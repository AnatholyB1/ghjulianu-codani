import type { Metadata } from 'next';
import { albums }         from '@/data/albums';
import AlbumPageClient    from './AlbumPageClient';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const album    = albums.find((a) => a.slug === slug);
  if (!album) return {};

  const title       = `${album.title} \u2014 Ghjulianu Codani`;
  const description = album.description
    ?? `Album photo ${album.category === 'event' ? 'evenement' : 'marque'} \u2014 ${album.title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: album.cover, width: 1200, height: 800, alt: album.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title,
      description,
      images:      [album.cover],
    },
  };
}

export default function AlbumPage({ params }: Props) {
  return <AlbumPageClient params={params} />;
}
