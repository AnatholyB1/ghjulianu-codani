'use client';

import KeyForm from '@/components/cart/KeyForm';
import { useLang } from '@/contexts/LanguageContext';
import { REQUEST_COPY } from '@/lib/requestCopy';

export default function MonAlbumPage() {
  const { lang } = useLang();
  const c = REQUEST_COPY[lang];

  return (
    <div className="rq-keypage">
      <p className="rq-eyebrow">{c.keyEyebrow}</p>
      <h1>{c.keyTitle}</h1>
      <p className="rq-lead">{c.keyDesc}</p>
      <KeyForm redirectToAlbum />
      <ul className="rq-how" aria-label={c.keyHelpTitle}>
        {c.keyHelp.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  );
}
