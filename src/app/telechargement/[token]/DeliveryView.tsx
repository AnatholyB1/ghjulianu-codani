'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { COPY, formatSize, type Lang } from './copy';

export interface Tile { id: string; url: string; w: number; h: number }
export interface PartInfo { index: number; first: number; last: number; bytes: number }

interface Props {
  token: string;
  lang: Lang;
  albumTitle: string;
  count: number;
  totalBytes: number;
  approx: boolean;
  usesLeft: number;
  maxUses: number;
  windowOpen: boolean;
  validUntil: string;
  windowUntil: string | null;
  parts: PartInfo[];
  tiles: Tile[];
  /** '?e=' value left by a refused download (nothing was consumed). */
  error: 'rate' | 'error' | null;
}

const ICON = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
const FIRST_BATCH = 12;
const MORE_BATCH = 24;

/**
 * Valid-link view. Download controls are plain links to the download routes:
 * the click handler only sets the busy state (no fetch, no preventDefault), so
 * the browser streams the file natively. Opening this page consumed nothing.
 */
export default function DeliveryView(p: Props) {
  const c = COPY[p.lang];
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [clicked, setClicked] = useState<Set<string>>(new Set());
  const [hint, setHint] = useState(false);
  const [shown, setShown] = useState(p.parts.length > 1 ? FIRST_BATCH : p.tiles.length);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  // Optimistic: the first click of a session consumes a use unless a session is already open.
  const opened = p.windowOpen || clicked.size > 0;
  const left = Math.max(0, p.usesLeft - (clicked.size > 0 && !p.windowOpen ? 1 : 0));
  const isLast = left === 1 && !opened;

  const start = (id: string, ms: number) => (e: React.MouseEvent) => {
    if (busy) {
      // A download is still starting: block the double click, but tell the visitor and release soon.
      e.preventDefault();
      setHint(true);
      timers.current.push(setTimeout(() => setHint(false), 3000));
      return;
    }
    setBusy(id);
    setClicked((s) => new Set(s).add(id));
    timers.current.push(setTimeout(() => router.refresh(), 4000));
    // The browser starts a native download within a second or two; keep the lock short so a second one works.
    timers.current.push(setTimeout(() => setBusy(null), Math.min(ms, 3000)));
  };

  const zipHref = (n: number) => `/api/download/${p.token}/zip?part=${n}`;
  const photoHref = (id: string) => `/api/download/${p.token}/photo/${id}`;
  const multi = p.parts.length > 1;
  const sizeLabel = formatSize(p.totalBytes, p.lang, p.approx);

  return (
    <div className="layout">
      <section className="panel rise" aria-labelledby="h1">
        <h1 id="h1">{c.ready}</h1>
        {p.error && (
          <div className="callout danger" role="alert">
            <Alert />
            <div><strong>{p.error === 'rate' ? c.rateT : c.srvT}</strong>{p.error === 'rate' ? c.rateB : c.srvB}</div>
          </div>
        )}
        {isLast && (
          <div className="callout" role="status">
            <Alert />
            <div><strong>{c.lastT}</strong>{c.lastB}</div>
          </div>
        )}
        <dl className="meta">
          <div><dt>{c.album}</dt><dd>{p.albumTitle}</dd></div>
          <div><dt>{c.photos}</dt><dd>{p.count}, {sizeLabel}</dd></div>
          <div>
            <dt>{c.usesLeft}</dt>
            <dd>
              <span className="pips" aria-hidden="true">
                {Array.from({ length: p.maxUses }, (_, i) => <span key={i} className={`pip${i < left ? ' on' : ''}`} />)}
              </span>
              {c.ofN(left, p.maxUses)}
            </dd>
          </div>
          <div><dt>{c.validUntil}</dt><dd>{p.validUntil}</dd></div>
        </dl>
        <p className="note" role="status" aria-live="polite">{hint ? c.wait : ''}</p>
        {(p.windowOpen && p.windowUntil) && <p className="note" role="status">{c.sessionOpen(p.windowUntil)}</p>}

        {!multi ? (
          <>
            <a
              className="btn btn-primary" href={zipHref(1)} rel="nofollow noreferrer"
              aria-busy={busy === 'zip1'} onClick={start('zip1', 15000)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" {...ICON} aria-hidden="true"><path d="M6 3h8l4 4v14H6z" /><path d="M12 3v6M12 11v2M12 15v2" /></svg>
              <span className="stack">
                {busy === 'zip1' ? c.busy : clicked.has('zip1') ? c.again : c.all}
                <small>{c.zipSub(p.count, sizeLabel)}</small>
              </span>
            </a>
            {busy === 'zip1' && <Started lang={p.lang} />}
            <p className="note">{c.note}</p>
          </>
        ) : (
          <section className="parts-head" aria-labelledby="ph">
            <h2 id="ph">{c.partsH(p.parts.length)}</h2>
            <p className="note">{c.partsLede(sizeLabel, p.parts.length)}</p>
            <ol className="parts">
              {p.parts.map((pt) => {
                const id = `zip${pt.index}`;
                const isBusy = busy === id;
                return (
                  <li className="part" key={pt.index}>
                    <div>
                      <div className="part-name">{c.partName(pt.index, p.parts.length)}</div>
                      <div className="part-info">{c.partInfo(pt.first, pt.last, formatSize(pt.bytes, p.lang, p.approx))}</div>
                    </div>
                    <a
                      className={`btn ${isBusy ? 'btn-ghost' : 'btn-primary'}`} href={zipHref(pt.index)} rel="nofollow noreferrer"
                      aria-label={c.partAria(pt.index, opened)} aria-busy={isBusy} onClick={start(id, 15000)}
                    >
                      {isBusy ? c.busy : clicked.has(id) ? c.again : c.download}
                    </a>
                    {isBusy && <><span className="bar" aria-hidden="true" /><span className="part-status" role="status">{c.started}</span></>}
                  </li>
                );
              })}
            </ol>
            <p className="note">{c.note}</p>
          </section>
        )}
      </section>

      <section aria-labelledby="gh">
        <div className="grid-head"><h2 id="gh">{c.gridH}</h2><p>{c.countPhotos(p.count)}</p></div>
        <ul className="photos">
          {p.tiles.slice(0, shown).map((t, i) => (
            <li className="tile" key={t.id} style={{ ['--i' as string]: i }}>
              <figure>
                <div className="ph loaded" style={{ aspectRatio: `${t.w} / ${t.h}` }}>
                  <Image
                    src={t.url} alt={c.tileAlt(i + 1, p.count)} width={t.w} height={t.h}
                    sizes="(min-width: 1024px) 24vw, (min-width: 768px) 30vw, 48vw" quality={60}
                    loading={i < 4 ? 'eager' : 'lazy'} draggable={false}
                  />
                  <span className="tag"><span className="n">{String(i + 1).padStart(2, '0')}</span></span>
                </div>
              </figure>
              <a
                className="dl" href={photoHref(t.id)} rel="nofollow noreferrer"
                aria-label={(opened ? c.tileAriaFree : c.tileAria)(i + 1, p.count)} aria-busy={busy === t.id}
                onClick={start(t.id, 8000)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" {...ICON} aria-hidden="true"><path d="M12 4v11" /><path d="m7 11 5 5 5-5" /><path d="M5 20h14" /></svg>
              </a>
            </li>
          ))}
        </ul>
        {shown < p.tiles.length && (
          <div className="more">
            <button type="button" className="btn btn-ghost fit" onClick={() => setShown((s) => s + MORE_BATCH)}>
              {c.more(p.tiles.length - shown)}
            </button>
          </div>
        )}
        {busy && !busy.startsWith('zip') && <Started lang={p.lang} />}
      </section>
    </div>
  );
}

function Started({ lang }: { lang: Lang }) {
  return <p className="note" role="status">{COPY[lang].started}</p>;
}

function Alert() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" {...ICON} aria-hidden="true"><path d="M12 4 3 20h18z" /><path d="M12 10v4M12 17v.01" /></svg>
  );
}
