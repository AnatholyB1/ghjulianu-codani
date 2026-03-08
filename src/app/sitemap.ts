import type { MetadataRoute } from 'next';
import { albums } from '@/data/albums';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ghjulianucodani.com';
  const now  = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}`,            lastModified: now, changeFrequency: 'monthly',  priority: 1.0 },
    { url: `${base}/portfolio`,  lastModified: now, changeFrequency: 'weekly',   priority: 0.9 },
    { url: `${base}/albums`,     lastModified: now, changeFrequency: 'weekly',   priority: 0.9 },
    { url: `${base}/about`,      lastModified: now, changeFrequency: 'yearly',   priority: 0.6 },
    { url: `${base}/contact`,    lastModified: now, changeFrequency: 'yearly',   priority: 0.7 },
    { url: `${base}/tarifs`,     lastModified: now, changeFrequency: 'monthly',  priority: 0.7 },
    { url: `${base}/don`,        lastModified: now, changeFrequency: 'yearly',   priority: 0.4 },
  ];

  const albumRoutes: MetadataRoute.Sitemap = albums.map((album) => ({
    url:             `${base}/albums/${album.slug}`,
    lastModified:    now,
    changeFrequency: 'monthly',
    priority:        0.8,
  }));

  return [...staticRoutes, ...albumRoutes];
}
