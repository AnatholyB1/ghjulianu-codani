'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface VideoTransitionOverlayProps {
  src: string;
  onComplete: () => void;
}

export default function VideoTransitionOverlay({ src, onComplete }: VideoTransitionOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  // Trigger fade-in on next frame after mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function handleEnded() {
    setFading(true);
    setTimeout(() => onComplete(), 300);
  }

  function handleError() {
    onComplete();
  }

  if (typeof document === 'undefined') return null;

  const opacity = fading ? 0 : visible ? 1 : 0;

  return createPortal(
    <div
      style={{
        ...videoOverlay,
        opacity,
      }}
    >
      <video
        src={src}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        onError={handleError}
        style={videoFill}
      />
    </div>,
    document.body
  );
}

const videoOverlay: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 8000,
  background: '#000',
  transition: 'opacity 0.3s ease',
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
