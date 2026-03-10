import { createClient } from '@/utils/supabase/server';
import ScrollReveal     from '@/components/ScrollReveal';
import PortfolioGrid    from './PortfolioGrid';

export default async function PortfolioPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from('portfolio_photos')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

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
