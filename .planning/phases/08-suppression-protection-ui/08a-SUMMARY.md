# Phase 8a Summary: image UI protection (PRT-02)

## What is protected
`src/components/ImageProtection.tsx` (mounted once in `src/app/layout.tsx`, additive):
- `contextmenu` on an `<img>`, on any `[data-protect]` element, or on a wrapper/overlay positioned over an image
  (pointer inside the image rect AND target within the image's parent/grandparent) -> `preventDefault()`.
  Covers desktop right-click and Android long-press (which fires `contextmenu`).
- `dragstart` on images / `[data-protect]` -> `preventDefault()`.
- Capture-phase delegated listeners on `document`; no per-image handlers.
- CSS (`globals.css`, active only under `html[data-img-protect="on"]`): `-webkit-touch-callout:none`
  (iOS long-press save sheet), `user-select:none`, `-webkit-user-drag:none` on `img, [data-protect]`.
  No `pointer-events:none` is applied, so taps/clicks/lightbox/carousels are untouched.
- Disabled on `/admin` and `/admin/**` (attribute not set, no listeners).
- Never applied when the target is inside `input, textarea, select, [contenteditable]`.

## Not changed
Touch/mouse/pointer/click/wheel events (DragTrack, AlbumsDragTrack, swipe, zoom, lightbox). No download code removed (8b).

## Honest limits: this is a DETERRENT ONLY
It does not prevent saving images: DevTools, "view source"/network tab, direct storage URLs (buckets are public, D-05),
screenshots, screen recording, browser "Save page", disabling JS, or iOS Safari paths that bypass web content
(e.g. Share sheet from a reader view, Live Text). It only removes the casual one-click paths.

## Verification (real, Playwright 1.65 on Chromium against `next build && next start -p 3104`)
`node scripts/e2e-image-protection.mjs` -> **52/52 passed** (desktop 1440x900, iPhone 14 and Pixel 7 descriptors with touch):
contextmenu + dragstart prevented on portfolio images; real mouse right-click prevented; album cover (pointer-events:none)
contextmenu prevented; lightbox opens, next works, contextmenu in lightbox prevented; /albums carousel drag still moves
the track (mouse and CDP touch); inputs/textarea contextmenu NOT prevented; paste (Ctrl+V) / typing works; /admin has no
protection; no page errors; CSS rule shipped. The script needs Playwright via `PLAYWRIGHT_DIR` (not a repo dependency),
uses live Supabase data, no fixtures. Mid-run failures found and fixed: overlay/pointer-events:none targets (geometric fallback),
`-webkit-touch-callout` dropped from the CSSOM by Chromium (checked in shipped CSS text instead).

## NOT proven
- Real iOS Safari long-press (callout, "Save to Photos", Live Text, 3D-touch preview): Chromium emulation has no WebKit
  callout; only the CSS rule's presence is checked, not its effect.
- Real Android Chrome long-press "Download image" menu: emulated `contextmenu` dispatch only.
- Native browser context menu rendering (headless cannot show it): paste is verified through Ctrl+V, and
  `contextmenu` not being prevented on inputs, not through the OS menu itself.
- Firefox/WebKit engines were not run.
