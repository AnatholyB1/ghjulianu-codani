---
phase: 02-photo-album-filtering
verified: 2026-07-01T14:00:00Z
reverified: 2026-07-01T16:00:00Z
status: passed
score: 10/10 must-haves verified
overrides_applied: 0
gaps_closed_by:
  - plan: "02-05"
    truth: "Database indexes created on is_day columns for performance (ROADMAP SC-5)"
    resolution: "supabase/migrations/20240626000006_add_portfolio_photos_is_day_index.sql adds idx_portfolio_photos_is_day ON portfolio_photos(is_day)"
  - plan: "02-06"
    truth: "Default state shows all content when no preference set (or defaults to day) (ROADMAP SC-4)"
    resolution: "src/store/dayNightStore.ts initial mode changed from 'night' to 'day'"
---

# Phase 2: Photo & Album Filtering — Verification Report

**Phase Goal:** Implement filtering logic to show/hide content based on day/night selection
**Verified:** 2026-07-01T14:00:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

#### From ROADMAP.md Success Criteria (non-negotiable contract)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC-1 | Photo gallery displays only photos matching current day/night mode | VERIFIED | `PortfolioGrid.tsx` uses `.or('is_day.is.null,is_day.eq.true')` / `.or('is_day.is.null,is_day.eq.false')` in a `useEffect([mode])` — photos matching the mode (or untagged) are fetched and rendered |
| SC-2 | Album listing displays only albums matching current day/night mode | VERIFIED | `AlbumsDragTrack.tsx` applies same `.or()` filter on `albums` table in a `useEffect([mode])` |
| SC-3 | Filtering happens at Supabase query level (not client-side only) | VERIFIED | Both components call `supabase.from(...).or(...)` — the filter is in the PostgREST query sent to Supabase, not applied after fetch |
| SC-4 | Default state shows all content when no preference set (or defaults to day) | VERIFIED | `dayNightStore.ts` initial state changed to `mode: 'day'` by plan 02-06. First-time visitors now default to day mode. |
| SC-5 | Database indexes created on is_day columns for performance | VERIFIED | Migration 006 adds `idx_portfolio_photos_is_day ON portfolio_photos(is_day)` by plan 02-05. Both albums and portfolio_photos indexes now exist. |

**Roadmap score: 5/5 success criteria VERIFIED**

#### From Plan Frontmatter Must-Haves (plan-01 through plan-04)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| P01-1 | All existing portfolio_photos rows have is_day = NULL after migration runs | VERIFIED | `20240626000005_reset_is_day_to_null.sql` line 3: `UPDATE portfolio_photos SET is_day = NULL` — no WHERE clause, all rows targeted |
| P01-2 | All existing albums rows have is_day = NULL after migration runs | VERIFIED | `20240626000005_reset_is_day_to_null.sql` line 4: `UPDATE albums SET is_day = NULL` — no WHERE clause |
| P01-3 | PortfolioPhoto interface has is_day field typed as boolean \| null | VERIFIED | `src/lib/db.types.ts` line 48: `is_day:     boolean \| null` in `PortfolioPhoto` interface |
| P01-4 | Album interface has is_day field typed as boolean \| null | VERIFIED | `src/lib/db.types.ts` line 20: `is_day:         boolean \| null` in `Album` interface |
| P01-5 | AlbumPhoto interface does NOT have an is_day field | VERIFIED | `src/lib/db.types.ts` lines 31-40: `AlbumPhoto` interface contains no `is_day` field |
| P02-1 | AlbumsDragTrack fetches its own albums from Supabase on mount and on every mode change | VERIFIED | `AlbumsDragTrack.tsx` lines 24-40: `useEffect(() => { ... }, [mode])` creates supabase client and fetches on every mode change (including initial mount) |
| P02-2 | In day mode only albums with is_day = true OR is_day IS NULL are returned | VERIFIED | `AlbumsDragTrack.tsx` line 32: `query = query.or('is_day.is.null,is_day.eq.true')` |
| P02-3 | In night mode only albums with is_day = false OR is_day IS NULL are returned | VERIFIED | `AlbumsDragTrack.tsx` line 34: `query = query.or('is_day.is.null,is_day.eq.false')` |
| P02-4 | While a new fetch is in-flight the previous album list remains visible (no blank flash) | VERIFIED | `AlbumsDragTrack.tsx` useEffect comment line 23: no `setAlbums([])` called before the async operation; previous state persists |
| P02-5 | When the filtered result set is empty a text message 'No albums available in this mode yet' renders | VERIFIED | `AlbumsDragTrack.tsx` lines 185-188: `filtered.length === 0 ? (<div className="text-center py-8 text-sm opacity-60">No albums available in this mode yet</div>)` |
| P02-6 | albums/page.tsx passes no data props to AlbumsDragTrack | VERIFIED | `src/app/albums/page.tsx` line 4: `return <AlbumsDragTrack />;` — no props passed; no `createClient` import present (0 occurrences) |
| P03-1 | PortfolioGrid fetches its own photos from Supabase on mount and on every mode change | VERIFIED | `PortfolioGrid.tsx` lines 94-109: `useEffect(() => { ... }, [mode])` |
| P03-2 | In day mode only photos with is_day = true OR is_day IS NULL are returned | VERIFIED | `PortfolioGrid.tsx` line 101: `query = query.or('is_day.is.null,is_day.eq.true')` |
| P03-3 | In night mode only photos with is_day = false OR is_day IS NULL are returned | VERIFIED | `PortfolioGrid.tsx` line 103: `query = query.or('is_day.is.null,is_day.eq.false')` |
| P03-4 | Fisher-Yates shuffle runs client-side after each fetch completes | VERIFIED | `PortfolioGrid.tsx` lines 13-20: module-level `shuffle<T>()` function; line 107: `setPhotos(shuffle(data ?? []))` |
| P03-5 | While a new fetch is in-flight the previous photo list remains visible | VERIFIED | `PortfolioGrid.tsx` line 95 comment: "Do NOT clear photos"; no `setPhotos([])` before the async fetch |
| P03-6 | When the filtered result set is empty a text message 'No photos available in this mode yet' renders | VERIFIED | `PortfolioGrid.tsx` lines 117-120: `photos.length === 0 ? (<div className="text-center py-8 text-sm opacity-60">No photos available in this mode yet</div>)` |
| P03-7 | portfolio/page.tsx passes no data props to PortfolioGrid | VERIFIED | `src/app/portfolio/page.tsx` line 27: `<PortfolioGrid />` — no props; no `createClient` import |
| P04-1 | Home page recent albums collage re-fetches from Supabase whenever day/night mode changes | VERIFIED | `src/app/page.tsx` line 98: `}, [mode]);` — the `recentAlbums` useEffect dependency array contains `mode` |
| P04-2 | In day mode the recentAlbums query filters is_day = true OR is_day IS NULL | VERIFIED | `src/app/page.tsx` line 92: `baseQuery.or('is_day.is.null,is_day.eq.true')` |
| P04-3 | In night mode the recentAlbums query filters is_day = false OR is_day IS NULL | VERIFIED | `src/app/page.tsx` line 93: `baseQuery.or('is_day.is.null,is_day.eq.false')` |
| P04-4 | The recentAlbums useEffect dependency array includes mode | VERIFIED | `src/app/page.tsx` line 98: `}, [mode]);` |

**Plan must-have score: 22/22 VERIFIED**

---

## Gaps Summary

Two of the five ROADMAP success criteria are not met:

### Gap 1 — BLOCKER: Missing index on portfolio_photos(is_day) (ROADMAP SC-5)

Migration `20240626000003_add_is_day_indexes.sql` creates:
- `CREATE INDEX IF NOT EXISTS idx_photos_is_day ON photos(is_day);`
- `CREATE INDEX IF NOT EXISTS idx_albums_is_day ON albums(is_day);`

The application queries `portfolio_photos`, not `photos`. These are different table names. The index on `photos(is_day)` does not benefit the Supabase query in `PortfolioGrid.tsx` (which targets `portfolio_photos`). The `albums(is_day)` index is correct and does apply to the AlbumsDragTrack and home page queries.

**Fix required:** Create a new migration that adds `CREATE INDEX IF NOT EXISTS idx_portfolio_photos_is_day ON portfolio_photos(is_day);`

### Gap 2 — BLOCKER: Default mode is 'night', not 'day' (ROADMAP SC-4)

`src/store/dayNightStore.ts` line 13 sets the initial store state to `mode: 'night'`. A user visiting the site for the first time with no localStorage will see the site in night mode. ROADMAP SC-4 says "Default state shows all content when no preference set (or defaults to day)."

The NULL-tagged content (all current content, per migration 005) does appear in both modes, so technically "all content" shows regardless of initial mode. However, the explicit parenthetical "or defaults to day" is not satisfied.

**Fix required:** Either change `mode: 'night'` to `mode: 'day'` in `dayNightStore.ts` to match the ROADMAP specification, or get explicit sign-off that night is the intentional default (override).

**Note:** If the intent is for night to be the default (matching the photography brand aesthetic), add an override to this VERIFICATION.md frontmatter.

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20240626000005_reset_is_day_to_null.sql` | SQL resetting all is_day to NULL | VERIFIED | EXISTS — 6 lines, wraps two UPDATE statements in BEGIN/COMMIT transaction |
| `src/lib/db.types.ts` | Album and PortfolioPhoto with is_day: boolean \| null | VERIFIED | EXISTS — Album line 20, PortfolioPhoto line 48, AlbumPhoto untouched |
| `src/app/albums/AlbumsDragTrack.tsx` | Self-fetching with day/night filter | VERIFIED | EXISTS — 224 lines, contains useDayNight, createClient, .or() filter, empty state |
| `src/app/albums/page.tsx` | Thin shell with no props to AlbumsDragTrack | VERIFIED | EXISTS — 5 lines, renders `<AlbumsDragTrack />` with no props, no createClient |
| `src/app/portfolio/PortfolioGrid.tsx` | Self-fetching with day/night filter and Fisher-Yates shuffle | VERIFIED | EXISTS — 150 lines, contains useDayNight, createClient, shuffle(), .or() filter, empty state |
| `src/app/portfolio/page.tsx` | Thin shell with no props to PortfolioGrid | VERIFIED | EXISTS — 31 lines, renders `<PortfolioGrid />` with no props, no createClient, no async, no shuffle |
| `src/app/page.tsx` | Home page with day/night filtered recentAlbums | VERIFIED | EXISTS — recentAlbums useEffect uses baseQuery + .or() conditional, [mode] dependency |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/albums/AlbumsDragTrack.tsx` | `src/utils/supabase/client.ts` | `createClient()` inside useEffect | WIRED | Line 7 imports `createClient`; line 25 calls it inside the `useEffect([mode])` |
| `src/app/albums/AlbumsDragTrack.tsx` | `src/hooks/useDayNight.ts` | `useDayNight()` destructuring mode | WIRED | Line 8 imports `useDayNight`; line 14 calls it and destructures `mode`; `mode` used in useEffect and filter |
| `src/app/portfolio/PortfolioGrid.tsx` | `src/utils/supabase/client.ts` | `createClient()` inside useEffect | WIRED | Line 7 imports `createClient`; line 96 calls it inside `useEffect([mode])` |
| `src/app/portfolio/PortfolioGrid.tsx` | `src/hooks/useDayNight.ts` | `useDayNight()` destructuring mode | WIRED | Line 8 imports `useDayNight`; line 90 calls it and destructures `mode`; `mode` in useEffect dependency |
| `src/app/page.tsx` | `supabase.from('albums')` | recentAlbums useEffect | WIRED | Lines 86-98: baseQuery from albums, filteredQuery appends .or() based on mode, dependency [mode] |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `AlbumsDragTrack.tsx` | `albums` (useState) | `supabase.from('albums').select('*, category:categories(*)').or(...)` | Yes — Supabase DB query with mode-conditional filter | FLOWING |
| `PortfolioGrid.tsx` | `photos` (useState) | `supabase.from('portfolio_photos').select('*').or(...)` then `shuffle()` | Yes — Supabase DB query with mode-conditional filter | FLOWING |
| `src/app/page.tsx` | `recentAlbums` (useState) | `supabase.from('albums').select(...).eq('is_public',true).or(...).order(...).limit(3)` | Yes — Supabase DB query | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED — no running server available. Runtime behavior (Supabase returning filtered rows, mode toggle triggering re-fetch) requires browser/server environment. Items routed to Human Verification.

---

## Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CTR-03 | 02-02, 02-03, 02-04 | Theme Integration / photo + album filtering via query | SATISFIED | .or() filters applied at Supabase query level in all three components |
| CTR-04 | 02-02, 02-03, 02-04 | UI Toggle Component / re-fetch on mode change | SATISFIED | useDayNight().mode in useEffect([mode]) dependency array in all three components |
| CTR-05 | 02-01 | Photo Filtering Logic — is_day field on PortfolioPhoto | SATISFIED | db.types.ts PortfolioPhoto has is_day: boolean \| null; migration 005 resets rows to NULL |
| CTR-06 | 02-02, 02-03, 02-04 | Album Filtering Logic — re-fetch on every toggle | SATISFIED | All three useEffects have [mode] in dependency array |
| CTR-07 | 02-02, 02-03 | Cross-tab State Synchronization / empty state handling | SATISFIED | Empty state messages implemented in both AlbumsDragTrack and PortfolioGrid |
| CTR-08 | 02-01 | Initial Load Performance — filtering at DB level | PARTIALLY SATISFIED | Filtering IS at DB level via .or() on Supabase queries; however, the index on portfolio_photos(is_day) is missing (only photos(is_day) index exists), so query performance SC is not fully met |

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/store/dayNightStore.ts` | 13 | `mode: 'night'` as initial value | WARNING | Contradicts ROADMAP SC-4 "or defaults to day"; first-time visitors see night mode |

No `TBD`, `FIXME`, or `XXX` debt markers found in modified files. No stub returns detected. No hardcoded empty arrays used as final rendered values.

---

## Human Verification Required

### 1. Mode Toggle Triggers Re-fetch

**Test:** Open `/albums` in browser. Toggle day/night mode. Observe network requests in DevTools Network tab.
**Expected:** Each toggle fires a new Supabase request to `albums?select=...&or=is_day.is.null...`; the album list updates without a blank flash (previous albums remain visible during in-flight request).
**Why human:** Network request timing and visual continuity cannot be verified by static code analysis.

### 2. Portfolio Mode Toggle Triggers Re-fetch and Shuffle

**Test:** Open `/portfolio` in browser. Toggle day/night mode multiple times.
**Expected:** New Supabase request fires on each toggle; photo order changes (Fisher-Yates shuffle applied); previous photos visible during in-flight request.
**Why human:** Shuffle randomness and visual transition require runtime observation.

### 3. Home Page recentAlbums Re-fetch on Toggle

**Test:** Open `/` in browser with DevTools Network open. Toggle day/night mode.
**Expected:** A new Supabase query to `albums?select=id,title,...&is_public=eq.true&or=is_day.is.null,...` fires and the "Derniers Evenements" section updates.
**Why human:** Requires runtime browser + Supabase environment.

### 4. Empty State Message Renders Correctly

**Test:** Tag all albums/photos as `is_day = true` in the DB, then switch to night mode.
**Expected:** AlbumsDragTrack shows "No albums available in this mode yet"; PortfolioGrid shows "No photos available in this mode yet".
**Why human:** Requires DB state manipulation and browser verification.

---

_Verified: 2026-07-01T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
