# Phase 8a: UI protection of public images (PRT-02) - Context

Decision D-06 (MILESTONE-v1.1-DECISIONS.md): block context menu / drag / long-press on public images only;
never inputs, never lightbox gestures. **Deterrent only.** Buckets stay public in v1.1 (D-05).

## Scope
- In: `ImageProtection` client component (root layout mount), CSS in `globals.css`, e2e script.
- Out (phase 8b / PRT-01): removal of old download code. Untouched here.
- Out: watermarking, private buckets, right-click on non-image content.

## Findings from the codebase
- Public images: `next/image` (PortfolioGrid, Lightbox, AlbumsDragTrack covers, hero) and raw `<img>` (DragTrack `.bw-img`).
- Several images have `pointer-events: none` (portfolio grid, album covers) or sit under a hover overlay
  (`position:absolute; inset:0` sibling), so `contextmenu` targets the wrapper/overlay, not the `<img>`.
  `closest('img, [data-protect]')` alone is therefore insufficient; a geometric fallback is used.
- Carousels (`DragTrack`, `AlbumsDragTrack`) use `mousedown/touchstart/touchmove` on window/wrapper.
  The protection never touches pointer/touch/click events, only `contextmenu` and `dragstart`.
- PortfolioGrid already had a local `onContextMenu` preventDefault; left as is.
- A first-visit `WelcomeModal` overlays the whole site (localStorage `ghjulianu-portfolio-welcomed`); the e2e pre-sets it.
