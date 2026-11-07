'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/* ─────────────────────────────────────────────────────────────
   ViewBeacon — KPI-03 (phase 10)
   Sends one `view` event per photo and session, only after the photo was
   REALLY displayed: loaded (naturalWidth > 0), >= 50 % in the viewport and
   still there after DWELL_MS. Never fires on page load, prefetch or SSR.

   • Transport: navigator.sendBeacon (fetch keepalive fallback), JSON as
     text/plain so no CORS preflight. No cookie, no identifier generated here.
   • Client dedupe: sessionStorage holds only the ids already sent.
     The server dedupes again (unique index per photo, visitor hash, Paris day).
   • The client sends only the photo's public image URL; the server resolves it
     to a row id and derives everything else (device, country, day/night...).
   • Not mounted on /admin (SiteShell skips it) and does nothing there anyway.
───────────────────────────────────────────────────────────── */

const DWELL_MS = 1000;
const RATIO = 0.5;
const STORAGE_KEY = 'vb-sent-v1';
const ENDPOINT = '/api/track';

function sentSet(): Set<string> {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function remember(set: Set<string>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...set].slice(-500)));
  } catch {
    /* storage unavailable: the server unique index still dedupes */
  }
}

/** Original image URL behind a next/image `/_next/image?url=...` src, or the src itself. */
function originalSrc(img: HTMLImageElement): string | null {
  const raw = img.currentSrc || img.src;
  if (!raw) return null;
  try {
    const u = new URL(raw, window.location.href);
    if (u.pathname === '/_next/image') {
      const inner = u.searchParams.get('url');
      return inner ? new URL(inner, window.location.href).toString() : null;
    }
    return u.toString();
  } catch {
    return null;
  }
}

function send(payload: object) {
  const body = new Blob([JSON.stringify(payload)], { type: 'text/plain;charset=UTF-8' });
  try {
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
  } catch {
    /* fall through */
  }
  void fetch(ENDPOINT, { method: 'POST', body, keepalive: true, credentials: 'omit' }).catch(() => {});
}

export default function ViewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return;

    const sent = sentSet();
    const timers = new Map<HTMLImageElement, number>();
    const seen = new WeakSet<HTMLImageElement>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const img = entry.target as HTMLImageElement;
          const visible = entry.isIntersecting && entry.intersectionRatio >= RATIO;
          const pending = timers.get(img);
          if (!visible) {
            if (pending !== undefined) {
              window.clearTimeout(pending);
              timers.delete(img);
            }
            continue;
          }
          if (pending !== undefined) continue;
          timers.set(
            img,
            window.setTimeout(() => {
              timers.delete(img);
              if (document.visibilityState !== 'visible' || !img.isConnected) return;
              if (!img.complete || img.naturalWidth === 0) return;
              const src = originalSrc(img);
              if (!src || sent.has(src)) return;
              sent.add(src);
              remember(sent);
              send({ type: 'view', src });
            }, DWELL_MS),
          );
        }
      },
      { threshold: [0, RATIO] },
    );

    const watch = (img: HTMLImageElement) => {
      if (seen.has(img)) return;
      // Skip tiny decorative images (icons, logos).
      if (img.closest('[data-no-track]')) return;
      seen.add(img);
      io.observe(img);
    };
    const scan = (root: ParentNode) => root.querySelectorAll('img').forEach(watch);
    scan(document);

    const mo = new MutationObserver((records) => {
      for (const r of records) {
        r.addedNodes.forEach((n) => {
          if (n instanceof HTMLImageElement) watch(n);
          else if (n instanceof Element) scan(n);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Lazy images flip to loaded after observation: re-check on load.
    const onLoad = (e: Event) => {
      if (e.target instanceof HTMLImageElement) {
        io.unobserve(e.target);
        io.observe(e.target);
      }
    };
    document.addEventListener('load', onLoad, true);

    return () => {
      io.disconnect();
      mo.disconnect();
      document.removeEventListener('load', onLoad, true);
      timers.forEach((t) => window.clearTimeout(t));
      timers.clear();
    };
  }, [pathname]);

  return null;
}
