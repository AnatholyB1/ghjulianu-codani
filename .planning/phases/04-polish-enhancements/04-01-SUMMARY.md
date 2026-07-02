---
phase: 04-polish-enhancements
plan: 01
subsystem: ui
tags: [next.js, css, animations, ssr, localStorage, hydration, prefers-reduced-motion]

# Dependency graph
requires: []
provides:
  - Inline hydration-fix script in layout.tsx preventing dark→light flash for day-mode users
  - suppressHydrationWarning on html element for intentional class mismatch
  - Video preload links for day/night transition animations
  - iconSwap CSS keyframe for toggle icon animation
  - Global prefers-reduced-motion kill-switch media rule in globals.css
  - SSR-safe prefersReducedMotion() utility in src/lib/prefersReducedMotion.ts
affects: [04-04, 04-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline blocking script in <head> to apply .day class from localStorage before React hydration"
    - "SSR-safe window API guard: typeof window === 'undefined' return false"
    - "Global prefers-reduced-motion kill-switch via 0.01ms !important animation/transition durations"

key-files:
  created:
    - src/lib/prefersReducedMotion.ts
  modified:
    - src/app/layout.tsx
    - src/app/globals.css

key-decisions:
  - "suppressHydrationWarning on html only — class mismatch between server and client is intentional for day-mode flash prevention"
  - "Inline script uses var (not const/let) for pre-hydration compatibility and try/catch for SecurityError in private browsing"
  - "iconSwap keyframe defined in globals.css (not inline) so it is available globally to all plans building on phase 4"

patterns-established:
  - "Hydration flash prevention: inline blocking script in head reads localStorage and mutates documentElement.classList synchronously"
  - "SSR guard pattern: typeof window === 'undefined' consistent with src/lib/storage.ts"

requirements-completed: [ANI-01, PER-02]

# Metrics
duration: 8min
completed: 2026-07-02
---

# Phase 4 Plan 01: Foundation — Hydration Fix, CSS Animations, Motion Utility Summary

**Inline localStorage script in layout.tsx eliminates dark→light flash for day-mode users; iconSwap keyframe and prefers-reduced-motion kill-switch added to globals.css; SSR-safe prefersReducedMotion() utility created**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-07-02T12:06:00Z
- **Completed:** 2026-07-02T12:14:31Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- layout.tsx now applies `.day` class synchronously before React hydrates, eliminating the dark→light flash for returning day-mode users
- globals.css has `@keyframes iconSwap` for the toggle icon animation (used in plan 04-04) and a global `@media (prefers-reduced-motion: reduce)` kill-switch
- `src/lib/prefersReducedMotion.ts` provides an SSR-safe named export used by VideoTransitionOverlay and WelcomeModal (plans 04-04, 04-05)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hydration flash fix + preload links to layout.tsx** - `7562aa1` (feat)
2. **Task 2: Add iconSwap keyframe + prefers-reduced-motion rule to globals.css** - `b33fd99` (feat)
3. **Task 3: Create prefersReducedMotion.ts utility** - `8c09eba` (feat)

## Files Created/Modified
- `src/app/layout.tsx` - Added suppressHydrationWarning, inline blocking script, and video preload links
- `src/app/globals.css` - Appended iconSwap keyframe and prefers-reduced-motion media rule
- `src/lib/prefersReducedMotion.ts` - New SSR-safe utility exporting prefersReducedMotion()

## Decisions Made
- Used `var` declarations in the inline script (not `const`/`let`) for maximum pre-hydration browser compatibility
- Wrapped localStorage access in try/catch to handle SecurityError in private browsing mode — consistent with the Zustand persist `createJSONStorage` pattern
- Followed the `typeof window === 'undefined'` guard pattern established in `src/lib/storage.ts`

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. All three tasks completed cleanly; `rtk next build` passed with 0 errors and 0 warnings after each task.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Foundation is in place for all other Phase 4 plans
- Plans 04-04 (toggle animation) and 04-05 (welcome modal) can now import `prefersReducedMotion` from `src/lib/prefersReducedMotion.ts`
- The `iconSwap` keyframe in globals.css is ready for use by plan 04-04
- Video files `/transitions/day-to-night.mp4` and `/transitions/night-to-day.mp4` are preloaded and ready for plan 04-02

---
*Phase: 04-polish-enhancements*
*Completed: 2026-07-02*
