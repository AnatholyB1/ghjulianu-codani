'use client';

import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import Lightbox     from '@/components/Lightbox';
import DragTrack, { TrackPhoto } from '@/components/DragTrack';
import { portfolioPhotos } from '@/data/portfolio';

const trackPhotos: TrackPhoto[] = portfolioPhotos.map((p) => ({
  src:    p.src,
  width:  p.width,
  height: p.height,
  alt:    p.alt,
}));

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

      {/* ── Brick-wall drag track ── */}
      <section style={{ padding: 'clamp(2rem,4vw,4rem) 0' }}>
        <ScrollReveal direction="up" threshold={0.05}>
          <DragTrack
            photos={trackPhotos}
            onClickPhoto={(idx) => setLightbox(idx)}
          />
        </ScrollReveal>
      </section>

      {/* Drag hint */}
      <p style={{ textAlign: 'center', fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)', opacity: 0.5, paddingBottom: 'clamp(3rem,5vw,5rem)' }}>
        ← GLISSER →
      </p>

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
