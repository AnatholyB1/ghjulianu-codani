'use client';

import Link         from 'next/link';
import Image        from 'next/image';
import { useState, useEffect, useRef } from 'react';
import Lightbox     from '@/components/Lightbox';
import { useCart, type CartPhoto } from '@/contexts/CartContext';
import type { Album, AlbumPhoto, Category } from '@/lib/db.types';

type AlbumFull = Album & { category: Category | null; location?: string | null };

/* ── Derive short download prefix from album slug ─────────── */
function downloadPrefix(slug: string): string {
  return slug.replace(/-/g, '').toUpperCase().substring(0, 12);
}

/* ── Hero parallax ─────────────────────────────────────────── */
function useHeroParallax() {
  const sectionRef = useRef<HTMLElement>(null);
  const imgRef     = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const section = sectionRef.current;
      const img     = imgRef.current;
      if (!section || !img) return;
      const { top, height } = section.getBoundingClientRect();
      const progress = -top / (height + window.innerHeight);
      const shift    = progress * 40;
      img.style.transform = `translateY(${shift}%)`;
    };
    const onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);

  return { sectionRef, imgRef };
}

/* ── Photo card with enter/exit animation + inner parallax ─── */
function PhotoCard({
  src, width, height, alt, index, onClick, albumTitle, prefix,
}: {
  src: string; width: number; height: number; alt?: string;
  index: number; onClick: () => void; albumTitle: string; prefix: string;
}) {
  const wrapRef       = useRef<HTMLDivElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  const { add, remove, has } = useCart();
  const inCart = has(src);

  const label    = `IMG_${String(index + 1).padStart(3, '0')}`;
  const dlName   = `${prefix}_${String(index + 1).padStart(3, '0')}`;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVis(entry.isIntersecting),
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const wrap = wrapRef.current;
      const img  = imgRef.current;
      if (!wrap || !img) return;
      const { top, height: h } = wrap.getBoundingClientRect();
      const vh       = window.innerHeight;
      const progress = 1 - (top + h) / (vh + h);
      const shift    = Math.max(-20, Math.min(0, progress * -20));
      img.style.transform = `translateY(${shift}%)`;
    };
    const onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);

  const delay = (index % 4) * 60;
  const cartPhoto: CartPhoto = {
    id:           src,
    src,
    width,
    height,
    alt:          label,
    context:      albumTitle,
    downloadName: dlName,
  };

  return (
    <div
      ref={wrapRef}
      style={{
        breakInside: 'avoid',
        marginBottom: 'clamp(6px,1vmin,12px)',
        position:    'relative',
        cursor:      'zoom-in',
        display:     'block',
        opacity:      vis ? 1 : 0,
        transform:    vis ? 'translateY(0) scale(1)' : 'translateY(28px) scale(0.97)',
        transition:  `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div onClick={onClick} style={{ overflow: 'hidden', display: 'block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? label}
          width={width}
          height={height}
          loading="lazy"
          style={{
            display:        'block',
            width:          '100%',
            height:         'calc(100% + 20%)',
            objectFit:      'cover',
            objectPosition: 'center center',
            filter:         hov ? 'brightness(1) saturate(1)' : 'brightness(0.88) saturate(0.85)',
            transition:     'filter 0.4s ease',
            willChange:     'transform',
          }}
        />
      </div>

      {/* Photo label  */}
      <span
        style={{
          position:      'absolute',
          bottom:        hov ? '44px' : '8px',
          left:          '8px',
          fontSize:      '0.48rem',
          letterSpacing: '0.1em',
          color:         'rgba(232,228,220,0.45)',
          fontFamily:    'var(--font-space)',
          pointerEvents: 'none',
          transition:    'bottom 0.2s ease',
          textShadow:    '0 1px 3px rgba(0,0,0,0.8)',
        }}
      >
        {label}
      </span>

      {/* Cart button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          inCart ? remove(src) : add(cartPhoto);
        }}
        aria-label={inCart ? 'Retirer du panier' : 'Ajouter au panier'}
        style={{
          position:       'absolute',
          bottom:         '8px',
          right:          '8px',
          width:          '30px',
          height:         '30px',
          borderRadius:   '50%',
          background:     inCart ? 'rgba(100,200,120,0.92)' : 'rgba(200,169,126,0.92)',
          border:         'none',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '0.85rem',
          color:          '#080808',
          fontWeight:     700,
          lineHeight:     1,
          opacity:        hov || inCart ? 1 : 0,
          transform:      hov || inCart ? 'scale(1)' : 'scale(0.8)',
          transition:     'opacity 0.2s ease, transform 0.2s ease',
          boxShadow:      '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {inCart ? '✓' : '+'}
      </button>
    </div>
  );
}

/* ── CTA Banner ─────────────────────────────────────────────── */
function CtaBanner() {
  return (
    <Link
      href="/contact"
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '1rem clamp(1rem,3vw,2rem)',
        background:     'rgba(200,169,126,0.07)',
        border:         '1px solid rgba(200,169,126,0.18)',
        textDecoration: 'none',
        gap:            '1rem',
        transition:     'background 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(200,169,126,0.13)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(200,169,126,0.07)'; }}
    >
      <span style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(0.9rem,2vw,1.1rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', lineHeight: 1.3 }}>
        Intéressé par des photos ? Clique ici pour les avoir en haute qualité&nbsp;!
      </span>
      <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--accent)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        NOUS CONTACTER →
      </span>
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function AlbumPageClient({
  album,
  photos,
}: {
  album:  AlbumFull;
  photos: AlbumPhoto[];
}) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { sectionRef, imgRef }  = useHeroParallax();

  const prefix         = downloadPrefix(album.slug);
  const lightboxPhotos = photos.map((p, i) => ({
    src:     p.src,
    width:   p.width,
    height:  p.height,
    alt:     `IMG_${String(i + 1).padStart(3, '0')}`,
    context: album.title,
  }));

  /* Format date */
  const d       = new Date(album.created_at);
  const month   = d.toLocaleDateString('fr-FR', { month: 'long' });
  const year    = d.getFullYear();
  const dateStr = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;

  return (
    <>
      {/* ── Fixed left sidebar ── */}
      <aside className="album-sidebar">
        {album.cover_url && (
          <div style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', marginBottom: '1rem', flexShrink: 0 }}>
            <Image
              src={album.cover_url}
              alt={album.title}
              width={160}
              height={213}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.75)' }}
            />
          </div>
        )}

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: '0.9rem', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', lineHeight: 1.2, marginBottom: '0.6rem', wordBreak: 'break-word' }}>
            {album.title}
          </h2>
          <p style={{ fontSize: '0.5rem', letterSpacing: '0.14em', color: 'var(--muted)', marginBottom: '0.3rem' }}>{dateStr}</p>
          {album.location && (
            <p style={{ fontSize: '0.48rem', letterSpacing: '0.1em', color: 'rgba(122,122,116,0.65)' }}>{album.location}</p>
          )}
          {album.category && (
            <p style={{ marginTop: '0.6rem', fontSize: '0.45rem', letterSpacing: '0.18em', color: 'rgba(200,169,126,0.5)', textTransform: 'uppercase' }}>{album.category.name}</p>
          )}
        </div>

        <p style={{ fontSize: '0.45rem', letterSpacing: '0.1em', color: 'rgba(122,122,116,0.35)', marginTop: 'auto', paddingTop: '1rem', flexShrink: 0 }}>
          {photos.length} PHOTOS
        </p>
      </aside>

      {/* ── Hero ── */}
      <section
        ref={sectionRef}
        style={{ position: 'relative', height: 'clamp(300px, 50vh, 560px)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={album.cover_url ?? 'https://picsum.photos/seed/hero/1200/800'}
          alt={album.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '140%', objectFit: 'cover', objectPosition: 'center top', filter: 'brightness(0.38)', willChange: 'transform', top: '-20%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.96) 0%,rgba(8,8,8,0.25) 60%,transparent 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(2rem,5vw,4rem)' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--muted)', marginBottom: '1rem' }}>
            <Link href="/albums" style={{ color: 'var(--muted)', textDecoration: 'none' }}>ALBUMS</Link>
            {' → '}
            <span style={{ color: 'var(--text)' }}>{album.title}</span>
          </p>

          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)', animation: 'fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>
            {album.title}
          </h1>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>{dateStr}</p>
            {album.location && (
              <>
                <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>{album.location}</p>
              </>
            )}
            {album.category && (
              <>
                <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
                <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase' }}>{album.category.name}</p>
              </>
            )}
            <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>{photos.length} photos</p>
          </div>

          {album.description && (
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)', maxWidth: '480px', lineHeight: 1.7 }}>{album.description}</p>
          )}
        </div>
      </section>

      {/* ── CTA top ── */}
      <div className="album-main-offset">
        <CtaBanner />
      </div>

      {/* ── Photo grid ── */}
      <section
        className="album-main-offset"
        style={{
          padding:   'clamp(1.5rem,3vw,2.5rem) clamp(0.75rem,2vw,1.5rem)',
          columns:   '4 160px',
          columnGap: 'clamp(6px,1vmin,12px)',
        }}
      >
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            src={photo.src}
            width={photo.width}
            height={photo.height}
            alt={photo.alt ?? ''}
            index={i}
            onClick={() => setLightbox(i)}
            albumTitle={album.title}
            prefix={prefix}
          />
        ))}
      </section>

      {/* ── CTA bottom + back link ── */}
      <div className="album-main-offset" style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
        <CtaBanner />
        <div style={{ padding: 'clamp(1.5rem,3vw,2.5rem) clamp(0.75rem,2vw,1.5rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/albums" style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--muted)', textDecoration: 'none' }}>← RETOUR AUX ALBUMS</Link>
          <p style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: 'rgba(122,122,116,0.35)' }}>{prefix}</p>
        </div>
      </div>

      {/* ── Sidebar + layout styles ── */}
      <style>{`
        .album-sidebar {
          position:        fixed;
          top:             var(--navbar-h);
          left:            0;
          width:           160px;
          height:          calc(100vh - var(--navbar-h));
          background:      rgba(8,8,8,0.9);
          border-right:    1px solid var(--border);
          backdrop-filter: blur(10px);
          padding:         1.2rem 1rem;
          z-index:         50;
          display:         flex;
          flex-direction:  column;
          overflow:        hidden;
          animation:       fadeIn 0.5s ease 0.15s both;
        }
        .album-main-offset { margin-left: 160px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 680px) {
          .album-sidebar     { display: none; }
          .album-main-offset { margin-left: 0; }
        }
      `}</style>

      {lightbox !== null && (
        <Lightbox
          photos={lightboxPhotos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNext={() => setLightbox((lightbox + 1) % photos.length)}
          onPrev={() => setLightbox((lightbox - 1 + photos.length) % photos.length)}
        />
      )}
    </>
  );
}

