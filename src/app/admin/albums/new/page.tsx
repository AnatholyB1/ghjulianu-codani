import { createClient }    from '@/utils/supabase/server';
import { createAlbum }     from '../../actions';
import type { Category }   from '@/lib/db.types';
import ImageUploadField    from '../../_components/ImageUploadField';

export default async function NewAlbumPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase.from('categories').select('*').order('name');

  return (
    <>
      <div style={{ marginBottom: '2rem' }}>
        <p style={subLabel}>ALBUMS / NOUVEAU</p>
        <h1 style={pageTitle}>Créer un album</h1>
      </div>

      <div style={{ maxWidth: '680px' }}>
        <form action={createAlbum} style={formCol}>
          <Row label="TITRE *">
            <input name="title" required placeholder="Furtive 2025" style={inputS} />
          </Row>
          <Row label="ANNÉE">
            <input name="year" placeholder="2025" style={inputS} />
          </Row>
          <Row label="CATÉGORIE">
            <select name="category_id" style={inputS}>
              <option value="">— Aucune —</option>
              {categories?.map((c: Category) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Row>
          <Row label="DESCRIPTION">
            <textarea name="description" rows={3} placeholder="Description de l'album…" style={{ ...inputS, resize: 'vertical' }} />
          </Row>
          <Row label="MINIATURE (COVER)">
            <ImageUploadField name="cover_url" bucket="album-covers" aspectHint="3/4" />
          </Row>
          <Row label="PHOTO DE FOND">
            <ImageUploadField name="background_url" bucket="album-backgrounds" aspectHint="16/9" />
          </Row>
          <Row label="VISIBILITÉ">
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <label style={radioLabel}>
                <input type="radio" name="is_public" value="true" defaultChecked />
                <span>PUBLIC</span>
              </label>
              <label style={radioLabel}>
                <input type="radio" name="is_public" value="false" />
                <span>PRIVÉ (clé générée auto)</span>
              </label>
            </div>
          </Row>
          <div style={{ paddingTop: '0.5rem', display: 'flex', gap: '0.8rem' }}>
            <button type="submit" style={btnPrimary}>CRÉER L&apos;ALBUM →</button>
          </div>
        </form>
      </div>
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelS}>{label}</label>
      {children}
    </div>
  );
}

const subLabel:   React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.4rem' };
const pageTitle:  React.CSSProperties = { fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' };
const formCol:    React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1.2rem' };
const labelS:     React.CSSProperties = { display: 'block', fontSize: '0.58rem', letterSpacing: '0.14em', color: '#7a7a74', marginBottom: '0.45rem' };
const inputS:     React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E4DC', padding: '0.65rem 0.9rem', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' };
const btnPrimary: React.CSSProperties = { background: '#E8E4DC', color: '#080808', border: 'none', padding: '0.7rem 1.4rem', fontSize: '0.63rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const radioLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#E8E4DC', cursor: 'pointer', letterSpacing: '0.1em' };
