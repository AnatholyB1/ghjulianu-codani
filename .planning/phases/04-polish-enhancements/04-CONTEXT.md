# Phase 4: Polish & Enhancements - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish the day/night experience with cinematic transitions, a first-visit welcome modal, accessibility hardening, and performance validation. This phase delivers:

1. **Hydration flash fix** — no dark→light flash for day-mode users on page load
2. **Higgsfield video transition** — two AI-generated sky timelapse clips (day→night, night→day) that play as a fullscreen overlay when the toggle is clicked
3. **Welcome modal** — full-screen first-visit experience with the Higgsfield video looping, concept copy, and [JOUR]/[NUIT] mode selection buttons
4. **Content fade animation** — PortfolioGrid and AlbumsDragTrack fade out → re-fetch → fade in on mode switch (grids only, not the whole page)
5. **Toggle icon animation** — Sun/Moon icon rotates 180° + crossfades on click (~200ms)
6. **prefers-reduced-motion** — global CSS kill-switch + JS guard that skips the video overlay
7. **Performance validation** — EXPLAIN ANALYZE on Supabase queries + bundle size check, documented in commit

Does NOT include: new photo/album tagging UI (Phase 3), automatic day/night detection (deferred FUT-01), time-based switching (FUT-02), social sharing, or any new filterable categories.

</domain>

<decisions>
## Implementation Decisions

### Hydration Flash Fix
- **D-01:** Add an inline `<script>` tag to the `<head>` in `src/app/layout.tsx` (via `dangerouslySetInnerHTML`). The script reads `'day-night-storage'` from localStorage and adds the `.day` class to `document.documentElement` synchronously before React hydrates.
- **D-02:** Add `suppressHydrationWarning` to the `<html>` element in `layout.tsx`. The class mismatch between server-rendered HTML (no class) and client (`.day` possibly added by inline script) is intentional.
- **D-03:** `ThemeProvider` stays as-is — its `useLayoutEffect` continues to handle dynamic changes (subsequent toggles during the session).

### Higgsfield Video Transition
- **D-04:** Generate two AI videos via Higgsfield: a **day→night sky timelapse** and a **night→day sky timelapse**. Photorealistic sky, ~2–3s each.
- **D-05:** Videos stored in `/public/transitions/` as `day-to-night.mp4` and `night-to-day.mp4`. Preloaded on component mount (e.g. via `<link rel="preload">` or `new Audio()`/`fetch` preload pattern for video).
- **D-06:** On toggle click: a fullscreen `<video>` overlay mounts with `autoPlay muted playsInline`, plays once, then unmounts and the content below reflects the new mode. Fade-in/out of the overlay itself: ~300ms opacity transitions on mount/unmount.
- **D-07:** prefers-reduced-motion guard: if `window.matchMedia('(prefers-reduced-motion: reduce)').matches` → skip video overlay entirely, mode switches instantly (CSS var transition only).

### Welcome Modal (First Visit)
- **D-08:** Full-screen overlay component (`WelcomeModal`) shown only on first visit. Trigger: check localStorage for a `'ghjulianu-welcomed'` key. If absent, show modal. On dismiss, set key.
- **D-09:** Modal content: Higgsfield **day→night** video looping in background (`loop muted autoPlay playsInline`), overlaid with text "Ce portfolio existe en deux versions : JOUR et NUIT" (large, editorial typography matching site style), and two buttons: `[JOUR]` and `[NUIT]`.
- **D-10:** Clicking `[JOUR]` → sets mode to `'day'` via `useDayNightStore` + dismisses modal. Clicking `[NUIT]` → sets mode to `'night'` + dismisses modal.
- **D-11:** Modal mounts in the root layout (or `SiteShell`) so it appears on first page load regardless of route.
- **D-12:** prefers-reduced-motion guard also applies to the modal video: if reduced motion is preferred, the video is replaced with a static background (gradient or blurred photo) — modal still shows.

### Content Fade Animation
- **D-13:** `PortfolioGrid` and `AlbumsDragTrack` each manage a local `fading` state. On mode change: set `fading = true` (opacity → 0 over 300ms), then re-fetch from Supabase, then set `fading = false` (opacity → 1 over 300ms). CSS `transition: opacity 0.3s` on the container.
- **D-14:** Fade applies to the grid/track container only — navbar, page titles, footer remain stable.
- **D-15:** Home page album collage (Phase 2 D-03) also gets the same fade pattern.

### Toggle Icon Animation
- **D-16:** The Sun/Moon icon in `DayNightToggle` animates on click: rotate 180° + fade out current icon, then new icon fades in rotated-back to 0°. CSS keyframe, ~200ms. Implemented via a `key` prop change or explicit CSS animation class toggle.

### prefers-reduced-motion
- **D-17:** Add one global CSS rule to `src/app/globals.css`:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      transition-duration: 0.01ms !important;
      animation-duration:  0.01ms !important;
      animation-iteration-count: 1 !important;
    }
  }
  ```
  This kills all CSS transitions and keyframe animations site-wide when the OS accessibility setting is on.
- **D-18:** JS guard for video playback (see D-07 and D-12) handles the video overlay separately since CSS doesn't control `<video>` playback.

### Performance Validation
- **D-19:** Run EXPLAIN ANALYZE on the filtered Supabase queries (day-mode and night-mode variants) against the production DB. Document results (query plan, index usage, execution time) in the plan's commit message or a `.planning/perf-notes.md` file.
- **D-20:** No preemptive React memoization — only add `React.memo`/`useMemo` if profiling reveals actual unnecessary re-renders during the fade transitions.

### Claude's Discretion
- Exact CSS keyframe implementation for the toggle icon rotate + crossfade — pick what renders cleanly given the current `DayNightToggle` inline-style pattern (could use a wrapper with `animation: spin-fade 200ms`).
- Video preload technique (link rel=preload vs JS fetch vs HTMLVideoElement.load()) — pick based on Next.js compatibility.
- Exact z-index layering for the video overlay and welcome modal — choose values that sit above navbar (z-index appears to be ~100 area based on admin layout patterns).
- Static fallback appearance for welcome modal under prefers-reduced-motion (gradient direction, colors matching day/night themes).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Theme System
- `src/app/globals.css` — CSS variables (`:root` night defaults + `.day` overrides), existing `@keyframes`, body transition. Phase 4 adds the prefers-reduced-motion rule here.
- `src/lib/theme.ts` — `setMode(mode)`: applies/removes `.day` class on `document.documentElement`. Phase 4's inline script mirrors this logic but runs synchronously before React.
- `src/components/ThemeProvider.tsx` — `useLayoutEffect` wraps `setMode`. Stays unchanged in Phase 4.

### State Management
- `src/store/dayNightStore.ts` — Zustand store with `mode`, `setMode`, `toggleMode`. Source of truth. Storage key: `'day-night-storage'` (Zustand persist format: `{state:{mode:"day"},version:0}`).
- `src/hooks/useDayNight.ts` — Re-exports `{ mode, setMode, toggleMode }` from store. Use this in components.

### Components to Modify
- `src/app/layout.tsx` — Add inline `<script>` to `<head>` (D-01) + `suppressHydrationWarning` on `<html>` (D-02) + mount `<WelcomeModal>` (D-11).
- `src/components/DayNightToggle.tsx` — Add rotate + crossfade animation to icon on click (D-16).
- `src/app/portfolio/PortfolioGrid.tsx` — Add fade state + opacity transition (D-13).
- `src/app/albums/AlbumsDragTrack.tsx` — Add fade state + opacity transition (D-13).
- `src/app/page.tsx` — Add fade pattern to home page album collage (D-15).

### New Components to Create
- `src/components/WelcomeModal.tsx` — First-visit full-screen overlay (D-08 → D-12). Client Component. Reads/writes `'ghjulianu-welcomed'` localStorage key.
- `src/components/VideoTransitionOverlay.tsx` — Fullscreen `<video>` overlay that plays on toggle (D-06). Triggered by mode change, mounts/unmounts with opacity fade.

### Assets to Generate (Higgsfield)
- `/public/transitions/day-to-night.mp4` — Sky timelapse, day→night (D-04, D-05)
- `/public/transitions/night-to-day.mp4` — Sky timelapse, night→day (D-04, D-05)

### Requirements
- `.planning/REQUIREMENTS.md` — ANI-01 (crossfade 300–500ms, prefers-reduced-motion), ACC-01 (keyboard navigation), ACC-02 (screen reader / ARIA), ACC-03 (WCAG AA contrast), PER-01 (index usage), PER-02 (render performance), PER-03 (bundle size).

### Prior Phase Context
- `.planning/phases/01-foundation-basic-toggle/1-CONTEXT.md` — Night-default decision, Zustand, BroadcastChannel, Lucide icons.
- `.planning/phases/02-photo-album-filtering/02-CONTEXT.md` — D-02: re-fetch on every mode change (this is what Phase 4 wraps with the fade animation). D-06: Supabase `.or()` filter pattern.
- `.planning/phases/03-admin-controls/03-CONTEXT.md` — D-04: badge icon pattern using Lucide Sun/Moon. Reference for consistent icon usage.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/store/dayNightStore.ts` `toggleMode()` — already broadcasts via BroadcastChannel. Phase 4's video overlay should subscribe to mode changes (or be triggered by the toggle button directly, not the store subscription, to avoid double-firing on cross-tab sync).
- `src/app/globals.css` `@keyframes` (fadeIn, fadeInUp, scaleIn, slideDown, slideUp) — already defined. The toggle icon animation and content fade should reuse or extend these.
- `src/app/albums/[slug]/AlbumPageClient.tsx` — has an existing card enter animation (`opacity 0.7s cubic-bezier(0.22,1,0.36,1)` with stagger delay). Same cubic-bezier could be used for the content fade-in after re-fetch.
- Lucide-react `Sun` and `Moon` icons — already imported in `DayNightToggle.tsx`. Phase 4 animates between them.

### Established Patterns
- **Inline style objects** (not Tailwind): all components use `React.CSSProperties` objects. New components (`WelcomeModal`, `VideoTransitionOverlay`) must follow this dark-minimalist pattern.
- **Client Components with `'use client'`**: `ThemeProvider`, `DayNightToggle`, `AlbumsDragTrack` are all client components. `WelcomeModal` and `VideoTransitionOverlay` will also be client-only.
- **localStorage key naming**: existing keys are `'day-night-storage'` (Zustand persist). New welcome modal key follows same pattern: `'ghjulianu-welcomed'`.
- **French copy**: admin labels and site copy are French ("SÉLECTIONNER", "NUIT", "JOUR"). Welcome modal copy should match.

### Integration Points
- Phase 2's re-fetch logic lives inside `PortfolioGrid` and `AlbumsDragTrack` — Phase 4 wraps the existing `useEffect` that triggers on mode change with the fade state machine (fading out → fetch → fade in).
- `ThemeProvider` in `layout.tsx` wraps all children. `WelcomeModal` should be mounted inside `ThemeProvider` (or alongside `SiteShell`) so it has access to `useDayNight`.
- The inline script in `<head>` uses the same localStorage key as Zustand (`'day-night-storage'`) and the same `.day` class as `src/lib/theme.ts`. These three sources of truth must stay in sync.

</code_context>

<specifics>
## Specific Ideas

- **Welcome modal copy**: "Ce portfolio existe en deux versions : JOUR et NUIT" — user specified this French text exactly.
- **Welcome modal buttons**: `[JOUR]` (sets day mode) and `[NUIT]` (sets night mode) — editorial caps style, matching the rest of the admin/site labels.
- **Video style**: Higgsfield prompt should specify photorealistic sky — sunrise/sunset timelapse. Not abstract, not a landscape (just sky).
- **Video duration**: ~2–3s per clip. Short enough to not feel like an ad, long enough to communicate the day/night concept.
- **Welcome modal key**: `'ghjulianu-welcomed'` in localStorage (boolean, first-visit detection).
- **Inline script key**: `'day-night-storage'` — Zustand persist format, `JSON.parse(s)?.state?.mode === 'day'` is the correct access path.

</specifics>

<deferred>
## Deferred Ideas

- **Home page CTA section** — a persistent section explaining the day/night concept (below hero or between grids). Mentioned but not chosen — welcome modal covers the onboarding need.
- **Animated tooltip near toggle** — pulsing hint on first visit pointing at the toggle. Superseded by the welcome modal.
- **FUT-01 Automatic day/night detection** — AI image brightness classification on upload. Out of scope per REQUIREMENTS.md.
- **FUT-02 Time-based automatic switching** — sunrise/sunset detection. Out of scope per REQUIREMENTS.md.

</deferred>

---

*Phase: 4-Polish & Enhancements*
*Context gathered: 2026-07-02*
