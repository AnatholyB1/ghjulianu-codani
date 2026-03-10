'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

const NAV = [
  { label: 'DASHBOARD',   href: '/admin' },
  { label: 'ALBUMS',      href: '/admin/albums' },
  { label: 'PORTFOLIO',   href: '/admin/portfolio' },
  { label: 'CATÉGORIES',  href: '/admin/categories' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const supabase = createClient();

  // Don't show layout on login page
  if (pathname === '/admin/login') return <>{children}</>;

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{
        height:         '56px',
        background:     '#0e0e0e',
        borderBottom:   '1px solid rgba(255,255,255,0.07)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        '0 2rem',
        flexShrink:     0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
          <span style={{ fontFamily: 'var(--font-cormorant,serif)', fontStyle: 'italic', fontSize: '1.1rem', color: '#E8E4DC' }}>
            Admin
          </span>
          <nav style={{ display: 'flex', gap: '0.2rem' }}>
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== '/admin' && pathname.startsWith(n.href));
              return (
                <Link key={n.href} href={n.href} style={{
                  fontSize:      '0.58rem',
                  letterSpacing: '0.14em',
                  color:         active ? '#E8E4DC' : '#7a7a74',
                  textDecoration:'none',
                  padding:       '0.35rem 0.8rem',
                  background:    active ? 'rgba(255,255,255,0.07)' : 'transparent',
                  transition:    'all 0.2s',
                }}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" target="_blank" style={{ fontSize: '0.58rem', letterSpacing: '0.12em', color: '#7a7a74', textDecoration: 'none' }}>
            VOIR LE SITE ↗
          </Link>
          <button onClick={signOut} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', color: '#7a7a74', padding: '0.3rem 0.8rem', fontSize: '0.58rem', letterSpacing: '0.12em', cursor: 'pointer', fontFamily: 'inherit' }}>
            DÉCONNEXION
          </button>
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '2rem', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
