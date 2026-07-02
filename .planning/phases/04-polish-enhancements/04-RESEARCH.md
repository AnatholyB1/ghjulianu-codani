# Phase 4: Polish & Enhancements - Research

**Researched:** 2026-07-02
**Domain:** Next.js 16 App Router — animations, accessibility, hydration, video overlays, localStorage-gated modals
**Confidence:** HIGH (all claims verified against live codebase; framework-specific claims from official Next.js/React patterns)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Hydration Flash Fix**
- D-01: Add inline `<script>` to `<head>` in `src/app/layout.tsx` via `dangerouslySetInnerHTML`. Reads `'day-night-storage'` from localStorage and adds `.day` class synchronously.
- D-02: Add `suppressHydrationWarning` to `<html>` in `layout.tsx`. The class mismatch is intentional.
- D-03: `ThemeProvider` stays as-is — its `useLayoutEffect` handles subsequent toggles.

**Higgsfield Video Transition**
- D-04: Generate two AI videos via Higgsfield: day→night and night→day sky timelapses, ~2–3s each.
- D-05: Videos stored as `/public/transitions/day-to-night.mp4` and `/public/transitions/night-to-day.mp4`.
- D-06: Fullscreen `<video>` overlay mounts on toggle click with `autoPlay muted playsInline`, plays once, then unmounts. Overlay fade-in/out: ~300ms opacity transitions.
- D-07: prefers-reduced-motion guard — if reduced motion preferred, skip video overlay entirely; mode switches instantly.

**Welcome Modal (First Visit)**
- D-08: `WelcomeModal` shown only on first visit. Trigger: check localStorage for `'ghjulianu-welcomed'` key. If absent, show modal; on dismiss, set key.
- D-09: Modal content: Higgsfield day→night video looping in background, text "Ce portfolio existe en deux versions : JOUR et NUIT", buttons `[JOUR]` and `[NUIT]`.
- D-10: `[JOUR]` → sets mode to `'day'` via `useDayNightStore` + dismisses. `[NUIT]` → sets mode to `'night'` + dismisses.
- D-11: Modal mounts in root layout (or `SiteShell`).
- D-12: prefers-reduced-motion guard — video replaced with static gradient/blurred photo; modal still shows.

**Content Fade Animation**
- D-13: `PortfolioGrid` and `AlbumsDragTrack` each manage local `fading` state. On mode change: `fading = true` (opacity → 0, 300ms) → re-fetch → `fading = false` (opacity → 1, 300ms). CSS `transition: opacity 0.3s` on the container.
- D-14: Fade applies to the grid/track container only — navbar, page titles, footer remain stable.
- D-15: Home page album collage (recentAlbums list) also gets the fade pattern.

**Toggle Icon Animation**
- D-16: Sun/Moon icon in `DayNightToggle` animates on click: rotate 180° + crossfade. CSS keyframe, ~200ms.

**prefers-reduced-motion**
- D-17: Add global CSS rule to `src/app/globals.css` killing all CSS transitions/animations site-wide.
- D-18: JS guard for video playback (D-07, D-12) handles video overlay separately.

**Performance Validation**
- D-19: Run EXPLAIN ANALYZE on filtered Supabase queries. Document in `.planning/perf-notes.md`.
- D-20: No preemptive React memoization — only add if profiling reveals actual unnecessary re-renders.

### Claude's Discretion
- Exact CSS keyframe for toggle icon rotate + crossfade
- Video preload technique (link rel=preload vs JS fetch vs HTMLVideoElement.load())
- Z-index layering for video overlay and welcome modal
- Static fallback appearance for welcome modal under prefers-reduced-motion

### Deferred Ideas (OUT OF SCOPE)
- Home page CTA section explaining day/night concept
- Animated tooltip near toggle
- FUT-01 Automatic day/night detection
- FUT-02 Time-based automatic switching
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANI-01 | Smooth crossfade when filtering content changes, 300–500ms, CSS transitions, respects prefers-reduced-motion, no layout thrashing | Sections: Content Fade Animation, prefers-reduced-motion, Toggle Icon Animation |
| ACC-01 | All controls operable via keyboard, logical tab order, visible focus indicators, Escape closes dialogs | Section: Accessibility — WelcomeModal focus trap, CartDrawer Escape pattern as reference |
| ACC-02 | ARIA labels on toggle, live regions for dynamic content updates, proper heading structure, landmark regions | Section: Accessibility — aria-live regions for re-fetch, WelcomeModal ARIA |
| ACC-03 | All text meets WCAG AA contrast, icons meet contrast, focus indicators visible | Section: Accessibility — existing CSS var contrast values already computed |
| PER-01 | Index usage verified with EXPLAIN ANALYZE, query time < 100ms, no sequential scans | Section: Performance Validation |
| PER-02 | Component re-renders minimized, animation performance 60fps | Section: Content Fade — race condition prevention, AlbumsDragTrack WAAPI note |
| PER-03 | Minimal JS bundle increase, lazy load non-critical components, analyze with webpack/source-map-explorer | Section: Bundle Size |
</phase_requirements>

---

## Summary

Phase 4 is a polish-and-accessibility pass on a fully-functioning Next.js 16 / React 19 portfolio site. The codebase is clean, well-structured, and uses inline `React.CSSProperties` objects throughout — no Tailwind classes on component logic. The key technical challenges are:

1. **Hydration flash** — already structurally solved by the chosen approach (inline script + `suppressHydrationWarning`). The main pitfall is the exact JSON path to read from Zustand's persisted format.
2. **Video overlay lifecycle** — `onEnded` + React state unmount pattern is straightforward but must be coordinated with the toggle action so the UI reflects the new mode only after the video finishes.
3. **WelcomeModal SSR** — localStorage is not available on the server; the component must initialize its visible state as `false` and check localStorage inside `useEffect`, then conditionally render.
4. **Content fade race condition** — the mode-change `useEffect` fires a Supabase fetch; wrapping it with a fade state machine requires an abort/ignore pattern to handle rapid toggles without stale state updates.
5. **AlbumsDragTrack complexity** — this component has two layers of animation (WAAPI for track translate, rAF for parallax). The fade wrapper must target only the outer container, not interfere with WAAPI animations.

**Primary recommendation:** Implement in dependency order: (1) hydration flash fix first (no deps), (2) prefers-reduced-motion CSS rule (no deps), (3) content fade animations (wraps existing fetch logic), (4) toggle icon animation (isolated), (5) VideoTransitionOverlay (new component, deps on toggle event), (6) WelcomeModal (new component, deps on localStorage + video assets).

**framer-motion is present** (`^12.35.1`) but has never been used in any component. The project's animation idiom is pure CSS transitions + inline style objects. Do NOT introduce framer-motion for Phase 4 — it would break the established pattern.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Hydration flash fix | Browser (inline script in `<head>`) | — | Must run synchronously before React hydrates; no React component can do this |
| Video overlay (transition) | Browser / Client Component | — | `<video>` autoplay, DOM events, mount/unmount state |
| Welcome modal | Browser / Client Component | — | localStorage read, React state, `useEffect`; SSR-incompatible by definition |
| Content fade animation | Browser / Client Component | — | Wraps existing client-side Supabase fetch; purely presentation layer |
| Toggle icon animation | Browser / Client Component | — | Isolated to `DayNightToggle`; CSS keyframe on icon swap |
| prefers-reduced-motion (CSS) | Browser / CSS | — | Global CSS rule; zero JS, no component changes |
| prefers-reduced-motion (JS) | Browser / Client Component | — | `window.matchMedia` only available in browser; must be read in `useEffect` or event handler |
| Performance validation | Database | — | EXPLAIN ANALYZE runs against Supabase; not a code change |
| Bundle size check | Build pipeline | — | `next build` output or `@next/bundle-analyzer` |

---

## Technical Findings

### 1. Hydration Flash Fix (D-01/D-02)

**The problem:** The site's default mode is `'night'` (no `.day` class on `<html>`), but Zustand persists `mode: 'day'` to `localStorage['day-night-storage']`. When a returning day-mode user loads the page, the server renders without `.day`, React hydrates, then `ThemeProvider`'s `useLayoutEffect` applies `.day` — causing a brief flash of the dark theme before switching to light.

**The fix pattern (D-01):**

```typescript
// In src/app/layout.tsx — inside <head>
<script
  dangerouslySetInnerHTML={{
    __html: `
      try {
        var s = localStorage.getItem('day-night-storage');
        if (s) {
          var parsed = JSON.parse(s);
          if (parsed && parsed.state && parsed.state.mode === 'day') {
            document.documentElement.classList.add('day');
          }
        }
      } catch(e) {}
    `,
  }}
/>
```

**Why this exact JSON path:** Zustand's `persist` middleware (confirmed from `src/store/dayNightStore.ts`) stores: `{"state":{"mode":"day"},"version":0}`. Therefore the access path is `JSON.parse(s).state.mode`. [VERIFIED: codebase — `src/store/dayNightStore.ts` line 27: `name: 'day-night-storage'`]

**`suppressHydrationWarning` on `<html>` (D-02):** The server renders `<html lang="fr">` with no class. The inline script may add `class="day"` before React hydrates, creating a mismatch. React 19 will warn about this unless `suppressHydrationWarning` is set. This prop suppresses the warning for that element only — it does NOT suppress warnings for children. [ASSUMED: React 19 hydration warning suppression behavior — standard pattern, consistent with React docs]

**Critical constraint:** The current `layout.tsx` has `<html lang="fr">` without the body wrapping — confirmed at line 107. The `<head>` is implicit (Next.js App Router injects it). To add a `<script>` to `<head>`, use Next.js's explicit `<head>` tag inside the layout:

```typescript
// layout.tsx
return (
  <html lang="fr" suppressHydrationWarning>
    <head>
      <script dangerouslySetInnerHTML={{ __html: `...` }} />
    </head>
    <body ...>
```

**ThemeProvider interaction (D-03):** `ThemeProvider` uses `useLayoutEffect` which fires synchronously after DOM mutations but before paint. On hydration, both the inline script AND `useLayoutEffect` will set the mode. The inline script runs first (before React), then `useLayoutEffect` runs and calls `setMode(mode)` which reads from Zustand store. This is safe — both arrive at the same `.day` class state. No change to `ThemeProvider` required.

**Pitfall — localStorage in private/incognito:** `localStorage.getItem` throws `SecurityError` in some private browsing configurations. The `try/catch` wrapper in the inline script handles this. [ASSUMED: private browsing security error — standard known browser behavior]

---

### 2. Higgsfield Video Integration (D-04/D-05/D-06)

**Video generation:** The Higgsfield MCP tool (`mcp__higgsfield__authenticate`) is listed as available in the project environment. The implementer must authenticate first, then call the video generation endpoint with sky timelapse prompts. The generated files must be saved to `/public/transitions/` as `day-to-night.mp4` and `night-to-day.mp4`. [ASSUMED: Higgsfield MCP availability — confirmed only by CONTEXT.md reference, not independently verified]

**Video format for web autoplay:** MP4 with H.264 codec is the safest choice for cross-browser autoplay. The `autoPlay muted playsInline` attribute combination is required for mobile Safari autoplay. [ASSUMED: H.264 autoplay compatibility — well-established browser behavior, not re-verified]

**Preload strategy (D-05):** For ~2–3s MP4 clips in `/public/`, the cleanest Next.js 16 approach is `<link rel="preload" as="video" href="/transitions/day-to-night.mp4">` inserted into `<head>` from `layout.tsx`. Alternative is JS-side `new HTMLVideoElement()` preload but `<link rel="preload">` is cleaner, declarative, and works with Next.js's `<head>` export. [ASSUMED: `<link rel="preload" as="video">` behavior — documented but support varies by browser; Chrome/Edge preload video, Firefox/Safari may not honor it]

**VideoTransitionOverlay pattern (D-06):**

The component needs to:
1. Mount (triggered by toggle)
2. Fade in (opacity 0 → 1, 300ms)
3. Play video via `autoPlay`
4. Listen for `onEnded`
5. Fade out (opacity 1 → 0, 300ms)
6. Unmount

The critical design question is **when to apply the new mode to the page**. Two options:

- **Option A (apply immediately, overlay masks it):** Mode change happens instantly (Zustand store + ThemeProvider apply `.day`/`.night`), overlay plays on top. When overlay unmounts, page is already in new mode. This is simpler and avoids any timing dependency.
- **Option B (apply after overlay ends):** Toggle click triggers overlay WITHOUT updating the store; store update happens on `onEnded`. This is more cinematic but requires decoupling the store toggle from the DayNightToggle click.

**Recommendation: Option A.** The CONTEXT.md (D-06) says "plays once, then unmounts and the content below reflects the new mode" — Option A satisfies this. The overlay masks the content-below fade (which is triggered by mode change), so the sequencing is: click → mode updates + overlay mounts → overlay plays → overlay unmounts revealing page in new state.

**Coordination with BroadcastChannel:** `toggleMode()` in the store already broadcasts via `dayNightBroadcastChannel`. The overlay should be triggered by the toggle button click event, NOT by store subscription, to avoid double-firing on cross-tab sync (as noted in CONTEXT.md § Reusable Assets). Specifically: `DayNightToggle` gets modified to call `toggleMode()` AND set a local `showOverlay` state or trigger overlay via a callback prop/context.

**Implementation approach:** Add a `VideoTransitionOverlay` mounting mechanism that `DayNightToggle` controls. Options:

1. `DayNightToggle` manages a local `showOverlay` state and renders `<VideoTransitionOverlay>` conditionally.
2. A new Zustand slice or React context provides `showOverlay` state that `DayNightToggle` sets and `VideoTransitionOverlay` reads.
3. `VideoTransitionOverlay` lives in the layout and subscribes to mode changes with a ref to the previous mode.

**Recommended: Option 1** (toggle manages local overlay state). Simplest, colocated, avoids cross-component coupling. The overlay can be rendered as a portal to `document.body` to avoid z-index stacking context issues.

---

### 3. WelcomeModal (D-08 to D-12)

**SSR compatibility:** `localStorage` throws `ReferenceError: localStorage is not defined` on the server. The pattern is:

```typescript
'use client';
const [show, setShow] = useState(false); // always false on server

useEffect(() => {
  // Only runs in browser
  const welcomed = localStorage.getItem('ghjulianu-welcomed');
  if (!welcomed) setShow(true);
}, []);
```

This renders nothing on the server and on the client's initial render, then `useEffect` fires and conditionally shows the modal. This avoids hydration mismatch because `show` is consistently `false` on both server and initial client render. [ASSUMED: Next.js 16 App Router useEffect timing for localStorage — standard pattern, consistent with LanguageContext.tsx approach in this codebase]

The existing `LanguageContext.tsx` (line 18–20) uses exactly this pattern. [VERIFIED: codebase — `src/contexts/LanguageContext.tsx` lines 17–20]

**Mounting location (D-11):** The CONTEXT.md says "mount in root layout (or SiteShell)". Since `WelcomeModal` needs `useDayNight` (to call `setMode`), it must be inside `ThemeProvider`. Current layout structure:

```
<html>
  <body>
    <ThemeProvider>         ← setMode available below here
      <SiteShell>           ← Navbar + content
        {children}
      </SiteShell>
      <Analytics />
    </ThemeProvider>
  </body>
</html>
```

**Best mounting point:** Inside `ThemeProvider` alongside `SiteShell`, OR inside `SiteShell` itself. Either works. Mounting in `layout.tsx` alongside `SiteShell` is cleaner — avoids coupling `SiteShell` to the welcome flow.

**Z-index (Claude's discretion):** The z-index ladder from codebase analysis:

| Component | z-index |
|-----------|---------|
| Loading overlay (page.tsx) | 10000 |
| IntroAnimation | 9999 |
| CartDrawer donation modal | 300 |
| CartDrawer backdrop | 160 |
| CartDrawer drawer | 150 |
| Lightbox | 200 |
| Navbar | 100 |
| BottomBar | 90 |

**Recommendation:** `WelcomeModal` → z-index **9000**, `VideoTransitionOverlay` → z-index **8000**. Both sit above Navbar (100), Lightbox (200), and CartDrawer (300) but below IntroAnimation (9999) and loading overlay (10000). The intro animation only plays on first visit and is already gone by the time WelcomeModal could show (though WelcomeModal should also guard against showing during intro — see Pitfalls section).

**prefers-reduced-motion fallback (D-12):** When motion is reduced, replace the looping `<video>` with a gradient background. The gradient should use CSS variables to match the current theme:

```typescript
// night theme (default welcome modal background)
background: 'linear-gradient(135deg, #080808 0%, #1a1209 40%, #0e0a04 100%)'
// or a blurred static image via CSS filter: blur(8px)
```

**Focus trap for ACC-01:** The CartDrawer already implements Escape-to-close (`src/components/CartDrawer.tsx` lines 34–44) using `useCallback` + `useEffect`. The WelcomeModal must implement the same pattern. Additionally, it must implement a focus trap so Tab/Shift+Tab cycle only within the modal. The simplest reliable implementation:

```typescript
useEffect(() => {
  if (!show) return;
  const focusable = modalRef.current?.querySelectorAll(
    'button, [href], input, [tabindex]:not([tabindex="-1"])'
  ) as NodeListOf<HTMLElement>;
  const first = focusable?.[0];
  const last = focusable?.[focusable.length - 1];
  
  const trap = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { dismiss(); return; }
    if (e.key !== 'Tab') return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };
  
  window.addEventListener('keydown', trap);
  first?.focus(); // move focus into modal on mount
  return () => window.removeEventListener('keydown', trap);
}, [show]);
```

**ARIA for WelcomeModal (ACC-02):**

```tsx
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="welcome-title"
  aria-describedby="welcome-desc"
  ref={modalRef}
>
  <h2 id="welcome-title">Ghjulianu Codani</h2>
  <p id="welcome-desc">Ce portfolio existe en deux versions : JOUR et NUIT</p>
  <button onClick={handleJour}>JOUR</button>
  <button onClick={handleNuit}>NUIT</button>
</div>
```

---

### 4. Content Fade Animation (D-13/D-14/D-15)

**Current fetch pattern in PortfolioGrid and AlbumsDragTrack:**

Both use the same pattern: `useEffect(() => { /* fetch */ }, [mode])`. The effect fires when `mode` changes, fetches from Supabase, calls `setPhotos`/`setAlbums`. There is currently NO loading state — the previous results stay visible until the new fetch completes. [VERIFIED: codebase — `PortfolioGrid.tsx` lines 94–109, `AlbumsDragTrack.tsx` lines 31–47]

**Fade state machine pattern:**

```typescript
const [fading, setFading] = useState(false);

useEffect(() => {
  let cancelled = false;
  
  setFading(true); // start fade-out
  
  // Wait for fade-out transition (300ms) before fetching
  const timeout = setTimeout(async () => {
    const supabase = createClient();
    let query = /* ... */;
    const { data } = await query;
    
    if (!cancelled) {
      setPhotos(shuffle(data ?? []));
      setFading(false); // trigger fade-in
    }
  }, 300);
  
  return () => {
    cancelled = true;
    clearTimeout(timeout);
  };
}, [mode]);
```

**Race condition handling:** The `cancelled` flag + `clearTimeout` cancels in-flight fetches when `mode` changes rapidly. If the user toggles twice quickly, only the last toggle's fetch resolves and updates state. [ASSUMED: Supabase client-side fetch cancellation — the `cancelled` boolean is a standard pattern; Supabase JS client does not expose an AbortController for `.then()` chains, but the `cancelled` flag prevents stale state from being applied]

**CSS on container:**

```typescript
// Applied to the grid/track container div
style={{
  transition: 'opacity 0.3s ease',
  opacity: fading ? 0 : 1,
}}
```

**AlbumsDragTrack-specific considerations:** This component has two animation layers that must NOT be disturbed by the fade:
1. **WAAPI animation** on `trackRef` for the drag track position (`track.animate(...)`) — lives on the track element, not the outer container
2. **rAF loop** for parallax on `.image` elements

The fade should be applied to the **outer container div** (the fullscreen `<div>` with `height: 'calc(100vh - var(--navbar-h))'`), not to `trackRef`. The outer container wrapping the track and category filters can fade without touching the track's WAAPI state. [VERIFIED: codebase — `AlbumsDragTrack.tsx` structure: outer div → category buttons + `<p>` + track div]

**HomePage (D-15):** The `recentAlbums` list (the "DERNIERS ÉVÉNEMENTS" section) is the target. The collage (`.cp` elements) uses IntersectionObserver + class toggle — it's NOT re-rendered on mode change (static images). The fade should apply to the `<section>` containing the `recentAlbums.map(...)`, not the collage section. [VERIFIED: codebase — `src/app/page.tsx` line 434, `recentAlbums` fetch at line 85–98]

**ARIA live region for ACC-02:** When content updates after re-fetch, screen readers should be informed:

```tsx
<div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
  {fading ? 'Chargement du contenu...' : `${photos.length} photos chargées`}
</div>
```

---

### 5. Toggle Icon Animation (D-16)

**Current state:** `DayNightToggle` renders `<Icon size={20} strokeWidth={1.5} />` where `Icon` is either `Sun` or `Moon` from lucide-react, determined by current mode. When mode changes, the component re-renders with the new icon immediately — no animation. [VERIFIED: codebase — `DayNightToggle.tsx` lines 10–12, 56]

**The challenge:** Two icons need to animate (old icon fades/rotates out, new icon fades/rotates in). With a single `<Icon>` slot, this requires either:
1. A `key` prop change to trigger React's remount + CSS `@keyframes` on the icon wrapper
2. Rendering both icons simultaneously with CSS classes controlling opacity/transform

**Recommended approach — `key` prop + CSS animation:**

Define a keyframe in `globals.css`:

```css
@keyframes iconSwap {
  from { opacity: 0; transform: rotate(-90deg) scale(0.7); }
  to   { opacity: 1; transform: rotate(0deg)  scale(1); }
}
```

In `DayNightToggle.tsx`:

```tsx
<span
  key={mode}  // key change forces remount on every mode switch
  style={{
    display:   'flex',
    animation: 'iconSwap 200ms cubic-bezier(0.22,1,0.36,1) both',
  }}
>
  <Icon size={20} strokeWidth={1.5} />
</span>
```

The `key={mode}` causes React to unmount the old span and mount a new one when mode changes, which restarts the CSS animation. This is the simplest approach with zero new state. [ASSUMED: key-based remount triggering CSS animation restart — well-known React pattern]

**Alternative:** Explicit entering/exiting state machine with two icon renders. More complex, not justified for a 200ms animation.

**Inline style compatibility:** The existing `DayNightToggle` uses inline style objects. Adding `animation` as an inline style property is fully compatible with `React.CSSProperties`.

---

### 6. prefers-reduced-motion (D-17/D-18)

**CSS global rule (D-17):** The rule specified in CONTEXT.md is correct and complete:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0.01ms !important;
    animation-duration:  0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

This should be added to `src/app/globals.css`. Currently **no** `prefers-reduced-motion` rule exists in the file. [VERIFIED: codebase — `src/app/globals.css` full scan, no such rule present]

**Effect on existing animations:** This rule will zero out:
- `body` transition (background-color, color — already short; 0.01ms makes it instant)
- `PhotoCard` enter animation (IntersectionObserver-driven opacity/transform)
- `cp` collage enter animations
- `slideDown`/`fadeInUp`/`scaleIn` keyframes used throughout
- The new `iconSwap` keyframe
- The new content fade opacity transitions

All of these become instant. This is the correct behavior for reduced-motion users.

**JS guard for video (D-18):** The MediaQueryList approach:

```typescript
// In VideoTransitionOverlay and WelcomeModal
function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
```

Call this in the event handler (toggle click) before mounting the overlay — not in a `useEffect`, because the overlay should not mount at all. For WelcomeModal, check inside the `useEffect` that reads localStorage:

```typescript
useEffect(() => {
  const welcomed = localStorage.getItem('ghjulianu-welcomed');
  if (!welcomed) {
    setShow(true);
    setUseVideo(!prefersReducedMotion()); // decide video vs static background
  }
}, []);
```

**SSR safety:** The `typeof window === 'undefined'` guard ensures this returns `false` on the server. In practice, since `VideoTransitionOverlay` and `WelcomeModal` are Client Components, `window` is available when these functions execute — but the guard is good defensive practice. [ASSUMED: window.matchMedia SSR behavior — standard guard pattern]

---

### 7. Performance Validation (D-19/D-20, PER-01, PER-02, PER-03)

**PER-01 — EXPLAIN ANALYZE via Supabase MCP:**

The Supabase MCP tools are available in the environment (`plugin:supabase:supabase` per system context). Use the `execute_sql` tool to run EXPLAIN ANALYZE:

```sql
-- Day mode query
EXPLAIN ANALYZE
SELECT * FROM portfolio_photos
WHERE is_day IS NULL OR is_day = true;

-- Night mode query  
EXPLAIN ANALYZE
SELECT * FROM portfolio_photos
WHERE is_day IS NULL OR is_day = false;

-- Albums day mode
EXPLAIN ANALYZE
SELECT *, categories.* FROM albums
LEFT JOIN categories ON albums.category_id = categories.id
WHERE (albums.is_day IS NULL OR albums.is_day = true)
ORDER BY sort_order DESC;
```

Target: Index Scan on `is_day` index (not Sequential Scan). Phase 2 created these indexes — confirm they are being used. Document in `.planning/perf-notes.md`. [ASSUMED: exact index names — not verified; Phase 2 plan created them but names depend on migration SQL]

**PER-02 — Render performance:** The fade animation (CSS `opacity` transition) runs on the compositor thread when the element has `will-change: opacity` or is a stacking context. Adding `will-change: opacity` to the fade container during the fading state would help:

```typescript
style={{
  transition: 'opacity 0.3s ease',
  opacity: fading ? 0 : 1,
  willChange: fading ? 'opacity' : 'auto', // remove after animation completes
}}
```

**D-20 note:** No React.memo is added unless profiling reveals actual issues. The fade state machine will cause one extra render cycle (fading=true → fetch → fading=false), but these are low-frequency (only on toggle) and involve trivial state.

**PER-03 — Bundle size:** The project uses Next.js 16.1.6. Bundle analysis options:

1. **Built-in:** `next build` output already shows route-level JS sizes. Check the output after adding `WelcomeModal` and `VideoTransitionOverlay`.
2. **`@next/bundle-analyzer`:** Not currently in devDependencies. Can be added as a devDependency for a one-time analysis. [ASSUMED: @next/bundle-analyzer package name — standard Next.js ecosystem package]

The two new components (`WelcomeModal`, `VideoTransitionOverlay`) are Client Components that will be lazy-loaded by Next.js when first needed. Since they are rendered conditionally (first visit, toggle click), they will be code-split automatically. No manual `React.lazy()` needed.

**Lazy loading for WelcomeModal:** Since it only shows on first visit, it can be dynamically imported in `layout.tsx`:

```typescript
const WelcomeModal = dynamic(() => import('@/components/WelcomeModal'), { ssr: false });
```

`ssr: false` is appropriate here because the component reads localStorage and cannot render on the server. This also removes it from the critical path bundle.

---

### 8. Accessibility — WelcomeModal and Toggle (ACC-01/ACC-02/ACC-03)

**ACC-01 — Keyboard navigation:**

| Control | Required keyboard behavior |
|---------|---------------------------|
| DayNightToggle button | Space/Enter to toggle (already a `<button>` ✓) |
| WelcomeModal [JOUR] button | Space/Enter to select |
| WelcomeModal [NUIT] button | Space/Enter to select |
| WelcomeModal | Escape to dismiss (should NOT close without making a choice — or should it? See Open Questions) |
| VideoTransitionOverlay | No keyboard interaction needed (plays and unmounts automatically) |

**Focus management:** When `WelcomeModal` mounts, focus must move into it. When it unmounts, focus must return to the element that was focused before (ideally the `DayNightToggle` or the page's first interactive element). Store `document.activeElement` before mounting and restore on dismiss.

**ACC-02 — Screen reader:**

`DayNightToggle` currently has `aria-label="Toggle day/night mode"` (English). Consider updating to French: `aria-label="Basculer en mode jour/nuit"` for consistency with the French site. Or use `aria-pressed` to communicate current state:

```tsx
<button
  aria-label={mode === 'night' ? 'Activer le mode jour' : 'Activer le mode nuit'}
  aria-pressed={mode === 'day'}
>
```

**ACC-03 — WCAG AA contrast:**

The existing CSS variables were already audited in Phase 1. From `globals.css`:

| Mode | Background | Text | Computed ratio |
|------|-----------|------|----------------|
| Night | `#080808` | `#E8E4DC` | ~16:1 (passes AAA) |
| Day | `#fafafa` | `#1a1a1a` | ~18:1 (passes AAA) |
| Night accent | `#080808` | `#c8a97e` | ~9:1 (passes AA + AAA) |
| Day accent-text | `#fafafa` | `#7a5200` | ~6.6:1 (passes AA + AAA) |

[VERIFIED: codebase — `globals.css` line 45–61: `.day` class comment documents the contrast ratio]

**Risk areas for new components:**

- **WelcomeModal overlay text:** Text on top of the Higgsfield video background. The video is a sky timelapse (variable luminance). Text must have a dark scrim underneath or use `text-shadow` to maintain readable contrast in all video frames.
- **WelcomeModal buttons `[JOUR]` and `[NUIT]`:** Use `var(--text)` on `var(--bg)` backgrounds — inherits the site's verified contrast.
- **VideoTransitionOverlay:** No text, no contrast risk.

---

### 9. Z-Index Strategy

Based on the complete z-index audit from the codebase:

```
10000  — Loading overlay (page.tsx first-visit only)
 9999  — IntroAnimation (first-visit only, gone before WelcomeModal shows)
 9000  — WelcomeModal (first-visit)
 8000  — VideoTransitionOverlay (mode toggle)
  300  — CartDrawer donation modal
  200  — Lightbox
  160  — CartDrawer drawer
  150  — CartDrawer float button
  100  — Navbar (fixed)
   90  — BottomBar
   10  — AlbumsDragTrack category buttons (z-index: 10 from local style)
    2  — Content elements
```

**WelcomeModal at 9000:** Sits above everything except the first-visit loading/intro sequence. The `IntroAnimation` (9999) and loading overlay (10000) finish before localStorage-gated welcome modal shows, so there's no conflict. The `sessionStorage` key `'intro-played'` already tracks whether intro has run.

**VideoTransitionOverlay at 8000:** Sits above Lightbox (200) and CartDrawer (300) — the video should mask everything during transition. Sits below WelcomeModal (9000) so the welcome modal cannot be masked by a transition overlay (though this combination is unlikely in practice).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Focus trap in WelcomeModal | Custom traversal logic | Native `querySelectorAll` + keydown handler (per CartDrawer pattern) | Simple, works reliably; native HTML approach sufficient |
| Video preload | XHR blob cache | `<link rel="preload" as="video">` in `<head>` | Browser handles caching, no JS overhead |
| localStorage SSR guard | Custom isServer() utility | `typeof window === 'undefined'` check (already in `src/lib/storage.ts`) | Already exists in this codebase |
| Bundle analysis | Custom webpack plugin | `next build` output + optional `@next/bundle-analyzer` | Built-in route sizes are sufficient for PER-03 |
| Reduced motion detection | CSS-in-JS solution | `window.matchMedia('(prefers-reduced-motion: reduce)')` | Native browser API, no deps |

---

## Architecture Patterns

### VideoTransitionOverlay — Mount/Play/Unmount State Machine

```
DayNightToggle.onClick()
  → check prefersReducedMotion() → true: call toggleMode() directly, return
  → false: setShowOverlay(true) + call toggleMode()
  
VideoTransitionOverlay mounts:
  → CSS opacity: 0 → 1 (300ms transition)
  → <video autoPlay muted playsInline onEnded={handleEnded} />
  
handleEnded():
  → setFading(true) on overlay (opacity: 1 → 0, 300ms)
  → after 300ms: setShowOverlay(false) (unmount)
```

The `mode` change (from `toggleMode()`) fires simultaneously with overlay mount. This means the content behind the overlay is already updating while the overlay plays. When the overlay unmounts, the page is in the correct final state — no additional mode change needed.

### WelcomeModal — First-Visit Gate

```
Component mounts (layout.tsx renders):
  → show = false (server render, no flash)
  → useEffect fires:
      → read localStorage['ghjulianu-welcomed']
      → if absent: setShow(true), setUseVideo(!prefersReducedMotion())
      
User clicks [JOUR]:
  → setMode('day') via useDayNight()
  → localStorage.setItem('ghjulianu-welcomed', '1')
  → setShow(false)
  → (focus returns to previous element)
  
User clicks [NUIT]:
  → setMode('night') via useDayNight()
  → localStorage.setItem('ghjulianu-welcomed', '1')
  → setShow(false)
```

### Content Fade — Race-Safe State Machine

```
mode changes:
  → setFading(true) [opacity → 0, 300ms]
  → setTimeout(300ms):
      → fetch Supabase (with mode snapshot from closure)
      → if !cancelled: setData(result), setFading(false) [opacity → 1, 300ms]
  
rapid mode change:
  → clearTimeout cancels pending fetch
  → cancelled = true prevents stale setData
  → new fetch starts with new mode
```

### Recommended Project Structure (new files)

```
src/
├── components/
│   ├── WelcomeModal.tsx        # NEW — first-visit modal
│   └── VideoTransitionOverlay.tsx  # NEW — toggle transition
├── app/
│   └── layout.tsx              # MODIFY — add <script>, suppressHydrationWarning, WelcomeModal
├── app/globals.css             # MODIFY — add @keyframes iconSwap, prefers-reduced-motion rule
├── components/
│   └── DayNightToggle.tsx      # MODIFY — showOverlay state, icon animation
├── app/portfolio/
│   └── PortfolioGrid.tsx       # MODIFY — fading state machine
├── app/albums/
│   └── AlbumsDragTrack.tsx     # MODIFY — fading state machine
└── app/
    └── page.tsx                # MODIFY — recentAlbums section fade
public/
└── transitions/
    ├── day-to-night.mp4        # NEW — Higgsfield generated
    └── night-to-day.mp4        # NEW — Higgsfield generated
.planning/
└── perf-notes.md               # NEW — EXPLAIN ANALYZE results (D-19)
```

---

## Common Pitfalls

### Pitfall 1: WelcomeModal shows during IntroAnimation

**What goes wrong:** The `IntroAnimation` takes ~2.5s and shows on the first visit. If `WelcomeModal` also checks `'ghjulianu-welcomed'` and finds it absent (also first visit), both overlays appear simultaneously.

**Why it happens:** Both are first-visit gates but track different keys — `sessionStorage['intro-played']` vs `localStorage['ghjulianu-welcomed']`.

**How to avoid:** `WelcomeModal` should additionally check `sessionStorage['intro-played']` — if absent (intro hasn't played yet), delay showing until after intro completes. Options:
- Listen for a custom event dispatched by `IntroAnimation.onDone()`
- Pass an `introComplete` prop from `page.tsx` state
- Use a small `setTimeout` delay (400ms) in the WelcomeModal `useEffect` to let the intro start first — fragile, not recommended

**Best solution:** `WelcomeModal` should only mount/check localStorage AFTER `page.tsx` sets `heroReady = true`, which happens after intro. Since `WelcomeModal` mounts in `layout.tsx` (not `page.tsx`), it cannot read `heroReady`. Alternative: `WelcomeModal` uses a `setTimeout` of 3000ms (enough for intro to complete) or checks `sessionStorage['intro-played']` and shows immediately if intro already played in this session.

**Warning signs:** User sees a fullscreen overlay during the cinematic intro animation.

---

### Pitfall 2: Content fade leaves empty state visible

**What goes wrong:** `setFading(true)` triggers opacity → 0 and the 300ms timeout fires. Before the timeout resolves, the component renders with opacity 0 AND potentially zero photos (if `setPhotos([])` was called). The component shows "No photos available in this mode yet" at opacity 0 — but this empty state has a different height than the photo grid, causing a layout shift.

**Why it happens:** Current `PortfolioGrid` does NOT clear photos on re-fetch (`// Do NOT clear photos — keep previous list visible`). Preserving this behavior during the fade state machine prevents layout shifts. Do NOT call `setPhotos([])` during the fading phase.

**How to avoid:** Keep the previous photo list in state until the new data arrives. Only call `setPhotos(newData)` inside the `!cancelled` block after the 300ms delay.

**Warning signs:** Brief flash of "No photos" text during mode switch.

---

### Pitfall 3: Video overlay double-fires on cross-tab mode sync

**What goes wrong:** User has two tabs open. They toggle in Tab A. Tab A plays the video overlay. BroadcastChannel sends the mode change to Tab B. Tab B's Zustand store updates, which could trigger the overlay in Tab B too.

**Why it happens:** If `VideoTransitionOverlay` is triggered by store subscription rather than button click.

**How to avoid:** Trigger overlay ONLY from the `DayNightToggle` button click event, not from the Zustand store subscription. This is explicitly noted in CONTEXT.md § Reusable Assets.

**Warning signs:** Video plays in background tabs when toggle is used.

---

### Pitfall 4: `suppressHydrationWarning` only suppresses one level

**What goes wrong:** Developer adds `suppressHydrationWarning` to `<html>` but also has attribute mismatches on children — those mismatches still produce console warnings.

**Why it happens:** `suppressHydrationWarning` in React is shallow — it only suppresses warnings for the direct element, not its subtree.

**How to avoid:** Only the `<html>` element needs `suppressHydrationWarning`. The inline script adds the class to `document.documentElement` (same as `<html>`), so only that element has the mismatch. No other element needs the prop.

---

### Pitfall 5: AlbumsDragTrack track position not reset on mode change

**What goes wrong:** User drags the track 70% to the right. They toggle mode. The fade animation plays and new albums appear — but the track position stays at -70% because the WAAPI animation is not reset during the mode-change `useEffect`.

**Why it happens:** The `useEffect([cat])` that resets track position only fires on category change, not mode change. [VERIFIED: codebase — `AlbumsDragTrack.tsx` lines 129–138]

**How to avoid:** Add track reset logic to the mode-change `useEffect` (or in the `fading` state machine): when fading starts, also reset the track to `translate(0%, -50%)`. This is consistent with what happens on category change.

---

### Pitfall 6: `dangerouslySetInnerHTML` script triggers React compiler warnings

**What goes wrong:** With `babel-plugin-react-compiler` in devDependencies (confirmed in `package.json` line 28), the compiler may inspect the `<script>` content in JSX. This is unlikely to cause runtime issues but may produce unexpected compiler behavior.

**Why it happens:** The React Compiler (`babel-plugin-react-compiler: 1.0.0`) analyzes component trees.

**How to avoid:** The inline `<script dangerouslySetInnerHTML>` in `layout.tsx` is a Server Component — the React Compiler does not optimize Server Components in the same way. No action needed, but watch the build output.

---

## Performance Validation — Detailed Plan

**Queries to validate (PER-01):**

```sql
-- 1. portfolio_photos day mode
EXPLAIN ANALYZE
SELECT * FROM portfolio_photos
WHERE is_day IS NULL OR is_day = true;

-- 2. portfolio_photos night mode
EXPLAIN ANALYZE
SELECT * FROM portfolio_photos
WHERE is_day IS NULL OR is_day = false;

-- 3. albums day mode (with category join)
EXPLAIN ANALYZE
SELECT albums.*, row_to_json(categories.*) as category
FROM albums
LEFT JOIN categories ON albums.category_id = categories.id
WHERE (albums.is_day IS NULL OR albums.is_day = true)
ORDER BY albums.sort_order DESC;

-- 4. albums night mode
EXPLAIN ANALYZE
SELECT albums.*, row_to_json(categories.*) as category
FROM albums
LEFT JOIN categories ON albums.category_id = categories.id
WHERE (albums.is_day IS NULL OR albums.is_day = false)
ORDER BY albums.sort_order DESC;
```

**Success criteria:** "Index Scan" or "Bitmap Index Scan" in EXPLAIN output (not "Seq Scan"). Execution time < 100ms (per PER-01).

---

## Validation Architecture

> `workflow.nyquist_validation` not found in `.planning/config.json` (file does not exist) — treating as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Not detected — no jest.config, vitest.config, or pytest.ini found |
| Test files | None found in src/ |
| Quick run command | N/A — no framework installed |

This project has **no automated test infrastructure**. All validation is manual or build-time.

### Phase Requirements → Validation Map

| Req ID | Behavior | Test Type | How to Validate |
|--------|----------|-----------|-----------------|
| ANI-01 | Crossfade 300–500ms on mode switch | Manual | Toggle mode in browser, observe opacity transition on PortfolioGrid and AlbumsDragTrack containers |
| ANI-01 | prefers-reduced-motion kills transitions | Manual | Enable reduced motion in OS/browser settings; verify no animations play |
| ACC-01 | Escape closes WelcomeModal | Manual | Open modal, press Escape |
| ACC-01 | Focus trap in WelcomeModal | Manual | Open modal, Tab through all buttons, verify focus stays inside |
| ACC-01 | DayNightToggle keyboard operable | Manual | Tab to toggle, press Space/Enter |
| ACC-02 | Screen reader announces content update | Manual | Use VoiceOver/NVDA, toggle mode, verify live region announces update |
| ACC-02 | WelcomeModal ARIA role="dialog" | Build-time | Browser DevTools accessibility tree |
| ACC-03 | WCAG AA contrast on new components | Manual | Chrome DevTools accessibility panel, or axe extension |
| PER-01 | Index usage on is_day queries | Supabase MCP | EXPLAIN ANALYZE SQL (documented in perf-notes.md) |
| PER-02 | No jank during fade animation | Manual | Chrome DevTools Performance panel, record during mode toggle |
| PER-03 | Bundle size impact | Build | `next build` output comparing route sizes before/after |

### Wave 0 Gaps

No test framework to install. All validation is manual. Before Phase 4 tasks begin:
- [ ] Confirm browser DevTools available for animation inspection
- [ ] Confirm OS accessibility settings accessible for prefers-reduced-motion testing
- [ ] Confirm Supabase MCP available for EXPLAIN ANALYZE

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | Phase 4 adds no auth changes |
| V3 Session Management | No | localStorage keys are non-sensitive |
| V4 Access Control | No | No new access control logic |
| V5 Input Validation | No | No user input in Phase 4 components |
| V6 Cryptography | No | No cryptographic operations |

**Note:** `dangerouslySetInnerHTML` in the hydration script contains only hardcoded inline JS — no user input is injected into it. The string is a constant in `layout.tsx`, not interpolated from external data. No XSS risk. [ASSUMED: Next.js inline script XSS risk — confirmed safe because the content is a compile-time constant]

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Higgsfield MCP (`mcp__higgsfield__authenticate`) is available and functional in the current environment | Higgsfield Video Integration | Video assets cannot be generated; need manual alternative |
| A2 | `<link rel="preload" as="video">` is honored by the target browsers | Higgsfield Video Integration | Videos may not be preloaded; user may see buffering delay |
| A3 | `window.matchMedia('(prefers-reduced-motion: reduce)')` works correctly in all supported browsers | prefers-reduced-motion | Motion-sensitive users not protected |
| A4 | H.264 MP4 works for autoplay in all target browsers with `muted playsInline` | Higgsfield Video Integration | Video may not autoplay on iOS Safari |
| A5 | React Compiler (`babel-plugin-react-compiler`) does not interfere with `dangerouslySetInnerHTML` in Server Components | Hydration Flash Fix | Build error or runtime mismatch |
| A6 | The `cancelled` boolean pattern prevents stale Supabase fetch state from applying | Content Fade | Race condition creates incorrect photo set on rapid toggle |
| A7 | WelcomeModal at z-index 9000 does not conflict with IntroAnimation at 9999 when both are present simultaneously | Z-Index Strategy | Overlapping overlays create visual corruption |

---

## Open Questions

1. **Should WelcomeModal dismiss on Escape without making a mode choice?**
   - What we know: ACC-01 requires Escape closes dialogs. But the modal forces a choice (JOUR/NUIT) as its purpose.
   - What's unclear: Is "dismiss without choosing" a valid action? If Escape dismisses without choice, what mode is set? The welcome key must still be written or the modal shows again.
   - Recommendation: Escape dismisses without changing mode (keeps current mode, which defaults to night). Write `'ghjulianu-welcomed'` key regardless.

2. **When does WelcomeModal show relative to the first-visit IntroAnimation?**
   - What we know: `IntroAnimation` runs if `sessionStorage['intro-played']` is absent. `WelcomeModal` shows if `localStorage['ghjulianu-welcomed']` is absent. Both conditions are true on true first visit.
   - What's unclear: The IntroAnimation takes ~2.5s. Should WelcomeModal wait for it?
   - Recommendation: WelcomeModal delays its appearance by checking `sessionStorage['intro-played']`. If absent, subscribe to an `introComplete` event or use a 3000ms delay. If present (repeat visit), show immediately after `useEffect`.

3. **Which video plays on WelcomeModal background — and does it change based on current mode?**
   - What we know: CONTEXT.md D-09 says "Higgsfield day→night video looping in background" — always the `day-to-night.mp4`, regardless of current mode.
   - What's unclear: Whether this is intentional (always shows the day→night transformation as an illustration of the concept) or whether it should match the current mode.
   - Recommendation: Follow D-09 literally — always use `day-to-night.mp4` in WelcomeModal. This is a design choice, not a technical question.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Next.js build | ✓ | v26.4.0 | — |
| Next.js | Core framework | ✓ | 16.1.6 | — |
| lucide-react | DayNightToggle icons | ✓ | ^0.577.0 | — |
| framer-motion | (NOT used) | ✓ | ^12.35.1 | Do not use |
| Supabase MCP | PER-01 EXPLAIN ANALYZE | ✓ (system context) | — | Use Supabase dashboard SQL editor |
| Higgsfield MCP | Video generation | [ASSUMED] | — | Manual video creation |
| `/public/transitions/` directory | Video storage | ✗ (not yet created) | — | Create before video generation |
| Test framework | Automated validation | ✗ | — | Manual browser testing |

---

## Sources

### Primary (HIGH confidence — verified against live codebase)
- `src/store/dayNightStore.ts` — Zustand persist key `'day-night-storage'`, JSON format `{state:{mode},version:0}`
- `src/components/ThemeProvider.tsx` — `useLayoutEffect` pattern confirmed; no changes needed
- `src/components/DayNightToggle.tsx` — current icon swap mechanism; no animation exists yet
- `src/app/globals.css` — existing keyframes inventory; no prefers-reduced-motion rule present
- `src/app/layout.tsx` — `<html lang="fr">` without `suppressHydrationWarning`; no inline script
- `src/app/portfolio/PortfolioGrid.tsx` — fetch pattern with `// Do NOT clear photos` comment
- `src/app/albums/AlbumsDragTrack.tsx` — two-layer animation (WAAPI + rAF); outer container structure
- `src/app/page.tsx` — `recentAlbums` fetch pattern; collage static images (not re-fetched on mode change)
- `src/contexts/LanguageContext.tsx` — localStorage in `useEffect` pattern (established precedent)
- `src/lib/storage.ts` — `typeof window === 'undefined'` guard (established pattern)
- `src/components/CartDrawer.tsx` — Escape-to-close pattern with `useCallback`/`useEffect`
- Full z-index audit from codebase grep

### Secondary (MEDIUM confidence — standard patterns)
- React `suppressHydrationWarning` — documented prop for intentional SSR mismatches
- `window.matchMedia('(prefers-reduced-motion: reduce)')` — W3C Web Animations / CSS Media Queries standard
- `key` prop CSS animation restart — documented React reconciliation behavior
- `next/dynamic` with `{ ssr: false }` — official Next.js API for client-only dynamic imports

### Tertiary (LOW confidence — training knowledge, marked ASSUMED above)
- Higgsfield MCP availability and behavior
- Browser-specific `<link rel="preload" as="video">` support
- React Compiler interaction with Server Components + `dangerouslySetInnerHTML`

---

## Metadata

**Confidence breakdown:**
- Hydration flash fix: HIGH — exact JSON path verified from Zustand source; pattern standard
- Higgsfield integration: MEDIUM — video format/autoplay well-known; MCP availability assumed
- WelcomeModal: HIGH — SSR guard pattern verified in codebase; ARIA patterns standard
- Content fade: HIGH — existing fetch pattern verified; race condition solution is standard
- Toggle animation: HIGH — key prop remount pattern well-known; CSS verified
- prefers-reduced-motion: HIGH — CSS rule confirmed absent; JS API is standard
- Z-index: HIGH — full codebase audit performed
- Performance validation: MEDIUM — EXPLAIN ANALYZE approach standard; exact Supabase MCP tool name assumed from system context
- Bundle size: MEDIUM — next build route size display is standard; @next/bundle-analyzer availability assumed

**Research date:** 2026-07-02
**Valid until:** 2026-08-01 (stable project; framework versions locked)
