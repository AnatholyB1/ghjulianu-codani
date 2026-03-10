import { createClient }             from '@/utils/supabase/server';
import { createCategory, updateCategory, deleteCategory } from '../actions';
import type { Category }            from '@/lib/db.types';
import ConfirmButton                from '../_components/ConfirmButton';

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name');

  return (
    <>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={subLabel}>CATÉGORIES</p>
          <h1 style={pageTitle}>Gérer les catégories</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Form – new */}
        <div style={card}>
          <p style={cardTitle}>NOUVELLE CATÉGORIE</p>
          <form action={createCategory} style={formCol}>
            <div>
              <label style={labelS}>NOM</label>
              <input name="name" required placeholder="ex: Mariage" style={inputS} />
            </div>
            <button type="submit" style={btnPrimary}>CRÉER →</button>
          </form>
        </div>

        {/* List */}
        <div style={card}>
          <p style={cardTitle}>LISTE ({categories?.length ?? 0})</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
            {categories?.map((cat: Category) => (
              <CategoryRow key={cat.id} cat={cat} />
            ))}
            {(!categories || categories.length === 0) && (
              <p style={{ fontSize: '0.75rem', color: '#7a7a74', padding: '1rem 0' }}>Aucune catégorie.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function CategoryRow({ cat }: { cat: Category }) {
  const update = updateCategory.bind(null, cat.id);
  const del    = deleteCategory.bind(null, cat.id);

  return (
    <div style={{ background: '#141414', padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <form action={update} style={{ flex: 1, display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <input name="name" defaultValue={cat.name} required style={{ ...inputS, flex: 1, padding: '0.4rem 0.7rem', fontSize: '0.78rem' }} />
        <button type="submit" style={{ ...btnSmall, borderColor: 'rgba(200,169,126,0.4)', color: '#c8a97e' }}>OK</button>
      </form>
      <span style={{ fontSize: '0.6rem', color: '#7a7a74', fontFamily: 'monospace' }}>{cat.slug}</span>
      <ConfirmButton
        formAction={del}
        message="Supprimer cette catégorie ?"
        style={{ ...btnSmall, borderColor: 'rgba(200,80,80,0.3)', color: '#e07070' }}
      >
        ✕
      </ConfirmButton>
    </div>
  );
}

// ── Shared styles ──────────────────────────────────────────────
const subLabel:    React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.4rem' };
const pageTitle:   React.CSSProperties = { fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' };
const card:        React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem' };
const cardTitle:   React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74', marginBottom: '1.2rem' };
const formCol:     React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const labelS:      React.CSSProperties = { display: 'block', fontSize: '0.58rem', letterSpacing: '0.14em', color: '#7a7a74', marginBottom: '0.4rem' };
const inputS:      React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E4DC', padding: '0.6rem 0.9rem', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' };
const btnPrimary:  React.CSSProperties = { background: '#E8E4DC', color: '#080808', border: 'none', padding: '0.7rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start' };
const btnSmall:    React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#7a7a74', padding: '0.3rem 0.6rem', fontSize: '0.62rem', cursor: 'pointer', fontFamily: 'inherit' };
