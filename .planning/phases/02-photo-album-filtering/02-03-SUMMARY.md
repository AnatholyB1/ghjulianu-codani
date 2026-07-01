---
phase: 02-photo-album-filtering
plan: "03"
subsystem: portfolio-filtering
tags: [client-fetch, day-night-filter, supabase, fisher-yates, portfolio]
dependency_graph:
  requires: [02-01]
  provides: [portfolio-day-night-filter, portfolio-self-fetch]
  affects: []
tech_stack:
  added: []
  patterns: [client-side-supabase-fetch, zustand-mode-subscription, fisher-yates-shuffle]
key_files:
  created: []
  modified:
    - src/app/portfolio/PortfolioGrid.tsx
    - src/app/portfolio/page.tsx
decisions:
  - "Kept previous photo list visible during re-fetch instead of clearing — no spinner, smoother UX"
  - "Empty state renders only when photos.length === 0 after fetch completes (initial state)"
  - "Fisher-Yates shuffle moved to module-level helper function for clarity"
  - "Supabase query uses .or() with exact strings from plan spec verbatim"
metrics:
  duration: "~15 minutes"
  completed: "2026-07-01"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 2 Plan 03: Portfolio Grid Day/Night Filtering Summary

**One-liner:** PortfolioGrid now self-fetches from Supabase with day/night .or() filter and client-side Fisher-Yates shuffle on every mode change; portfolio/page.tsx is a thin synchronous shell.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Refactor PortfolioGrid with self-fetch, day/night filter, and shuffle | 91cd9b0 | src/app/portfolio/PortfolioGrid.tsx |
| 2 | Thin portfolio/page.tsx to shell with no data fetching | 9748eb8 | src/app/portfolio/page.tsx |

## What Was Built

### PortfolioGrid.tsx

Completely refactored from a pure display component to a self-contained data-fetching component:

- **Props removed:** Function signature changed from `({ photos }: { photos: PortfolioPhoto[] })` to `()` — no props accepted.
- **useDayNight():** Imported from `@/hooks/useDayNight`. Destructures `mode` ('day' | 'night').
- **useState:** Added `photos: PortfolioPhoto[]` state (initialized to `[]`). Existing `lightbox` state unchanged.
- **useEffect with [mode] dependency:** On every mode change:
  - Does NOT clear photos — previous list stays visible while new fetch is in-flight
  - Creates Supabase client via `createClient()`
  - Applies day filter: `.or('is_day.is.null,is_day.eq.true')` for day mode
  - Applies night filter: `.or('is_day.is.null,is_day.eq.false')` for night mode
  - Shuffles result with Fisher-Yates, calls `setPhotos()`
- **Fisher-Yates shuffle:** Extracted as `shuffle<T>()` module-level helper. Slices before mutating. Identical algorithm to the one previously in page.tsx.
- **Empty state:** When `photos.length === 0`, renders `<div className="text-center py-8 text-sm opacity-60">No photos available in this mode yet</div>` instead of the photo grid.
- **Preserved unchanged:** PhotoCard component, IntersectionObserver logic, lightbox state and JSX, all animation/transition styles.

### portfolio/page.tsx

Reduced to a minimal synchronous Server Component:

- Removed: `createClient` import, `async` keyword, supabase query, Fisher-Yates shuffle, `photos` variable
- Kept: `ScrollReveal` import, `PortfolioGrid` import, page header section with PHOTOGRAPHIE label and Portfolio h1
- `<PortfolioGrid />` rendered with no props

## Deviations from Plan

### Merge Required (pre-task)

The worktree was created from commit `07b9ecf` (before Phase 1 and 02-01 work). Files needed by this plan (`useDayNight.ts`, `dayNightStore.ts`, updated `db.types.ts`) were not present. `git merge master --no-edit` was run to bring the worktree up to date before executing tasks. This is normal worktree setup behavior, not a code deviation.

## Known Stubs

None — PortfolioGrid fetches real data from Supabase. Empty state is functional and correct.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries introduced beyond what the threat model already documents (T-02-04, T-02-05, T-02-SC).

## Verification Results

- `grep -c "useDayNight"` in PortfolioGrid.tsx: 2 (import + usage)
- `grep -c "createClient"` in PortfolioGrid.tsx: 2 (import + usage)
- `grep -c "is_day.is.null"` in PortfolioGrid.tsx: 2 (day + night filter branches)
- `grep -c "createClient"` in page.tsx: 0 (removed)
- `tsc --noEmit`: 1 pre-existing error in `src/store/dayNightStore.ts` (TS2561: `getStorage`), no new errors
- `next build`: 0 errors, 0 warnings

## Self-Check: PASSED

- [x] src/app/portfolio/PortfolioGrid.tsx — exists, contains useDayNight, createClient, is_day.is.null, no photos prop
- [x] src/app/portfolio/page.tsx — exists, no createClient, no async, no shuffle, renders `<PortfolioGrid />`
- [x] Commit 91cd9b0 — exists (PortfolioGrid refactor)
- [x] Commit 9748eb8 — exists (page.tsx thinning)
