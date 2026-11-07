import { NextResponse } from 'next/server';
import { decideSuppression, readSvixHeaders, verifySvix } from '@/lib/newsletter/svix';
import { suppressEmails } from '@/lib/server/newsletter';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BODY = 256 * 1024;

/**
 * NWS-03: Resend webhook (Svix signature). The Resend account is shared with other apps, so events whose
 * `from` is not on OUR sender domain (RESEND_FROM) are acknowledged with 200 and ignored: nothing recorded.
 *  - email.bounced with bounce.type "Permanent" -> subscriber `suppressed` / hard_bounce
 *  - email.complained                           -> subscriber `suppressed` / complaint
 * Idempotent: an already suppressed row is not touched. Every other event: 200, no side effect.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[webhook/resend] RESEND_WEBHOOK_SECRET missing');
    return NextResponse.json({ error: 'not_configured' }, { status: 500 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: 'too_large' }, { status: 413 });

  let verdict;
  try {
    verdict = verifySvix(secret, readSvixHeaders(request.headers), raw);
  } catch {
    verdict = { ok: false as const, reason: 'bad_signature' as const };
  }
  if (!verdict.ok) return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });

  let evt: unknown;
  try {
    evt = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true, ignored: 'unparsable' }, { status: 200 });
  }

  if (!process.env.RESEND_FROM?.trim()) {
    // Without our own sender domain every event looks foreign (shared Resend account) and is ignored:
    // bounces / complaints would silently NOT suppress anyone. Still 200 so Resend does not retry.
    console.error('[webhook/resend] RESEND_FROM is not set: ALL events are ignored, bounces and complaints are NOT being suppressed. Set RESEND_FROM.');
  }
  const decision = decideSuppression(evt, process.env.RESEND_FROM);
  if (!decision.suppress) return NextResponse.json({ ok: true, ignored: true }, { status: 200 });

  try {
    const changed = await suppressEmails(decision.recipients, decision.reason);
    return NextResponse.json({ ok: true, suppressed: changed }, { status: 200 });
  } catch (e) {
    console.error('[webhook/resend] suppress failed:', e instanceof Error ? e.message : 'unknown');
    // 500 so Resend retries (the operation is idempotent).
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
