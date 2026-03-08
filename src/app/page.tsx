'use client';

import Image from 'next/image';
import Link  from 'next/link';
import ScrollReveal    from '@/components/ScrollReveal';
import IntroAnimation, { INTRO_CENTER_SRC, INTRO_LEFT_SRC, INTRO_RIGHT_SRC } from '@/components/IntroAnimation';
import { useState, useEffect } from 'react';

const SERVICES = [
  {
    key:   'perso',
    label: 'SHOOTING PERSONNEL',
    sub:   'Portraits, séances solo & collaborations artistiques.',
    img:   INTRO_LEFT_SRC,
    href:  '/contact',
  },
  {
    key:   'marques',
    label: 'POUR DES MARQUES',
    sub:   'Identité visuelle, produits, événements de marque.',
    img:   'https://picsum.photos/seed/s2/900/600',
    href:  '/contact',
  },
  {
    key:   'nightlife',
    label: 'ÉVÉNEMENTIEL NIGHTLIFE',
    sub:   "Soirées, clubs, festivals – capturer l'énergie brute de la nuit.",
    img:   INTRO_RIGHT_SRC,
    href:  '/albums',
  },
];

export default function HomePage() {
  const [showIntro, setShowIntro]     = useState(false);
  const [heroReady, setHeroReady]     = useState(false);

  useEffect(() => {
    const played = sessionStorage.getItem('intro-played');
    if (!played) {
      setShowIntro(true);
    } else {
      // Already played this session — show hero content immediately
      setHeroReady(true);
    }
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
          src={INTRO_CENTER_SRC}
          alt="Hero background"
          fill
          priority
          unoptimized
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
            PHOTOGRAPHE — PARIS
          </p>

          <div style={{
            marginTop: '2.5rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap',
            animation: heroReady ? 'fadeInUp 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s both' : 'none',
            opacity:   heroReady ? undefined : 0,
          }}>
            <Link href="/portfolio" style={ctaStyle('solid')}>VOIR LE PORTFOLIO</Link>
            <Link href="/contact"   style={ctaStyle('outline')}>ME CONTACTER</Link>
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: '2rem', right: '2.5rem', zIndex: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
          animation: heroReady ? 'fadeIn 1s ease 0.7s both' : 'none',
          opacity:   heroReady ? undefined : 0,
        }}>
          <span style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)', writingMode: 'vertical-rl' }}>SCROLL</span>
          <div style={{ width: '1px', height: '48px', background: 'linear-gradient(to bottom,var(--muted),transparent)' }} />
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section style={{ padding: 'clamp(4rem,8vw,8rem) clamp(1.5rem,5vw,5rem)', maxWidth: '1300px', margin: '0 auto' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '3rem' }}>
            PRESTATIONS
          </p>
        </ScrollReveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '1px', border: '1px solid var(--border)' }}>
          {SERVICES.map((s, i) => (
            <ScrollReveal key={s.key} direction="up" delay={i * 100}>
              <Link href={s.href} style={{ display: 'block', textDecoration: 'none', position: 'relative', overflow: 'hidden', aspectRatio: '4/3', background: '#0a0a0a' }} className="service-card">
                <Image src={s.img} alt={s.label} fill unoptimized className="service-img"
                  style={{ objectFit: 'cover', filter: 'brightness(0.4)', transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1),filter 0.5s ease' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(8,8,8,0.88) 0%,transparent 60%)' }} />
                <div style={{ position: 'absolute', bottom: '1.8rem', left: '1.8rem', right: '1.8rem' }}>
                  <h3 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.3rem,3vw,1.7rem)', fontStyle: 'italic', fontWeight: 400, color: 'var(--text)', marginBottom: '0.5rem' }}>
                    {s.label}
                  </h3>
                  <p style={{ fontSize: '0.68rem', letterSpacing: '0.06em', color: 'var(--muted)', lineHeight: 1.6 }}>{s.sub}</p>
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── RECENT EVENT strip ── */}
      <section style={{ borderTop: '1px solid var(--border)', padding: 'clamp(3rem,6vw,6rem) clamp(1.5rem,5vw,5rem)', display: 'flex', gap: '3rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <ScrollReveal direction="left" style={{ flex: '1 1 280px' }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '1rem' }}>DERNIERS ÉVÉNEMENTS</p>
          <p style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 1.1, color: 'var(--text)' }}>
            ONESH · FURTIVE
            <br />FIGHTCLUB · UFO
          </p>
          <Link href="/albums" style={{ display: 'inline-block', marginTop: '2rem', fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '2px' }}>
            VOIR LES ALBUMS →
          </Link>
        </ScrollReveal>

        <ScrollReveal direction="right" delay={150}
          style={{ flex: '2 1 400px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignItems: 'start' }}
        >
          {[
            { src: 'https://picsum.photos/seed/e1/600/900', w: 600, h: 900 },
            { src: 'https://picsum.photos/seed/e2/600/400', w: 600, h: 400 },
            { src: 'https://picsum.photos/seed/e3/600/400', w: 600, h: 400 },
            { src: 'https://picsum.photos/seed/e4/600/900', w: 600, h: 900 },
          ].map((img, i) => (
            <div key={i} style={{ overflow: 'hidden' }}>
              <Image src={img.src} alt="" width={img.w} height={img.h} unoptimized
                style={{ width: '100%', height: 'auto', objectFit: 'cover', display: 'block', filter: 'brightness(0.78)' }}
              />
            </div>
          ))}
        </ScrollReveal>
      </section>

      <style>{`
        .service-card:hover .service-img { transform: scale(1.06); filter: brightness(0.55) !important; }
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
