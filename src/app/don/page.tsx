'use client';

import ScrollReveal from '@/components/ScrollReveal';
import Link         from 'next/link';

export default function DonPage() {
  return (
    <>
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>SOUTENIR</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)' }}>
            Faire un don
          </h1>
        </ScrollReveal>
      </section>

      <section style={{ padding: '0 clamp(1.5rem,5vw,5rem) clamp(4rem,6vw,7rem)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(3rem,6vw,7rem)', alignItems: 'start' }}>
        {/* Left – message */}
        <ScrollReveal direction="left">
          <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.5rem,3vw,2.2rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', marginBottom: '1.5rem', lineHeight: 1.2 }}>
            Vous appréciez<br />mon travail ?
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem' }}>
            La photographie événementielle est un travail de passion. Chaque soirée, chaque shooting est une invitation à raconter une histoire à travers l'image.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.9, marginBottom: '1.2rem' }}>
            Si mon travail vous a touché, m'a aidé à vous représenter, ou si vous souhaitez simplement encourager la création indépendante, un don — même symbolique — est toujours très apprécié.
          </p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.9, fontStyle: 'italic' }}>
            Merci sincèrement.
          </p>

          <p style={{ marginTop: '2rem', fontSize: '0.75rem', fontStyle: 'italic', fontFamily: 'var(--font-cormorant),serif', color: 'var(--text)', opacity: 0.6 }}>
            — Ghjulianu
          </p>
        </ScrollReveal>

        {/* Right – donate section */}
        <ScrollReveal direction="right" delay={120}>
          <div
            style={{
              border:      '1px solid var(--border)',
              padding:     'clamp(2rem,4vw,3.5rem)',
              display:     'flex',
              flexDirection: 'column',
              gap:         '1.5rem',
            }}
          >
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--muted)' }}>VIA PAYPAL</p>

            <a
              href="https://paypal.me/ghjulianucodani"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display:        'inline-flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '0.6rem',
                background:     'var(--accent)',
                color:          '#080808',
                padding:        '1rem 2rem',
                fontSize:       '0.7rem',
                letterSpacing:  '0.14em',
                textDecoration: 'none',
                transition:     'opacity 0.25s',
                fontWeight:     500,
              }}
              onMouseEnter={(e) => ((e.target as HTMLAnchorElement).style.opacity = '0.85')}
              onMouseLeave={(e) => ((e.target as HTMLAnchorElement).style.opacity = '1')}
            >
              FAIRE UN DON VIA PAYPAL
            </a>

            <div style={{ height: '1px', background: 'var(--border)' }} />

            <div>
              <p style={{ fontSize: '0.6rem', letterSpacing: '0.18em', color: 'var(--muted)', marginBottom: '0.8rem' }}>
                OU PAR VIREMENT — IBAN
              </p>
              <code style={{ fontSize: '0.75rem', color: 'var(--text)', opacity: 0.5, userSelect: 'all', letterSpacing: '0.04em' }}>
                FR76 XXXX XXXX XXXX XXXX XXXX XXX
              </code>
              <p style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: '0.4rem' }}>Remplacez l'IBAN par le vôtre dans le code.</p>
            </div>

            <div style={{ height: '1px', background: 'var(--border)' }} />

            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', lineHeight: 1.7 }}>
              Besoin de photos ou d'un projet commun ?{' '}
              <Link href="/contact" style={{ color: 'var(--accent)', textDecoration: 'none', borderBottom: '1px solid var(--accent)', paddingBottom: '1px' }}>
                Contactez-moi
              </Link>
            </p>
          </div>
        </ScrollReveal>
      </section>
    </>
  );
}
