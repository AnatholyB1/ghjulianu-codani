'use client';

import Link         from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { Check, ShoppingCart, MousePointer2, Download, ArrowRight } from 'lucide-react';
import Lightbox     from '@/components/Lightbox';
import { useCart, type CartPhoto } from '@/contexts/CartContext';
import type { Album, AlbumPhoto, Category } from '@/lib/db.types';

type AlbumFull = Album & { category: Category | null; location?: string | null };

/* ── Derive short download prefix from album slug ─────────── */
function downloadPrefix(slug: string): string {
  return slug.replace(/-/g, '').toUpperCase().substring(0, 12);
}

/* ── Hero parallax — unused, kept for future use ────────────── */
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
        marginBottom: 'clamp(6px,1vmin,12px)',
        gridColumn:   'auto',
        gridRow:      'auto',
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
          width:          '42px',
          height:         '42px',
          borderRadius:   '50%',
          background:     inCart ? 'rgba(100,200,120,0.92)' : 'rgba(200,169,126,0.92)',
          border:         'none',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontSize:       'inherit',
          color:          '#080808',
          fontWeight:     700,
          lineHeight:     1,
          opacity:        hov || inCart ? 1 : 0,
          transform:      hov || inCart ? 'scale(1)' : 'scale(0.8)',
          transition:     'opacity 0.2s ease, transform 0.2s ease',
          boxShadow:      '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {inCart ? <Check size={18} strokeWidth={2.5} /> : <ShoppingCart size={18} strokeWidth={2} />}
      </button>
    </div>
  );
}

/* ── CTA Banner ─────────────────────────────────────────────── */
function CtaBanner() {
  return (
    <div
      style={{
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '1rem clamp(1rem,3vw,2rem)',
        background:     'rgba(200,169,126,0.05)',
        borderTop:      '1px solid rgba(200,169,126,0.12)',
        borderBottom:   '1px solid rgba(200,169,126,0.12)',
        gap:            '2rem',
        flexWrap:       'wrap',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        <span style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(0.9rem,2vw,1.05rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', lineHeight: 1.4 }}>
          Vous souhaitez obtenir des photos en haute qualité ?
        </span>
        <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontFamily: 'var(--font-cormorant),serif', fontStyle: 'italic', opacity: 0.9 }}>
          1&nbsp;€,&nbsp;2&nbsp;€,&nbsp;5&nbsp;€ — ou plus, à la hauteur de vos moyens
        </span>
      </div>
      <div style={{ display: 'flex', gap: 'clamp(1.2rem,3vw,2.5rem)', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <MousePointer2 size={18} color='rgba(200,169,126,0.7)' strokeWidth={1.5} />
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--muted)', lineHeight: 1.4 }}>Survolez une photo<br />et cliquez sur le bouton</span>
        </div>
        <ArrowRight size={12} color='rgba(200,169,126,0.3)' />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <ShoppingCart size={18} color='rgba(200,169,126,0.7)' strokeWidth={1.5} />
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--muted)', lineHeight: 1.4 }}>Composez votre sélection<br />depuis n'importe quel album</span>
        </div>
        <ArrowRight size={12} color='rgba(200,169,126,0.3)' />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Download size={18} color='rgba(200,169,126,0.7)' strokeWidth={1.5} />
          <span style={{ fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--muted)', lineHeight: 1.4 }}>Envoyez votre panier<br />pour recevoir les fichiers HD</span>
        </div>
      </div>
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
  const [lightbox, setLightbox] = useState<number | null>(null);

  const prefix         = downloadPrefix(album.slug);
  const lightboxPhotos = photos.map((p, i) => ({
    src:     p.src,
    width:   p.width,
    height:  p.height,
    alt:     `IMG_${String(i + 1).padStart(3, '0')}`,
    context: album.title,
  }));

  /* Format date — prefer the year field entered in admin */
  const dateStr = (() => {
    if (album.year) return album.year;
    const d     = new Date(album.created_at);
    const month = d.toLocaleDateString('fr-FR', { month: 'long' });
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${d.getFullYear()}`;
  })();

  return (
    <>
      {/* ── Hero ── */}
      <section
        style={{ position: 'relative', height: 'clamp(340px, 55vh, 620px)', overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={album.background_url ?? album.cover_url ?? 'https://picsum.photos/seed/hero/1920/1080'}
          alt={album.title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
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
      <div>
        <CtaBanner />
      </div>

      {/* ── Photo grid (left-to-right) ── */}
      <section
        style={{
          padding:             'clamp(1.5rem,3vw,2.5rem) clamp(0.75rem,2vw,1.5rem)',
          display:             'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
          gap:                 'clamp(6px,1vmin,12px)',
          alignItems:          'start',
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
      <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem' }}>
        <CtaBanner />
        <div style={{ padding: 'clamp(1.5rem,3vw,2.5rem) clamp(0.75rem,2vw,1.5rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <Link href="/albums" style={{ fontSize: '0.65rem', letterSpacing: '0.14em', color: 'var(--muted)', textDecoration: 'none' }}>← RETOUR AUX ALBUMS</Link>
          <p style={{ fontSize: '0.55rem', letterSpacing: '0.1em', color: 'rgba(122,122,116,0.35)' }}>{prefix}</p>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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

