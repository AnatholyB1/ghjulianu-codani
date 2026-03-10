'use client';

import { usePathname } from 'next/navigation';
import Navbar      from '@/components/Navbar';
import BottomBar   from '@/components/BottomBar';
import Footer      from '@/components/Footer';
import CartDrawer  from '@/components/CartDrawer';
import { CartProvider }    from '@/contexts/CartContext';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin   = pathname.startsWith('/admin');

  if (isAdmin) {
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
    </CartProvider>
    </LanguageProvider>
  );
}
