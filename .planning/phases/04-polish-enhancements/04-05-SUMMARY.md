---
phase: 04-polish-enhancements
plan: 05
subsystem: ui
tags: [react, nextjs, modal, accessibility, localStorage, focus-trap, video]

# Dependency graph
requires:
  - phase: 04-01
    provides: prefersReducedMotion utility, layout.tsx suppressHydrationWarning + inline script + preload links
  - phase: 04-02
    provides: day-to-night.mp4 video asset in /public/transitions/

provides:
  - WelcomeModal first-visit fullscreen overlay with video background and [JOUR]/[NUIT] mode selection
  - Dynamic import of WelcomeModal in layout.tsx with ssr:false (excludes from critical path bundle)

affects: [layout, first-visit, onboarding, accessibility]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Dynamic import with ssr:false for client-only components that read localStorage"
    - "Focus trap pattern: querySelectorAll('button,[href]...') + Tab/Shift+Tab cycle with Escape dismiss"
    - "First-visit gate: localStorage key absent check inside useEffect (SSR-safe — show starts false)"
    - "Intro animation guard: 3000ms setTimeout fallback if sessionStorage 'intro-played' absent"
    - "Body scroll lock: document.body.style.overflow = 'hidden' on mount, restored on unmount"

key-files:
  created:
    - src/components/WelcomeModal.tsx
  modified:
    - src/app/layout.tsx

key-decisions:
  - "WelcomeModal dynamically imported with ssr:false to avoid localStorage read on server"
  - "3000ms delay fallback for intro animation guard prevents simultaneous display with IntroAnimation"
  - "Escape dismisses and writes ghjulianu-welcomed key to prevent re-display without changing mode"
  - "video src and gradient fallback defined as named CSSProperties constants per project inline-style convention"

patterns-established:
  - "Focus trap: save previousFocus before mounting, restore in useEffect cleanup"
  - "Body overflow lock: save prev value, restore on cleanup to avoid clobbering external locks"

requirements-completed: [ANI-01, ACC-01, ACC-02, ACC-03]

# Metrics
duration: 4min
completed: 2026-07-02
---

# Phase 04, Plan 05: WelcomeModal Summary

**Fullscreen first-visit mode-selection modal with looping video background, focus trap, ARIA dialog, and [JOUR]/[NUIT] handlers — dynamically imported in layout.tsx with ssr:false**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-07-02T12:41:13Z
- **Completed:** 2026-07-02T12:44:54Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created WelcomeModal.tsx with complete first-visit gate, intro-animation guard, video background, gradient fallback, [JOUR]/[NUIT] handlers, focus trap, body scroll lock, and ARIA dialog structure
- Wired WelcomeModal into layout.tsx via `next/dynamic` with `ssr: false`, mounted inside ThemeProvider after SiteShell
- All 17 acceptance criteria for Task 1 and all 5 acceptance criteria for Task 2 verified green
- Build passes (0 errors, 0 warnings) after each task commit

## Task Commits

Each task was committed atomically:

1. **Task 1: Create WelcomeModal component** - `8a85ea2` (feat)
2. **Task 2: Mount WelcomeModal in layout.tsx via dynamic import** - `98b5b35` (feat)

## Files Created/Modified
- `src/components/WelcomeModal.tsx` - First-visit fullscreen modal: localStorage gate, sessionStorage intro guard, video/gradient background, focus trap, ARIA dialog, [JOUR]/[NUIT] handlers, Escape dismiss
- `src/app/layout.tsx` - Added `import dynamic from 'next/dynamic'`, `WelcomeModal` dynamic import with `ssr:false`, `<WelcomeModal />` mounted inside ThemeProvider

## Decisions Made
- Mounted WelcomeModal after SiteShell and before Analytics inside ThemeProvider — ensures dayNightStore access and avoids z-index stacking context issues
- Used `useVideo` state initialized to `true` (not computed at render) so SSR renders null safely; `prefersReducedMotion()` is only called inside `useEffect` (client-only)
- videoFill constant added to WelcomeModal (not in plan's interface snippet) to avoid repeating the inline object on the video element — per project convention of named CSSProperties constants

## Deviations from Plan

None — plan executed exactly as written. One minor addition: named `videoFill` CSSProperties constant for the `<video>` element's style (the plan provided the values inline in JSX; factoring into a constant follows the project's established convention for all style objects).

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- WelcomeModal is live; first-visit users will be prompted to choose JOUR or NUIT mode
- Plan 04-06 (if any) can reference WelcomeModal via dynamic import pattern
- The `ghjulianu-welcomed` localStorage key is set by this modal; any future components that depend on first-visit state should check this key

---
*Phase: 04-polish-enhancements*
*Completed: 2026-07-02*
