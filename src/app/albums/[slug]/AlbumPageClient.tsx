'use client';

import Link         from 'next/link';
import { useState, useEffect, useRef } from 'react';
import Lightbox     from '@/components/Lightbox';
import { useCart, type CartPhoto } from '@/contexts/CartContext';
import type { Album, AlbumPhoto, Category } from '@/lib/db.types';

type AlbumFull = Album & { category: Category | null };

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
  src, width, height, alt, index, onClick, albumTitle,
}: {
  src: string; width: number; height: number; alt?: string;
  index: number; onClick: () => void; albumTitle: string;
}) {
  const wrapRef       = useRef<HTMLDivElement>(null);
  const imgRef        = useRef<HTMLImageElement>(null);
  const [vis, setVis] = useState(false);
  const [hov, setHov] = useState(false);
  const { add, remove, has } = useCart();
  const inCart = has(src);

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
  const cartPhoto: CartPhoto = { id: src, src, width, height, alt: alt ?? '', context: albumTitle };

  return (
    <div
      ref={wrapRef}
      style={{
        breakInside: 'avoid',
        marginBottom: 'clamp(10px,1.4vmin,20px)',
        position:    'relative',
        cursor:      'zoom-in',
        display:     'block',
        opacity:      vis ? 1 : 0,
        transform:    vis ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
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
          alt={alt ?? ''}
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
          width:          '32px',
          height:         '32px',
          borderRadius:   '50%',
          background:     inCart ? 'rgba(100,200,120,0.92)' : 'rgba(200,169,126,0.92)',
          border:         'none',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       '0.9rem',
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

/* ─────────────────────────────────────────────────────────── */
export default function AlbumPageClient({
  album,
  photos,
}: {
  album:  AlbumFull;
  photos: AlbumPhoto[];
}) {
  const [lightbox, setLightbox]  = useState<number | null>(null);
  const { sectionRef, imgRef }   = useHeroParallax();

  const lightboxPhotos = photos.map((p) => ({ src: p.src, width: p.width, height: p.height, alt: p.alt ?? '', context: album.title }));

  return (
    <>
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
            {album.year && <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>{album.year}</p>}
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

      <section style={{ padding: 'clamp(2rem,4vw,4rem) clamp(1rem,3vw,3rem)', columns: '3 220px', columnGap: 'clamp(10px,1.4vmin,20px)' }}>
        {photos.map((photo, i) => (
          <PhotoCard key={photo.id} src={photo.src} width={photo.width} height={photo.height} alt={photo.alt ?? ''} index={i} onClick={() => setLightbox(i)} albumTitle={album.title} />
        ))}
      </section>

      <div style={{ padding: '0 clamp(1rem,3vw,3rem) clamp(3rem,5vw,5rem)', borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/albums" style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--muted)', textDecoration: 'none' }}>← RETOUR AUX ALBUMS</Link>
        <Link href="/contact" style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '2px' }}>COMMANDER DES PHOTOS</Link>
      </div>

      {lightbox !== null && (
        <Lightbox photos={lightboxPhotos} index={lightbox} onClose={() => setLightbox(null)} onNext={() => setLightbox((lightbox + 1) % photos.length)} onPrev={() => setLightbox((lightbox - 1 + photos.length) % photos.length)} />
      )}
    </>
  );
}
