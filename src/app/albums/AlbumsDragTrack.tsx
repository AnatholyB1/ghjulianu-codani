'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import type { Album, Category } from '@/lib/db.types';
import { useT } from '@/hooks/useT';
import { createClient } from '@/utils/supabase/client';

type AlbumWithCat = Album & { category: Category | null };

export default function AlbumsDragTrack() {
  const t = useT();
  const [allAlbums, setAllAlbums] = useState<AlbumWithCat[]>([]);
  const [loading, setLoading]     = useState(true);
  const [nightCat, setNightCat]   = useState<string>('all');
  const [dayCat, setDayCat]       = useState<string>('all');

  // Two independent tracks
  const nightTrackRef = useRef<HTMLDivElement>(null);
  const dayTrackRef   = useRef<HTMLDivElement>(null);

  // Track locking: hover sets hovered, mousedown locks it for the drag duration
  const hoveredTrackRef = useRef<HTMLDivElement | null>(null);
  const lockedTrackRef  = useRef<HTMLDivElement | null>(null);
  const hasDragged      = useRef(false);

  // Per-track image parallax state
  const nightImgTarget  = useRef(0);
  const nightImgCurrent = useRef(0);
  const dayImgTarget    = useRef(0);
  const dayImgCurrent   = useRef(0);

  /* Fetch all albums on mount (no day/night filter — two rows handle split) */
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('albums')
      .select('*, category:categories(*)')
      .order('sort_order', { ascending: false })
      .then(({ data }) => {
        setAllAlbums(data ?? []);
        setLoading(false);
      });
  }, []);

  /* Split by is_day — null appears in both rows */
  const nightAlbums = allAlbums.filter((a) => a.is_day === false || a.is_day === null);
  const dayAlbums   = allAlbums.filter((a) => a.is_day === true  || a.is_day === null);

  const nightCategories = Array.from(
    new Map(nightAlbums.filter((a) => a.category).map((a) => [a.category!.slug, a.category!])).values()
  );
  const dayCategories = Array.from(
    new Map(dayAlbums.filter((a) => a.category).map((a) => [a.category!.slug, a.category!])).values()
  );

  const filteredNight = nightCat === 'all' ? nightAlbums : nightAlbums.filter((a) => a.category?.slug === nightCat);
  const filteredDay   = dayCat   === 'all' ? dayAlbums   : dayAlbums.filter((a) => a.category?.slug === dayCat);

  /* ── Drag handlers ──────────────────────────────────────────── */
  useEffect(() => {
    const handleOnDown = (clientX: number) => {
      // Lock to whatever track is currently hovered
      lockedTrackRef.current = hoveredTrackRef.current;
      const track = lockedTrackRef.current;
      if (!track) return;
      track.dataset.mouseDownAt = String(clientX);
      hasDragged.current = false;
    };

    const handleOnUp = () => {
      const track = lockedTrackRef.current;
      if (track) {
        track.dataset.prevPercentage = track.dataset.percentage ?? '0';
        track.dataset.mouseDownAt    = '0';
      }
      lockedTrackRef.current = null;
    };

    const handleOnMove = (clientX: number) => {
      const track = lockedTrackRef.current;
      if (!track || !track.dataset.mouseDownAt || track.dataset.mouseDownAt === '0') return;

      const mouseDelta = parseFloat(track.dataset.mouseDownAt) - clientX;
      // maxDelta = full window width → half the speed of the original (/2)
      const maxDelta                    = window.innerWidth;
      const percentage                  = (mouseDelta / maxDelta) * -100;
      const nextPercentageUnconstrained = parseFloat(track.dataset.prevPercentage ?? '0') + percentage;
      const nextPercentage              = Math.max(Math.min(nextPercentageUnconstrained, 0), -100);

      if (Math.abs(mouseDelta) > 4) hasDragged.current = true;

      track.dataset.percentage = String(nextPercentage);
      track.animate(
        { transform: `translate(${nextPercentage}%, -50%)` },
        { duration: 1200, fill: 'forwards' }
      );

      const imgTarget = nextPercentage * 0.25;
      if (track === nightTrackRef.current) {
        nightImgTarget.current = imgTarget;
      } else {
        dayImgTarget.current = imgTarget;
      }
    };

    window.onmousedown  = (e) => handleOnDown(e.clientX);
    window.ontouchstart = (e) => handleOnDown(e.touches[0].clientX);
    window.onmouseup    = () => handleOnUp();
    window.ontouchend   = () => handleOnUp();
    window.onmousemove  = (e) => handleOnMove(e.clientX);
    window.ontouchmove  = (e) => handleOnMove(e.touches[0].clientX);

    /* rAF loop — smooth lerp for image parallax on both tracks */
    let rafId: number;
    const tick = () => {
      nightImgCurrent.current += (nightImgTarget.current - nightImgCurrent.current) * 0.12;
      dayImgCurrent.current   += (dayImgTarget.current   - dayImgCurrent.current)   * 0.12;

      const nTrack = nightTrackRef.current;
      const dTrack = dayTrackRef.current;
      if (nTrack) {
        for (const img of nTrack.getElementsByClassName('image') as HTMLCollectionOf<HTMLElement>) {
          img.style.transform = `translateX(${nightImgCurrent.current}%)`;
        }
      }
      if (dTrack) {
        for (const img of dTrack.getElementsByClassName('image') as HTMLCollectionOf<HTMLElement>) {
          img.style.transform = `translateX(${dayImgCurrent.current}%)`;
        }
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.onmousedown  = null;
      window.ontouchstart = null;
      window.onmouseup    = null;
      window.ontouchend   = null;
      window.onmousemove  = null;
      window.ontouchmove  = null;
      cancelAnimationFrame(rafId);
    };
  }, []);

  /* Reset track position when category changes */
  useEffect(() => {
    const track = nightTrackRef.current;
    if (!track) return;
    track.dataset.mouseDownAt    = '0';
    track.dataset.prevPercentage = '0';
    track.dataset.percentage     = '0';
    track.animate({ transform: 'translate(0%, -50%)' }, { duration: 0, fill: 'forwards' });
    nightImgTarget.current  = 0;
    nightImgCurrent.current = 0;
  }, [nightCat]);

  useEffect(() => {
    const track = dayTrackRef.current;
    if (!track) return;
    track.dataset.mouseDownAt    = '0';
    track.dataset.prevPercentage = '0';
    track.dataset.percentage     = '0';
    track.animate({ transform: 'translate(0%, -50%)' }, { duration: 0, fill: 'forwards' });
    dayImgTarget.current  = 0;
    dayImgCurrent.current = 0;
  }, [dayCat]);

  /* ── Shared row renderer ─────────────────────────────────────── */
  function renderRow(
    trackRef: React.RefObject<HTMLDivElement | null>,
    albums: AlbumWithCat[],
    categories: Category[],
    cat: string,
    setCat: (v: string) => void,
    sectionLabel: string,
  ) {
    return (
      <div
        onMouseEnter={() => { hoveredTrackRef.current = trackRef.current; }}
        onTouchStart={() => { hoveredTrackRef.current = trackRef.current; }}
        style={{
          height:           'calc((100vh - var(--navbar-h)) / 2)',
          width:            '100vw',
          overflow:         'hidden',
          background:       'var(--bg)',
          position:         'relative',
          userSelect:       'none',
          WebkitUserSelect: 'none',
          touchAction:      'none',
          borderBottom:     '1px solid var(--border)',
        }}
      >
        {/* Section label + category filters */}
        <div style={{
          position: 'absolute',
          top:      'clamp(0.6rem,1.2vw,1rem)',
          left:     'clamp(1.5rem,3vw,3rem)',
          zIndex:   10,
          display:  'flex',
          alignItems: 'center',
          gap:      '1rem',
        }}>
          <span style={{ fontSize: '0.5rem', letterSpacing: '0.22em', color: 'var(--muted)', flexShrink: 0 }}>
            {sectionLabel}
          </span>
          <div style={{ display: 'flex', gap: '0.2rem' }}>
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setCat('all')}
              style={{
                background:    cat === 'all' ? 'var(--text)' : 'transparent',
                color:         cat === 'all' ? 'var(--bg)'   : 'var(--muted)',
                border:        '1px solid var(--border)',
                padding:       '0.28rem 0.8rem',
                fontSize:      '0.55rem',
                letterSpacing: '0.14em',
                cursor:        'pointer',
                transition:    'all 0.25s',
              }}
            >
              {t.albums.all}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => setCat(c.slug)}
                style={{
                  background:    cat === c.slug ? 'var(--text)' : 'transparent',
                  color:         cat === c.slug ? 'var(--bg)'   : 'var(--muted)',
                  border:        '1px solid var(--border)',
                  padding:       '0.28rem 0.8rem',
                  fontSize:      '0.55rem',
                  letterSpacing: '0.14em',
                  cursor:        'pointer',
                  transition:    'all 0.25s',
                }}
              >
                {c.name.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Image track */}
        <div
          ref={trackRef}
          data-mouse-down-at="0"
          data-prev-percentage="0"
          data-percentage="0"
          style={{
            display:   'flex',
            gap:       '2vmin',
            position:  'absolute',
            left:      '50%',
            top:       '50%',
            transform: 'translate(0%, -50%)',
          }}
        >
          {albums.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '0.62rem', letterSpacing: '0.1em', padding: '2rem 1rem', whiteSpace: 'nowrap' }}>
              Aucun album disponible
            </div>
          ) : (
            albums.map((album) => (
              <Link
                key={album.id}
                href={`/albums/${album.slug}`}
                draggable={false}
                onClick={(e) => { if (hasDragged.current) e.preventDefault(); }}
                style={{
                  position:      'relative',
                  flexShrink:    0,
                  display:       'block',
                  overflow:      'hidden',
                  textDecoration: 'none',
                  /* 9:16 portrait cover — height fills most of the row */
                  height:        'calc((100vh - var(--navbar-h)) / 2 - 4.5rem)',
                  aspectRatio:   '9 / 16',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="image"
                  src={album.cover_url ?? 'https://picsum.photos/seed/default/600/900'}
                  alt={album.title}
                  draggable={false}
                  style={{
                    width:         '100%',
                    height:        '100%',
                    objectFit:     'cover',
                    objectPosition: 'center',
                    transform:     'translateX(0%)',
                    pointerEvents: 'none',
                    willChange:    'transform',
                    display:       'block',
                  }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.75) 0%,transparent 55%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '0.8rem', left: '0.8rem', right: '0.8rem', pointerEvents: 'none' }}>
                  <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(0.85rem,2vmin,1.3rem)', fontStyle: 'italic', fontWeight: 400, color: '#E8E4DC', lineHeight: 1.1, margin: 0 }}>
                    {album.title}
                  </h2>
                  {!album.is_public && <span style={{ fontSize: '0.7rem', color: '#c8a97e' }}>🔒</span>}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height: 'calc(100vh - var(--navbar-h))', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)', fontSize: '0.62rem', letterSpacing: '0.18em' }}>
        CHARGEMENT…
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - var(--navbar-h))', width: '100vw', overflow: 'hidden', background: 'var(--bg)' }}>
      {renderRow(nightTrackRef, filteredNight, nightCategories, nightCat, setNightCat, 'NUIT')}
      {renderRow(dayTrackRef,   filteredDay,   dayCategories,   dayCat,   setDayCat,   'JOUR')}
    </div>
  );
}
