import { headers } from 'next/headers';
import Shell from './Shell';
import Terminal from './Terminal';
import type { Lang } from './copy';

/** Unknown, malformed and revoked tokens: one identical screen (no enumeration). Language from Accept-Language. */
export default async function InvalidLink() {
  const al = (await headers()).get('accept-language') ?? '';
  const lang: Lang = /^\s*en/i.test(al) ? 'en' : 'fr';
  return (
    <Shell lang={lang}>
      <Terminal kind="invalid" lang={lang} reaskHref="/" />
    </Shell>
  );
}
