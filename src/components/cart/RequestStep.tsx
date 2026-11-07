'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertCircle, Mail } from 'lucide-react';
import { requestDownload, issueFormToken } from '@/app/telechargement/actions';
import { useCart } from '@/contexts/CartContext';
import { useLang } from '@/contexts/LanguageContext';
import { REQUEST_COPY } from '@/lib/requestCopy';
import { CONSENT_LABEL, CONSENT_SUB } from '@/lib/consentCopy';
import './request.css';

type Phase =
  | { p: 'idle' }
  | { p: 'invalid' }
  | { p: 'loading' }
  | { p: 'success'; newsletter: boolean }
  | { p: 'error'; kind: 'server' | 'rate' | 'locked' };

const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_LOADING_MS = 400;

/**
 * Request step of the cart drawer (screens A3..A10). The parent owns the header, the scroll body
 * and the sticky footer; `renderFooter` hands the primary button to the parent's sticky footer slot.
 */
export default function RequestStep({
  onBack, onClose, renderFooter,
}: {
  onBack: () => void;
  onClose: () => void;
  renderFooter: (node: React.ReactNode) => void;
}) {
  const { items } = useCart();
  const { lang } = useLang();
  const c = REQUEST_COPY[lang];
  const uid = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);
  const [website, setWebsite] = useState('');
  const [touched, setTouched] = useState(false);
  const [phase, setPhase] = useState<Phase>({ p: 'idle' });
  const [token, setToken] = useState<string | null>(null);

  const loading = phase.p === 'loading';
  const emailInvalid = (touched || phase.p === 'invalid') && !EMAIL_OK.test(email.trim());

  const refreshToken = useCallback(async () => {
    try { setToken(await issueFormToken()); } catch { setToken(null); }
  }, []);

  // signed render timestamp for the min time-to-submit check
  useEffect(() => {
    let alive = true;
    issueFormToken().then((t) => { if (alive) setToken(t); }).catch(() => { if (alive) setToken(null); });
    return () => { alive = false; };
  }, []);

  // desktop only: focus the email field (on mobile the keyboard would cover the checkbox)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      emailRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (phase.p === 'success') successRef.current?.focus();
  }, [phase.p]);

  const submit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    const addr = email.trim();
    if (!EMAIL_OK.test(addr)) {
      setPhase({ p: 'invalid' });
      requestAnimationFrame(() => emailRef.current?.focus());
      return;
    }
    setPhase({ p: 'loading' });
    const started = Date.now();
    let next: Phase;
    try {
      const res = await requestDownload({
        email: addr,
        lang,
        newsletter,
        website,
        formToken: token ?? '',
        photos: items.map((i) => ({ photoId: i.photoId, source: i.source })),
      });
      if (res.ok) next = { p: 'success', newsletter };
      else if (res.code === 'invalid_email') next = { p: 'invalid' };
      else if (res.code === 'rate_limited') next = { p: 'error', kind: 'rate' };
      else if (res.code === 'album_locked') next = { p: 'error', kind: 'locked' };
      else { next = { p: 'error', kind: 'server' }; void refreshToken(); }
    } catch {
      next = { p: 'error', kind: 'server' };
      void refreshToken();
    }
    const wait = MIN_LOADING_MS - (Date.now() - started);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    setPhase(next);
    if (next.p === 'invalid') requestAnimationFrame(() => emailRef.current?.focus());
  }, [email, items, lang, loading, newsletter, refreshToken, token, website]);

  // primary button lives in the drawer's sticky footer
  useEffect(() => {
    if (phase.p === 'success') {
      renderFooter(
        <button type="button" className="rq-btn" onClick={onClose}>{c.okClose}</button>,
      );
    } else {
      renderFooter(
        <button type="submit" form={`${uid}-form`} className="rq-btn" disabled={loading} aria-disabled={loading}>
          {loading && <span className="rq-spin" aria-hidden />}
          {loading ? c.sending : c.submit}
        </button>,
      );
    }
    return () => renderFooter(null);
  }, [phase.p, loading, c, uid, onClose, renderFooter]);

  const n = items.length;
  const thumbs = items.slice(0, 3);

  if (phase.p === 'success') {
    return (
      <div className="rq-done" role="status" aria-live="polite">
        <div className="rq-done__icon"><Mail size={26} aria-hidden /></div>
        <h3 ref={successRef} tabIndex={-1}>{c.okTitle}</h3>
        <p className="rq-lead">{c.okBody}</p>
        {phase.newsletter && <p className="rq-note">{c.okNl}</p>}
        <button
          type="button"
          className="rq-textbtn"
          onClick={() => { setEmail(''); setNewsletter(false); setTouched(false); setPhase({ p: 'idle' }); void refreshToken(); }}
        >
          {c.okOther}
        </button>
      </div>
    );
  }

  return (
    <>
      <div>
        <div className="rq-row">
          <div className="rq-summary" aria-hidden="true">
            {thumbs.map((t) => (
              <div className="rq-summary__img" key={t.id}>
                <Image src={t.src} alt="" width={64} height={43} unoptimized />
              </div>
            ))}
            {n > thumbs.length && <span className="rq-summary__more">+{n - thumbs.length}</span>}
          </div>
        </div>
        <div className="rq-row">
          <p className="rq-hint">{n === 1 ? c.countOne : c.countMany(n)}</p>
          <button type="button" className="rq-textbtn" onClick={onBack}>{c.editSelection}</button>
        </div>
      </div>

      <p className="rq-lead">
        {c.introBefore}<strong>{n === 1 ? c.introOne : c.introMany(n)}</strong>{c.introAfter}
      </p>

      {phase.p === 'error' && (
        <div className={`rq-msg ${phase.kind === 'rate' ? 'rq-msg--warn' : 'rq-msg--err'}`} role="alert">
          <AlertCircle size={18} aria-hidden />
          <span>
            {phase.kind === 'rate' ? c.errRate : phase.kind === 'locked' ? c.errLocked : c.errServer}
            {phase.kind === 'locked' && <> <Link href="/mon-album" onClick={onClose}>{c.lockedLink}</Link></>}
          </span>
        </div>
      )}

      <form id={`${uid}-form`} noValidate onSubmit={submit} aria-busy={loading} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="rq-field">
          <label htmlFor={`${uid}-em`}>{c.emailLabel}</label>
          <input
            ref={emailRef}
            id={`${uid}-em`}
            name="email"
            className="rq-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={c.emailPlaceholder}
            value={email}
            readOnly={loading}
            required
            aria-invalid={emailInvalid}
            aria-describedby={emailInvalid ? `${uid}-err` : `${uid}-hint`}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => { if (email) setTouched(true); }}
          />
          {emailInvalid ? (
            <p id={`${uid}-err`} className="rq-msg rq-msg--inline" role="alert">
              <AlertCircle size={18} aria-hidden /> <span>{c.errInvalid}</span>
            </p>
          ) : (
            <p id={`${uid}-hint`} className="rq-hint">{c.emailHint}</p>
          )}
        </div>

        {/* honeypot: off-screen, out of tab order and the accessibility tree */}
        <div className="rq-hp" aria-hidden="true">
          <label>Website <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
        </div>

        <label className="rq-check">
          <input type="checkbox" name="newsletter" checked={newsletter} disabled={loading} onChange={(e) => setNewsletter(e.target.checked)} />
          <span className="rq-check__txt">
            {CONSENT_LABEL[lang]}
            <small>{CONSENT_SUB[lang]}</small>
          </span>
        </label>

        <p className="rq-hint">
          {c.privacyBefore}
          <Link href="/politique-de-confidentialite" onClick={onClose}>{c.privacyLink}</Link>
          {c.privacyAfter}
        </p>
      </form>
    </>
  );
}
