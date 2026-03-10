'use client';
import ScrollReveal from '@/components/ScrollReveal';
import Link         from 'next/link';
import { useT }     from '@/hooks/useT';

export default function TarifsPage() {
  const t = useT();
  const tr = t.tarifs;
  return (
    <>
      {/* ── Header ── */}
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)', borderBottom: '1px solid var(--border)' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>{tr.label}</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)' }}>
            {tr.title}
          </h1>
          <p style={{ marginTop: '1.2rem', fontSize: '0.8rem', color: 'var(--muted)', maxWidth: '480px', lineHeight: 1.8 }}>
            {tr.desc}{' '}
            <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}>{tr.descLink}</Link>
            {' '}{tr.descEnd}
          </p>
        </ScrollReveal>
      </section>

      {/* ── Prestation rows ── */}
      <section style={{ padding: '0 clamp(1.5rem,5vw,5rem)', maxWidth: '1100px' }}>
        {tr.prestations.map((p, i) => {
          const badge = p.badge ? tr[p.badge as 'badgeShooting' | 'badgeEvent'] : null;
          return (
          <ScrollReveal key={p.id} direction="up" delay={i * 60}>
            <div style={{
              display:       'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap:           'clamp(1.5rem,3vw,3rem)',
              padding:       'clamp(2rem,3.5vw,3rem) 0',
              borderBottom:  '1px solid var(--border)',
              alignItems:    'start',
              background:    badge ? 'linear-gradient(90deg,rgba(200,169,126,0.03) 0%,transparent 100%)' : 'transparent',
            }}>
              <div>
                {badge
                  ? <p style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--accent)', marginBottom: '0.7rem' }}>{badge}</p>
                  : <p style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: 'transparent', marginBottom: '0.7rem', userSelect: 'none' }}>·</p>
                }
                <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2rem,4vw,3rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', lineHeight: 1, marginBottom: '1rem' }}>{p.id}</h2>
                <p style={{ fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.25rem' }}>{p.photos}</p>
                <p style={{ fontSize: '0.55rem', letterSpacing: '0.06em', color: 'rgba(122,122,116,0.55)' }}>{p.duration}</p>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', paddingTop: '1.8rem' }}>
                {p.features.map((f) => (
                  <li key={f} style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.6, display: 'flex', gap: '0.55rem' }}>
                    <span style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.05em' }}>—</span>{f}
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: '1.8rem', gap: '1.2rem' }}>
                <p style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.4rem,2.5vw,1.8rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', opacity: 0.5 }}>{tr.quote}</p>
                <Link
                  href="/contact"
                  style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: badge ? 'var(--accent)' : 'var(--text)', textDecoration: 'none', border: `1px solid ${badge ? 'var(--accent)' : 'var(--border)'}`, padding: '0.6rem 1.2rem', transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}
                >
                  {tr.cta}
                </Link>
              </div>
            </div>
          </ScrollReveal>
          );
        })}
      </section>

      {/* ── Sur-mesure ── */}
      <section style={{ padding: 'clamp(2rem,4vw,4rem) clamp(1.5rem,5vw,5rem)', maxWidth: '1100px' }}>
        <ScrollReveal direction="up">
          <div style={{ border: '1px solid var(--border)', padding: 'clamp(2rem,4vw,3.5rem)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'clamp(1.5rem,3vw,3rem)', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '0.5rem', letterSpacing: '0.2em', color: 'var(--muted)', marginBottom: '0.7rem' }}>{tr.formulaLabel}</p>
              <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2rem,4vw,3rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', lineHeight: 1, marginBottom: '1rem' }}>
                {tr.customTitle}
              </h2>
              <p style={{ fontSize: '0.62rem', letterSpacing: '0.08em', color: 'var(--muted)', marginBottom: '0.25rem' }}>{tr.customPhotos}</p>
              <p style={{ fontSize: '0.55rem', letterSpacing: '0.06em', color: 'rgba(122,122,116,0.55)' }}>{tr.customDuration}</p>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {tr.customFeatures.map((f) => (
                <li key={f} style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.6, display: 'flex', gap: '0.55rem' }}>
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>—</span>{f}
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1.2rem' }}>
              <p style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.4rem,2.5vw,1.8rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', opacity: 0.5 }}>{tr.quote}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)', lineHeight: 1.7, fontStyle: 'italic', fontFamily: 'var(--font-cormorant),serif', textAlign: 'right', maxWidth: '200px' }}>{tr.customTagline}</p>
              <Link href="/contact" style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: 'var(--accent)', textDecoration: 'none', border: '1px solid var(--accent)', padding: '0.6rem 1.2rem', transition: 'opacity 0.2s', whiteSpace: 'nowrap' }}>
                {tr.cta}
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <div style={{ height: 'clamp(3rem,5vw,6rem)' }} />
    </>
  );
}
