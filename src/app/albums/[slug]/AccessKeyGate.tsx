'use client';

import { useState, useTransition } from 'react';
import { verifyAlbumKey }          from '@/app/admin/actions';

export default function AccessKeyGate({ slug }: { slug: string }) {
  const [value, setValue]     = useState('');
  const [error, setError]     = useState('');
  const [pending, startTrans] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTrans(async () => {
      const ok = await verifyAlbumKey(slug, value.trim());
      if (ok) {
        window.location.reload();
      } else {
        setError('Clé invalide. Veuillez réessayer.');
      }
    });
  }

  return (
    <div style={{
      minHeight:      'calc(100vh - var(--navbar-h))',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '360px', width: '100%' }}>
        <p style={{ fontSize: '2rem', marginBottom: '1.5rem', opacity: 0.5 }}>🔒</p>

        <h1 style={{
          fontFamily: 'var(--font-cormorant),serif',
          fontSize:   'clamp(1.8rem,5vw,2.8rem)',
          fontStyle:  'italic',
          fontWeight: 300,
          color:      'var(--text)',
          marginBottom: '0.6rem',
        }}>
          Album Privé
        </h1>

        <p style={{ fontSize: '0.72rem', color: 'var(--muted)', letterSpacing: '0.06em', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Cet album est réservé. Entrez la clé d&apos;accès pour continuer.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Clé d'accès"
            autoFocus
            style={{
              background:  'rgba(255,255,255,0.04)',
              border:      '1px solid var(--border)',
              color:       'var(--text)',
              padding:     '0.9rem 1.2rem',
              fontSize:    '0.9rem',
              letterSpacing: '0.1em',
              outline:     'none',
              textAlign:   'center',
              borderRadius: 0,
            }}
          />

          {error && (
            <p style={{ fontSize: '0.65rem', color: '#e57373', letterSpacing: '0.06em' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={pending || !value.trim()}
            style={{
              background:  'var(--accent)',
              color:       '#080808',
              border:      'none',
              padding:     '0.9rem 2rem',
              fontSize:    '0.62rem',
              letterSpacing: '0.18em',
              cursor:      pending ? 'wait' : 'pointer',
              opacity:     pending || !value.trim() ? 0.5 : 1,
              transition:  'opacity 0.2s',
            }}
          >
            {pending ? 'VÉRIFICATION…' : 'ACCÉDER'}
          </button>
        </form>
      </div>
    </div>
  );
}
