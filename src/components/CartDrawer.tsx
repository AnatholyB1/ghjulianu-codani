'use client';

import Image   from 'next/image';
import Link    from 'next/link';
import {
  useEffect, useState, useCallback,
} from 'react';

import { useCart } from '@/contexts/CartContext';

async function downloadPhoto(src: string, alt: string, downloadName?: string) {
  try {
    const res  = await fetch(src);
    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${(downloadName || alt || 'photo').replace(/\s+/g, '-').toLowerCase()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Download failed for', src, err);
  }
}

export default function CartDrawer() {
  const { items, remove, clear, open, setOpen, count } = useCart();

  const [donationModal, setDonationModal] = useState(false);
  const [downloading,   setDownloading]   = useState(false);

  /* Keyboard: Escape closes everything */
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); setDonationModal(false); }
    },
    [setOpen],
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  /* Lock scroll while drawer is open */
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  async function handleDownloadAll() {
    setDonationModal(false);
    setDownloading(true);
    for (const photo of items) {
      await downloadPhoto(photo.src, photo.alt, photo.downloadName);
    }
    setDownloading(false);
    clear();
    setOpen(false);
  }

  return (
    <>
      {/* ── Floating cart button (only visible when cart has items) ───── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le panier"
        style={{
          position:       'fixed',
          bottom:         '5.5rem',
          right:          '1.8rem',
          zIndex:         150,
          width:          '52px',
          height:         '52px',
          borderRadius:   '50%',
          background:     'var(--text)',
          border:         'none',
          cursor:         'pointer',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      '0 4px 24px rgba(0,0,0,0.55)',
          transition:     'transform 0.2s, opacity 0.3s',
          transform:      count > 0 ? 'scale(1)' : 'scale(0)',
          opacity:        count > 0 ? 1 : 0,
          pointerEvents:  count > 0 ? 'auto' : 'none',
        }}
        onMouseEnter={(e) => { if (count > 0) e.currentTarget.style.transform = 'scale(1.1)'; }}
        onMouseLeave={(e) => { if (count > 0) e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {/* cart icon */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9"  cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>

        {/* badge */}
        <span
          style={{
            position:       'absolute',
            top:            '-5px',
            right:          '-5px',
            background:     'var(--accent)',
            color:          '#080808',
            fontSize:       '0.58rem',
            fontFamily:     'var(--font-space)',
            fontWeight:     700,
            lineHeight:     1,
            minWidth:       '18px',
            height:         '18px',
            borderRadius:   '9px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            padding:        '0 4px',
          }}
        >
          {count}
        </span>
      </button>

      {/* ── Backdrop ──────────────────────────────────────────────────── */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position:       'fixed',
          inset:          0,
          zIndex:         160,
          background:     'rgba(0,0,0,0.7)',
          opacity:        open ? 1 : 0,
          pointerEvents:  open ? 'auto' : 'none',
          transition:     'opacity 0.3s ease',
        }}
      />

      {/* ── Drawer panel ──────────────────────────────────────────────── */}
      <div
        style={{
          position:        'fixed',
          top:             0,
          right:           0,
          bottom:          0,
          zIndex:          170,
          width:           'min(440px, 100vw)',
          background:      '#0f0f0f',
          borderLeft:      '1px solid var(--border)',
          display:         'flex',
          flexDirection:   'column',
          transform:       open ? 'translateX(0)' : 'translateX(100%)',
          transition:      'transform 0.35s cubic-bezier(0.22,1,0.36,1)',
          willChange:      'transform',
        }}
      >
        {/* Header */}
        <div
          style={{
            display:        'flex',
            justifyContent: 'space-between',
            alignItems:     'center',
            padding:        '1.5rem 1.75rem',
            borderBottom:   '1px solid var(--border)',
          }}
        >
          <div>
            <p style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '0.3rem' }}>
              SÉLECTION
            </p>
            <h2
              style={{
                fontFamily:  'var(--font-cormorant),serif',
                fontSize:    '1.7rem',
                fontStyle:   'italic',
                fontWeight:  300,
                color:       'var(--text)',
                lineHeight:  1,
              }}
            >
              Votre panier
            </h2>
          </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="Fermer le panier"
            style={{
              background:  'none',
              border:      'none',
              color:       'var(--muted)',
              cursor:      'pointer',
              fontSize:    '1.4rem',
              lineHeight:  1,
              transition:  'color 0.2s',
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--text)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--muted)')}
          >
            ✕
          </button>
        </div>

        {/* Photo list */}
        <div
          style={{
            flex:          1,
            overflowY:     'auto',
            padding:       '1rem 1.75rem',
            display:       'flex',
            flexDirection: 'column',
            gap:           '0.6rem',
          }}
        >
          {items.length === 0 ? (
            <p
              style={{
                color:      'var(--muted)',
                fontSize:   '0.82rem',
                marginTop:  '3rem',
                textAlign:  'center',
                fontStyle:  'italic',
              }}
            >
              Aucune photo sélectionnée.
            </p>
          ) : (
            items.map((photo) => (
              <div
                key={photo.id}
                style={{
                  display:     'flex',
                  gap:         '0.8rem',
                  alignItems:  'center',
                  padding:     '0.5rem',
                  background:  'rgba(255,255,255,0.03)',
                  borderRadius: '3px',
                }}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    width:        '72px',
                    height:       '54px',
                    flexShrink:   0,
                    overflow:     'hidden',
                    borderRadius: '2px',
                    background:   '#1a1a1a',
                  }}
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={72}
                    height={54}
                    unoptimized
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize:      '0.72rem',
                      color:         'var(--text)',
                      whiteSpace:    'nowrap',
                      overflow:      'hidden',
                      textOverflow:  'ellipsis',
                    }}
                  >
                    {photo.alt || 'Photo'}
                  </p>
                  {photo.context && (
                    <p style={{ fontSize: '0.58rem', color: 'var(--muted)', letterSpacing: '0.08em', marginTop: '2px' }}>
                      {photo.context}
                    </p>
                  )}
                  <p style={{ fontSize: '0.57rem', color: 'rgba(122,122,116,0.6)', marginTop: '2px' }}>
                    {photo.width} × {photo.height}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => remove(photo.id)}
                  aria-label={`Retirer ${photo.alt || 'photo'}`}
                  style={{
                    background: 'none',
                    border:     'none',
                    color:      'var(--muted)',
                    cursor:     'pointer',
                    fontSize:   '1rem',
                    lineHeight: 1,
                    padding:    '4px',
                    transition: 'color 0.2s',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#e55')}
                  onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--muted)')}
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer CTA */}
        {items.length > 0 && (
          <div
            style={{
              padding:       '1.25rem 1.75rem',
              borderTop:     '1px solid var(--border)',
              display:       'flex',
              flexDirection: 'column',
              gap:           '0.75rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: '0.65rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>
                {count} photo{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''}
              </p>
              <button
                onClick={clear}
                style={{
                  background:    'none',
                  border:        'none',
                  color:         'var(--muted)',
                  cursor:        'pointer',
                  fontSize:      '0.58rem',
                  letterSpacing: '0.14em',
                  textDecoration: 'underline',
                  transition:    'color 0.2s',
                }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = 'var(--text)')}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = 'var(--muted)')}
              >
                VIDER
              </button>
            </div>

            <button
              onClick={() => setDonationModal(true)}
              disabled={downloading}
              style={{
                background:    downloading ? 'rgba(200,169,126,0.6)' : 'var(--accent)',
                color:         '#080808',
                border:        'none',
                padding:       '0.95rem 1.5rem',
                fontSize:      '0.62rem',
                letterSpacing: '0.2em',
                fontFamily:    'var(--font-space)',
                fontWeight:    700,
                cursor:        downloading ? 'wait' : 'pointer',
                width:         '100%',
                transition:    'background 0.2s',
              }}
            >
              {downloading ? 'TÉLÉCHARGEMENT…' : 'TÉLÉCHARGER LES PHOTOS'}
            </button>
          </div>
        )}
      </div>

      {/* ── Donation modal ────────────────────────────────────────────── */}
      {donationModal && (
        <div
          onClick={() => setDonationModal(false)}
          style={{
            position:       'fixed',
            inset:          0,
            zIndex:         300,
            background:     'rgba(0,0,0,0.88)',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            animation:      'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#111',
              border:     '1px solid var(--border)',
              padding:    'clamp(2rem,5vw,3rem)',
              width:      'min(500px, 92vw)',
              textAlign:  'center',
              animation:  'scaleIn 0.3s cubic-bezier(0.22,1,0.36,1)',
            }}
          >
            <p
              style={{
                fontSize:      '0.58rem',
                letterSpacing: '0.22em',
                color:         'var(--muted)',
                marginBottom:  '1rem',
              }}
            >
              AVANT DE TÉLÉCHARGER
            </p>

            <h2
              style={{
                fontFamily:   'var(--font-cormorant),serif',
                fontSize:     'clamp(1.7rem,4vw,2.5rem)',
                fontStyle:    'italic',
                fontWeight:   300,
                color:        'var(--text)',
                lineHeight:   1.15,
                marginBottom: '1rem',
              }}
            >
              Ces images vous ont touché ?
            </h2>

            <p
              style={{
                fontSize:     '0.8rem',
                color:        'var(--muted)',
                lineHeight:   1.9,
                marginBottom: '2rem',
                maxWidth:     '380px',
                margin:       '0 auto 2rem',
              }}
            >
              Mon travail est librement accessible. Si vous souhaitez soutenir la création et me permettre de continuer à photographier, un geste — même modeste — est infiniment précieux.
            </p>

            <div
              style={{
                display:       'flex',
                flexDirection: 'column',
                gap:           '0.7rem',
              }}
            >
              <Link
                href="/don"
                onClick={() => setDonationModal(false)}
                style={{
                  display:       'block',
                  background:    'var(--accent)',
                  color:         '#080808',
                  padding:       '1.05rem',
                  fontSize:      '0.62rem',
                  letterSpacing: '0.2em',
                  fontFamily:    'var(--font-space)',
                  fontWeight:    700,
                  textDecoration: 'none',
                }}
              >
                SOUTENIR GHJULIANU →
              </Link>

              <button
                onClick={handleDownloadAll}
                style={{
                  background:    'none',
                  border:        '1px solid var(--border)',
                  color:         'var(--muted)',
                  padding:       '0.95rem',
                  fontSize:      '0.6rem',
                  letterSpacing: '0.16em',
                  cursor:        'pointer',
                  transition:    'color 0.2s, border-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLElement).style.color       = 'var(--text)';
                  (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLElement).style.color       = 'var(--muted)';
                  (e.target as HTMLElement).style.borderColor = 'var(--border)';
                }}
              >
                TÉLÉCHARGER QUAND MÊME
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
