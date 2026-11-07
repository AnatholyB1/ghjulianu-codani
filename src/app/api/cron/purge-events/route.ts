import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getAdminClient } from '@/lib/server/supabaseAdmin';
import { purgeExpired } from '@/lib/server/retention';

/**
 * Retention purge (KPI-07 + privacy page promises), idempotent, safe to run daily:
 *  - rolls raw `events` older than 13 months into `events_daily` and deletes them (SQL function purge_old_events)
 *  - deletes download_requests 90 days after expires_at, rate_limits older than 2 days,
 *    subscribers left `pending` for more than 30 days (see lib/server/retention.ts)
 * Each step is independent: one failing does not stop the others (HTTP 500 if any failed).
 *
 * Secured by the CRON_SECRET env var: `Authorization: Bearer <CRON_SECRET>`
 * (Vercel Cron sends exactly this header, but uses GET, so GET is accepted too).
 * Fails closed (503) when CRON_SECRET is not configured.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RETENTION_MONTHS = 13;

function authorised(req: NextRequest): boolean | null {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return null; // not configured
  const header = req.headers.get('authorization') ?? '';
  const given = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

async function run(req: NextRequest) {
  const ok = authorised(req);
  if (ok === null) return NextResponse.json({ error: 'cron not configured' }, { status: 503 });
  if (!ok) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const db = getAdminClient();
  let purged: number | null = null;
  let eventsFailed = false;
  try {
    const { data, error } = await db.rpc('purge_old_events', { p_months: RETENTION_MONTHS });
    if (error) throw new Error(error.code ?? error.message);
    purged = typeof data === 'number' ? data : 0;
  } catch (e) {
    eventsFailed = true;
    console.warn('[cron/purge-events] events purge failed:', e instanceof Error ? e.message : 'unknown');
  }

  const retention = await purgeExpired(db);
  if (eventsFailed || retention.failed.length > 0) {
    return NextResponse.json({ error: 'purge failed', purged, months: RETENTION_MONTHS, retention }, { status: 500 });
  }
  return NextResponse.json({ ok: true, purged, months: RETENTION_MONTHS, retention });
}

export const POST = run;
export const GET = run;
