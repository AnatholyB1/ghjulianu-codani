'use client';

import Image  from 'next/image';
import Link   from 'next/link';
import { useState } from 'react';
import ScrollReveal from '@/components/ScrollReveal';
import { albums } from '@/data/albums';

const CATEGORIES = ['all', 'event', 'brand'] as const;
type Cat = (typeof CATEGORIES)[number];

export default function AlbumsPage() {
  const [cat, setCat] = useState<Cat>('all');
  const filtered = cat === 'all' ? albums : albums.filter((a) => a.category === cat);

  return (
    <>
      {/* Header */}
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem) 0' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>
            GALERIES
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
            Albums
          </h1>
        </ScrollReveal>

        {/* Filter tabs */}
        <ScrollReveal direction="up" delay={120}>
          <div style={{ display: 'flex', gap: '0.2rem', marginTop: '2.5rem' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                style={{
                  background:    cat === c ? 'var(--text)' : 'transparent',
                  color:         cat === c ? '#080808' : 'var(--muted)',
                  border:        '1px solid var(--border)',
                  padding:       '0.45rem 1.2rem',
                  fontSize:      '0.62rem',
                  letterSpacing: '0.14em',
                  cursor:        'pointer',
                  transition:    'all 0.25s ease',
                }}
              >
                {c === 'all' ? 'TOUT' : c === 'event' ? 'ÉVÉNEMENTS' : 'MARQUES'}
              </button>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* Album cards – inspired by atmospheric vertical scroll */}
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)' }}>
        <div
          className="albums-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px,100%),1fr))',
            gap: '2px',
          }}
        >
          {filtered.map((album, i) => (
            <ScrollReveal key={album.slug} direction="up" delay={i * 80}>
              <Link
                href={`/albums/${album.slug}`}
                className="album-card"
                style={{
                  display:        'block',
                  position:       'relative',
                  overflow:       'hidden',
                  textDecoration: 'none',
                  aspectRatio:    '3/4',
                  background:     '#0c0c0c',
                }}
              >
                {/* Cover image */}
                <Image
                  src={album.cover}
                  alt={album.title}
                  fill
                  unoptimized
                  className="album-img"
                  style={{
                    objectFit:  'cover',
                    filter:     'brightness(0.55) saturate(0.85)',
                    transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1), filter 0.5s ease',
                  }}
                />

                {/* Gradient overlay */}
                <div className="album-overlay" style={{
                  position:   'absolute',
                  inset:      0,
                  background: 'linear-gradient(0deg,rgba(8,8,8,0.78) 0%, rgba(8,8,8,0.15) 60%, transparent 100%)',
                  transition: 'background 0.45s ease',
                }} />

                {/* Category badge */}
                <span style={{
                  position:      'absolute',
                  top:           '1.2rem',
                  right:         '1.2rem',
                  fontSize:      '0.55rem',
                  letterSpacing: '0.18em',
                  color:         'var(--muted)',
                  border:        '1px solid rgba(255,255,255,0.1)',
                  padding:       '3px 8px',
                  background:    'rgba(8,8,8,0.5)',
                }}>
                  {album.category === 'event' ? 'ÉVÉNEMENT' : 'MARQUE'}
                </span>

                {/* Album name – centred, reveals on hover */}
                <div
                  className="album-title-box"
                  style={{
                    position:       'absolute',
                    inset:          0,
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    justifyContent: 'center',
                    padding:        '1.5rem',
                    transition:     'opacity 0.35s ease',
                    opacity:        0,
                  }}
                >
                  <h2
                    style={{
                      fontFamily:    'var(--font-cormorant),serif',
                      fontSize:      'clamp(1.6rem,3.5vw,2.4rem)',
                      fontStyle:     'italic',
                      fontWeight:    400,
                      letterSpacing: '0.04em',
                      color:         'var(--text)',
                      textAlign:     'center',
                      lineHeight:    1.1,
                    }}
                  >
                    {album.title}
                  </h2>
                  {album.date && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--muted)' }}>
                      {album.date}
                    </p>
                  )}
                  <span style={{
                    display: 'inline-block', marginTop: '1.2rem',
                    fontSize: '0.6rem', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.4)',
                    borderBottom: '1px solid rgba(255,255,255,0.25)', paddingBottom: '2px',
                  }}>
                    VOIR →
                  </span>
                </div>

                {/* Bottom title (always visible) */}
                <div
                  className="album-title-bottom"
                  style={{
                    position:   'absolute',
                    bottom:     '1.5rem',
                    left:       '1.5rem',
                    right:      '1.5rem',
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}
                >
                  <h2
                    style={{
                      fontFamily:    'var(--font-cormorant),serif',
                      fontSize:      'clamp(1.3rem,3vw,1.9rem)',
                      fontStyle:     'italic',
                      fontWeight:    400,
                      color:         'var(--text)',
                      lineHeight:    1.1,
                    }}
                  >
                    {album.title}
                  </h2>
                  {album.date && (
                    <p style={{ marginTop: '0.3rem', fontSize: '0.58rem', letterSpacing: '0.14em', color: 'var(--muted)' }}>
                      {album.date}
                    </p>
                  )}
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <style>{`
        .album-card:hover .album-img {
          transform: scale(1.06);
          filter: brightness(0.3) saturate(0.7) !important;
        }
        .album-card:hover .album-title-box {
          opacity: 1 !important;
        }
        .album-card:hover .album-title-bottom {
          opacity: 0 !important;
          transform: translateY(8px);
        }
        .album-card:hover .album-overlay {
          background: linear-gradient(0deg, rgba(8,8,8,0.88) 0%, rgba(8,8,8,0.55) 100%) !important;
        }
      `}</style>
    </>
  );
}
