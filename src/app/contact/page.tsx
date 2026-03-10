'use client';

import ScrollReveal from '@/components/ScrollReveal';
import Link         from 'next/link';
import { useState } from 'react';
import { useT }     from '@/hooks/useT';

const inputStyle: React.CSSProperties = {
  background:  'transparent',
  border:      '1px solid var(--border)',
  color:       'var(--text)',
  padding:     '0.7rem 1rem',
  fontSize:    '0.82rem',
  fontFamily:  'inherit',
  outline:     'none',
  width:       '100%',
  transition:  'border-color 0.2s',
};

export default function ContactPage() {
  const t = useT();
  const tc = t.contact;
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd   = new FormData(e.currentTarget);
    const name    = fd.get('name');
    const email   = fd.get('email');
    const projet  = fd.get('projet');
    const message = fd.get('message');
    const mailto  = `mailto:ghjulianu.codani@gmail.com`
      + `?subject=${tc.mailSubject} – ${projet}`
      + `&body=Nom : ${name}%0AEmail : ${email}%0AProjet : ${projet}%0A%0A${message}`;
    window.location.href = mailto;
    setSent(true);
  }

  return (
    <>
      {/* ── Header ── */}
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)', borderBottom: '1px solid var(--border)' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>{tc.label}</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)' }}>
            {tc.title}
          </h1>
          <p style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: 'var(--muted)', maxWidth: '480px', lineHeight: 1.8 }}>
            {tc.subtitle}
          </p>
        </ScrollReveal>
      </section>

      {/* ── Body ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(3rem,6vw,7rem)', padding: 'clamp(3rem,5vw,5rem) clamp(1.5rem,5vw,5rem) clamp(4rem,6vw,7rem)', alignItems: 'start' }}>

        {/* Left – info */}
        <ScrollReveal direction="left">
          <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            {tc.availableFor}
          </h2>

          {tc.availableItems.map((item) => (
            <p key={item} style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.9, display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', flexShrink: 0 }}>—</span>{item}
            </p>
          ))}

          <div style={{ height: '1px', background: 'var(--border)', margin: '2rem 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <a
              href="mailto:ghjulianu.codani@gmail.com"
              style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--text)', textDecoration: 'none', opacity: 0.75, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'; }}
            >
              ghjulianu.codani@gmail.com
            </a>
            <a
              href="https://www.instagram.com/ghjulianu.cdn"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--text)', textDecoration: 'none', opacity: 0.75, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'; }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              @ghjulianu.cdn
            </a>
          </div>

          <p style={{ marginTop: '2rem', fontSize: '0.65rem', color: 'rgba(122,122,116,0.5)', lineHeight: 1.8 }}>
            {tc.location.split('\n').map((line, i) => (<span key={i}>{line}{i === 0 && <br />}</span>))}
          </p>

          <Link
            href="/tarifs"
            style={{ display: 'inline-flex', marginTop: '2rem', fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--muted)', textDecoration: 'none', borderBottom: '1px solid var(--border)', paddingBottom: '2px', transition: 'color 0.2s' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--accent)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.color = 'var(--muted)'; }}
          >
            {tc.seeTarifs}
          </Link>
        </ScrollReveal>

        {/* Right – form */}
        <ScrollReveal direction="right" delay={120}>
          {sent ? (
            <div style={{ padding: '2rem', border: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: '1.4rem', fontStyle: 'italic', color: 'var(--text)', marginBottom: '0.5rem' }}>{tc.sentTitle}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{tc.sentBody}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.56rem', letterSpacing: '0.18em', color: 'var(--muted)' }}>{tc.nameLabel}</label>
                  <input required type="text" name="name" placeholder={tc.namePlaceholder} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '0.56rem', letterSpacing: '0.18em', color: 'var(--muted)' }}>{tc.emailLabel}</label>
                  <input required type="email" name="email" placeholder="votre@email.com" style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.56rem', letterSpacing: '0.18em', color: 'var(--muted)' }}>{tc.projectLabel}</label>
                <select name="projet" style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', background: '#111111', color: 'var(--text)' }}>
                  <option value="" style={{ background: '#111111', color: 'var(--text)' }}>{tc.projectPlaceholder}</option>
                  {tc.projets.map((p) => <option key={p} value={p} style={{ background: '#111111', color: 'var(--text)' }}>{p}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.56rem', letterSpacing: '0.18em', color: 'var(--muted)' }}>{tc.messageLabel}</label>
                <textarea
                  required
                  name="message"
                  rows={5}
                  placeholder={tc.messagePlaceholder}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '130px' }}
                />
              </div>

              <button
                type="submit"
                style={{ background: 'var(--accent)', color: '#080808', border: 'none', padding: '0.85rem 2rem', fontSize: '0.63rem', letterSpacing: '0.18em', cursor: 'pointer', alignSelf: 'flex-start', fontFamily: 'inherit', fontWeight: 500, transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = '0.82'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = '1'; }}
              >
                {tc.sendBtn}
              </button>

              <p style={{ fontSize: '0.58rem', color: 'rgba(122,122,116,0.45)', lineHeight: 1.6 }}>
                {tc.mailHint}
              </p>
            </form>
          )}
        </ScrollReveal>
      </section>
    </>
  );
}
