'use client';

import KeyForm from '@/components/cart/KeyForm';
import { useLang } from '@/contexts/LanguageContext';
import { REQUEST_COPY } from '@/lib/requestCopy';

/** Direct visit of a private album without a valid access cookie. */
export default function AccessKeyGate({ slug }: { slug: string }) {
  const { lang } = useLang();
  const c = REQUEST_COPY[lang];
  return (
    <div className="rq-keypage">
      <p className="rq-eyebrow">{c.privateBadge.toUpperCase()}</p>
      <h1>{c.keyTitle}</h1>
      <p className="rq-lead">{c.keyDesc}</p>
      <KeyForm slug={slug} redirectToAlbum={false} />
    </div>
  );
}
