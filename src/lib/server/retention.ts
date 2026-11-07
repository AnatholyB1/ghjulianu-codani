import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Retention promised by the privacy page (D-14), applied by /api/cron/purge-events:
 *  - download_requests: deleted 90 days after expires_at
 *  - rate_limits: rows older than 2 days (windows are <= 1 h; nothing here needs more)
 *  - subscribers still `pending` and untouched for more than 30 days (never confirmed)
 * `events` has its own SQL function (purge_old_events, 13 months). Every step is idempotent and independent.
 */
export const DOWNLOAD_REQUEST_RETENTION_DAYS = 90;
export const RATE_LIMIT_RETENTION_DAYS = 2;
export const PENDING_SUBSCRIBER_RETENTION_DAYS = 30;

const DAY_MS = 86_400_000;

export function retentionCutoffs(now: Date) {
  const before = (days: number) => new Date(now.getTime() - days * DAY_MS).toISOString();
  return {
    downloadRequestsExpiredBefore: before(DOWNLOAD_REQUEST_RETENTION_DAYS),
    rateLimitsOlderThan: before(RATE_LIMIT_RETENTION_DAYS),
    pendingSubscribersOlderThan: before(PENDING_SUBSCRIBER_RETENTION_DAYS),
  };
}

export interface RetentionResult {
  downloadRequests: number | null;
  rateLimits: number | null;
  pendingSubscribers: number | null;
  /** names of steps that failed (their count is null) */
  failed: string[];
}

/** `scope` narrows each step to marked rows. Used by the e2e test only; the cron passes nothing. */
export interface RetentionScope {
  emailLike?: string;
  keyLike?: string;
}

export async function purgeExpired(
  db: SupabaseClient,
  now: Date = new Date(),
  scope: RetentionScope = {},
): Promise<RetentionResult> {
  const c = retentionCutoffs(now);
  const failed: string[] = [];

  async function step(name: string, run: () => PromiseLike<{ count: number | null; error: { code?: string; message: string } | null }>) {
    try {
      const { count, error } = await run();
      if (error) throw new Error(error.code ?? error.message);
      return count ?? 0;
    } catch (e) {
      console.warn(`[retention] ${name} failed:`, e instanceof Error ? e.message : 'unknown');
      failed.push(name);
      return null;
    }
  }

  const downloadRequests = await step('download_requests', () => {
    let q = db.from('download_requests').delete({ count: 'exact' }).lt('expires_at', c.downloadRequestsExpiredBefore);
    if (scope.emailLike) q = q.like('email', scope.emailLike);
    return q;
  });
  const rateLimits = await step('rate_limits', () => {
    let q = db.from('rate_limits').delete({ count: 'exact' }).lt('window_start', c.rateLimitsOlderThan);
    if (scope.keyLike) q = q.like('key', scope.keyLike);
    return q;
  });
  const pendingSubscribers = await step('pending_subscribers', () => {
    let q = db
      .from('subscribers')
      .delete({ count: 'exact' })
      .eq('status', 'pending')
      // NULL updated_at falls back to created_at (a NULL never compares true, so it must be explicit)
      .or(`updated_at.lt.${c.pendingSubscribersOlderThan},and(updated_at.is.null,created_at.lt.${c.pendingSubscribersOlderThan})`);
    if (scope.emailLike) q = q.like('email', scope.emailLike);
    return q;
  });

  return { downloadRequests, rateLimits, pendingSubscribers, failed };
}
