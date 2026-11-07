import { NextResponse, type NextRequest } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { getAdminClient } from '@/lib/server/supabaseAdmin';

/**
 * Retention purge (KPI-07): rolls raw `events` older than 13 months into
 * `events_daily` and deletes them (SQL function purge_old_events, atomic).
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

  const { data, error } = await getAdminClient().rpc('purge_old_events', { p_months: RETENTION_MONTHS });
  if (error) {
    console.warn('[cron/purge-events] rpc error:', error.code ?? error.message);
    return NextResponse.json({ error: 'purge failed' }, { status: 500 });
  }
  return NextResponse.json({ ok: true, purged: data ?? 0, months: RETENTION_MONTHS });
}

export const POST = run;
export const GET = run;
