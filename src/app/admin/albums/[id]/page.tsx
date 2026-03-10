import { createClient }                                    from '@/utils/supabase/server';
import { notFound }                                         from 'next/navigation';
import { updateAlbum, deleteAlbum, deleteAlbumPhoto, regenerateAccessKey } from '../../actions';
import type { Category, AlbumPhoto }                        from '@/lib/db.types';
import Link                                                 from 'next/link';
import ConfirmButton                                        from '../../_components/ConfirmButton';
import ImageUploadField                                     from '../../_components/ImageUploadField';
import AddAlbumPhotoForm                                    from '../../_components/AddAlbumPhotoForm';

export default async function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }   = await params;
  const supabase = await createClient();

  const [
    { data: album },
    { data: categories },
    { data: photos },
  ] = await Promise.all([
    supabase.from('albums').select('*, category:categories(name)').eq('id', id).single(),
    supabase.from('categories').select('*').order('name'),
    supabase.from('album_photos').select('*').eq('album_id', id).order('sort_order').order('created_at'),
  ]);

  if (!album) notFound();

  const update       = updateAlbum.bind(null, id);
  const regenKey     = regenerateAccessKey.bind(null, id);
  const del          = deleteAlbum.bind(null, id);

  return (
    <>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={subLabel}><Link href="/admin/albums" style={{ color: '#7a7a74', textDecoration: 'none' }}>ALBUMS</Link> / MODIFIER</p>
          <h1 style={pageTitle}>{album.title}</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href={`/albums/${album.slug}`} target="_blank" style={btnOutline}>VOIR ↗</Link>
          <ConfirmButton formAction={del} message="Supprimer cet album ?" style={btnDelete}>
            SUPPRIMER
          </ConfirmButton>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* ── Edit form ── */}
        <div style={card}>
          <p style={cardTitle}>INFORMATIONS</p>
          <form action={update} style={formCol}>
            <Row label="TITRE *"><input name="title" required defaultValue={album.title} style={inputS} /></Row>
            <Row label="ANNÉE"><input name="year" defaultValue={album.year ?? ''} placeholder="2025" style={inputS} /></Row>
            <Row label="CATÉGORIE">
              <select name="category_id" defaultValue={album.category_id ?? ''} style={inputS}>
                <option value="">— Aucune —</option>
                {categories?.map((c: Category) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Row>
            <Row label="DESCRIPTION">
              <textarea name="description" rows={3} defaultValue={album.description ?? ''} style={{ ...inputS, resize: 'vertical' }} />
            </Row>
            <Row label="MINIATURE (COVER)">
              <ImageUploadField name="cover_url" bucket="album-covers" defaultUrl={album.cover_url ?? undefined} aspectHint="3/4" />
            </Row>
            <Row label="PHOTO DE FOND">
              <ImageUploadField name="background_url" bucket="album-backgrounds" defaultUrl={album.background_url ?? undefined} aspectHint="16/9" />
            </Row>
            <Row label="VISIBILITÉ">
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                <label style={radioLabel}>
                  <input type="radio" name="is_public" value="true" defaultChecked={album.is_public} />
                  <span>PUBLIC</span>
                </label>
                <label style={radioLabel}>
                  <input type="radio" name="is_public" value="false" defaultChecked={!album.is_public} />
                  <span>PRIVÉ</span>
                </label>
              </div>
            </Row>
            <button type="submit" style={btnPrimary}>ENREGISTRER</button>
          </form>

          {/* Access key */}
          {!album.is_public && album.access_key && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#141414', borderLeft: '2px solid #c8a97e' }}>
              <p style={{ fontSize: '0.58rem', letterSpacing: '0.14em', color: '#7a7a74', marginBottom: '0.5rem' }}>CLÉ D&apos;ACCÈS PRIVÉE</p>
              <p style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: '0.2em', color: '#c8a97e', marginBottom: '0.8rem' }}>{album.access_key}</p>
              <form action={regenKey}>
                <button type="submit" style={{ ...btnOutline, fontSize: '0.58rem' }}>REGÉNÉRER LA CLÉ</button>
              </form>
            </div>
          )}
        </div>

        {/* ── Photos ── */}
        <div style={card}>
          <p style={cardTitle}>PHOTOS DE L&apos;ALBUM ({photos?.length ?? 0})</p>

          {/* Add photo form */}
          <AddAlbumPhotoForm albumId={id} />

          {/* Photo grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(90px,1fr))', gap: '4px' }}>
            {photos?.map((photo: AlbumPhoto) => (
              <div key={photo.id} style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: '#1a1a1a' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.src} alt={photo.alt ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                <div style={{ position: 'absolute', top: '3px', right: '3px' }}>
                  <ConfirmButton
                    formAction={deleteAlbumPhoto.bind(null, photo.id, id)}
                    message="Supprimer ?"
                    style={{ background: 'rgba(8,8,8,0.8)', border: 'none', color: '#e07070', width: '20px', height: '20px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </ConfirmButton>
                </div>
              </div>
            ))}
          </div>
          {(!photos || photos.length === 0) && (
            <p style={{ fontSize: '0.72rem', color: '#7a7a74', marginTop: '0.5rem' }}>Aucune photo.</p>
          )}
        </div>
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
const card:       React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem' };
const cardTitle:  React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74', marginBottom: '1.2rem' };
const formCol:    React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem' };
const labelS:     React.CSSProperties = { display: 'block', fontSize: '0.58rem', letterSpacing: '0.14em', color: '#7a7a74', marginBottom: '0.4rem' };
const inputS:     React.CSSProperties = { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#E8E4DC', padding: '0.6rem 0.9rem', fontSize: '0.82rem', fontFamily: 'inherit', outline: 'none' };
const btnPrimary: React.CSSProperties = { background: '#E8E4DC', color: '#080808', border: 'none', padding: '0.7rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const btnOutline: React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#E8E4DC', padding: '0.35rem 0.8rem', fontSize: '0.62rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-block' };
const btnDelete:  React.CSSProperties = { background: 'transparent', border: '1px solid rgba(200,80,80,0.3)', color: '#e07070', padding: '0.35rem 0.8rem', fontSize: '0.62rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' };
const radioLabel: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#E8E4DC', cursor: 'pointer', letterSpacing: '0.1em' };
