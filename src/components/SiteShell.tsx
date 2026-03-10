'use client';

import { usePathname } from 'next/navigation';
import Navbar      from '@/components/Navbar';
import BottomBar   from '@/components/BottomBar';
import CartDrawer  from '@/components/CartDrawer';
import { CartProvider } from '@/contexts/CartContext';

export default function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin  = pathname.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <Navbar />
      <main style={{ minHeight: '100vh', paddingTop: 'var(--navbar-h)' }}>
        {children}
      </main>
      <BottomBar />
      <CartDrawer />
    </CartProvider>
  );
}
