'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { findAlbumByKey } from '@/app/admin/actions';
import { useT } from '@/hooks/useT';

export default function MonAlbumPage() {
  const t   = useT();
  const tc  = t.client;
  const router = useRouter();

  const [key, setKey]         = useState('');
  const [error, setError]     = useState('');
  const [pending, startTrans] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    startTrans(async () => {
      const result = await findAlbumByKey(key.trim());
      if (result) {
        router.push(`/albums/${result.slug}`);
      } else {
        setError(tc.error);
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
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Header */}
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>
          {tc.label}
        </p>
        <h1 style={{
          fontFamily:   'var(--font-cormorant), serif',
          fontSize:     'clamp(2rem, 6vw, 3.5rem)',
          fontStyle:    'italic',
          fontWeight:   300,
          color:        'var(--text)',
          lineHeight:   0.95,
          marginBottom: '1rem',
        }}>
          {tc.title}
        </h1>
        <p style={{ fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
          {tc.desc}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.58rem', letterSpacing: '0.16em', color: 'var(--muted)', marginBottom: '0.5rem' }}>
              {tc.keyLabel}
            </label>
            <input
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={tc.keyPlaceholder}
              autoFocus
              autoComplete="off"
              style={{
                width:         '100%',
                background:    'rgba(255,255,255,0.04)',
                border:        `1px solid ${error ? 'rgba(229,115,115,0.5)' : 'var(--border)'}`,
                color:         'var(--text)',
                padding:       '0.9rem 1.2rem',
                fontSize:      '1rem',
                letterSpacing: '0.2em',
                outline:       'none',
                fontFamily:    'monospace',
                transition:    'border-color 0.2s',
              }}
              onFocus={(e)  => { if (!error) e.currentTarget.style.borderColor = 'rgba(200,169,126,0.4)'; }}
              onBlur={(e)   => { if (!error) e.currentTarget.style.borderColor = 'var(--border)'; }}
            />
          </div>

          {error && (
            <p style={{ fontSize: '0.65rem', color: '#e57373', letterSpacing: '0.06em', lineHeight: 1.5 }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending || !key.trim()}
            style={{
              background:    pending ? 'rgba(200,169,126,0.4)' : 'var(--accent)',
              color:         '#080808',
              border:        'none',
              padding:       '0.9rem 1.5rem',
              fontSize:      '0.65rem',
              letterSpacing: '0.18em',
              cursor:        pending || !key.trim() ? 'not-allowed' : 'pointer',
              fontFamily:    'inherit',
              fontWeight:    500,
              opacity:       pending || !key.trim() ? 0.7 : 1,
              transition:    'opacity 0.2s, background 0.2s',
            }}
          >
            {pending ? tc.loading : tc.submit}
          </button>
        </form>

        {/* Help */}
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--muted)', marginBottom: '1rem' }}>
            {tc.helpTitle}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {tc.helpItems.map((item, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--accent)', flexShrink: 0, fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic' }}>—</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
