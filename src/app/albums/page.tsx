import { createClient } from '@/utils/supabase/server';
import AlbumsDragTrack  from './AlbumsDragTrack';

export default async function AlbumsPage() {
  const supabase = await createClient();
  const { data: albums } = await supabase
    .from('albums')
    .select('*, category:categories(*)')
    .order('sort_order', { ascending: false });

  return <AlbumsDragTrack albums={albums ?? []} />;
}
