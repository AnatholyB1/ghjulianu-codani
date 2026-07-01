# Phase 3: Admin Controls - Context

**Gathered:** 2026-07-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the admin UI that lets users tag portfolio photos and albums as day, night, or untagged. This is the data-entry layer that populates the `is_day` field so Phase 2's filtering has real data to work with. Includes: inline per-photo toggle on the portfolio admin grid, is_day checkbox on the album edit form, visual status indicators in both admin grids/lists, bulk-select mode for portfolio photos, and full ALB-02 inheritance UI showing inherited vs. explicit is_day per album photo.

Does NOT include: per-photo is_day toggle for album photos (controlled at album level), public-facing UI changes, or animation/accessibility polish (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Portfolio Photo Tagging UI
- **D-01:** Inline toggle directly on each photo card in the portfolio admin grid. No new edit page needed. The toggle fires a Server Action immediately on click.
- **D-02:** Three-state cycle: `NULL (untagged) → true (day) → false (night) → NULL (untagged)`. Each click advances one state. NULL displays as a neutral/grey state (no icon).
- **D-03:** Per-photo is_day control only for `portfolio_photos`. Album photos (`album_photos`) are controlled at the album level — no per-album-photo toggle.

### Visual Status Indicators
- **D-04:** Photo cards: small ☀/☾ icon badge overlaid at top-right corner of each card. NULL = no badge. Consistent across both the portfolio admin grid and the DraggablePhotoGrid inside album edit.
- **D-05:** Album list rows (`AlbumSortableList`): same ☀/☾/— icon inline at the end of each album row. NULL = dash or no icon.

### Bulk Selection (Portfolio Photos)
- **D-06:** A "SELECT" toggle button above the portfolio photo grid enters selection mode. In selection mode: checkboxes appear on each photo card, and a bulk action bar appears with [MARK DAY] [MARK NIGHT] [UNTAGGED] buttons plus a "(N selected)" count.
- **D-07:** Portfolio admin grid extracted into a `PortfolioAdminGrid` Client Component (mirrors how `AlbumSortableList` is a Client Component for albums). Server page (`src/app/admin/portfolio/page.tsx`) fetches photos and passes them as props.
- **D-08:** Bulk Server Action updates all selected photo IDs in one call. Loading state during action: disable buttons + show "Updating..." text. No per-item progress indicator.

### Album is_day Toggle
- **D-09:** Add an `is_day` field (checkbox or toggle) to the album edit form in `/admin/albums/[id]/page.tsx`. Submitted alongside existing fields in the existing `updateAlbum` Server Action.
- **D-10:** Same three-state logic as portfolio photos: NULL (untagged) / true (day) / false (night). Checkbox approach: null state via an extra "Untagged" option or tri-state checkbox.

### Album → Photo Inheritance (ALB-02 — full implementation)
- **D-11:** Full ALB-02 inheritance UI inside `DraggablePhotoGrid` in the album edit page. Each album photo card shows a badge: inherited (muted ☀/☾ with `¹` or "from album" label) vs. explicit override (highlighted ☀/☾ with `!` marker). Clicking the badge on an inherited photo lets admin set an explicit override.
- **D-12:** Inheritance applied app-level: when Phase 2 filters, `album.is_day` takes precedence over `album_photos.is_day`. No new DB computed columns or views — the app query logic resolves effective is_day as: if `album.is_day IS NOT NULL` → use album setting; else use photo's own `is_day`.
- **D-13:** "Reset to album" action available for photos with an explicit override — sets the album photo's `is_day` back to NULL (inherits again).

### Claude's Discretion
- Icon choice (lucide-react Sun/Moon icons vs. unicode ☀/☾) — Claude picks based on what's already used in the codebase (Phase 1 chose lucide-react).
- Exact tri-state checkbox/toggle component for the album edit form — Claude decides based on what renders cleanly in the existing Server Component form pattern (no JS required for the album form itself).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Admin Pages to Modify
- `src/app/admin/portfolio/page.tsx` — Current portfolio admin (Server Component). Phase 3: extract grid into `PortfolioAdminGrid` Client Component, keep page as thin shell.
- `src/app/admin/albums/[id]/page.tsx` — Album edit form. Phase 3: add is_day field to the form and `updateAlbum` Server Action.
- `src/app/admin/albums/page.tsx` — Album list page (Server Component). Phase 3: pass is_day data into `AlbumSortableList` for indicator display.

### Components to Modify
- `src/app/admin/_components/DraggablePhotoGrid.tsx` — Phase 3: add inherited/explicit is_day badge + override toggle per album photo card.
- `src/app/admin/albums/_components/AlbumSortableList.tsx` — Phase 3: add ☀/☾ indicator per album row.

### New Components to Create
- `src/app/admin/portfolio/_components/PortfolioAdminGrid.tsx` — New Client Component extracted from portfolio page. Owns selection mode state, bulk action logic, inline toggle.

### Server Actions
- `src/app/admin/actions.ts` — Phase 3 adds: `updatePortfolioPhotoDay(id, isDay)`, `bulkUpdatePortfolioPhotoDay(ids, isDay)`, and extends `updateAlbum` to include is_day.

### Data Layer
- `src/lib/db.types.ts` — `PortfolioPhoto.is_day: boolean | null` already added in Phase 2. `Album.is_day: boolean | null` also already present. Verify `AlbumPhoto` type if album-photo-level override needs typing.
- `src/utils/supabase/server.ts` — Server-side Supabase client for Server Actions.

### Requirements
- `.planning/REQUIREMENTS.md` — PHO-01 (photo admin checkbox), PHO-02 (bulk ops), PHO-03 (indicators), ALB-01 (album admin checkbox), ALB-02 (hierarchy/inheritance), ALB-03 (album indicators).

### Phase 2 Context (prior decisions)
- `.planning/phases/02-photo-album-filtering/02-CONTEXT.md` — D-04: NULL = untagged (shows in both modes). D-06: filter logic `is_day = true OR is_day IS NULL` for day, `is_day = false OR is_day IS NULL` for night. D-09: `AlbumPhoto` does NOT currently have is_day — Phase 3 may need to add it for photo-level overrides within albums.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/admin/_components/ConfirmButton.tsx` — Existing confirm-before-action pattern. Useful reference for any destructive admin actions.
- `src/app/admin/_components/DraggablePhotoGrid.tsx` — Already a Client Component managing drag-to-reorder. Adding per-photo badge + toggle fits this client-side pattern naturally.
- `src/app/admin/albums/_components/AlbumSortableList.tsx` — Client Component for album list with drag reorder. Adding ☀/☾ indicator per row follows its existing item render pattern.
- Lucide-react icons — Phase 1 chose lucide-react for Sun/Moon toggle icons. Same library for admin badges.

### Established Patterns
- Server Actions pattern: `actions.ts` exports async server functions. Forms use `action={serverAction.bind(null, id)}`. Phase 3 follows this for all new DB writes.
- Server page → Client Component props pattern: `AlbumSortableList` receives `initialAlbums` as prop from Server page. `PortfolioAdminGrid` should follow the same shape: `initialPhotos` prop.
- Inline style objects (not Tailwind classes): Admin UI uses `React.CSSProperties` objects (`card`, `inputS`, `btnPrimary`, etc.) defined at the bottom of each file. New components should match this dark minimalist aesthetic.
- `revalidatePath('/admin/portfolio')` after mutations — already used in album/category actions; portfolio actions need the same.

### Integration Points
- Phase 2 filter queries read `is_day` from `portfolio_photos` and `albums`. Phase 3 writes to those same columns. No query-layer changes needed — existing filter logic works once is_day values are populated.
- Album photo inheritance: Phase 3 adds is_day to `album_photos` table for per-photo overrides. Phase 2's album-level filtering (`AlbumsDragTrack`) queries at album level — doesn't need change. The inheritance resolves in the existing filter logic: album.is_day wins if set.
- `DraggablePhotoGrid` already receives `photos` and `albumId` props. Phase 3 needs `albumIsDay` prop too (the parent album's is_day) to render inherited vs. explicit state correctly.

</code_context>

<specifics>
## Specific Ideas

- Three-state toggle visual: grey/muted = untagged (NULL), amber = day (true), indigo or cool-white = night (false). Matches the project's day/night color language.
- Album photo override badge: `[☀]¹` (superscript ¹) for inherited, `[☾]!` (exclamation) for explicit override — simple text suffix to the badge, no custom SVG needed.
- "SÉLECTIONNER" or "SELECT" as the button label above the portfolio grid (admin UI uses French caps for section labels).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Admin Controls*
*Context gathered: 2026-07-02*
