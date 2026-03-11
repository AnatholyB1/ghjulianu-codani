'use client';

import Image from 'next/image';
import Link  from 'next/link';
import ScrollReveal    from '@/components/ScrollReveal';
import IntroAnimation from '@/components/IntroAnimation';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { Album } from '@/lib/db.types';
import { useT } from '@/hooks/useT';

/** Wraps matching words with accent colour */
function HiText({ text, words }: { text: string; words: string[] }) {
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const rx  = new RegExp(`(${esc.join('|')})`, 'gi');
  const parts = text.split(rx);
  return (
    <>
      {parts.map((p, i) =>
        words.some((w) => w.toLowerCase() === p.toLowerCase())
          ? <span key={i} style={{ color: 'var(--accent)', fontStyle: 'italic' }}>{p}</span>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

export default function HomePage() {
  const t = useT();
  const [showIntro,     setShowIntro]     = useState(false);
  const [heroReady,     setHeroReady]     = useState(false);
  const [recentAlbums,  setRecentAlbums]  = useState<Album[]>([]);
  const [collageVisible, setCollageVisible] = useState([false, false, false, false]);
  const collageRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const el = collageRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          [0, 1, 2, 3].forEach((i) =>
            setTimeout(() => setCollageVisible((p) => { const n = [...p]; n[i] = true; return n; }), i * 130)
          );
        } else {
          setCollageVisible([false, false, false, false]);
        }
      },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
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
          style={{ objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.62)' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.95) 0%,rgba(8,8,8,0.18) 50%,transparent 100%)' }} />

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
                <HiText text={t.home.prestationsDesc2} words={["l'\u00e9nergie", '\u00e9nergie', 'artistes', 'interactions', 'interaction', 'vie \u00e0 la nuit', 'immersives', '\u00e9motionnelles', 'visuellement fortes', 'visually compelling', 'immersive', 'energy', 'artists', 'interactions']} />
              </p>
            </ScrollReveal>

            <ScrollReveal direction="up" delay={200}>
              <p style={{ fontSize: '0.58rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '1.2rem' }}>{t.home.availableFor}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 3rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {t.home.availableItems.map((item) => {
                  const colonIdx = item.indexOf(' :');
                  return (
                    <li key={item} style={{ display: 'flex', gap: '0.85rem', alignItems: 'baseline' }}>
                      <span style={{ color: 'var(--accent)', fontSize: '0.55rem', flexShrink: 0 }}>—</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.75 }}>
                        {colonIdx > -1 ? (
                          <><span style={{ color: 'var(--text)', fontWeight: 500 }}>{item.slice(0, colonIdx)}</span>{item.slice(colonIdx)}</>
                        ) : item}
                      </span>
                    </li>
                  );
                })}
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

          {/* ── RIGHT : collage 4 photos ── */}
          <div ref={collageRef} style={{ position: 'relative', alignSelf: 'stretch' }}>

            {/* Label décoratif */}
            <p style={{
              position:      'absolute',
              top:           '-1.2rem',
              right:         0,
              fontSize:      '0.52rem',
              letterSpacing: '0.22em',
              color:         'rgba(200,169,126,0.35)',
              fontFamily:    'var(--font-space)',
            }}>
              04 / 04
            </p>

            {/*
              Asymmetric grid:
              col1(44%) col2(30%) col3(26%)
              row1: [photo1 span col1-2] [photo2 span row1-2]
              row2: [photo3 col1]        [photo4 col2]
            */}
            <div style={{
              display:             'grid',
              gridTemplateColumns: '44% 30% 1fr',
              gridTemplateRows:    '1fr 1fr',
              gap:                 '4px',
              height:              'clamp(360px, 50vw, 540px)',
            }}>

              {/* Photo 1 — large landscape top-left, spans 2 cols */}
              <div
                className={`cp cp-1${collageVisible[0] ? ' cp-in' : ''}`}
                style={{ gridColumn: '1 / 3', gridRow: '1 / 2', overflow: 'hidden', background: '#0a0a0a', position: 'relative' }}
              >
                <Image
                  src="/furtive-1.jpg"
                  alt="Club photography"
                  fill
                  sizes="(max-width:760px) 74vw, 34vw"
                  style={{ objectFit: 'cover', objectPosition: 'center 30%', filter: 'brightness(0.85) contrast(1.12) saturate(0.7)' }}
                  className="cp-img"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 50%,rgba(8,8,8,0.45) 100%)', pointerEvents: 'none' }} />
              </div>

              {/* Photo 2 — tall portrait right col, spans 2 rows */}
              <div
                className={`cp cp-2${collageVisible[1] ? ' cp-in' : ''}`}
                style={{ gridColumn: '3 / 4', gridRow: '1 / 3', overflow: 'hidden', background: '#0a0a0a' }}
              >
                <Image
                  src="/IMG_1022-2.jpg"
                  alt="Festival ambiance"
                  fill
                  sizes="(max-width:760px) 26vw, 12vw"
                  style={{ objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.8) contrast(1.18) saturate(0.65) sepia(0.1)' }}
                  className="cp-img"
                />
              </div>

              {/* Photo 3 — bottom-left */}
              <div
                className={`cp cp-3${collageVisible[2] ? ' cp-in' : ''}`}
                style={{ gridColumn: '1 / 2', gridRow: '2 / 3', overflow: 'hidden', background: '#0a0a0a', position: 'relative' }}
              >
                <Image
                  src="/IMG_1684.jpg"
                  alt="Moment capturé"
                  fill
                  sizes="(max-width:760px) 44vw, 20vw"
                  style={{ objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.88) contrast(1.1) saturate(0.75)' }}
                  className="cp-img"
                />
              </div>

              {/* Photo 4 — bottom-center */}
              <div
                className={`cp cp-4${collageVisible[3] ? ' cp-in' : ''}`}
                style={{ gridColumn: '2 / 3', gridRow: '2 / 3', overflow: 'hidden', background: '#0a0a0a', position: 'relative' }}
              >
                <Image
                  src="/oneshw_1.jpg"
                  alt="Soirée ONESH"
                  fill
                  sizes="(max-width:760px) 30vw, 14vw"
                  style={{ objectFit: 'cover', filter: 'brightness(0.78) contrast(1.22) saturate(0.6)' }}
                  className="cp-img"
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(200,169,126,0.07) 0%,transparent 60%)', pointerEvents: 'none' }} />
              </div>

            </div>
          </div>
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
              const label = album.year
                ? album.year
                : (() => {
                    const d     = new Date(album.created_at);
                    const month = d.toLocaleDateString(t.home.dateLocale, { month: 'long' });
                    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${d.getFullYear()}`;
                  })();

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
        .event-row:hover .event-title { color: var(--accent) !important; }
        .event-row:hover .event-arrow { transform: translateX(4px); }
        .event-row:hover .event-thumb { transform: scale(1.08); }

        /* ── Collage 4 photos ── */
        .cp {
          opacity: 0;
          transition: opacity 0.75s cubic-bezier(0.22,1,0.36,1), transform 0.75s cubic-bezier(0.22,1,0.36,1);
        }
        .cp-1 { transform: translateY(28px); transition-delay: 0ms; }
        .cp-2 { transform: translateX(22px); transition-delay: 130ms; }
        .cp-3 { transform: translateY(24px); transition-delay: 260ms; }
        .cp-4 { transform: translateY(20px); transition-delay: 390ms; }

        .cp-1.cp-in { opacity: 1; transform: translateY(0); }
        .cp-2.cp-in { opacity: 1; transform: translateX(0); }
        .cp-3.cp-in { opacity: 1; transform: translateY(0); }
        .cp-4.cp-in { opacity: 1; transform: translateY(0); }

        .cp-img {
          transition: transform 0.9s cubic-bezier(0.22,1,0.36,1) !important;
        }
        .cp:hover .cp-img { transform: scale(1.06); }

        .cp-1::after {
          content: '';
          position: absolute;
          bottom: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--accent), transparent);
          opacity: 0.5;
          z-index: 3;
        }
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
