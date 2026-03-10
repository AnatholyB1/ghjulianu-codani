'use client';

import Image from 'next/image';
import Link  from 'next/link';
import ScrollReveal    from '@/components/ScrollReveal';
import IntroAnimation from '@/components/IntroAnimation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Album } from '@/lib/db.types';
import { useT } from '@/hooks/useT';

export default function HomePage() {
  const t = useT();
  const [showIntro,     setShowIntro]     = useState(false);
  const [heroReady,     setHeroReady]     = useState(false);
  const [recentAlbums,  setRecentAlbums]  = useState<Album[]>([]);

  useEffect(() => {
    const played = sessionStorage.getItem('intro-played');
    if (!played) {
      setShowIntro(true);
    } else {
      setHeroReady(true);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('albums')
      .select('id,title,slug,cover_url,created_at,year')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => { if (data) setRecentAlbums(data as Album[]); });
  }, []);

  function handleIntroDone() {
    sessionStorage.setItem('intro-played', '1');
    setShowIntro(false);
    // Small pause so the center strip fully exits before hero content appears
    setTimeout(() => setHeroReady(true), 120);
  }

  return (
    <>
      {showIntro && <IntroAnimation onDone={handleIntroDone} />}
      {/* ── HERO ── */}
      <section
        style={{
          position:       'relative',
          height:         'calc(100vh - var(--navbar-h))',
          overflow:       'hidden',
          display:        'flex',
          alignItems:     'flex-end',
          justifyContent: 'flex-start',
        }}
      >
        <Image
          src="/furtive-109.jpg"
          alt="Hero background"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.42)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.97) 0%,rgba(8,8,8,0.35) 50%,transparent 100%)' }} />

        <div style={{ position: 'relative', zIndex: 2, padding: 'clamp(2rem,5vw,5rem)', maxWidth: '820px' }}>
          <h1
            style={{
              fontFamily:    'var(--font-cormorant),serif',
              fontSize:      'clamp(3rem,9vw,8rem)',
              fontWeight:    300,
              fontStyle:     'italic',
              lineHeight:    0.92,
              letterSpacing: '-0.01em',
              color:         'var(--text)',
              animation:     heroReady ? 'fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.05s both' : 'none',
              opacity:       heroReady ? undefined : 0,
            }}
          >
            Ghjulianu
            <br />
            Codani
          </h1>

          <p style={{
            marginTop: '1.5rem', fontSize: '0.7rem', letterSpacing: '0.22em',
            color: 'var(--muted)',
            animation: heroReady ? 'fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.22s both' : 'none',
            opacity:   heroReady ? undefined : 0,
          }}>
            {t.home.heroSubtitle}
          </p>

          <div style={{
            marginTop: '2.5rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap',
            animation: heroReady ? 'fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both' : 'none',
            opacity:   heroReady ? undefined : 0,
          }}>
            <Link href="/portfolio" style={ctaStyle('solid')}>{t.home.ctaPortfolio}</Link>
            <Link href="/contact"   style={ctaStyle('outline')}>{t.home.ctaContact}</Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="scroll-hint" style={{
          position: 'absolute', bottom: '2rem', right: '2.5rem', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          animation: heroReady ? 'fadeIn 1s ease 0.7s both' : 'none',
          opacity:   heroReady ? undefined : 0,
        }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)', writingMode: 'vertical-rl' }}>{t.home.scroll}</span>
          <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom,var(--muted),transparent)' }} />
        </div>
      </section>

      {/* ── PRESTATIONS ── */}
      <section style={{ borderTop: '1px solid var(--border)', padding: 'clamp(4rem,8vw,8rem) clamp(1.5rem,5vw,5rem)' }}>
        <div style={{
          maxWidth:            '1300px',
          margin:              '0 auto',
          display:             'grid',
          gridTemplateColumns: 'minmax(0,1fr) minmax(0,420px)',
          gap:                 'clamp(3rem,6vw,7rem)',
          alignItems:          'start',
        }}
        className="prestations-grid"
        >

          {/* ── LEFT : texte ── */}
          <div>
            <ScrollReveal direction="up">
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '3rem' }}>
                {t.home.prestationsLabel}
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={80}>
              <p style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.05rem,1.8vw,1.2rem)', fontWeight: 300, lineHeight: 1.95, color: 'var(--text)', marginBottom: '1.6rem' }}>
                {t.home.prestationsDesc1}
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={140}>
              <p style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.05rem,1.8vw,1.2rem)', fontWeight: 300, lineHeight: 1.95, color: 'var(--muted)', marginBottom: '2.8rem' }}>
                {t.home.prestationsDesc2}
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p style={{ fontSize: '0.58rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '1.2rem' }}>{t.home.availableFor}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {t.home.availableItems.map((item) => (
                  <li key={item} style={{ display: 'flex', gap: '0.85rem', alignItems: 'baseline' }}>
                    <span style={{ color: 'var(--accent)', fontSize: '0.55rem', flexShrink: 0 }}>—</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.75 }}>{item}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={260}>
              <Link
                href="/tarifs"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '0.5rem',
                  padding:        '0.65rem 1.3rem',
                  fontSize:       '0.6rem',
                  letterSpacing:  '0.18em',
                  background:     '#111',
                  color:          'var(--text)',
                  border:         '1px solid var(--border)',
                  textDecoration: 'none',
                  transition:     'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)';           e.currentTarget.style.color = 'var(--text)'; }}
              >
                {t.home.seeRates}
              </Link>
            </ScrollReveal>
          </div>

          {/* ── RIGHT : photos ── */}
          <ScrollReveal direction="right" delay={120} style={{ position: 'relative', alignSelf: 'stretch' }}>

            {/* Grande photo principale */}
            <div style={{
              position:     'relative',
              overflow:     'hidden',
              aspectRatio:  '3/4',
              background:   '#0d0d0d',
              marginTop:    'clamp(0px,-2vw,-32px)',
            }}>
              <Image
                src="/furtive-108.jpg"
                alt="Ambiance event"
                fill
                sizes="(max-width:900px) 100vw, 45vw"
                style={{
                  objectFit:      'cover',
                  objectPosition: 'center',
                  filter:         'brightness(0.82) saturate(0.88)',
                  transition:     'transform 0.8s cubic-bezier(0.22,1,0.36,1)',
                }}
                className="presta-img-main"
              />
              {/* vignette */}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 55%,rgba(8,8,8,0.55) 100%)' }} />
            </div>

            {/* Petite photo décalée en bas à gauche */}
            <div style={{
              position:    'absolute',
              bottom:      'clamp(-1.5rem,-3vw,-2.5rem)',
              left:        'clamp(-1rem,-3vw,-2rem)',
              width:       '52%',
              overflow:    'hidden',
              aspectRatio: '4/3',
              background:  '#0d0d0d',
              border:      '3px solid var(--bg)',
              boxShadow:   '0 8px 40px rgba(0,0,0,0.7)',
            }}>
              <Image
                src="/furtive-109.jpg"
                alt="Détail"
                fill
                sizes="(max-width:900px) 52vw, 23vw"
                style={{
                  objectFit:      'cover',
                  objectPosition: 'center',
                  filter:         'brightness(0.78) saturate(0.82)',
                  transition:     'transform 0.8s cubic-bezier(0.22,1,0.36,1)',
                }}
                className="presta-img-secondary"
              />
            </div>

            {/* Numéro décoratif */}
            <p style={{
              position:      'absolute',
              top:           '-1.2rem',
              right:         0,
              fontSize:      '0.52rem',
              letterSpacing: '0.22em',
              color:         'rgba(200,169,126,0.35)',
              fontFamily:    'var(--font-space)',
            }}>
              01 / 01
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── DERNIERS ÉVÉNEMENTS ── */}
      <section style={{ borderTop: '1px solid var(--border)', padding: 'clamp(3rem,6vw,6rem) clamp(1.5rem,5vw,5rem)' }}>
        <div style={{ maxWidth: '1300px', margin: '0 auto' }}>

          <ScrollReveal direction="up">
            <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '2.5rem' }}>{t.home.latestEvents}</p>
          </ScrollReveal>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {recentAlbums.map((album, i) => {
              const d     = new Date(album.created_at);
              const month = d.toLocaleDateString(t.home.dateLocale, { month: 'long' });
              const year  = d.getFullYear();
              const label = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;

              return (
                <ScrollReveal key={album.id} direction="up" delay={i * 80}>
                  <Link
                    href={`/albums/${album.slug}`}
                    style={{ textDecoration: 'none', display: 'block' }}
                    className="event-row"
                  >
                    <div style={{
                      display:        'flex',
                      alignItems:     'center',
                      gap:            'clamp(1rem,3vw,2.5rem)',
                      padding:        'clamp(1rem,2vw,1.5rem) 0',
                      borderBottom:   '1px solid var(--border)',
                    }}>
                      {/* Thumbnail */}
                      <div style={{ width: '80px', height: '60px', flexShrink: 0, overflow: 'hidden', background: '#111' }}>
                        {album.cover_url ? (
                          <Image
                            src={album.cover_url}
                            alt={album.title}
                            width={80}
                            height={60}
                            sizes="80px"
                            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.82)', transition: 'transform 0.5s ease' }}
                            className="event-thumb"
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: '#1a1a1a' }} />
                        )}
                      </div>

                      {/* Index */}
                      <span style={{ fontSize: '0.52rem', letterSpacing: '0.14em', color: 'rgba(122,122,116,0.4)', flexShrink: 0, minWidth: '1.4rem' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>

                      {/* Title */}
                      <p style={{
                        fontFamily:    'var(--font-cormorant),serif',
                        fontSize:      'clamp(1.4rem,3vw,2rem)',
                        fontStyle:     'italic',
                        fontWeight:    300,
                        color:         'var(--text)',
                        flex:          1,
                        transition:    'color 0.2s',
                      }}
                        className="event-title"
                      >
                        {album.title}
                      </p>

                      {/* Date */}
                      <span style={{ fontSize: '0.6rem', letterSpacing: '0.14em', color: 'var(--muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {label}
                      </span>

                      {/* Arrow */}
                      <span style={{ fontSize: '0.9rem', color: 'var(--accent)', flexShrink: 0, transition: 'transform 0.2s' }} className="event-arrow">
                        →
                      </span>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}

            {recentAlbums.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', padding: '2rem 0' }}>{t.home.noEvents}</p>
            )}
          </div>

          <ScrollReveal direction="up" delay={280}>
            <div style={{ marginTop: '2.5rem' }}>
              <Link
                href="/albums"
                style={{
                  display:        'inline-flex',
                  alignItems:     'center',
                  gap:            '0.5rem',
                  padding:        '0.65rem 1.3rem',
                  fontSize:       '0.6rem',
                  letterSpacing:  '0.18em',
                  background:     '#111',
                  color:          'var(--text)',
                  border:         '1px solid var(--border)',
                  textDecoration: 'none',
                  transition:     'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)';           e.currentTarget.style.color = 'var(--text)'; }}
              >
                {t.home.seeAllAlbums}
              </Link>
            </div>
          </ScrollReveal>

        </div>
      </section>

      <style>{`
        .prestations-grid { align-items: start; }
        @media (max-width: 760px) {
          .prestations-grid { grid-template-columns: 1fr !important; }
          .prestations-grid > *:last-child { margin-top: 4rem; padding-bottom: 3.5rem; }
        }
        .presta-img-main:hover      { transform: scale(1.04) !important; }
        .presta-img-secondary:hover { transform: scale(1.06) !important; }
        .event-row:hover .event-title { color: var(--accent) !important; }
        .event-row:hover .event-arrow { transform: translateX(4px); }
        .event-row:hover .event-thumb { transform: scale(1.08); }
      `}</style>
    </>
  );
}

function ctaStyle(variant: 'solid' | 'outline') {
  return {
    display:        'inline-flex',
    alignItems:     'center',
    padding:        '0.75rem 1.8rem',
    fontSize:       '0.65rem',
    letterSpacing:  '0.16em',
    textDecoration: 'none',
    cursor:         'pointer',
    transition:     'all 0.25s ease',
    ...(variant === 'solid'
      ? { background: 'var(--text)', color: '#080808' }
      : { background: 'transparent', color: 'var(--text)', border: '1px solid rgba(255,255,255,0.3)' }),
  } as const;
}
