'use server';

import { headers } from 'next/headers';
import { confirmByToken, unsubscribeEmail } from '@/lib/server/newsletter';
import { verifyUnsubscribe } from '@/lib/server/tokens';
import { hit, hashIdentifier } from '@/lib/server/rateLimit';
import { maskEmail } from '@/lib/newsletter/mask';
import type { FlowResult } from './copy';

async function clientKey(): Promise<string> {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  return hashIdentifier(ip);
}

/** POST of the confirmation button (NWS-01). Idempotent; a GET of the page never reaches this. */
export async function confirmAction(_prev: FlowResult, fd: FormData): Promise<FlowResult> {
  const token = String(fd.get('token') ?? '');
  try {
    if (!(await hit(`nl-confirm-post:${await clientKey()}`, 30, 600))) return { state: 'ready', error: true };
    const out = await confirmByToken(token);
    if (out.state === 'expired') return { state: 'expired' };
    return { state: out.state, masked: maskEmail(out.row.email) };
  } catch (e) {
    console.warn('[newsletter] confirm failed:', e instanceof Error ? e.message : 'unknown');
    return { state: 'ready', error: true };
  }
}

/** POST of the "Me désinscrire" button (NWS-02). Immediate effect. */
export async function unsubscribeAction(_prev: FlowResult, fd: FormData): Promise<FlowResult> {
  const sig = String(fd.get('sig') ?? '');
  const email = verifyUnsubscribe(sig);
  if (!email) return { state: 'invalid' };
  try {
    if (!(await hit(`nl-unsub-post:${await clientKey()}`, 30, 600))) return { state: 'ready', error: true };
    const out = await unsubscribeEmail(email);
    if (out === 'unknown') return { state: 'invalid' };
    return { state: out === 'unsubscribed' ? 'confirmed' : 'already', masked: maskEmail(email) };
  } catch (e) {
    console.warn('[newsletter] unsubscribe failed:', e instanceof Error ? e.message : 'unknown');
    return { state: 'ready', error: true };
  }
}
