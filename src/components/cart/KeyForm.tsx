'use client';

import { useId, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { unlockAlbum } from '@/app/mon-album/actions';
import { useLang } from '@/contexts/LanguageContext';
import { REQUEST_COPY } from '@/lib/requestCopy';
import './request.css';

type KeyState =
  | { s: 'idle' }
  | { s: 'loading' }
  | { s: 'wrong'; left: number }
  | { s: 'locked' };

/** Private album key form (contract screens B1..B4). `slug` set = direct album page gate; unset = /mon-album. */
export default function KeyForm({ slug, redirectToAlbum }: { slug?: string; redirectToAlbum: boolean }) {
  const { lang } = useLang();
  const c = REQUEST_COPY[lang];
  const router = useRouter();
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [shown, setShown] = useState(false);
  const [st, setSt] = useState<KeyState>({ s: 'idle' });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || st.s === 'loading' || st.s === 'locked') return;
    setSt({ s: 'loading' });
    try {
      const r = await unlockAlbum(value.trim(), slug);
      if (r.ok) {
        if (redirectToAlbum) router.push(`/albums/${r.slug}`);
        else router.refresh();
        return;
      }
      if (r.code === 'locked') { setSt({ s: 'locked' }); return; }
      setSt({ s: 'wrong', left: r.attemptsLeft });
      setShown(true);
      requestAnimationFrame(() => inputRef.current?.focus());
    } catch {
      setSt({ s: 'wrong', left: 0 });
    }
  }

  const locked = st.s === 'locked';
  const loading = st.s === 'loading';
  return (
    <form className="rq-keyform" onSubmit={submit} noValidate aria-busy={loading}>
      <div className="rq-field">
        <label htmlFor={`${id}-k`}>{c.keyLabel}</label>
        <div className="rq-input-wrap">
          <input
            ref={inputRef}
            id={`${id}-k`}
            name="key"
            className="rq-input rq-input--key"
            type={shown ? 'text' : 'password'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={c.keyPlaceholder}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            readOnly={loading}
            disabled={locked}
            aria-invalid={st.s === 'wrong'}
            aria-describedby={st.s === 'wrong' || locked ? `${id}-m` : undefined}
          />
          <button
            type="button"
            className="rq-iconbtn"
            aria-pressed={shown}
            aria-label={shown ? c.keyHide : c.keyShow}
            onClick={() => setShown((v) => !v)}
            disabled={locked}
          >
            {shown ? <EyeOff size={20} aria-hidden /> : <Eye size={20} aria-hidden />}
          </button>
        </div>
      </div>

      {st.s === 'wrong' && (
        <div id={`${id}-m`} className="rq-msg rq-msg--err" role="alert">
          <AlertCircle size={18} aria-hidden />
          <span>
            {c.keyWrong}{' '}
            {st.left > 0 ? (st.left === 1 ? c.keyLeftOne : c.keyLeftMany(st.left)) : ''}
          </span>
        </div>
      )}
      {locked && (
        <div id={`${id}-m`} className="rq-msg rq-msg--warn" role="alert">
          <AlertCircle size={18} aria-hidden />
          <span>{c.keyLocked} <Link href="/contact">{c.keyContact}</Link></span>
        </div>
      )}

      <button type="submit" className="rq-btn" disabled={loading || locked || !value.trim()}>
        {loading && <span className="rq-spin" aria-hidden />}
        {loading ? c.keyLoading : c.keySubmit}
      </button>
    </form>
  );
}
