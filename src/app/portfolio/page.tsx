'use client';

import { useEffect, useRef, useState } from 'react';
import Image    from 'next/image';
import Lightbox from '@/components/Lightbox';
import ScrollReveal from '@/components/ScrollReveal';
import { portfolioPhotos } from '@/data/portfolio';

/* ── Photo card with enter / exit scroll animation ─────────── */
function PhotoCard({
  src, width, height, alt, index,
  onClick,
}: {
  src: string; width: number; height: number; alt?: string;
  index: number; onClick: () => void;
}) {
  const ref     = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);

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

  const delay = (index % 4) * 60; // stagger by column position

  return (
    <div
      ref={ref}
      onClick={onClick}
      style={{
        breakInside:   'avoid',
        marginBottom:  'clamp(10px,1.4vmin,20px)',
        overflow:      'hidden',
        cursor:        'zoom-in',
        display:       'block',
        opacity:        vis ? 1 : 0,
        transform:      vis ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
        transition:    `opacity 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms,
                        transform 0.7s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
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
          filter:     'brightness(0.88) saturate(0.85)',
          transition: 'filter 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLImageElement).style.filter    = 'brightness(1) saturate(1)';
          (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.025)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLImageElement).style.filter    = 'brightness(0.88) saturate(0.85)';
          (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
export default function PortfolioPage() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      {/* Header */}
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem) 0' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>
            PHOTOGRAPHIE
          </p>
          <h1
            style={{
              fontFamily: 'var(--font-cormorant),serif',
              fontSize:   'clamp(2.5rem,7vw,5.5rem)',
              fontStyle:  'italic',
              fontWeight: 300,
              lineHeight: 0.95,
              color:      'var(--text)',
            }}
          >
            Portfolio
          </h1>
        </ScrollReveal>
      </section>

      {/* Masonry collage */}
      <section
        style={{
          padding:    'clamp(2rem,4vw,4rem) clamp(1rem,3vw,3rem)',
          columns:    '3 220px',
          columnGap:  'clamp(10px,1.4vmin,20px)',
        }}
      >
        {portfolioPhotos.map((photo, i) => (
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

      {lightbox !== null && (
        <Lightbox
          photos={portfolioPhotos}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onNext={() => setLightbox((lightbox + 1) % portfolioPhotos.length)}
          onPrev={() => setLightbox((lightbox - 1 + portfolioPhotos.length) % portfolioPhotos.length)}
        />
      )}
    </>
  );
}

