import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: albumCount },
    { count: photoCount },
    { count: catCount },
    { count: portfolioCount },
  ] = await Promise.all([
    supabase.from('albums').select('*', { count: 'exact', head: true }),
    supabase.from('album_photos').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('portfolio_photos').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Albums',               value: albumCount ?? 0,    href: '/admin/albums' },
    { label: 'Photos d\'albums',     value: photoCount ?? 0,    href: '/admin/albums' },
    { label: 'Catégories',           value: catCount ?? 0,      href: '/admin/categories' },
    { label: 'Photos portfolio',     value: portfolioCount ?? 0,href: '/admin/portfolio' },
  ];

  const shortcuts = [
    { label: 'Nouvel album',         href: '/admin/albums/new' },
    { label: 'Gérer le portfolio',   href: '/admin/portfolio' },
    { label: 'Gérer les catégories', href: '/admin/categories' },
  ];

  return (
    <>
      <div style={{ marginBottom: '2.5rem' }}>
        <p style={{ fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.5rem' }}>TABLEAU DE BORD</p>
        <h1 style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' }}>
          Vue d&apos;ensemble
        </h1>
      </div>

      <style>{`.admin-stat-card:hover { background: #141414 !important; }`}</style>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1px', marginBottom: '3rem', border: '1px solid rgba(255,255,255,0.07)' }}>
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="admin-stat-card" style={{ padding: '1.5rem', background: '#0e0e0e', textDecoration: 'none', transition: 'background 0.2s', display: 'block' }}>
            <p style={{ fontFamily: 'var(--font-cormorant,serif)', fontSize: '2.5rem', fontWeight: 300, color: '#E8E4DC', marginBottom: '0.4rem' }}>{s.value}</p>
            <p style={{ fontSize: '0.6rem', letterSpacing: '0.12em', color: '#7a7a74' }}>{s.label.toUpperCase()}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p style={{ fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74', marginBottom: '1rem' }}>ACTIONS RAPIDES</p>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          {shortcuts.map((s) => (
            <Link key={s.href} href={s.href} style={{ fontSize: '0.62rem', letterSpacing: '0.14em', color: '#E8E4DC', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.12)', padding: '0.6rem 1.2rem', transition: 'border-color 0.2s' }}>
              {s.label} →
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
