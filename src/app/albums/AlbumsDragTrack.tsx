'use client';

import Link      from 'next/link';
import { useState, useRef, useEffect } from 'react';
import type { Album, Category } from '@/lib/db.types';
import { useT } from '@/hooks/useT';

type AlbumWithCat = Album & { category: Category | null };

/* ── Category preview overlay ──────────────────────────────── */
function CategoryPreview({ name, photos }: { name: string; photos: string[] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(id);
  }, []);

  return (
    <div
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         200,
        background:     'rgba(8,8,8,0.96)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '2.5rem',
        opacity:        visible ? 1 : 0,
        transition:     'opacity 0.45s ease',
        pointerEvents:  'none',
      }}
    >
      <div style={{ display: 'flex', gap: 'clamp(1rem,3vw,2.5rem)', alignItems: 'center' }}>
        {photos.map((src, i) => (
          <div
            key={src}
            style={{
              width:       i === 1 ? 'clamp(160px,20vw,240px)' : 'clamp(110px,14vw,170px)',
              aspectRatio: '3 / 4',
              overflow:    'hidden',
              transform:   visible
                ? i === 0 ? 'translateY(12px) rotate(-3deg)' : i === 2 ? 'translateY(12px) rotate(3deg)' : 'translateY(0)'
                : 'translateY(30px) scale(0.92)',
              opacity:     visible ? 1 : 0,
              transition:  `opacity 0.6s ease ${i * 90 + 80}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 90 + 80}ms`,
              boxShadow:   '0 16px 48px rgba(0,0,0,0.7)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      <h2
        style={{
          fontFamily:  'var(--font-cormorant),serif',
          fontSize:    'clamp(2rem,6vw,4.5rem)',
          fontStyle:   'italic',
          fontWeight:  300,
          color:       'var(--text)',
          letterSpacing: '0.04em',
          margin:      0,
          opacity:     visible ? 1 : 0,
          transform:   visible ? 'translateY(0)' : 'translateY(14px)',
          transition:  'opacity 0.6s ease 350ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) 350ms',
        }}
      >
        {name}
      </h2>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────────────── */
function animateTrack(track: HTMLDivElement, pct: number) {
  track.animate(
    { transform: `translate(${pct}%, -50%)` },
    { duration: 150, fill: 'forwards', easing: 'cubic-bezier(0.16,1,0.3,1)' },
  );
  track.querySelectorAll<HTMLElement>('.album-cover').forEach((img) => {
    img.animate(
      { objectPosition: `${50 - pct * 0.6}% center` },
      { duration: 150, fill: 'forwards', easing: 'cubic-bezier(0.16,1,0.3,1)' },
    );
  });
}

/* ── Main component ──────────────────────────────────────────── */
export default function AlbumsDragTrack({ albums }: { albums: AlbumWithCat[] }) {
  const t = useT();
  const [cat,        setCat]        = useState<string>('all');
  const [previewCat, setPreviewCat] = useState<{ name: string; photos: string[] } | null>(null);

  function handleCatClick(slug: string, displayName: string) {
    const covers = albums
      .filter((a) => a.category?.slug === slug && a.cover_url)
      .slice(0, 3)
      .map((a) => a.cover_url!);
    if (covers.length === 0) { setCat(slug); return; }
    setPreviewCat({ name: displayName, photos: covers });
    setTimeout(() => { setPreviewCat(null); setCat(slug); }, 2300);
  }

  const filtered = cat === 'all'
    ? albums
    : albums.filter((a) => a.category?.slug === cat);

  const categories = Array.from(
    new Map(
      albums.filter((a) => a.category).map((a) => [a.category!.slug, a.category!])
    ).values()
  );

  /* ── drag state (stored directly in dataset, exactly like the reference) */
  const trackRef   = useRef<HTMLDivElement>(null);
  const hasDragged = useRef(false);

  /* Reset track position when category changes */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.dataset.mouseDownAt    = '0';
    track.dataset.prevPercentage = '0';
    track.dataset.percentage     = '0';
    // Entrance animation on first mount, instant reset on cat change
    const isFirst = !track.dataset.entered;
    if (isFirst) {
      track.dataset.entered = '1';
      track.animate(
        { transform: ['translate(60%, -50%)', 'translate(0%, -50%)'] },
        { duration: 500, fill: 'forwards', easing: 'cubic-bezier(0.16,1,0.3,1)' },
      );
    } else {
      track.animate({ transform: 'translate(0%, -50%)' }, { duration: 0, fill: 'forwards' });
      track.querySelectorAll<HTMLElement>('.album-cover').forEach((img) => {
        img.animate({ objectPosition: '50% center' }, { duration: 0, fill: 'forwards' });
      });
    }
  }, [cat]);

  /* ── pointer/touch handlers wired on the window (same as reference) */
  useEffect(() => {
    const handleDown = (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;
      hasDragged.current = false;
      track.dataset.mouseDownAt = String(clientX);
    };

    const handleUp = () => {
      const track = trackRef.current;
      if (!track) return;
      track.dataset.mouseDownAt    = '0';
      track.dataset.prevPercentage = track.dataset.percentage ?? '0';
    };

    const handleMove = (clientX: number) => {
      const track = trackRef.current;
      if (!track || track.dataset.mouseDownAt === '0') return;

      const mouseDelta   = parseFloat(track.dataset.mouseDownAt!) - clientX;
      const maxDelta     = window.innerWidth / 2;
      const percentage   = (mouseDelta / maxDelta) * -100;
      const prev         = parseFloat(track.dataset.prevPercentage ?? '0');
      const next         = Math.max(Math.min(prev + percentage, 0), -100);

      if (Math.abs(mouseDelta) > 4) hasDragged.current = true;

      track.dataset.percentage = String(next);
      animateTrack(track, next);
    };

    /* wheel: only intercept horizontal (trackpad swipe), let vertical through */
    const handleWheel = (e: WheelEvent) => {
      const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (!isHorizontal) return;          // let vertical scroll pass through
      e.preventDefault();
      const track = trackRef.current;
      if (!track) return;
      const prev = parseFloat(track.dataset.prevPercentage ?? '0');
      const step = (e.deltaX / window.innerWidth) * -25;
      const next = Math.max(Math.min(prev + step, 0), -100);
      track.dataset.prevPercentage = String(next);
      track.dataset.percentage     = String(next);
      animateTrack(track, next);
    };

    const onMouseDown  = (e: MouseEvent)  => handleDown(e.clientX);
    const onTouchStart = (e: TouchEvent)  => handleDown(e.touches[0].clientX);
    const onMouseMove  = (e: MouseEvent)  => handleMove(e.clientX);
    const onTouchMove  = (e: TouchEvent)  => handleMove(e.touches[0].clientX);

    window.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('mouseup',    handleUp);
    window.addEventListener('touchend',   handleUp);
    window.addEventListener('mousemove',  onMouseMove, { passive: true });
    window.addEventListener('touchmove',  onTouchMove, { passive: true });
    window.addEventListener('wheel',      handleWheel, { passive: false });

    return () => {
      window.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('mouseup',    handleUp);
      window.removeEventListener('touchend',   handleUp);
      window.removeEventListener('mousemove',  onMouseMove);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('wheel',      handleWheel);
    };
  }, []);

  return (
    <div
      style={{
        height:           'calc(100vh - var(--navbar-h))',
        overflow:         'hidden',
        position:         'relative',
        userSelect:       'none',
        WebkitUserSelect: 'none',
        touchAction:      'pan-y',
        cursor:           'grab',
      }}
    >
      {previewCat && (
        <CategoryPreview name={previewCat.name} photos={previewCat.photos} />
      )}

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
            onClick={() => handleCatClick(c.slug, c.name.toUpperCase())}
            style={{ background: cat === c.slug ? 'var(--text)' : 'transparent', color: cat === c.slug ? '#080808' : 'var(--muted)', border: '1px solid var(--border)', padding: '0.45rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', transition: 'all 0.25s ease' }}
          >
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      <p style={{ position: 'absolute', bottom: 'clamp(1.5rem,3vw,2.5rem)', left: '50%', transform: 'translateX(-50%)', zIndex: 10, fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)', opacity: 0.45, pointerEvents: 'none' }}>
        {t.albums.drag}
      </p>

      {/* Track — mirrors the reference #image-track exactly */}
      <div
        ref={trackRef}
        data-mouse-down-at="0"
        data-prev-percentage="0"
        data-percentage="0"
        style={{
          display:   'flex',
          gap:       '4vmin',
          position:  'absolute',
          left:      'calc(50% - 20vmin)',
          top:       '50%',
          transform: 'translate(0%, -50%)',
          willChange: 'transform',
        }}
        className="album-track"
      >
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
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% center', display: 'block' }}
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
                  const label = album.year
                    ? album.year
                    : (() => {
                        const d  = new Date(album.created_at);
                        const mo = d.toLocaleDateString(t.albums.dateLocale, { month: 'long' });
                        return `${mo.charAt(0).toUpperCase() + mo.slice(1)} ${d.getFullYear()}`;
                      })();
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
