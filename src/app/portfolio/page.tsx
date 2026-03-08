'use client';

import Image      from 'next/image';
import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import Lightbox    from '@/components/Lightbox';
import { portfolioPhotos } from '@/data/portfolio';

export default function PortfolioPage() {
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <>
      {/* Page header */}
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

      {/* Asymmetric grid */}
      <section
        style={{
          padding:      'clamp(2rem,4vw,4rem) clamp(1rem,3vw,3rem)',
          columnCount:  3,
          columnGap:    '6px',
        }}
        className="portfolio-grid"
      >
        {portfolioPhotos.map((photo, i) => (
          <ScrollReveal key={i} direction="up" delay={(i % 5) * 60}
            style={{ breakInside: 'avoid', marginBottom: '6px', display: 'block' }}
          >
            <button
              onClick={() => setLightbox(i)}
              className="portfolio-item"
              style={{
                display:    'block',
                width:      '100%',
                background: 'none',
                border:     'none',
                padding:    0,
                cursor:     'zoom-in',
                overflow:   'hidden',
                position:   'relative',
              }}
            >
              <Image
                src={photo.src}
                alt={photo.alt ?? `Photo ${i + 1}`}
                width={photo.width}
                height={photo.height}
                unoptimized
                className="portfolio-img"
                style={{
                  width:      '100%',
                  height:     'auto',
                  display:    'block',
                  objectFit:  'cover',
                  filter:     'brightness(0.92)',
                  transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.4s ease',
                }}
              />
            </button>
          </ScrollReveal>
        ))}
      </section>

      {/* Hover CSS + responsive grid */}
      <style>{`
        .portfolio-item:hover .portfolio-img {
          transform: scale(1.055);
          filter: brightness(1.05) !important;
        }
        @media (max-width: 900px) {
          .portfolio-grid { column-count: 2 !important; }
        }
        @media (max-width: 550px) {
          .portfolio-grid { column-count: 1 !important; }
        }
      `}</style>

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
