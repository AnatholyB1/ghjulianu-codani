# Phase 2: Photo & Album Filtering - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Implement client-side Supabase filtering so photo galleries and album listings query only content matching the current day/night mode. Server Components become thin shells; data fetching moves into existing Client Components (`PortfolioGrid`, `AlbumsDragTrack`, `HomePage`). Includes a DB migration to reset `is_day` columns to NULL for all existing records. Does NOT include UI for tagging photos/albums as day/night — that is Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Filtering Architecture
- **D-01:** Data fetching moves into Client Components. `PortfolioGrid` and `AlbumsDragTrack` own their Supabase calls. `albums/page.tsx` and `portfolio/page.tsx` become thin shells (no server-side fetch).
- **D-02:** Re-fetch from Supabase on every mode change. Each toggle triggers a new filtered query. No client-side in-memory filtering. This satisfies the Supabase-level filtering requirement (CTR-05/06).
- **D-03:** Home page (`src/app/page.tsx`) album collage is also filtered by day/night mode. Consistent experience across the entire site.

### Untagged Photos Behavior (NULL = universal)
- **D-04:** `is_day = NULL` means untagged — shows in **both** day and night modes.
- **D-05:** DB migration sets ALL existing `portfolio_photos` and `albums` records to `is_day = NULL` (clean slate before Phase 3 tagging).
- **D-06:** Supabase filter logic:
  - **Day mode:** `is_day = true OR is_day IS NULL`
  - **Night mode:** `is_day = false OR is_day IS NULL`
  - This keeps the site functional until Phase 3 explicitly tags content.

### Empty State
- **D-07:** When filtering returns zero results, show a simple text message (e.g., "No photos available in this mode yet"). No CTA, no redirect. Consistent with the site's minimalist aesthetic.

### TypeScript Types
- **D-08:** Add `is_day: boolean | null` to `PortfolioPhoto` and `Album` interfaces in `src/lib/db.types.ts`. Type is nullable to reflect the DB reality after the NULL migration.
- **D-09:** `AlbumPhoto` does NOT get `is_day` — filtering is at the album level, not individual album photo level.

### Claude's Discretion
- Loading state while re-fetching on mode change (spinner, skeleton, or nothing — Claude decides based on UX consistency with existing patterns in the codebase).
- Whether to use a `useEffect` + direct Supabase client or a custom hook (e.g., `useFilteredPhotos`) — Claude decides based on code reuse needs.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### State Management
- `src/store/dayNightStore.ts` — Zustand store with `useDayNight` hook. This is the source of truth for current mode. Use `useDayNight()` to get `mode`.
- `src/hooks/useDayNight.ts` — Re-exports `mode`, `setMode`, `toggleMode` from the store.

### Data Layer
- `src/utils/supabase/client.ts` — Client-side Supabase instance. Use `createClient()` from here in Client Components.
- `src/lib/db.types.ts` — TypeScript types for DB tables. Will need `is_day: boolean | null` added to `PortfolioPhoto` and `Album`.

### Existing Client Components to Modify
- `src/app/portfolio/PortfolioGrid.tsx` — Currently receives photos as props. Phase 2: move Supabase fetch inside this component.
- `src/app/albums/AlbumsDragTrack.tsx` — Currently receives albums as props. Phase 2: move Supabase fetch inside this component.
- `src/app/page.tsx` — Home page fetches recent albums via `createClient()` (client-side). Phase 2: apply day/night filter to this query.

### Server Components to Thin Out
- `src/app/portfolio/page.tsx` — Currently fetches data server-side. Phase 2: remove fetch, just render `<PortfolioGrid />`.
- `src/app/albums/page.tsx` — Currently fetches data server-side. Phase 2: remove fetch, just render `<AlbumsDragTrack />`.

### Requirements
- `.planning/REQUIREMENTS.md` — CTR-03 through CTR-08 govern this phase. Especially: CTR-05 (photo filtering at Supabase level), CTR-06 (album filtering at Supabase level).

### Migrations
- `supabase/migrations/` — Phase 1 created migrations 001-004. Phase 2 adds a new migration to NULL out existing `is_day` values.

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useDayNight()` hook (`src/hooks/useDayNight.ts`): Returns `{ mode, setMode, toggleMode }`. Use `mode` directly in Supabase filter logic.
- `createClient()` from `src/utils/supabase/client.ts`: Already used in `src/app/page.tsx` for client-side album fetching — same pattern for PortfolioGrid and AlbumsDragTrack.
- `AlbumsDragTrack` (`src/app/albums/AlbumsDragTrack.tsx`): Already a Client Component (`'use client'`). Well-positioned to own its own fetch.
- `PortfolioGrid` (`src/app/portfolio/PortfolioGrid.tsx`): Check if it's already a Client Component — if so, fetch moves here.

### Established Patterns
- Server → Client data flow: Parent Server Components fetch → pass as props to Client Components. Phase 2 inverts this for day/night pages — Client Components fetch their own data.
- Supabase query pattern (from `albums/page.tsx`): `supabase.from('albums').select('*, category:categories(*)').order('sort_order', { ascending: false })`. Phase 2 adds `.or('is_day.is.null,is_day.eq.' + isDay)` or equivalent filter.

### Integration Points
- `useDayNightStore` subscribes to BroadcastChannel — mode changes from other tabs will propagate automatically. The re-fetch triggered by `useDayNight` will pick up cross-tab mode changes without extra wiring.
- `db.types.ts` types flow to all components — update happens once, TypeScript will surface any usage that needs updating.

</code_context>

<specifics>
## Specific Ideas

- Supabase `.or()` filter pattern for day mode: `.or('is_day.is.null,is_day.eq.true')` and for night mode: `.or('is_day.is.null,is_day.eq.false')`. This avoids two separate `.filter()` calls and maps cleanly to Supabase PostgREST syntax.
- Empty state message style: minimal, consistent with site aesthetic — no icons, no buttons.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Photo & Album Filtering*
*Context gathered: 2026-07-01*
