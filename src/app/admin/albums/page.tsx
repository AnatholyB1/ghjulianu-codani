import { createClient } from '@/utils/supabase/server';
import Link              from 'next/link';
import type { Album }    from '@/lib/db.types';
import { deleteAlbum }   from '../actions';
import ConfirmButton     from '../_components/ConfirmButton';

export default async function AdminAlbumsPage() {
  const supabase = await createClient();
  const { data: albums } = await supabase
    .from('albums')
    .select('*, category:categories(name)')
    .order('sort_order', { ascending: false })
    .order('created_at', { ascending: false });

  return (
    <>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <p style={subLabel}>ALBUMS</p>
          <h1 style={pageTitle}>Gérer les albums</h1>
        </div>
        <Link href="/admin/albums/new" style={btnPrimary}>+ NOUVEL ALBUM</Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {albums?.map((album: Album & { category?: { name: string } | null }) => (
          <div key={album.id} style={{ background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            {/* Cover */}
            {album.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={album.cover_url} alt={album.title} style={{ width: '52px', height: '52px', objectFit: 'cover', flexShrink: 0, filter: 'brightness(0.7)' }} />
            )}
            {!album.cover_url && (
              <div style={{ width: '52px', height: '52px', background: '#1a1a1a', flexShrink: 0 }} />
            )}
            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '0.9rem', color: '#E8E4DC', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</p>
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {album.year && <span style={tag}>{album.year}</span>}
                {album.category && <span style={tag}>{album.category.name}</span>}
                <span style={{ ...tag, color: album.is_public ? '#6dbf7a' : '#c8a97e' }}>
                  {album.is_public ? '● PUBLIC' : '🔒 PRIVÉ'}
                </span>
              </div>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <Link href={`/admin/albums/${album.id}`} style={btnEdit}>MODIFIER</Link>
              <ConfirmButton
                formAction={deleteAlbum.bind(null, album.id)}
                message={`Supprimer "${album.title}" ?`}
                style={btnDelete}
              >
                SUPPRIMER
              </ConfirmButton>
            </div>
          </div>
        ))}
        {(!albums || albums.length === 0) && (
          <p style={{ fontSize: '0.8rem', color: '#7a7a74', padding: '2rem 0' }}>Aucun album. <Link href="/admin/albums/new" style={{ color: '#c8a97e' }}>Créer le premier →</Link></p>
        )}
      </div>
    </>
  );
}

const subLabel:   React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.4rem' };
const pageTitle:  React.CSSProperties = { fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' };
const btnPrimary: React.CSSProperties = { background: '#E8E4DC', color: '#080808', border: 'none', padding: '0.6rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };
const btnEdit:    React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#E8E4DC', padding: '0.3rem 0.7rem', fontSize: '0.58rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none' };
const btnDelete:  React.CSSProperties = { background: 'transparent', border: '1px solid rgba(200,80,80,0.3)', color: '#e07070', padding: '0.3rem 0.7rem', fontSize: '0.58rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' };
const tag:        React.CSSProperties = { fontSize: '0.56rem', letterSpacing: '0.1em', color: '#7a7a74' };
