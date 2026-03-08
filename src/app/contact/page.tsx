'use client';

import ScrollReveal from '@/components/ScrollReveal';

export default function ContactPage() {
  return (
    <>
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem)' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>CONTACT</p>
          <h1 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(2.5rem,7vw,5.5rem)', fontStyle: 'italic', fontWeight: 300, lineHeight: 0.95, color: 'var(--text)' }}>
            Travailler ensemble
          </h1>
        </ScrollReveal>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 'clamp(2rem,4vw,5rem)', padding: '0 clamp(1.5rem,5vw,5rem) clamp(4rem,6vw,7rem)', alignItems: 'start' }}>
        {/* Left – info */}
        <ScrollReveal direction="left" style={{ paddingTop: '1rem' }}>
          <h2 style={{ fontFamily: 'var(--font-cormorant),serif', fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontStyle: 'italic', fontWeight: 300, color: 'var(--text)', marginBottom: '1.5rem' }}>
            Disponible pour
          </h2>
          {['Shootings personnels', 'Communication de marque', 'Événementiel & Nightlife', 'Collaborations artistiques'].map((item) => (
            <p key={item} style={{ fontSize: '0.8rem', color: 'var(--muted)', lineHeight: 1.9, display: 'flex', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent)' }}>—</span> {item}
            </p>
          ))}

          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            <a href="mailto:contact@ghjulianucodani.com"
              style={{ fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--text)', textDecoration: 'none', opacity: 0.8 }}>
              contact@ghjulianucodani.com
            </a>
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"
              style={{ fontSize: '0.7rem', letterSpacing: '0.08em', color: 'var(--text)', textDecoration: 'none', opacity: 0.8 }}>
              @ghjulianu_codani
            </a>
          </div>
        </ScrollReveal>

        {/* Right – form */}
        <ScrollReveal direction="right" delay={120}>
          <form
            onSubmit={(e) => e.preventDefault()}
            style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}
          >
            {[
              { label: 'NOM', type: 'text',  name: 'name',    placeholder: 'Votre nom' },
              { label: 'EMAIL', type: 'email', name: 'email',  placeholder: 'votre@email.com' },
            ].map((f) => (
              <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label style={{ fontSize: '0.58rem', letterSpacing: '0.16em', color: 'var(--muted)' }}>{f.label}</label>
                <input
                  type={f.type} name={f.name} placeholder={f.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label style={{ fontSize: '0.58rem', letterSpacing: '0.16em', color: 'var(--muted)' }}>MESSAGE</label>
              <textarea
                name="message" rows={5}
                placeholder="Décrivez votre projet…"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '120px' }}
              />
            </div>

            <button
              type="submit"
              style={{
                background:    'var(--text)',
                color:          '#080808',
                border:         'none',
                padding:        '0.8rem 2rem',
                fontSize:       '0.65rem',
                letterSpacing:  '0.16em',
                cursor:         'pointer',
                alignSelf:       'flex-start',
                transition:      'opacity 0.25s',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = '0.85')}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = '1')}
            >
              ENVOYER
            </button>
          </form>
        </ScrollReveal>
      </section>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  background:   'transparent',
  border:       '1px solid var(--border)',
  color:        'var(--text)',
  padding:      '0.7rem 1rem',
  fontSize:     '0.82rem',
  fontFamily:   'inherit',
  outline:      'none',
  width:        '100%',
  transition:   'border-color 0.2s',
};
