'use client';

import { useState, useEffect, useRef } from 'react';
import { useDayNight } from '@/hooks/useDayNight';
import { prefersReducedMotion } from '@/lib/prefersReducedMotion';

export default function WelcomeModal() {
  const [show, setShow] = useState(false);
  const [useVideo, setUseVideo] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);
  const { setMode } = useDayNight();

  // First-visit gate + intro animation guard
  useEffect(() => {
    const welcomed = localStorage.getItem('ghjulianu-welcomed');
    if (welcomed) return;

    const showModal = () => {
      setUseVideo(!prefersReducedMotion());
      setShow(true);
    };

    // Guard against showing simultaneously with IntroAnimation
    const introDone = sessionStorage.getItem('intro-played');
    if (introDone) {
      showModal();
    } else {
      // First ever visit: delay 3000ms to let IntroAnimation finish (~2.5s)
      const t = setTimeout(showModal, 3000);
      return () => clearTimeout(t);
    }
  }, []);

  // Body scroll lock
  useEffect(() => {
    if (!show) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [show]);

  // Focus trap + Escape handler
  useEffect(() => {
    if (!show) return;
    const focusable = modalRef.current?.querySelectorAll(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];

    const trap = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { dismiss(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    };

    const previousFocus = document.activeElement as HTMLElement;
    window.addEventListener('keydown', trap);
    first?.focus();

    return () => {
      window.removeEventListener('keydown', trap);
      previousFocus?.focus();
    };
  }, [show]); // eslint-disable-line react-hooks/exhaustive-deps

  function dismiss() {
    localStorage.setItem('ghjulianu-welcomed', '1');
    setShow(false);
  }

  function handleJour() {
    setMode('day');
    dismiss();
  }

  function handleNuit() {
    setMode('night');
    dismiss();
  }

  if (!show) return null;

  return (
    <div style={modalOverlay}>
      {/* Layer 1: video background or gradient fallback */}
      {useVideo ? (
        <video
          src="/transitions/day-to-night.mp4"
          loop
          muted
          autoPlay
          playsInline
          style={videoFill}
        />
      ) : (
        <div style={modalFallbackGradient} />
      )}

      {/* Layer 2: dark scrim for text contrast */}
      <div style={modalScrim} />

      {/* Layer 3: content */}
      <div
        style={modalContent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        aria-describedby="welcome-desc"
        ref={modalRef}
      >
        <h2
          id="welcome-title"
          style={{
            fontSize: '0.58rem',
            color: 'rgba(232,228,220,0.5)',
            fontWeight: 400,
            letterSpacing: '0.22em',
            marginBottom: '1rem',
          }}
        >
          Ghjulianu Codani
        </h2>
        <p id="welcome-desc" style={modalHeadline}>
          Ce portfolio existe en deux versions : JOUR et NUIT
        </p>
        <div style={modalBtnRow}>
          <button style={modalBtnDay} onClick={handleJour}>
            JOUR
          </button>
          <button style={modalBtnNight} onClick={handleNuit}>
            NUIT
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Inline style constants ───────────────────────────────────────────────────

const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  zIndex: 9000,
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
};

const modalScrim: React.CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'rgba(0,0,0,0.55)',
};

const modalContent: React.CSSProperties = {
  position: 'relative', zIndex: 1,
  textAlign: 'center', padding: '2rem',
};

const modalHeadline: React.CSSProperties = {
  fontFamily: 'var(--font-cormorant,serif)',
  fontSize: '2rem', fontStyle: 'italic', fontWeight: 300,
  color: '#E8E4DC', lineHeight: 1.2,
};

const modalBtnRow: React.CSSProperties = {
  display: 'flex', gap: '1rem', justifyContent: 'center',
  marginTop: '2rem',
};

const modalBtnDay: React.CSSProperties = {
  background: '#E8E4DC', color: '#080808', border: 'none',
  padding: '0.75rem 1.25rem', fontSize: '0.62rem',
  letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit',
};

const modalBtnNight: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(232,228,220,0.4)', color: '#E8E4DC',
  padding: '0.75rem 1.25rem', fontSize: '0.62rem',
  letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit',
};

const modalFallbackGradient: React.CSSProperties = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(135deg, #080808 0%, #1a1209 40%, #0e0a04 100%)',
};

const videoFill: React.CSSProperties = {
  position: 'absolute', top: 0, left: 0,
  width: '100%', height: '100%', objectFit: 'cover',
};
