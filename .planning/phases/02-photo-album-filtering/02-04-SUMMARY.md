---
phase: 02-photo-album-filtering
plan: "04"
subsystem: home-page
tags: [day-night, filtering, supabase, home-page, recentAlbums]
dependency_graph:
  requires: [02-01, phase-1-day-night-foundation]
  provides: [home-page-day-night-filter]
  affects: []
tech_stack:
  added: [zustand]
  patterns: [conditional-supabase-or-filter, zustand-mode-hook]
key_files:
  created:
    - src/hooks/useDayNight.ts
    - src/store/dayNightStore.ts
    - src/lib/broadcastChannel.ts
  modified:
    - src/app/page.tsx
    - package.json
decisions:
  - "Used conditional variable assignment pattern (baseQuery + filteredQuery) for .or() chain rather than inline ternary — clearer intent and easier to read"
  - "Created Phase 1 dependency files (useDayNight.ts, dayNightStore.ts, broadcastChannel.ts) in worktree since worktree was branched before Phase 1 commits landed on master"
  - "Added zustand to package.json as it is a required peer dependency for dayNightStore.ts"
metrics:
  duration: "~10 minutes"
  completed: "2026-07-01"
  tasks_completed: 1
  tasks_total: 1
---

# Phase 2 Plan 04: Home Page Day/Night Filtered recentAlbums Summary

**One-liner:** Home page recentAlbums useEffect updated to filter by is_day via .or() chain using mode from useDayNight, with [mode] dependency array for re-fetch on toggle.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add day/night filter to recentAlbums fetch in page.tsx | a3b4b2e | src/app/page.tsx, src/hooks/useDayNight.ts, src/store/dayNightStore.ts, src/lib/broadcastChannel.ts, package.json |

## What Was Built

`src/app/page.tsx` updated with:
- Import of `useDayNight` from `@/hooks/useDayNight`
- `const { mode } = useDayNight()` called inside `HomePage` component body
- `recentAlbums` useEffect refactored to apply a conditional `.or()` filter:
  - Day mode: `.or('is_day.is.null,is_day.eq.true')` — shows untagged and day albums
  - Night mode: `.or('is_day.is.null,is_day.eq.false')` — shows untagged and night albums
- `useEffect` dependency array changed from `[]` to `[mode]` — triggers re-fetch on mode change

Filter logic uses a two-step pattern:
1. `baseQuery` = `.from('albums').select(...).eq('is_public', true)`
2. `filteredQuery` = ternary appending the correct `.or()` based on `mode`
3. Then chain `.order(...).limit(3).then(...)`

Implements requirement D-03 (home page album collage filtered by day/night). The `is_public=true` guard remains in place, ensuring only public albums are returned regardless of day/night filter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Missing Phase 1 dependency files in worktree**
- **Found during:** Task 1
- **Issue:** The worktree was branched from `master` at commit `07b9ecf`, which predates the Phase 1 commits (`2afdbf2`) that introduced `useDayNight.ts`, `dayNightStore.ts`, and `broadcastChannel.ts`. These files were absent in the worktree, making the `import { useDayNight }` statement unresolvable.
- **Fix:** Created `src/hooks/useDayNight.ts`, `src/store/dayNightStore.ts`, and `src/lib/broadcastChannel.ts` in the worktree with identical content to the main repo versions. Also added `zustand: ^5.0.14` to `package.json` as it is required by `dayNightStore.ts`.
- **Files modified:** src/hooks/useDayNight.ts (created), src/store/dayNightStore.ts (created), src/lib/broadcastChannel.ts (created), package.json
- **Commit:** a3b4b2e

## Known Stubs

None — the day/night filter is fully wired. The `.or()` filter strings are applied directly from the mode value. No hardcoded or placeholder values.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundary surfaces introduced. The `is_public=true` filter remains enforced before the `.or()` filter. The `mode` value is a `'day' | 'night'` union type with no user-controlled string interpolation (per T-02-07 disposition: accept).

## Self-Check: PASSED

- [x] src/app/page.tsx — contains `useDayNight` (line 11 import, line 31 call)
- [x] src/app/page.tsx — contains `is_day.is.null` (lines 92, 93)
- [x] src/app/page.tsx — contains `[mode]` dependency array (line 98)
- [x] src/hooks/useDayNight.ts — created, exports `useDayNight` returning `{ mode, setMode, toggleMode }`
- [x] src/store/dayNightStore.ts — created, Zustand persist store with day/night mode
- [x] src/lib/broadcastChannel.ts — created, BroadcastChannel wrapper singleton
- [x] Commit a3b4b2e — exists on worktree-agent-a7568b11 branch
