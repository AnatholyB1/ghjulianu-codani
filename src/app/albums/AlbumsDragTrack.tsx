'use client';

import Link      from 'next/link';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { Album, Category } from '@/lib/db.types';
import { useT } from '@/hooks/useT';

type AlbumWithCat = Album & { category: Category | null };

export default function AlbumsDragTrack({ albums }: { albums: AlbumWithCat[] }) {
  const t = useT();
  const [cat, setCat] = useState<string>('all');

  const filtered = cat === 'all'
    ? albums
    : albums.filter((a) => a.category?.slug === cat);

  const categories = Array.from(
    new Map(
      albums.filter((a) => a.category).map((a) => [a.category!.slug, a.category!])
    ).values()
  );

  const trackRef    = useRef<HTMLDivElement>(null);
  const downAt      = useRef(0);
  const prevPct     = useRef(0);
  const isDragging  = useRef(false);
  const hasDragged  = useRef(false);
  const hasEntered  = useRef(false);

  useEffect(() => {
    prevPct.current = 0;
    const track = trackRef.current;
    if (!track) return;
    if (!hasEntered.current) {
      // First mount: slide in from right
      hasEntered.current = true;
      track.animate(
        { transform: ['translate(60%, -50%)', 'translate(0%, -50%)'] },
        { duration: 1100, fill: 'forwards', easing: 'cubic-bezier(0.16,1,0.3,1)' }
      );
      track.querySelectorAll<HTMLElement>('.album-cover').forEach((img, i) => {
        img.animate(
          { objectPosition: ['100% center', '100% center'] },
          { duration: 0, fill: 'forwards' }
        );
      });
    } else {
      track.animate({ transform: 'translate(0%, -50%)' }, { duration: 0, fill: 'forwards' });
      track.querySelectorAll<HTMLElement>('.album-cover').forEach((img) => {
        img.animate({ objectPosition: '100% center' }, { duration: 0, fill: 'forwards' });
      });
    }
  }, [cat]);

  const moveTo = useCallback((nextPct: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.animate(
      { transform: `translate(${nextPct}%, -50%)` },
      { duration: 1200, fill: 'forwards', easing: 'cubic-bezier(0.16,1,0.3,1)' },
    );
    track.querySelectorAll<HTMLElement>('.album-cover').forEach((img) => {
      img.animate(
        { objectPosition: `${100 + nextPct}% center` },
        { duration: 1200, fill: 'forwards', easing: 'cubic-bezier(0.16,1,0.3,1)' },
      );
    });
  }, []);

  const onDown = useCallback((x: number) => {
    isDragging.current = true;
    hasDragged.current = false;
    downAt.current = x;
  }, []);

  const onUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    prevPct.current = parseFloat(trackRef.current?.dataset.pct ?? String(prevPct.current));
  }, []);

  const onMove = useCallback((x: number) => {
    if (!isDragging.current) return;
    const delta    = downAt.current - x;
    if (Math.abs(delta) > 4) hasDragged.current = true;
    const maxDelta = window.innerWidth * 2;
    const pct      = (delta / maxDelta) * -100;
    const next     = Math.max(Math.min(prevPct.current + pct, 0), -100);
    if (trackRef.current) trackRef.current.dataset.pct = String(next);
    moveTo(next);
  }, [moveTo]);

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const step  = (delta / window.innerWidth) * -25;
    const next  = Math.max(Math.min(prevPct.current + step, 0), -100);
    prevPct.current = next;
    if (trackRef.current) trackRef.current.dataset.pct = String(next);
    moveTo(next);
  }, [moveTo]);

  useEffect(() => {
    const mm = (e: MouseEvent) => onMove(e.clientX);
    const tm = (e: TouchEvent) => onMove(e.touches[0].clientX);
    window.addEventListener('mousemove', mm, { passive: true });
    window.addEventListener('touchmove', tm, { passive: true });
    window.addEventListener('mouseup',   onUp);
    window.addEventListener('touchend',  onUp);
    window.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('mouseup',   onUp);
      window.removeEventListener('touchend',  onUp);
      window.removeEventListener('wheel', onWheel);
    };
  }, [onMove, onUp, onWheel]);

  return (
    <div
      className="drag-area"
      style={{
        height:           'calc(100vh - var(--navbar-h))',
        overflow:         'hidden',
        position:         'relative',
        userSelect:       'none',
        WebkitUserSelect: 'none',
        touchAction:      'none',
        cursor:           'grab',
      }}
      onMouseDown={(e) => onDown(e.clientX)}
      onTouchStart={(e) => onDown(e.touches[0].clientX)}
    >
      {/* Filter tabs */}
      <div style={{ position: 'absolute', top: 'clamp(1.5rem,3vw,2.5rem)', left: 'clamp(1.5rem,3vw,3rem)', zIndex: 10, display: 'flex', gap: '0.2rem', pointerEvents: 'auto' }}>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={() => setCat('all')}
          style={{ background: cat === 'all' ? 'var(--text)' : 'transparent', color: cat === 'all' ? '#080808' : 'var(--muted)', border: '1px solid var(--border)', padding: '0.45rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', transition: 'all 0.25s ease' }}
        >
          {t.albums.all}
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => setCat(c.slug)}
            style={{ background: cat === c.slug ? 'var(--text)' : 'transparent', color: cat === c.slug ? '#080808' : 'var(--muted)', border: '1px solid var(--border)', padding: '0.45rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', transition: 'all 0.25s ease' }}
          >
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      <p className="scroll-hint" style={{ position: 'absolute', bottom: 'clamp(1.5rem,3vw,2.5rem)', left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)', opacity: 0.45, pointerEvents: 'none' }}>
        {t.albums.drag}
      </p>

      <div ref={trackRef} data-pct="0" style={{ position: 'absolute', left: 'calc(50% - 20vmin)', top: '50%', transform: 'translate(0%, -50%)', display: 'flex', gap: '4vmin', willChange: 'transform' }} className="album-track">
        {filtered.map((album) => (
          <Link
            key={album.id}
            href={`/albums/${album.slug}`}
            draggable={false}
            onClick={(e) => { if (hasDragged.current) e.preventDefault(); }}
            style={{ flexShrink: 0, display: 'block', width: '40vmin', height: '56vmin', overflow: 'hidden', position: 'relative', textDecoration: 'none' }}
            className="album-track-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={album.cover_url ?? 'https://picsum.photos/seed/default/600/900'}
              alt={album.title}
              draggable={false}
              loading="lazy"
              className="album-cover"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '100% center', filter: 'brightness(0.55) saturate(0.8)', display: 'block' }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(0.35) saturate(0.7)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(0.55) saturate(0.8)'; }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.85) 0%,rgba(8,8,8,0.1) 55%,transparent 100%)', pointerEvents: 'none' }} />

            {album.category && (
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '0.52rem', letterSpacing: '0.18em', color: 'var(--muted)', border: '1px solid rgba(255,255,255,0.1)', padding: '3px 7px', background: 'rgba(8,8,8,0.5)', pointerEvents: 'none' }}>
                {album.category.name.toUpperCase()}
              </span>
            )}

            {!album.is_public && (
              <span style={{ position: 'absolute', top: '1rem', left: '1rem', fontSize: '0.55rem', color: '#c8a97e', pointerEvents: 'none' }}>🔒</span>
            )}

            <div style={{ position: 'absolute', bottom: '1.4rem', left: '1.4rem', right: '1.4rem', pointerEvents: 'none' }}>
              <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.2rem,3vmin,1.8rem)', fontStyle: 'italic', fontWeight: 400, color: 'var(--text)', lineHeight: 1.1, margin: 0 }}>
                {album.title}
              </h2>
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                {(() => {
                  const d = new Date(album.created_at);
                  const mo = d.toLocaleDateString(t.albums.dateLocale, { month: 'long' });
                  const yr = d.getFullYear();
                  const label = `${mo.charAt(0).toUpperCase() + mo.slice(1)} ${yr}`;
                  return <p style={{ fontSize: '0.52rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>{label}</p>;
                })()}
                {(album as AlbumWithCat & { location?: string | null }).location && (
                  <p style={{ fontSize: '0.5rem', letterSpacing: '0.12em', color: 'rgba(122,122,116,0.7)' }}>
                    {(album as AlbumWithCat & { location?: string | null }).location}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @media (max-width: 900px) {
          .album-track      { gap: 5vw !important; }
          .album-track-card { width: 72vw !important; height: calc(72vw * 1.4) !important; }
        }
      `}</style>
    </div>
  );
}
