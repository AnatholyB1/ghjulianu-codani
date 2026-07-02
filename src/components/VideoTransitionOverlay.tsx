'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface VideoTransitionOverlayProps {
  src: string;
  onComplete: () => void;
  message?: string;
}

export default function VideoTransitionOverlay({ src, onComplete, message }: VideoTransitionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [typed, setTyped] = useState('');

  // Fade-in: allow one paint then transition
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Typewriter: start quickly (80ms), then ~12ms/char so it finishes well before video ends
  useEffect(() => {
    if (!message) return;
    let cancelled = false;
    const delay = setTimeout(() => {
      let i = 0;
      const tick = setInterval(() => {
        if (cancelled) { clearInterval(tick); return; }
        i++;
        setTyped(message.slice(0, i));
        if (i >= message.length) clearInterval(tick);
      }, 12);
      return () => clearInterval(tick);
    }, 80);
    return () => { cancelled = true; clearTimeout(delay); };
  }, [message]);

  function handleEnded() {
    setFading(true);
    setTimeout(() => onComplete(), 600);
  }

  function handleError() {
    onComplete();
  }

  if (typeof document === 'undefined') return null;

  const opacity = fading ? 0 : visible ? 1 : 0;

  return createPortal(
    <div style={{ ...videoOverlay, opacity }}>
      <video
        src={src}
        autoPlay
        muted
        playsInline
        onCanPlay={(e) => { (e.target as HTMLVideoElement).playbackRate = 3; }}
        onEnded={handleEnded}
        onError={handleError}
        style={videoFill}
      />
      {message && typed && (
        <div style={textOverlay}>
          <p style={typewriterText}>
            {typed}
            <span style={cursor}>|</span>
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}

const videoOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 'var(--navbar-h, 4rem)',
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 8000,
  background: '#000',
  transition: 'opacity 0.6s cubic-bezier(0.4,0,0.2,1)',
  pointerEvents: 'none',
};

const videoFill: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

const textOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem',
  background: 'rgba(0,0,0,0.35)',
};

const typewriterText: React.CSSProperties = {
  fontFamily: 'var(--font-cormorant, serif)',
  fontSize: 'clamp(1rem, 2.5vw, 1.6rem)',
  fontStyle: 'italic',
  fontWeight: 300,
  color: 'rgba(232,228,220,0.92)',
  letterSpacing: '0.04em',
  lineHeight: 1.4,
  textAlign: 'center',
  maxWidth: '36rem',
};

const cursor: React.CSSProperties = {
  display: 'inline-block',
  marginLeft: '2px',
  animation: 'blink 0.7s step-end infinite',
};
