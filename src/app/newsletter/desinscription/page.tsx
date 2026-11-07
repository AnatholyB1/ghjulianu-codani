import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { findByEmail, langFromAcceptLanguage, normaliseLang } from '@/lib/server/newsletter';
import { verifyUnsubscribe } from '@/lib/server/tokens';
import { maskEmail } from '@/lib/newsletter/mask';
import Shell from '../_components/Shell';
import Flow from '../_components/Flow';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Newsletter',
  robots: { index: false, follow: false },
};

/** GET never unsubscribes. The button is a POST (server action); one-click POST lives at /api/newsletter/unsubscribe. */
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ s?: string | string[] }> }) {
  const sp = await searchParams;
  const sig = typeof sp.s === 'string' ? sp.s : '';
  const email = sig ? verifyUnsubscribe(sig) : null;

  let state: 'ready' | 'already' | 'invalid' = 'invalid';
  let lang: 'fr' | 'en' = langFromAcceptLanguage((await headers()).get('accept-language'));
  let masked: string | undefined;
  let failed = false;
  if (email) {
    try {
      const row = await findByEmail(email);
      if (row) {
        lang = normaliseLang(row.lang);
        masked = maskEmail(email);
        state = row.status === 'unsubscribed' || row.status === 'suppressed' ? 'already' : 'ready';
      }
    } catch {
      failed = true;
      state = 'ready';
      masked = maskEmail(email);
    }
  }

  return (
    <Shell lang={lang}>
      <Flow kind="unsub" lang={lang} secret={sig} initial={{ state, masked, error: failed }} />
    </Shell>
  );
}
