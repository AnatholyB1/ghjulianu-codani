import { createClient }          from '@/utils/supabase/server';
import AddPortfolioPhotoForm      from '../_components/AddPortfolioPhotoForm';
import PortfolioAdminGrid         from './_components/PortfolioAdminGrid';

export default async function AdminPortfolioPage() {
  const supabase = await createClient();
  const { data: photos } = await supabase
    .from('portfolio_photos')
    .select('*')
    .order('sort_order')
    .order('created_at', { ascending: false });

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <p style={subLabel}>PORTFOLIO</p>
        <h1 style={pageTitle}>Gérer le portfolio</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Add form */}
        <div style={card}>
          <p style={cardTitle}>AJOUTER UNE PHOTO</p>
          <AddPortfolioPhotoForm />
        </div>

        {/* Grid */}
        <PortfolioAdminGrid initialPhotos={photos ?? []} />
      </div>
    </>
  );
}

const subLabel:  React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.4rem' };
const pageTitle: React.CSSProperties = { fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' };
const card:      React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem' };
const cardTitle: React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74' };
