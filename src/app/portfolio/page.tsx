import ScrollReveal          from '@/components/ScrollReveal';
import PortfolioGrid          from './PortfolioGrid';
import PortfolioHeading       from './PortfolioHeading';
import WelcomeModalLoader     from '@/components/WelcomeModalLoader';

export default function PortfolioPage() {
  return (
    <>
      <WelcomeModalLoader />
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem) 0' }}>
        <ScrollReveal direction="up">
          <PortfolioHeading />
        </ScrollReveal>
      </section>

      <PortfolioGrid />
    </>
  );
}
