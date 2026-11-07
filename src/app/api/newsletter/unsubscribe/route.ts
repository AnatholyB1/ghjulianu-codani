import { NextResponse } from 'next/server';
import { verifyUnsubscribe } from '@/lib/server/tokens';
import { unsubscribeEmail } from '@/lib/server/newsletter';
import { hit, hashIdentifier } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

/**
 * RFC 8058 one-click unsubscribe target (`List-Unsubscribe-Post: List-Unsubscribe=One-Click`).
 * Mail providers POST here without cookies or CSRF token, so authenticity rests on the HMAC `s` value.
 * Immediate effect, no page. GET (prefetchers, humans) NEVER unsubscribes: it redirects to the confirm page.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const sig = url.searchParams.get('s') ?? '';
  const email = verifyUnsubscribe(sig);
  if (!email) return NextResponse.json({ error: 'invalid' }, { status: 400, headers: NO_STORE });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!(await hit(`nl-oneclick:${hashIdentifier(ip)}`, 120, 600))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429, headers: NO_STORE });
  }
  try {
    await unsubscribeEmail(email);
    return NextResponse.json({ ok: true }, { status: 200, headers: NO_STORE });
  } catch (e) {
    console.warn('[newsletter] one-click failed:', e instanceof Error ? e.message : 'unknown');
    return NextResponse.json({ error: 'server' }, { status: 500, headers: NO_STORE });
  }
}

export async function GET(request: Request) {
  const sig = new URL(request.url).searchParams.get('s') ?? '';
  const target = new URL('/newsletter/desinscription', request.url);
  target.searchParams.set('s', sig);
  return NextResponse.redirect(target, 303);
}
