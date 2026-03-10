import { createClient }  from '@/utils/supabase/server';
import Link               from 'next/link';
import type { Album }     from '@/lib/db.types';
import AlbumSortableList  from './_components/AlbumSortableList';

export default async function AdminAlbumsPage() {
  const supabase = await createClient();
  const { data: albums } = await supabase
    .from('albums')
    .select('*, category:categories(id,name,slug,created_at)')
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

      <AlbumSortableList initialAlbums={(albums ?? []) as Album[]} />
    </>
  );
}

const subLabel:   React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.4rem' };
const pageTitle:  React.CSSProperties = { fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' };
const btnPrimary: React.CSSProperties = { background: '#E8E4DC', color: '#080808', border: 'none', padding: '0.6rem 1.2rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' };

