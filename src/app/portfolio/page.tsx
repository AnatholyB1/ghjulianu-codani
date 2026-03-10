import { createClient } from '@/utils/supabase/server';
import ScrollReveal     from '@/components/ScrollReveal';
import PortfolioGrid    from './PortfolioGrid';

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: raw } = await supabase
    .from('portfolio_photos')
    .select('*');

  // Fisher-Yates shuffle — new random order on every request
  const photos = [...(raw ?? [])];
  for (let i = photos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [photos[i], photos[j]] = [photos[j], photos[i]];
  }

  return (
    <>
      <section style={{ padding: 'clamp(2.5rem,5vw,5rem) clamp(1.5rem,5vw,5rem) 0' }}>
        <ScrollReveal direction="up">
          <p style={{ fontSize: '0.62rem', letterSpacing: '0.22em', color: 'var(--muted)', marginBottom: '0.8rem' }}>
            PHOTOGRAPHIE
          </p>
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
        </ScrollReveal>
      </section>

      <PortfolioGrid photos={photos ?? []} />
    </>
  );
}
