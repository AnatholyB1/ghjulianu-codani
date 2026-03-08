'use client';

import Image       from 'next/image';
import Link        from 'next/link';
import { notFound } from 'next/navigation';
import { useState, use } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import Lightbox    from '@/components/Lightbox';
import { albums }  from '@/data/albums';

export default function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug }  = use(params);
  const album     = albums.find((a) => a.slug === slug);
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (!album) notFound();

  return (
    <>
      {/* Hero banner */}
      <section
        style={{
          position:   'relative',
          height:     'clamp(300px, 50vh, 560px)',
          overflow:   'hidden',
          display:    'flex',
          alignItems: 'flex-end',
        }}
      >
        <Image
          src={album.cover}
          alt={album.title}
          fill
          unoptimized
          priority
          style={{ objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.38)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.96) 0%,rgba(8,8,8,0.25) 60%,transparent 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(2rem,5vw,4rem)' }}>
          {/* Breadcrumb */}
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--muted)', marginBottom: '1rem' }}>
            <Link href="/albums" style={{ color: 'var(--muted)', textDecoration: 'none' }}>ALBUMS</Link>
            {' → '}
            <span style={{ color: 'var(--text)' }}>{album.title}</span>
          </p>

          <h1
            style={{
              fontFamily:    'var(--font-cormorant),serif',
              fontSize:      'clamp(2.5rem,7vw,5.5rem)',
              fontStyle:     'italic',
              fontWeight:    300,
              lineHeight:    0.95,
              color:         'var(--text)',
              animation:     'fadeInUp 0.9s cubic-bezier(0.22,1,0.36,1) 0.1s both',
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

      {/* Masonry photo grid */}
      <section
        style={{
          padding:      'clamp(2rem,4vw,4rem) clamp(1rem,3vw,3rem)',
          columnCount:  3,
          columnGap:    '5px',
        }}
        className="album-grid"
      >
        {album.photos.map((photo, i) => (
          <ScrollReveal key={i} direction="up" delay={(i % 4) * 70}
            style={{ breakInside: 'avoid', marginBottom: '5px', display: 'block' }}
          >
            <button
              onClick={() => setLightbox(i)}
              className="album-photo-btn"
              style={{ display: 'block', width: '100%', border: 'none', background: 'none', padding: 0, cursor: 'zoom-in', overflow: 'hidden' }}
            >
              <Image
                src={photo.src}
                alt={photo.alt ?? `${album.title} — photo ${i + 1}`}
                width={photo.width}
                height={photo.height}
                unoptimized
                className="album-photo-img"
                style={{ width: '100%', height: 'auto', display: 'block', filter: 'brightness(0.9)', transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.35s ease' }}
              />
            </button>
          </ScrollReveal>
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

      <style>{`
        .album-photo-btn:hover .album-photo-img {
          transform: scale(1.04);
          filter: brightness(1.05) !important;
        }
        @media (max-width: 900px) { .album-grid { column-count: 2 !important; } }
        @media (max-width: 550px) { .album-grid { column-count: 1 !important; } }
      `}</style>

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
