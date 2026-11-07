import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { findByConfirmToken, classifyConfirm, langFromAcceptLanguage, normaliseLang } from '@/lib/server/newsletter';
import { CONSENT_TEXT } from '@/lib/server/consent';
import { maskEmail } from '@/lib/newsletter/mask';
import Shell from '../_components/Shell';
import Flow from '../_components/Flow';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Newsletter',
  robots: { index: false, follow: false },
};

/** GET is strictly read-only: it never confirms anything (mail scanners prefetch links). */
export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const sp = await searchParams;
  const token = typeof sp.t === 'string' ? sp.t : '';

  let row = null;
  let failed = false;
  try {
    row = token ? await findByConfirmToken(token) : null;
  } catch {
    failed = true;
  }
  const lang = row ? normaliseLang(row.lang) : langFromAcceptLanguage((await headers()).get('accept-language'));
  const state = failed ? 'ready' : classifyConfirm(row);

  // Unknown / used / expired tokens never show an address (no enumeration).
  const masked = row && state !== 'expired' ? maskEmail(row.email) : undefined;
  const recap =
    row && state === 'ready'
      ? {
          consent: CONSENT_TEXT[lang],
          asked: new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Europe/Paris',
          }).format(new Date(row.consent_at ?? row.created_at)),
          version: row.consent_text_version ?? 'v1',
        }
      : undefined;

  return (
    <Shell lang={lang}>
      <Flow kind="confirm" lang={lang} secret={token} initial={{ state, masked, error: failed }} recap={recap} />
    </Shell>
  );
}
