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
    const mailto  = `mailto:contact@ghjulianucodani.com`
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
              href="mailto:contact@ghjulianucodani.com"
              style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--text)', textDecoration: 'none', opacity: 0.75, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'; }}
            >
              contact@ghjulianucodani.com
            </a>
            <a
              href="https://www.instagram.com/ghjulianu_codani"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.68rem', letterSpacing: '0.08em', color: 'var(--text)', textDecoration: 'none', opacity: 0.75, transition: 'opacity 0.2s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '1'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = '0.75'; }}
            >
              @ghjulianu_codani
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
