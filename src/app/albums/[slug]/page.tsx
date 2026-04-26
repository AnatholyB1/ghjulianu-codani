import type { Metadata }   from 'next';
import { notFound }        from 'next/navigation';
import { cookies }         from 'next/headers';
import { createClient, createServiceClient } from '@/utils/supabase/server';
import AlbumPageClient     from './AlbumPageClient';
import AccessKeyGate       from './AccessKeyGate';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: album } = await supabase
    .from('albums')
    .select('title, description, cover_url, category:categories(name)')
    .eq('slug', slug)
    .single();

  if (!album) return {};

  const title       = `${album.title} — Ghjulianu Codani`;
  const description = album.description ?? `Album photo — ${album.title}`;
  const cover       = album.cover_url ?? '';

  return {
    title,
    description,
    openGraph: { title, description, images: cover ? [{ url: cover, width: 1200, height: 800, alt: album.title }] : [] },
    twitter:   { card: 'summary_large_image', title, description, images: cover ? [cover] : [] },
  };
}

export default async function AlbumPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: album } = await supabase
    .from('albums')
    .select('*, category:categories(*)')
    .eq('slug', slug)
    .single();

  if (!album) notFound();

  // Private album: check cookie
  if (!album.is_public) {
    const cookieStore = await cookies();
    const stored = cookieStore.get(`album-access-${slug}`)?.value;
    if (stored !== album.access_key) {
      return <AccessKeyGate slug={slug} />;
    }
  }

  const { data: photos } = await supabase
    .from('album_photos')
    .select('*')
    .eq('album_id', album.id)
    .order('sort_order')
    .order('created_at', { ascending: true });

  return <AlbumPageClient album={album} photos={photos ?? []} />;
}
