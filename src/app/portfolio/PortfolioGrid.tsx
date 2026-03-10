'use client';

import { useEffect, useRef, useState } from 'react';
import Image    from 'next/image';
import Lightbox from '@/components/Lightbox';
import { useCart, type CartPhoto } from '@/contexts/CartContext';
import type { PortfolioPhoto } from '@/lib/db.types';

type LBPhoto = { src: string; width: number; height: number; alt: string; context?: string };

function PhotoCard({
  src, width, height, alt, index, onClick,
}: {
  src: string; width: number; height: number; alt?: string;
  index: number; onClick: () => void;
}) {
  const ref              = useRef<HTMLDivElement>(null);
  const [vis,  setVis]   = useState(false);
  const [hov,  setHov]   = useState(false);
  const { add, remove, has } = useCart();
  const inCart = has(src);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setVis(entry.isIntersecting),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const delay = (index % 4) * 60;

  const cartPhoto: CartPhoto = { id: src, src, width, height, alt: alt ?? '', context: 'Portfolio' };

  return (
    <div
      ref={ref}
      style={{
        breakInside:  'avoid',
        marginBottom: 'clamp(10px,1.4vmin,20px)',
        display:      'block',
        position:     'relative',
        opacity:       vis ? 1 : 0,
        transform:     vis ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
        transition:   `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                       transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {/* image (overflow hidden here so cart btn stays visible) */}
      <div
        onClick={onClick}
        style={{ overflow: 'hidden', cursor: 'zoom-in', display: 'block' }}
      >
        <Image
          src={src}
          alt={alt ?? ''}
          width={width}
          height={height}
          unoptimized
          style={{
            display:    'block',
            width:      '100%',
            height:     'auto',
            filter:     hov ? 'brightness(1) saturate(1)' : 'brightness(0.88) saturate(0.85)',
            transform:  hov ? 'scale(1.025)' : 'scale(1)',
            transition: 'filter 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </div>

      {/* cart button */}
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

export default function PortfolioGrid({ photos }: { photos: PortfolioPhoto[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const lbPhotos: LBPhoto[] = photos.map((p) => ({
    src: p.src, width: p.width, height: p.height, alt: p.alt ?? '', context: 'Portfolio',
  }));

  return (
    <>
      <section style={{ padding: 'clamp(2rem,4vw,4rem) clamp(1rem,3vw,3rem)', columns: '3 220px', columnGap: 'clamp(10px,1.4vmin,20px)' }}>
        {photos.map((photo, i) => (
          <PhotoCard
            key={photo.id}
            src={photo.src}
            width={photo.width}
            height={photo.height}
            alt={photo.alt ?? ''}
            index={i}
            onClick={() => setLightbox(i)}
          />
        ))}
      </section>

      {lightbox !== null && (
        <Lightbox
          photos={lbPhotos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNext={() => setLightbox((lightbox + 1) % photos.length)}
          onPrev={() => setLightbox((lightbox - 1 + photos.length) % photos.length)}
        />
      )}
    </>
  );
}
