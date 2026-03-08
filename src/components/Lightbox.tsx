'use client';

import Image from 'next/image';
import { useEffect, KeyboardEvent, useCallback } from 'react';

type Photo = { src: string; width: number; height: number; alt?: string };

interface Props {
  photos:   Photo[];
  index:    number;
  onClose:  () => void;
  onNext:   () => void;
  onPrev:   () => void;
}

export default function Lightbox({ photos, index, onClose, onNext, onPrev }: Props) {
  const photo = photos[index];

  const handleKey = useCallback((e: globalThis.KeyboardEvent) => {
    if (e.key === 'Escape')     onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft')  onPrev();
  }, [onClose, onNext, onPrev]);

  useEffect(() => {
    document.body.classList.add('no-scroll');
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.classList.remove('no-scroll');
      window.removeEventListener('keydown', handleKey);
    };
  }, [handleKey]);

  return (
    <div
      onClick={onClose}
      style={{
        position:       'fixed',
        inset:          0,
        zIndex:         200,
        background:     'rgba(0,0,0,0.96)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        animation:      'fadeIn 0.25s ease',
        cursor:         'zoom-out',
      }}
    >
      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev(); }}
        aria-label="Photo précédente"
        style={arrowStyle('left')}
      >
        ←
      </button>

      {/* Image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position:  'relative',
          maxWidth:  '92vw',
          maxHeight: '88vh',
          cursor:    'default',
          animation: 'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <Image
          src={photo.src}
          alt={photo.alt ?? ''}
          width={photo.width}
          height={photo.height}
          style={{
            maxWidth:   '92vw',
            maxHeight:  '88vh',
            width:      'auto',
            height:     'auto',
            objectFit:  'contain',
          }}
          priority
          unoptimized
        />
      </div>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext(); }}
        aria-label="Photo suivante"
        style={arrowStyle('right')}
      >
        →
      </button>

      {/* Close */}
      <button
        onClick={onClose}
        aria-label="Fermer"
        style={{
          position:   'fixed',
          top:        '1.5rem',
          right:      '2rem',
          background: 'none',
          border:     'none',
          color:      'rgba(255,255,255,0.6)',
          fontSize:   '1.5rem',
          cursor:     'pointer',
          lineHeight: 1,
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#fff')}
        onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.6)')}
      >
        ✕
      </button>

      {/* Counter */}
      <p
        style={{
          position:      'fixed',
          bottom:        '1.5rem',
          left:          '50%',
          transform:     'translateX(-50%)',
          fontSize:      '0.65rem',
          letterSpacing: '0.14em',
          color:         'rgba(255,255,255,0.35)',
        }}
      >
        {index + 1} / {photos.length}
      </p>
    </div>
  );
}

function arrowStyle(side: 'left' | 'right') {
  return {
    position:   'fixed' as const,
    top:        '50%',
    [side]:     '1.5rem',
    transform:  'translateY(-50%)',
    background: 'none',
    border:     'none',
    color:      'rgba(255,255,255,0.4)',
    fontSize:   '1.6rem',
    cursor:     'pointer',
    lineHeight: 1,
    padding:    '0.5rem',
    transition: 'color 0.2s',
  };
}
