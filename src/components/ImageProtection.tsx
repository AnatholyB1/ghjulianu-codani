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
   • Accessibility / link carve-outs (audit 08a, documented compromise):
       - keyboard-initiated menus (Menu key, Shift+F10) are NEVER cancelled;
         only mouse right-click and touch long-press are.
       - an image that is the sole content of a link (<a href><img></a>, e.g. album
         cover cards) keeps its context menu so "Open link in new tab / Copy link
         address" still works. Consequence: those link-wrapped images are NOT
         shielded from "Save image as" via the mouse menu. Deterrent only (D-06).
       - when the pointer target is a link wrapper above a pointer-events:none image
         the browser menu is the link menu (no image entry): left alone.
   • CSS side (globals.css) is keyed on html[data-img-protect="on"].
───────────────────────────────────────────────────────────── */

const EDITABLE = 'input, textarea, select, [contenteditable=""], [contenteditable="true"]';

/** Menu key / Shift+F10 yield a contextmenu with detail 0 and no pointer (touch long-press reports pointerType 'touch'). */
function isKeyboardContextMenu(e: Event): boolean {
  if (e.type !== 'contextmenu' || !(e instanceof MouseEvent)) return false;
  const pt = (e as PointerEvent).pointerType;
  return e.detail === 0 && pt !== 'touch' && pt !== 'pen' && pt !== 'mouse' && e.button !== 2;
}

/** True when `el` is inside <a href> and the link has no text and exactly one <img>: the image IS the link. */
function isSoleLinkContent(el: Element): boolean {
  const a = el.closest('a[href]');
  if (!a) return false;
  return (a.textContent ?? '').trim() === '' && a.querySelectorAll('img').length <= 1;
}

function isProtectedTarget(e: Event): boolean {
  const target = e.target;
  if (!(target instanceof Element)) return false;
  if (target.closest(EDITABLE)) return false;
  if (e.type === 'contextmenu') {
    if (isKeyboardContextMenu(e)) return false;
    if (isSoleLinkContent(target)) return false;
  }
  if (target.closest('img, [data-protect]') !== null) return true;

  // Some images use `pointer-events: none` (portfolio grid, album covers) or sit under
  // a hover overlay, so the event target is a wrapper/sibling, not the <img>. Fall back
  // to a geometric hit-test: pointer inside an <img> rect AND the target lives within
  // that image's parent or grandparent (so unrelated UI stacked above, such as a drawer
  // or modal, is never caught).
  if (e instanceof MouseEvent && !target.closest('a[href]')) {
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
