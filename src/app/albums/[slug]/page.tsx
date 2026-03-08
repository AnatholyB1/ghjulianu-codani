'use client';

import Image       from 'next/image';
import Link        from 'next/link';
import { notFound } from 'next/navigation';
import { useState, use, useMemo } from 'react'; // useMemo kept for trackPhotos
import ScrollReveal from '@/components/ScrollReveal';
import Lightbox    from '@/components/Lightbox';
import DragTrack, { TrackPhoto } from '@/components/DragTrack';
import { albums }  from '@/data/albums';

export default function AlbumPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug }  = use(params);
  const album     = albums.find((a) => a.slug === slug);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const trackPhotos: TrackPhoto[] = useMemo(
    () => (album?.photos ?? []).map((p) => ({
      src:    p.src,
      width:  p.width,
      height: p.height,
      alt:    p.alt,
      aspect: p.height > p.width ? '2/3' : p.width > p.height * 1.2 ? '4/3' : '3/2',
    })),
    [album],
  );



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
      <p style={{ textAlign: 'center', fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)', opacity: 0.5, paddingBottom: '2rem' }}>
        ← GLISSER →
      </p>

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
