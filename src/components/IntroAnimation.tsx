'use client';

import Image from 'next/image';
import { useEffect, useState, useRef, useCallback } from 'react';

/*
  ─────────────────────────────────────────────────────────────
  INTRO ANIMATION
  ─────────────────────────────────────────────────────────────
  Phase timeline
  ─────────────────────────────────────────────────────────────
  0        → 'entering'   strips slide in from 3 directions
  ~850ms   → 'showing'    name fades in + scale
  ~1750ms  → 'exiting'    sides collapse outward, center lifts
  ~2550ms  → 'done'       overlay removed, page revealed
  ─────────────────────────────────────────────────────────────
  The center strip uses the SAME photo as the homepage hero.
  When it lifts off the page is already rendered beneath →
  perfect visual continuity.
  ─────────────────────────────────────────────────────────────
*/

/* ── Shared photo tokens – must match page.tsx ────────────── */
export const INTRO_CENTER_SRC = '/milieu.jpg';
export const INTRO_LEFT_SRC   = '/gauche.jpg';
export const INTRO_RIGHT_SRC  = '/droite.jpg';

type Phase = 'entering' | 'showing' | 'exiting' | 'done';

/* Timing constants (ms) */
const T = {
  IN_DURATION:   760,   // strip slide-in duration
  IN_CENTER_LAG: 120,   // center strip lag after sides
  NAME_APPEAR:   870,   // after mount → name shows
  NAME_HOLD:     900,   // how long name stays
  EXIT_START:    870 + 900,
  EXIT_SIDES:    560,   // sides collapse duration
  EXIT_CENTER:   680,   // center lifts duration
  CENTER_LAG:    160,   // center lag behind sides
  DONE_OFFSET:   80,    // tiny buffer after exit
} as const;

const TOTAL_EXIT = T.EXIT_SIDES + T.CENTER_LAG + T.EXIT_CENTER + T.DONE_OFFSET;
const TOTAL      = T.EXIT_START + TOTAL_EXIT;

/* ── Easing ─────────────────────────────────────────────── */
const EASE_OUT_EXPO   = 'cubic-bezier(0.16, 1, 0.3, 1)';
const EASE_IN_EXPO    = 'cubic-bezier(0.7, 0, 0.84, 0)';
const EASE_OUT_QUART  = 'cubic-bezier(0.25, 1, 0.5, 1)';

export default function IntroAnimation({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>('entering');
  const done = useRef(false);

  const finish = useCallback(() => {
    if (!done.current) { done.current = true; onDone(); }
  }, [onDone]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('showing'),  T.NAME_APPEAR);
    const t2 = setTimeout(() => setPhase('exiting'),  T.EXIT_START);
    const t3 = setTimeout(() => { setPhase('done'); finish(); }, TOTAL);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [finish]);

  if (phase === 'done') return null;

  const entering = phase === 'entering';
  const exiting  = phase === 'exiting';
  const showing  = phase === 'showing' || exiting;

  /* ── Strip helper ──────────────────────────────────────── */
  function StripInner({ src }: { src: string }) {
    return (
      <Image
        src={src} alt="" fill unoptimized priority
        style={{
          objectFit:      'cover',
          objectPosition: 'center',
          filter:         'brightness(0.52) saturate(0.7)',
          /* Counter-scale: image starts bigger and settles — parallax feel */
          transform:      entering ? 'scale(1.12)' : 'scale(1)',
          transition:     `transform ${T.IN_DURATION + 400}ms ${EASE_OUT_EXPO}`,
          willChange:     'transform',
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      style={{
        position:      'fixed',
        inset:         0,
        zIndex:        9999,
        overflow:      'hidden',
        pointerEvents: exiting ? 'none' : 'all',
        background:    '#050505',
      }}
    >
      {/* ════════════════ STRIPS ════════════════ */}

      {/* LEFT — enters from left, exits left */}
      <div
        style={{
          position:   'absolute',
          top: 0, bottom: 0,
          left: 0,
          width:      'calc(33.333% - 1px)',
          overflow:   'hidden',
          willChange: 'transform',
          /* enter from left */
          transform:  entering
            ? 'translateX(-104%)'
            : exiting
              ? 'translateX(-104%)'
              : 'translateX(0)',
          transition: entering
            ? `transform ${T.IN_DURATION}ms ${EASE_OUT_EXPO}`
            : exiting
              ? `transform ${T.EXIT_SIDES}ms ${EASE_IN_EXPO}`
              : 'none',
        }}
      >
        <StripInner src={INTRO_LEFT_SRC} />
      </div>

      {/* CENTER — enters from bottom, exits upward (reveals hero) */}
      <div
        style={{
          position:   'absolute',
          top: 0, bottom: 0,
          left:       'calc(33.333%)',
          width:      'calc(33.334%)',
          overflow:   'hidden',
          willChange: 'transform',
          transform:  entering
            ? 'translateY(104%)'
            : exiting
              ? 'translateY(-104%)'
              : 'translateY(0)',
          transition: entering
            ? `transform ${T.IN_DURATION}ms ${EASE_OUT_EXPO} ${T.IN_CENTER_LAG}ms`
            : exiting
              ? `transform ${T.EXIT_CENTER}ms ${EASE_IN_EXPO} ${T.CENTER_LAG}ms`
              : 'none',
        }}
      >
        <StripInner src={INTRO_CENTER_SRC} />
      </div>

      {/* RIGHT — enters from right, exits right */}
      <div
        style={{
          position:   'absolute',
          top: 0, bottom: 0,
          right: 0,
          width:      'calc(33.333% - 1px)',
          overflow:   'hidden',
          willChange: 'transform',
          transform:  entering
            ? 'translateX(104%)'
            : exiting
              ? 'translateX(104%)'
              : 'translateX(0)',
          transition: entering
            ? `transform ${T.IN_DURATION}ms ${EASE_OUT_EXPO} 60ms`
            : exiting
              ? `transform ${T.EXIT_SIDES}ms ${EASE_IN_EXPO} 40ms`
              : 'none',
        }}
      >
        <StripInner src={INTRO_RIGHT_SRC} />
      </div>

      {/* ════════════ SEPARATOR LINES ════════════ */}
      {[1, 2].map((n) => (
        <div
          key={n}
          style={{
            position:   'absolute',
            top: 0, bottom: 0,
            left:       `calc(${n} * 33.333%)`,
            width:      '1px',
            background: 'rgba(255,255,255,0.07)',
            zIndex:     2,
            pointerEvents: 'none',
            /* fade out on exit */
            opacity:    exiting ? 0 : 1,
            transition: `opacity 200ms ease`,
          }}
        />
      ))}

      {/* ════════════ VIGNETTE ════════════ */}
      <div
        style={{
          position:      'absolute',
          inset:         0,
          zIndex:        3,
          background:    'radial-gradient(ellipse at 50% 55%, transparent 28%, rgba(5,5,5,0.72) 100%)',
          pointerEvents: 'none',
          opacity:       exiting ? 0 : 1,
          transition:    `opacity 350ms ease`,
        }}
      />

      {/* ════════════ NAME ════════════ */}
      <div
        style={{
          position:       'absolute',
          inset:          0,
          zIndex:         5,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          pointerEvents:  'none',
          opacity:        showing && !exiting ? 1 : 0,
          transform:      showing && !exiting ? 'translateY(0)' : 'translateY(22px)',
          transition:     exiting
            ? `opacity 240ms ease, transform 240ms ease`
            : `opacity 700ms ${EASE_OUT_QUART}, transform 700ms ${EASE_OUT_EXPO}`,
        }}
      >
        {/* Line above */}
        <div
          style={{
            width:      '1px',
            background: 'rgba(255,255,255,0.18)',
            marginBottom: '1.4rem',
            height:     showing && !exiting ? '52px' : '0px',
            transition: `height 700ms ${EASE_OUT_EXPO} 100ms`,
          }}
        />

        <h1
          style={{
            fontFamily:    'var(--font-cormorant), serif',
            fontSize:      'clamp(3rem, 9vw, 7.5rem)',
            fontWeight:    300,
            fontStyle:     'italic',
            letterSpacing: '-0.015em',
            lineHeight:    0.9,
            color:         '#E8E4DC',
            textAlign:     'center',
            textShadow:    '0 4px 60px rgba(0,0,0,0.9)',
          }}
        >
          Ghjulianu
          <br />
          Codani
        </h1>

        <p
          style={{
            marginTop:     '1.1rem',
            fontSize:      '0.58rem',
            letterSpacing: '0.32em',
            color:         'rgba(232,228,220,0.38)',
            textAlign:     'center',
          }}
        >
          PHOTOGRAPHE — PARIS || CORSE
        </p>

        {/* Line below */}
        <div
          style={{
            width:      '1px',
            background: 'rgba(255,255,255,0.18)',
            marginTop:  '1.4rem',
            height:     showing && !exiting ? '52px' : '0px',
            transition: `height 700ms ${EASE_OUT_EXPO} 100ms`,
          }}
        />
      </div>

      {/* ════════════ SKIP ════════════ */}
      <button
        onClick={finish}
        style={{
          position:      'absolute',
          bottom:        '1.8rem',
          right:         '2rem',
          zIndex:        6,
          background:    'none',
          border:        '1px solid rgba(255,255,255,0.08)',
          color:         'rgba(255,255,255,0.28)',
          fontSize:      '0.56rem',
          letterSpacing: '0.2em',
          padding:       '0.4rem 0.9rem',
          cursor:        'pointer',
          transition:    'color 0.2s, border-color 0.2s',
          opacity:       exiting ? 0 : 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color       = 'rgba(255,255,255,0.65)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color       = 'rgba(255,255,255,0.28)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
        }}
      >
        PASSER
      </button>
    </div>
  );
}
