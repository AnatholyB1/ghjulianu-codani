'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type CartPhoto = {
  id:       string; // unique key = src
  src:      string;
  width:    number;
  height:   number;
  alt:      string;
  context?: string; // e.g. album title or 'Portfolio'
};

type CartCtx = {
  items:  CartPhoto[];
  add:    (photo: CartPhoto) => void;
  remove: (id: string) => void;
  clear:  () => void;
  has:    (id: string) => boolean;
  count:  number;
  open:   boolean;
  setOpen:(v: boolean) => void;
};

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items,  setItems]  = useState<CartPhoto[]>([]);
  const [open,   setOpen]   = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Hydrate from localStorage once
  useEffect(() => {
    try {
      const saved = localStorage.getItem('photo-cart');
      if (saved) setItems(JSON.parse(saved));
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem('photo-cart', JSON.stringify(items));
  }, [items, loaded]);

  const add = useCallback((photo: CartPhoto) => {
    setItems((prev) => prev.find((p) => p.id === photo.id) ? prev : [...prev, photo]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((id: string) => items.some((p) => p.id === id), [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has, count: items.length, open, setOpen }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
