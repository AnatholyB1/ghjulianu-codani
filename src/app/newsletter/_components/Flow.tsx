'use client';

import Link from 'next/link';
import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { AlertCircle, Check, Clock, Mail } from 'lucide-react';
import { COPY, type FlowResult, type NlLang } from '../copy';
import { confirmAction, unsubscribeAction } from '../actions';

export interface Recap {
  consent: string;
  asked: string;
  version: string;
}

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="nlp-btn" type="submit" disabled={pending} aria-busy={pending}>
      {pending ? busy : label}
    </button>
  );
}

function fill(s: string, masked?: string) {
  return s.replace('{a}', masked ?? '');
}

/**
 * One client component for both public flows. The buttons are real <form> POSTs (server actions), so the
 * pages work without JavaScript; a GET never changes anything (mail scanners prefetch links).
 */
export default function Flow({
  kind,
  lang,
  secret,
  initial,
  recap,
}: {
  kind: 'confirm' | 'unsub';
  lang: NlLang;
  secret: string;
  initial: FlowResult;
  recap?: Recap;
}) {
  const c = COPY[lang];
  const [res, formAction] = useActionState(kind === 'confirm' ? confirmAction : unsubscribeAction, initial);
  const h1 = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  const state = res.state;
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    h1.current?.focus();
  }, [state]);

  const block = (kind === 'confirm' ? c.confirm : c.unsub) as unknown as Record<string, { h1: string; l1: string; l2: string; cta?: string; stay?: string }>;
  const s = block[state] ?? block.ready;
  const masked = res.masked ?? initial.masked;
  const done = state === 'confirmed' || state === 'already';
  const bad = state === 'expired' || state === 'invalid';
  const Icon = done ? Check : bad ? Clock : Mail;
  const errorText = kind === 'confirm' ? c.confirm.error : c.unsub.error;
  const isReady = state === 'ready';

  return (
    <>
      <section className="nlp-rise" aria-labelledby="nlp-h" role={isReady ? undefined : 'status'}>
        <p className="nlp-eyebrow">{c.eyebrow}</p>
        <div className={`nlp-ico${bad ? ' bad' : ''}`}>
          <Icon aria-hidden="true" strokeWidth={1.25} />
        </div>
        <h1 id="nlp-h" ref={h1} tabIndex={-1}>
          {s.h1}
        </h1>
        <p className="nlp-lede">{fill(s.l1, masked)}</p>
        <p className="nlp-lede">{s.l2}</p>

        {isReady ? (
          <form action={formAction} className="nlp-actions">
            <input type="hidden" name={kind === 'confirm' ? 'token' : 'sig'} value={secret} />
            {res.error ? (
              <p className="nlp-alert" role="alert">
                <AlertCircle aria-hidden="true" strokeWidth={1.5} />
                <span>{errorText}</span>
              </p>
            ) : null}
            <Submit label={s.cta ?? ''} busy={kind === 'confirm' ? c.busy : c.unsubBusy} />
            {kind === 'unsub' ? (
              <Link className="nlp-link" href="/">
                {s.stay}
              </Link>
            ) : null}
          </form>
        ) : (
          <div className="nlp-actions">
            <Link className="nlp-btn ghost" href="/">
              {c.back}
            </Link>
          </div>
        )}
        {kind === 'unsub' && (state === 'confirmed' || state === 'already') ? <p className="nlp-hint">{c.unsub.resub}</p> : null}
      </section>

      {kind === 'confirm' && isReady && recap ? (
        <aside className="nlp-recap" aria-labelledby="nlp-rc">
          <h2 id="nlp-rc">{c.confirm.recap.title}</h2>
          <dl>
            <div>
              <dt>{c.confirm.recap.address}</dt>
              <dd>{masked}</dd>
            </div>
            <div>
              <dt>{c.confirm.recap.consent}</dt>
              <dd className="quote">{recap.consent}</dd>
            </div>
            <div>
              <dt>{c.confirm.recap.asked}</dt>
              <dd>{recap.asked}</dd>
            </div>
          </dl>
          <p className="nlp-hint">{c.confirm.recap.version.replace('{v}', recap.version)}</p>
        </aside>
      ) : null}
    </>
  );
}
