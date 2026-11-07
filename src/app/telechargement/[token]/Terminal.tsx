import Link from 'next/link';
import { COPY, formatWhen, type Lang } from './copy';

export type TerminalKind = 'expired' | 'exhausted' | 'invalid' | 'error';

const clock = (
  <path d="M32 18v15l9 6" />
);

function Glyph({ size, cls, kind }: { size: number; cls: string; kind: TerminalKind }) {
  return (
    <svg className={cls} width={size} height={size} viewBox="0 0 64 64" fill="none" stroke="currentColor"
      strokeWidth={size > 100 ? 0.6 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="32" cy="32" r="24" />
      {kind === 'expired' ? clock : kind === 'exhausted' ? <path d="M20 32h24" /> : kind === 'error' ? <path d="M32 20v16M32 43v.5" /> : <path d="M24 24l16 16M40 24 24 40" />}
    </svg>
  );
}

/** Terminal screens: expired, used up, invalid (unknown / malformed / revoked, identical) and page error. */
export default function Terminal({
  kind,
  lang,
  expiresAt,
  maxUses,
  reaskHref,
  retryHref,
}: {
  kind: TerminalKind;
  lang: Lang;
  expiresAt?: Date;
  maxUses?: number;
  reaskHref: string;
  retryHref?: string;
}) {
  const c = COPY[lang];
  const h1 = { expired: c.expiredH, exhausted: c.usedH, invalid: c.invalidH, error: c.errorH }[kind];
  return (
    <div className="state">
      <div className="body rise">
        <Glyph size={64} cls="glyph small" kind={kind} />
        <h1>{h1}</h1>
        {kind === 'expired' && expiresAt && <p className="lede">{c.expiredB(formatWhen(expiresAt, lang, 'at'))}</p>}
        {kind === 'exhausted' && <p className="lede">{c.usedB(maxUses ?? 3)}</p>}
        {kind === 'invalid' && <p className="lede">{c.invalidB}</p>}
        {kind === 'error' && <p className="lede">{c.errorB}</p>}
        <p className="lede" style={{ marginTop: 'var(--s-3)' }}>
          {kind === 'expired' || kind === 'exhausted' ? c.again2 : kind === 'invalid' ? c.invalidB2 : c.errorB2}
        </p>
        <div className="actions">
          {kind === 'error' ? (
            <a className="btn btn-primary" href={retryHref ?? '#'} rel="nofollow noreferrer">{c.retry}</a>
          ) : (
            <Link className="btn btn-primary" href={reaskHref} rel="noopener noreferrer">{c.reask}</Link>
          )}
          <Link className="btn btn-ghost" href="/" rel="noopener noreferrer">{c.back}</Link>
        </div>
      </div>
      <Glyph size={240} cls="glyph big" kind={kind} />
    </div>
  );
}
