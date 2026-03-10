'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const redirect     = searchParams.get('redirect') ?? '/admin';
  const supabase     = createClient();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Identifiants incorrects.');
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', maxWidth: '360px' }}>
      <div>
        <label style={labelStyle}>EMAIL</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
          placeholder="admin@exemple.com"
          style={inputStyle}
        />
      </div>
      <div>
        <label style={labelStyle}>MOT DE PASSE</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="••••••••"
          style={inputStyle}
        />
      </div>
      {error && (
        <p style={{ fontSize: '0.72rem', color: '#e07070', letterSpacing: '0.04em' }}>{error}</p>
      )}
      <button type="submit" disabled={loading} style={btnStyle}>
        {loading ? 'CONNEXION…' : 'SE CONNECTER'}
      </button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div style={{
      minHeight:     '100vh',
      background:    '#080808',
      display:       'flex',
      flexDirection: 'column',
      alignItems:    'center',
      justifyContent:'center',
      padding:       '2rem',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.58rem', letterSpacing: '0.24em', color: '#7a7a74', marginBottom: '0.8rem' }}>ADMINISTRATION</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant, serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' }}>
          Ghjulianu Codani
        </h1>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display:       'block',
  fontSize:      '0.58rem',
  letterSpacing: '0.16em',
  color:         '#7a7a74',
  marginBottom:  '0.5rem',
};
const inputStyle: React.CSSProperties = {
  width:        '100%',
  background:   'transparent',
  border:       '1px solid rgba(255,255,255,0.1)',
  color:        '#E8E4DC',
  padding:      '0.7rem 1rem',
  fontSize:     '0.85rem',
  fontFamily:   'inherit',
  outline:      'none',
};
const btnStyle: React.CSSProperties = {
  background:    '#E8E4DC',
  color:         '#080808',
  border:        'none',
  padding:       '0.8rem',
  fontSize:      '0.65rem',
  letterSpacing: '0.16em',
  cursor:        'pointer',
  fontFamily:    'inherit',
  marginTop:     '0.5rem',
};
