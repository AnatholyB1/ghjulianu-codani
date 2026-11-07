'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type CartSource = 'album_photos' | 'portfolio_photos';

export type CartPhoto = {
  /** unique cart key = photoId (real DB id) */
  id:            string;
  /** DB id of the photo row (album_photos.id / portfolio_photos.id) */
  photoId:       string;
  /** DB id of the album, null for portfolio photos */
  albumId:       string | null;
  source:        CartSource;
  src:           string; // display only: the server never trusts it
  width:         number;
  height:        number;
  alt:           string;
  context?:      string; // e.g. album title or 'Portfolio'
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

const STORAGE_KEY = 'photo-cart-v2';
const LEGACY_KEY  = 'photo-cart';
/** Same limit as the server (MAX_PHOTOS_PER_REQUEST in requestGuards): a bigger cart could never be requested. */
export const MAX_CART_PHOTOS = 200;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Keep only well-formed v2 items; anything else (incl. old carts) is dropped silently. */
function sanitize(raw: unknown): CartPhoto[] {
  if (!Array.isArray(raw)) return [];
  const out: CartPhoto[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') continue;
    const p = r as Record<string, unknown>;
    if (typeof p.photoId !== 'string' || !UUID_RE.test(p.photoId)) continue;
    if (p.source !== 'album_photos' && p.source !== 'portfolio_photos') continue;
    if (typeof p.src !== 'string') continue;
    if (out.length >= MAX_CART_PHOTOS) break;
    if (out.some((o) => o.photoId === p.photoId)) continue;
    out.push({
      id: p.photoId,
      photoId: p.photoId,
      albumId: typeof p.albumId === 'string' && UUID_RE.test(p.albumId) ? p.albumId : null,
      source: p.source,
      src: p.src,
      width: Number(p.width) || 1200,
      height: Number(p.height) || 800,
      alt: typeof p.alt === 'string' ? p.alt : '',
      context: typeof p.context === 'string' ? p.context : undefined,
    });
  }
  return out;
}

/** Fire-and-forget select_add analytics. Never blocks the UI, never throws. */
function trackSelectAdd(photoId: string, albumId: string | null) {
  try {
    void fetch('/api/select-add', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ photoId, albumId }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignore */ }
}

const CartContext = createContext<CartCtx | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items,  setItems]  = useState<CartPhoto[]>([]);
  const [open,   setOpen]   = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Hydrate from localStorage once (v1 carts are dropped)
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_KEY);
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot hydration from localStorage
      if (saved) setItems(sanitize(JSON.parse(saved)));
    } catch {}
    setLoaded(true);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch {}
  }, [items, loaded]);

  const add = useCallback((photo: CartPhoto) => {
    if (!UUID_RE.test(photo.photoId)) return;
    const next = { ...photo, id: photo.photoId };
    if (items.some((p) => p.id === next.id)) return;
    if (items.length >= MAX_CART_PHOTOS) {
      const en = typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('en');
      setNotice(en
        ? `Your selection is full (${MAX_CART_PHOTOS} photos maximum). Request these first, then start a new selection.`
        : `Votre sélection est pleine (${MAX_CART_PHOTOS} photos maximum). Demandez celles-ci d'abord, puis recommencez une nouvelle sélection.`);
      return;
    }
    setItems((prev) => prev.some((p) => p.id === next.id) ? prev : [...prev, next]);
    trackSelectAdd(next.photoId, next.albumId);
  }, [items]);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const has = useCallback((id: string) => items.some((p) => p.id === id), [items]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, has, count: items.length, open, setOpen }}>
      {children}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', left: 16, right: 16, bottom: 24, margin: '0 auto', maxWidth: 420, zIndex: 1000,
            padding: '12px 16px', borderRadius: 8, background: '#111', color: '#fff', fontSize: 14, lineHeight: 1.4,
            boxShadow: '0 4px 24px rgba(0,0,0,.35)',
          }}
        >
          {notice}
        </div>
      )}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
