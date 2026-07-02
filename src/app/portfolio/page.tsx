import ScrollReveal          from '@/components/ScrollReveal';
import PortfolioGrid          from './PortfolioGrid';
import PortfolioThemeToggle   from './PortfolioThemeToggle';
import WelcomeModalLoader     from '@/components/WelcomeModalLoader';

export default function PortfolioPage() {
  return (
    <>
      <WelcomeModalLoader />
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem) 0' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>
            PHOTOGRAPHIE
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h1
              style={{
                fontFamily: 'var(--font-cormorant),serif',
                fontSize:   'clamp(2.5rem,7vw,5.5rem)',
                fontStyle:  'italic',
                fontWeight: 300,
                lineHeight: 0.95,
                color:      'var(--text)',
              }}
            >
              Portfolio
            </h1>
            <PortfolioThemeToggle />
          </div>
        </ScrollReveal>
      </section>

      <PortfolioGrid />
    </>
  );
}
