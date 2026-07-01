---
phase: 02-photo-album-filtering
plan: "02"
subsystem: albums-client
tags: [supabase, day-night, filtering, client-component, zustand]
dependency_graph:
  requires: [02-01]
  provides: [albums-self-fetch, day-night-filter-albums]
  affects: [02-03, 02-04]
tech_stack:
  added: []
  patterns: [client-side-supabase-fetch, zustand-mode-subscription, or-filter-pattern]
key_files:
  created: []
  modified:
    - src/app/albums/AlbumsDragTrack.tsx
    - src/app/albums/page.tsx
    - src/app/layout.tsx
    - src/store/dayNightStore.ts
decisions:
  - "AlbumsDragTrack uses .or() PostgREST filter to fetch only matching albums per mode"
  - "Previous album list preserved during re-fetch (no blank flash between mode changes)"
  - "Empty state rendered inside the track container div when filtered result is empty"
  - "Pre-existing layout.tsx bug fixed: ThemeProvider extracted to import from component file"
  - "Pre-existing dayNightStore.ts bug fixed: getStorage replaced with createJSONStorage"
metrics:
  duration: "~20 minutes"
  completed: "2026-07-01"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 2 Plan 02: AlbumsDragTrack Self-Fetch + Day/Night Filter Summary

**One-liner:** AlbumsDragTrack now owns its Supabase fetch with .or() day/night filtering on every mode change; albums/page.tsx is a thin shell with no server-side data fetch.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Refactor AlbumsDragTrack — internalize fetch with day/night filter | 837178b | src/app/albums/AlbumsDragTrack.tsx |
| 2 | Thin albums/page.tsx — remove server-side fetch | 66e6b41 | src/app/albums/page.tsx, src/app/layout.tsx, src/store/dayNightStore.ts |

## What Was Built

**AlbumsDragTrack.tsx** refactored to be fully self-contained:
- Removed `albums` prop — component function now takes no arguments
- Added `useDayNight()` hook to get current `mode` from Zustand store
- Added `useState<AlbumWithCat[]>` initialized to `[]` for local album state
- Added `useEffect([mode])` that calls `createClient()` and builds a Supabase query:
  - Day: `.or('is_day.is.null,is_day.eq.true')`
  - Night: `.or('is_day.is.null,is_day.eq.false')`
- Previous album list stays visible during in-flight fetch (no `setAlbums([])` at effect start)
- Empty state: when `filtered.length === 0`, renders `"No albums available in this mode yet"` inside the track container with `className="text-center py-8 text-sm opacity-60"`

**albums/page.tsx** thinned to a 5-line shell:
- Removed `createClient` import from `@/utils/supabase/server`
- Removed `async` keyword, Supabase query, and `albums` variable
- Returns `<AlbumsDragTrack />` with no props

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] layout.tsx had misplaced 'use client' directive and duplicate ThemeProvider**
- **Found during:** Task 2 (next build)
- **Issue:** `src/app/layout.tsx` had `'use client'` directive placed after `export default` and after other expressions (at line 117). Next.js rejected this with: "The 'use client' directive must be placed before other expressions." A complete `ThemeProvider` function was inlined below the directive. Meanwhile, `src/components/ThemeProvider.tsx` already contained the same component with the directive correctly at the top.
- **Fix:** Added `import ThemeProvider from '@/components/ThemeProvider'` at the top of layout.tsx, removed the misplaced `'use client'` block and inline ThemeProvider function at the bottom.
- **Files modified:** src/app/layout.tsx
- **Commit:** 66e6b41

**2. [Rule 1 - Bug] dayNightStore.ts used deprecated `getStorage` persist option**
- **Found during:** Task 2 (tsc --noEmit)
- **Issue:** `src/store/dayNightStore.ts` used `getStorage: () => localStorage` in Zustand's persist middleware. This property no longer exists in the current Zustand version — the correct option is `storage` with a `StorageValue`-compatible adapter. TypeScript reported TS2561.
- **Fix:** Replaced `getStorage` with `storage: createJSONStorage(() => localStorage)` using the `createJSONStorage` helper imported from `zustand/middleware`.
- **Files modified:** src/store/dayNightStore.ts
- **Commit:** 66e6b41

### Build Environment Note

`next build` fails during prerendering of `/admin/albums/new` with a Supabase credentials error. This is a pre-existing environment issue — the admin route was created in an early commit and the build environment has no `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` set. The TypeScript compilation and Turbopack compile steps complete successfully; only the static prerender of the admin page fails. This issue is out of scope for this plan.

## Known Stubs

None — AlbumsDragTrack fetches real Supabase data. The empty state message is functional behavior, not a placeholder.

## Threat Flags

None — no new network endpoints, auth paths, or trust-boundary surfaces introduced beyond what the plan's threat model already covers (T-02-02, T-02-03).

## Self-Check: PASSED

- [x] src/app/albums/AlbumsDragTrack.tsx — exists; contains `useDayNight` (2x), `createClient` (2x), `is_day.is.null` (2x), `[mode]` dependency array
- [x] src/app/albums/page.tsx — exists; 0 occurrences of `createClient`, renders `<AlbumsDragTrack />` with no props, no `async` keyword
- [x] Commit 837178b — exists (AlbumsDragTrack refactor)
- [x] Commit 66e6b41 — exists (page.tsx thin + layout/store auto-fixes)
