'use client';

import { usePathname } from 'next/navigation';
import Navbar      from '@/components/Navbar';
import BottomBar   from '@/components/BottomBar';
import Footer      from '@/components/Footer';
import CartDrawer  from '@/components/CartDrawer';
import ViewBeacon  from '@/components/ViewBeacon';
import { CartProvider }    from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin   = pathname.startsWith('/admin');

  // Admin, the standalone newsletter pages and the emailed-link delivery page
  // (/telechargement/<token>) have their own chrome and render without the site shell.
  if (isAdmin || pathname.startsWith('/newsletter') || pathname.startsWith('/telechargement/')) {
    return <>{children}</>;
  }

  return (
    <LanguageProvider>
    <CartProvider>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: 'var(--navbar-h)' }}>
        {children}
      </main>
      <Footer />
      <BottomBar />
      <CartDrawer />
      <ViewBeacon />
    </CartProvider>
    </LanguageProvider>
  );
}
