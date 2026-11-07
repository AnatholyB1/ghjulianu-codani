'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────
   ImageProtection — PRT-02 / decision D-06
   ─────────────────────────────────────────────────────────────
   DETERRENT ONLY. Anyone can still save images via DevTools, the
   network tab, a screenshot or the (public) storage URL.

   • Delegated, capture-phase listeners on document (no per-image
     handlers, no interference with DragTrack mouse/touch handlers,
     swipe, zoom, or lightbox click gestures: we only cancel
     `contextmenu` and `dragstart`, never pointer/touch/click).
   • Scope: <img> or any [data-protect] element. Never form fields,
     textarea, contenteditable. Disabled on /admin/**.
   • CSS side (globals.css) is keyed on html[data-img-protect="on"].
───────────────────────────────────────────────────────────── */

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

function isProtectedTarget(e: Event): boolean {
  const target = e.target;
  if (!(target instanceof Element)) return false;
  if (target.closest(EDITABLE)) return false;
  if (target.closest('img, [data-protect]') !== null) return true;

  // Some images use `pointer-events: none` (portfolio grid, album covers) or sit under
  // a hover overlay, so the event target is a wrapper/sibling, not the <img>. Fall back
  // to a geometric hit-test: pointer inside an <img> rect AND the target lives within
  // that image's parent or grandparent (so unrelated UI stacked above, such as a drawer
  // or modal, is never caught).
  if (e instanceof MouseEvent) {
    const { clientX: x, clientY: y } = e;
    for (const img of Array.from(document.images)) {
      const r = img.getBoundingClientRect();
      if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
      const p = img.parentElement;
      if (p && (p.contains(target) || p.parentElement?.contains(target))) return true;
    }
  }
  return false;
}

export default function ImageProtection() {
  const pathname = usePathname();
  const isAdmin = pathname === '/admin' || pathname?.startsWith('/admin/');

  useEffect(() => {
    if (isAdmin) return;
    const root = document.documentElement;
    root.setAttribute('data-img-protect', 'on');

    const block = (e: Event) => {
      if (isProtectedTarget(e)) e.preventDefault();
    };

    document.addEventListener('contextmenu', block, true);
    document.addEventListener('dragstart', block, true);
    return () => {
      root.removeAttribute('data-img-protect');
      document.removeEventListener('contextmenu', block, true);
      document.removeEventListener('dragstart', block, true);
    };
  }, [isAdmin]);

  return null;
}
