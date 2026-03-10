import { createClient }                              from '@/utils/supabase/server';
import { deletePortfolioPhoto }                     from '../actions';
import type { PortfolioPhoto }                      from '@/lib/db.types';
import ConfirmButton                               from '../_components/ConfirmButton';
import AddPortfolioPhotoForm                       from '../_components/AddPortfolioPhotoForm';

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
        <div>
          <p style={{ ...cardTitle, marginBottom: '1rem' }}>PHOTOS ({photos?.length ?? 0})</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '4px' }}>
            {photos?.map((photo: PortfolioPhoto) => (
              <div key={photo.id} style={{ position: 'relative', background: '#1a1a1a' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt ?? ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
                <div style={{ padding: '0.4rem 0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.56rem', color: '#7a7a74', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
                    {photo.alt ?? '—'}
                  </span>
                  <ConfirmButton
                    formAction={deletePortfolioPhoto.bind(null, photo.id)}
                    message="Supprimer ?"
                    style={{ background: 'none', border: 'none', color: '#e07070', fontSize: '0.65rem', padding: '2px 4px' }}
                  >
                    ✕
                  </ConfirmButton>
                </div>
              </div>
            ))}
          </div>
          {(!photos || photos.length === 0) && (
            <p style={{ fontSize: '0.8rem', color: '#7a7a74' }}>Aucune photo dans le portfolio.</p>
          )}
        </div>
      </div>
    </>
  );
}

const subLabel:   React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.4rem' };
const pageTitle:  React.CSSProperties = { fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' };
const card:       React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem' };
const cardTitle:  React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74' };
const formCol:    React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const labelS:     React.CSSProperties = { display: 'block', fontSize: '0.58rem', letterSpacing: '0.14em', color: '#7a7a74', marginBottom: '0.4rem' };
const inputS:     React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E4DC', padding: '0.6rem 0.9rem', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' };
const btnPrimary: React.CSSProperties = { background: '#E8E4DC', color: '#080808', border: 'none', padding: '0.7rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' };
