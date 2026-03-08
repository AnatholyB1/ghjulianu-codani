'use client';

import Image        from 'next/image';
import Link         from 'next/link';
import { notFound } from 'next/navigation';
import { useState, use, useEffect, useRef } from 'react';
import Lightbox     from '@/components/Lightbox';
import { albums }   from '@/data/albums';

/* ── Hero parallax ─────────────────────────────────────────
   The cover image is 140% tall; a rAF scroll listener shifts
   it upward so it moves at ~40% of the page-scroll speed.
───────────────────────────────────────────────────────────── */
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
      // how far the section top is from the viewport top (negative when scrolled past)
      const progress = -top / (height + window.innerHeight); // 0 → 1
      const shift    = progress * 40; // 0% → 40% shift (image is 140% tall)
      img.style.transform = `translateY(${shift}%)`;
    };
    const onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);

  return { sectionRef, imgRef };
}

/* ── Photo card with enter/exit animation + inner parallax ──
   The <img> is 120% tall; its translateY shifts based on where
   the card sits in the viewport (top → bottom = 0% → -20%).
───────────────────────────────────────────────────────────── */
function PhotoCard({
  src, width, height, alt, index, onClick,
}: {
  src: string; width: number; height: number; alt?: string;
  index: number; onClick: () => void;
}) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const imgRef       = useRef<HTMLImageElement>(null);
  const [vis, setVis] = useState(false);

  // Visibility for fade-in / fade-out
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

  // Inner image parallax on scroll
  useEffect(() => {
    let rafId: number;
    const tick = () => {
      const wrap = wrapRef.current;
      const img  = imgRef.current;
      if (!wrap || !img) return;
      const { top, height: h } = wrap.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 when bottom of card enters viewport, 1 when top exits top
      const progress = 1 - (top + h) / (vh + h);
      const shift    = Math.max(-20, Math.min(0, progress * -20)); // 0% → -20%
      img.style.transform = `translateY(${shift}%)`;
    };
    const onScroll = () => { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(tick); };
    window.addEventListener('scroll', onScroll, { passive: true });
    tick();
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(rafId); };
  }, []);

  const delay = (index % 4) * 60;

  return (
    <div
      ref={wrapRef}
      onClick={onClick}
      style={{
        breakInside:  'avoid',
        marginBottom: 'clamp(10px,1.4vmin,20px)',
        overflow:     'hidden',
        cursor:       'zoom-in',
        display:      'block',
        opacity:       vis ? 1 : 0,
        transform:     vis ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
        transition:   `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                       transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {/* wrapper that clips the over-tall image */}
      <div style={{ overflow: 'hidden', display: 'block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={src}
          alt={alt ?? ''}
          width={width}
          height={height}
          loading="lazy"
          style={{
            display:         'block',
            width:           '100%',
            height:          'calc(100% + 20%)', // 120% tall for parallax room
            objectFit:       'cover',
            objectPosition:  'center center',
            filter:          'brightness(0.88) saturate(0.85)',
            transition:      'filter 0.4s ease',
            willChange:      'transform',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLImageElement).style.filter = 'brightness(1) saturate(1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLImageElement).style.filter = 'brightness(0.88) saturate(0.85)';
          }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function AlbumPageClient({ params }: { params: Promise<{ slug: string }> }) {
  const { slug }  = use(params);
  const album     = albums.find((a) => a.slug === slug);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { sectionRef, imgRef }   = useHeroParallax();

  if (!album) notFound();

  return (
    <>
      {/* Hero banner — cover image scrolls at 40% speed */}
      <section
        ref={sectionRef}
        style={{
          position:   'relative',
          height:     'clamp(300px, 50vh, 560px)',
          overflow:   'hidden',
          display:    'flex',
          alignItems: 'flex-end',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={album.cover}
          alt={album.title}
          style={{
            position:   'absolute',
            inset:      0,
            width:      '100%',
            height:     '140%',   // taller than its container
            objectFit:  'cover',
            objectPosition: 'center top',
            filter:     'brightness(0.38)',
            willChange: 'transform',
            top:        '-20%',   // centre the oversize start position
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.96) 0%,rgba(8,8,8,0.25) 60%,transparent 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(2rem,5vw,4rem)' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--muted)', marginBottom: '1rem' }}>
            <Link href="/albums" style={{ color: 'var(--muted)', textDecoration: 'none' }}>ALBUMS</Link>
            {' → '}
            <span style={{ color: 'var(--text)' }}>{album.title}</span>
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-cormorant),serif',
              fontSize:   'clamp(2.5rem,7vw,5.5rem)',
              fontStyle:  'italic',
              fontWeight: 300,
              lineHeight: 0.95,
              color:      'var(--text)',
              animation:  'fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s both',
            }}
          >
            {album.title}
          </h1>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {album.date && (
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>{album.date}</p>
            )}
            <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase' }}>
              {album.category === 'event' ? 'Événement' : 'Marque'}
            </p>
            <span style={{ width: '1px', height: '14px', background: 'var(--border)' }} />
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>
              {album.photos.length} photos
            </p>
          </div>

          {album.description && (
            <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--muted)', maxWidth: '480px', lineHeight: 1.7 }}>
              {album.description}
            </p>
          )}
        </div>
      </section>

      {/* Masonry collage with per-photo inner parallax */}
      <section
        style={{
          padding:   'clamp(2rem,4vw,4rem) clamp(1rem,3vw,3rem)',
          columns:   '3 220px',
          columnGap: 'clamp(10px,1.4vmin,20px)',
        }}
      >
        {album.photos.map((photo, i) => (
          <PhotoCard
            key={i}
            src={photo.src}
            width={photo.width}
            height={photo.height}
            alt={photo.alt}
            index={i}
            onClick={() => setLightbox(i)}
          />
        ))}
      </section>

      {/* Back link */}
      <div style={{ padding: '0 clamp(1rem,3vw,3rem) clamp(3rem,5vw,5rem)', borderTop: '1px solid var(--border)', paddingTop: '2rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/albums" style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--muted)', textDecoration: 'none', transition: 'color 0.2s' }}>
          ← RETOUR AUX ALBUMS
        </Link>
        <Link href="/contact" style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '2px' }}>
          COMMANDER DES PHOTOS
        </Link>
      </div>

      {lightbox !== null && (
        <Lightbox
          photos={album.photos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNext={() => setLightbox((lightbox + 1) % album.photos.length)}
          onPrev={() => setLightbox((lightbox - 1 + album.photos.length) % album.photos.length)}
        />
      )}
    </>
  );
}

