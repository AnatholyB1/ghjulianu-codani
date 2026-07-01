# Phase 3: Admin Controls - Research

**Researched:** 2026-07-02
**Domain:** Next.js 16 Server Actions / React 19 Client Components / Supabase admin UI patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Inline toggle directly on each photo card in the portfolio admin grid. No new edit page needed. The toggle fires a Server Action immediately on click.
- **D-02:** Three-state cycle: `NULL (untagged) → true (day) → false (night) → NULL (untagged)`. Each click advances one state. NULL displays as a neutral/grey state (no icon).
- **D-03:** Per-photo is_day control only for `portfolio_photos`. Album photos (`album_photos`) are controlled at the album level — no per-album-photo toggle (except the ALB-02 override mechanic in D-11).
- **D-04:** Photo cards: small ☀/☾ icon badge overlaid at top-right (portfolio) or bottom-right (album) corner. NULL = no badge.
- **D-05:** Album list rows: same ☀/☾/— icon inline in each row. NULL = dash.
- **D-06:** A "SELECT" toggle button above the portfolio photo grid enters selection mode with checkboxes and [MARK DAY] [MARK NIGHT] [UNTAGGED] action bar.
- **D-07:** Portfolio admin grid extracted into `PortfolioAdminGrid` Client Component. Server page becomes thin shell.
- **D-08:** Bulk Server Action updates all selected photo IDs in one call. Loading state: disable buttons + "Updating..." text.
- **D-09:** Add `is_day` field (radio tri-state) to album edit form in `/admin/albums/[id]/page.tsx`. Submitted alongside existing fields in `updateAlbum`.
- **D-10:** Same three-state logic: NULL (untagged) / true (day) / false (night). Radio approach: three radios (JOUR / NUIT / NON TAGGÉ).
- **D-11:** Full ALB-02 inheritance UI inside `DraggablePhotoGrid`: each album photo card shows inherited (muted icon + `¹`) vs. explicit override (bright icon + `!`).
- **D-12:** Inheritance applied app-level: `album.is_day` takes precedence. No DB computed columns.
- **D-13:** "Reset to album" action sets `album_photos.is_day = NULL`.

### Claude's Discretion
- Icon choice: lucide-react `Sun`/`Moon` (already used in codebase — confirmed).
- Exact tri-state toggle for album form: radio buttons (confirmed by UI-SPEC).

### Deferred Ideas (OUT OF SCOPE)
None.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PHO-01 | Photo admin checkbox to mark photo as day/night | D-01/D-02 inline toggle on portfolio admin grid; Server Action `updatePortfolioPhotoDay` |
| PHO-02 | Bulk photo operations: select multiple, mark day/night | D-06/D-08 SELECT mode + bulk action bar + `bulkUpdatePortfolioPhotoDay` |
| PHO-03 | Visual indicators in photo admin views | D-04 badge on portfolio card top-right; D-11 badge on album photo bottom-right |
| ALB-01 | Album admin form field for day/night | D-09/D-10 radio tri-state in album edit form + extend `updateAlbum` |
| ALB-02 | Album hierarchy: album setting affects contained photos; individual override supported | D-11 inherited vs. explicit badge in DraggablePhotoGrid; D-12 app-level logic; D-13 reset |
| ALB-03 | Album display indicators in list | D-05 ☀/☾/— indicator in AlbumSortableList rows |
</phase_requirements>

---

## Summary

Phase 3 is the data-entry layer for the day/night tagging system. Phase 2 has already added `is_day: boolean | null` to both `portfolio_photos` and `albums` tables and their TypeScript types, and the filtering logic in public-facing Client Components is live. Phase 3 writes to those same columns via three new Server Actions and modifications to one existing action.

The codebase uses a uniform admin UI pattern: every admin page and component defines named `React.CSSProperties` constants at the bottom of the file (zero Tailwind, zero shadcn). All Client Components in the admin area use `useTransition` for Server Action calls. The `PortfolioAdminGrid` extraction (D-07) mirrors the existing `AlbumSortableList` pattern exactly: Server page fetches, passes `initialPhotos` prop, Client Component owns all state.

The single new DB migration needed is `ALTER TABLE album_photos ADD COLUMN is_day BOOLEAN DEFAULT NULL` — `AlbumPhoto` type in `db.types.ts` does not yet have `is_day`, and no migration for it exists. Everything else (portfolio_photos.is_day, albums.is_day) is already in the DB and TypeScript types.

**Primary recommendation:** Eight atomic work units — one DB migration, one type update, three new Server Actions (+ extend updateAlbum), two new components, four modified components. Execute in strict dependency order: DB migration and type update first, then Server Actions, then UI components.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Per-photo is_day toggle (portfolio) | Client Component (PortfolioAdminGrid) | Server Action (updatePortfolioPhotoDay) | Toggle state is client-side; write goes through Server Action |
| Bulk photo day/night marking | Client Component (PortfolioAdminGrid) | Server Action (bulkUpdatePortfolioPhotoDay) | Selection state is client-side; bulk write is one Server Action call |
| Album is_day form field | Server Component (EditAlbumPage) | Server Action (updateAlbum extended) | Form is server-rendered; no JS required for radio input |
| Album photo inheritance badge | Client Component (DraggablePhotoGrid) | Server Action (updateAlbumPhotoDay) | DraggablePhotoGrid is already a Client Component; badge logic + override writes live here |
| Album list indicator | Client Component (AlbumSortableList) | — | AlbumSortableList is already a Client Component; read-only indicator needs no new action |
| DB write for album_photos.is_day | API / Server Action | Database | New `updateAlbumPhotoDay` action writes to album_photos table |

---

## Standard Stack

### Core (all already installed — no new packages)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 16.1.6 | Server Actions, `revalidatePath` | Project framework [VERIFIED: package.json] |
| react | 19.2.3 | `useTransition`, `useState`, Client Components | Project framework [VERIFIED: package.json] |
| lucide-react | ^0.577.0 | `Sun`, `Moon` icons | Already used in `DayNightToggle.tsx` [VERIFIED: package.json + codebase grep] |
| @supabase/ssr | ^0.9.0 | `createClient()` from `@/utils/supabase/server` | Existing Server Action pattern [VERIFIED: package.json] |
| @supabase/supabase-js | ^2.98.0 | Client-side Supabase (not needed for admin actions) | Installed [VERIFIED: package.json] |

### No New Packages Required
Phase 3 adds zero npm dependencies. All required libraries are already installed.

## Package Legitimacy Audit

No new packages required for this phase. All dependencies are existing project dependencies already in `package.json`. Audit not applicable.

---

## Architecture Patterns

### System Architecture Diagram

```
Admin user (browser)
        │
        ▼
Server Component (page.tsx) ──fetch──► Supabase DB
        │                              (portfolio_photos, albums, album_photos)
        │ initialPhotos / initialAlbums props
        ▼
Client Component (PortfolioAdminGrid / AlbumSortableList / DraggablePhotoGrid)
        │ user interaction (click toggle, checkbox, radio)
        │
        ├──► optimistic local state update
        │
        └──► Server Action call
                    │
                    ▼
              actions.ts ('use server')
                    │
                    ├──► supabase.from('portfolio_photos').update({ is_day }).eq('id', id)
                    ├──► supabase.from('portfolio_photos').update({ is_day }).in('id', ids)
                    ├──► supabase.from('album_photos').update({ is_day }).eq('id', id)
                    └──► supabase.from('albums').update({ ..., is_day }).eq('id', id)
                                │
                                ▼
                        revalidatePath(...)
                        (Server Component re-fetches on next navigation)
```

### Recommended Project Structure

```
src/app/admin/
├── actions.ts                          # Add 3 new Server Actions; extend updateAlbum
├── _components/
│   ├── ConfirmButton.tsx               # Unchanged
│   ├── DraggablePhotoGrid.tsx          # MODIFY: albumIsDay prop + inheritance badge
│   └── DayNightToggleBadge.tsx         # CREATE: reusable 3-state badge for portfolio cards
├── portfolio/
│   ├── page.tsx                        # MODIFY: thin shell, pass initialPhotos
│   └── _components/
│       └── PortfolioAdminGrid.tsx      # CREATE: Client Component extracted from page
└── albums/
    ├── page.tsx                        # NO CHANGE (already passes full Album with is_day)
    └── _components/
        └── AlbumSortableList.tsx       # MODIFY: render ☀/☾/— per row
```

### Pattern 1: Server Action for Single Row Update (existing pattern)

```typescript
// Source: src/app/admin/actions.ts (existing deletePortfolioPhoto / updateAlbum)
'use server';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updatePortfolioPhotoDay(id: string, isDay: boolean | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('portfolio_photos')
    .update({ is_day: isDay })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}
```

**Key detail:** Always call `revalidatePath` on both the admin path AND the public-facing path (same pattern as `addPortfolioPhoto`, `deletePortfolioPhoto`).

### Pattern 2: Bulk Update with `.in()` (new but follows existing pattern)

```typescript
// Source: pattern derived from reorderAlbumPhotos (actions.ts:178) using Promise.all + upsert
// For bulk is_day, a single .update().in() is cleaner than Promise.all:
export async function bulkUpdatePortfolioPhotoDay(ids: string[], isDay: boolean | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('portfolio_photos')
    .update({ is_day: isDay })
    .in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}
```

Note: Supabase `.in()` filter accepts an array of values. This is a single DB call regardless of array length — preferable to Promise.all for bulk operations. [ASSUMED — derived from Supabase PostgREST docs pattern, not verified against Context7 in this session]

### Pattern 3: useTransition for Server Action (existing pattern)

```typescript
// Source: src/app/admin/_components/DraggablePhotoGrid.tsx (lines 25, 58)
const [isPending, startTrans] = useTransition();
// ...
startTrans(() => reorderAlbumPhotos(albumId, next.map(p => p.id)));
// Pending state: { isPending && <p style={{ color: '#c8a97e' }}>SAUVEGARDE…</p> }
```

For `DayNightToggleBadge`, optimistic update pattern: update local state immediately, then fire Server Action inside `startTransition`. On error, revert to prior state.

### Pattern 4: Form action binding (existing pattern)

```typescript
// Source: src/app/admin/albums/[id]/page.tsx (line 27)
const update = updateAlbum.bind(null, id);
// <form action={update}>
```

Phase 3 extends `updateAlbum` to also read `formData.get('is_day')` — no change to caller.

### Pattern 5: Server page → Client Component props (existing pattern)

```typescript
// Source: src/app/admin/albums/page.tsx (line 24)
<AlbumSortableList initialAlbums={(albums ?? []) as Album[]} />

// PortfolioAdminGrid follows identical shape:
<PortfolioAdminGrid initialPhotos={photos ?? []} />
```

### Anti-Patterns to Avoid

- **Fetching inside Server Action:** Server Actions must only write. Reads happen in Server Components or Client Components via Supabase client.
- **Missing revalidatePath on public routes:** Every admin mutation that affects public-facing content MUST call `revalidatePath` on the public path too (e.g., `/portfolio`, `/albums`). The existing codebase does this consistently — do not skip it.
- **Skipping `revalidatePath('/admin/...')` after album_photos update:** Album edit page needs to re-render after override changes. Use `revalidatePath('/admin/albums/${album_id}')`.
- **Conditional `'use client'` directive:** All components under the existing Client Component tree in DraggablePhotoGrid are automatically client-side. New sub-components added to it do not need their own `'use client'` directive.
- **Using `useState` for pessimistic updates:** The project pattern (DraggablePhotoGrid, ConfirmButton) uses optimistic local state + `useTransition`. Do not wait for Server Action to resolve before updating UI.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic UI update on Server Action | Custom fetch + setState | `useTransition` from React | Already project-wide pattern; handles pending/error states correctly |
| Bulk DB update | `Promise.all` of individual updates | Supabase `.update().in('id', ids)` | Single round-trip to DB |
| Icon SVGs | Custom SVG markup | `lucide-react` `<Sun>` / `<Moon>` with `size={9|10}` prop | Already installed; Phase 1 chose this library |
| Confirm-before-delete pattern | New dialog/modal | Existing `ConfirmButton` component | Already handles `window.confirm` + `useTransition` |
| Access key logic in updateAlbum | New utility | Existing pattern in `updateAlbum` (lines 93-95) | Preserve existing `access_key` re-generation logic when extending `updateAlbum` |

**Key insight:** This phase is UI plumbing on top of an already-wired data layer. The hard work (DB schema, filter queries, type definitions) is done. The risk is in the interaction details (three-state cycle, optimistic UI, inheritance badge logic), not in infrastructure.

---

## Current State of Each File to Modify

### `src/app/admin/portfolio/page.tsx` (MODIFY → thin shell)

**Current state:** Server Component. Fetches `portfolio_photos` with `select('*').order('sort_order').order('created_at', { ascending: false })`. Renders inline grid with ConfirmButton per card. No `is_day` column used anywhere.

**Inline style constants defined:** `subLabel`, `pageTitle`, `card`, `cardTitle`, `formCol`, `labelS`, `inputS`, `btnPrimary`.

**Phase 3 change:** Keep the fetch query (it already selects `*` which includes `is_day`). Replace inline `<div style={{ display: 'grid' ...}>` block with `<PortfolioAdminGrid initialPhotos={photos ?? []} />`. Keep `AddPortfolioPhotoForm` import and rendering unchanged. Remove the per-photo map loop and ConfirmButton from this file.

**Import to add:** `import PortfolioAdminGrid from './_components/PortfolioAdminGrid';`

---

### `src/app/admin/actions.ts` (MODIFY — add 3 actions, extend 1)

**Current state:** `'use server'` file. Pattern: `const supabase = await createClient()` → Supabase call → `if (error) throw new Error(error.message)` → `revalidatePath(...)`.

**`updateAlbum` current shape (lines 82-105):** Reads `title`, `year`, `location`, `category_id`, `description`, `cover_url`, `bg_url`, `is_public` from `formData`. Does NOT read `is_day`. Updates `albums` table with those fields plus `access_key`.

**Phase 3 additions:**
1. `updatePortfolioPhotoDay(id: string, isDay: boolean | null)` — `.update({ is_day: isDay }).eq('id', id)` on `portfolio_photos`. Revalidate `/admin/portfolio` + `/portfolio`.
2. `bulkUpdatePortfolioPhotoDay(ids: string[], isDay: boolean | null)` — `.update({ is_day: isDay }).in('id', ids)` on `portfolio_photos`. Revalidate `/admin/portfolio` + `/portfolio`.
3. `updateAlbumPhotoDay(id: string, albumId: string, isDay: boolean | null)` — `.update({ is_day: isDay }).eq('id', id)` on `album_photos`. Revalidate `` `/admin/albums/${albumId}` ``.
4. **Extend `updateAlbum`:** Add `const isDayRaw = formData.get('is_day') as string | null` → parse: `'true'` → `true`, `'false'` → `false`, else `null`. Add `is_day` to the `.update({...})` call.

**CRITICAL:** `updateAlbumPhotoDay` needs `albumId` param to revalidate the correct album page.

---

### `src/app/admin/_components/DraggablePhotoGrid.tsx` (MODIFY)

**Current state:** Client Component (`'use client'`). Props: `{ photos: AlbumPhoto[], albumId: string }`. Internal state: `photos`, `dragId`, `overId`, `isPending`. Uses `useTransition` for drag reorder. Per card: position badge (bottom-left), delete button (top-right, `position: 'absolute', top: '3px', right: '3px'`). Grid gap: `4px`. Card size: `minmax(90px,1fr)`.

**AlbumPhoto type (current):** `{ id, album_id, src, width, height, alt, sort_order, created_at }` — NO `is_day` field.

**Phase 3 change:**
- Add `albumIsDay?: boolean | null` to Props interface.
- Add a second `useTransition` (or reuse) for the badge Server Action call.
- After `AlbumPhoto` type is extended with `is_day: boolean | null`, each photo card renders a badge at `position: 'absolute', bottom: '3px', right: '3px'` (bottom-right, away from delete button at top-right).
- Badge logic: if `photo.is_day === null && albumIsDay !== null` → inherited badge. If `photo.is_day !== null` → explicit override badge. If both null → no badge.
- Clicking inherited badge sets explicit override (`updateAlbumPhotoDay(photo.id, albumId, nextValue)`).
- Clicking explicit override badge shows "ALBUM ↺" for 1500ms then calls `updateAlbumPhotoDay(photo.id, albumId, null)`.

**Import to add:** `import { Sun, Moon } from 'lucide-react'` + `import { updateAlbumPhotoDay } from '../actions'`

---

### `src/app/admin/albums/_components/AlbumSortableList.tsx` (MODIFY)

**Current state:** Client Component. `AlbumRow = Album & { category?: Category | null }`. Renders rows with: drag handle, cover thumbnail, info div (title + tags for year/category/is_public/sort_order), edit/delete action buttons.

**`is_day` on `Album` type:** Already present (`is_day: boolean | null`) — `AlbumSortableList` receives `Album` objects so `is_day` is already available in each row's data. No type changes needed here.

**The info div (lines 119-130):** Tags rendered as `<span style={tag}>`. Existing tags: `{album.year}`, `{album.category.name}`, `● PUBLIC / 🔒 PRIVÉ`, `#{album.sort_order}`.

**Phase 3 change:** Insert a new `<span>` for the day/night indicator after the `is_public` span (line 127), before the `sort_order` span. Three render states:
- `album.is_day === null`: `<span style={{ ...tag, color: 'rgba(122,122,116,0.4)' }}>—</span>`
- `album.is_day === true`: `<span style={{ ...tag, color: '#c8a97e' }}><Sun size={9} /></span>`
- `album.is_day === false`: `<span style={{ ...tag, color: '#8090b0' }}><Moon size={9} /></span>`

**Import to add:** `import { Sun, Moon } from 'lucide-react'`

---

### `src/app/admin/albums/[id]/page.tsx` (MODIFY)

**Current state:** Server Component. Fetches `album`, `categories`, `photos`. Renders two-column layout: left = INFORMATIONS form, right = album photos grid. INFORMATIONS form has: TITRE, ANNÉE, LIEU, CATÉGORIE, DESCRIPTION, MINIATURE, PHOTO DE FOND, VISIBILITÉ (two radios), ENREGISTRER button.

**`album.is_day`:** Available on the fetched `album` object (Album type has `is_day: boolean | null`). No query change needed.

**`DraggablePhotoGrid` current call (line 122):** `<DraggablePhotoGrid photos={photos ?? []} albumId={id} />`

**Phase 3 change:**
1. Add MODE JOUR/NUIT `<Row>` after VISIBILITÉ row, before ENREGISTRER button. Three radios: `name="is_day"`, values `"true"` / `"false"` / `""`. `defaultChecked` from `album.is_day`.
2. Change `DraggablePhotoGrid` call: `<DraggablePhotoGrid photos={photos ?? []} albumId={id} albumIsDay={album.is_day} />`
3. Import `Sun`, `Moon` from lucide-react for radio label icons.

**Inline style constant `radioLabel` (line 148):** `{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', color: '#E8E4DC', cursor: 'pointer', letterSpacing: '0.1em' }` — UI-SPEC canonicalizes `fontSize` to `0.62rem` for this new row. Use the same `radioLabel` constant but note the existing VISIBILITÉ radios also use it; updating the constant affects them. Consider defining a separate `radioLabelSm` or override inline for the new row to avoid affecting VISIBILITÉ.

---

### New: `src/app/admin/_components/DayNightToggleBadge.tsx` (CREATE)

**Purpose:** Reusable three-state badge for portfolio photo cards. Renders nothing (NULL), amber Sun pill (true), or indigo Moon pill (false). Clicking cycles through states. Fires `updatePortfolioPhotoDay` on each click.

**Props:** `{ photoId: string, isDay: boolean | null }`

**State:** Local `value: boolean | null` initialized from prop. `isPending` via `useTransition`.

**Positioning used by caller (PortfolioAdminGrid):** `position: 'absolute', top: '3px', right: '26px'` — places it left of the delete button at `right: '3px'`.

---

### New: `src/app/admin/portfolio/_components/PortfolioAdminGrid.tsx` (CREATE)

**Purpose:** Client Component extracted from `portfolio/page.tsx`. Owns selection mode state, inline day/night toggle, bulk action bar.

**Props:** `{ initialPhotos: PortfolioPhoto[] }`

**State needed:**
- `photos: PortfolioPhoto[]` — initialized from prop; updated optimistically on toggle
- `selectionMode: boolean`
- `selectedIds: Set<string>`
- `bulkPending: boolean`

**Structure:**
1. SÉLECTIONNER / ANNULER button (above the grid)
2. Bulk action bar (conditional, when selectionMode=true)
3. Photo grid (`display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: '4px'`)
4. Per card: img, DayNightToggleBadge (hidden in select mode), ConfirmButton (hidden in select mode), checkbox overlay (only in select mode), bottom info bar

---

## DB Migration Required

**ONE new migration needed for Phase 3:**

```sql
-- File: supabase/migrations/20240626000007_add_album_photos_is_day.sql
ALTER TABLE album_photos ADD COLUMN IF NOT EXISTS is_day BOOLEAN DEFAULT NULL;
```

**Rationale:** `AlbumPhoto` in `db.types.ts` has NO `is_day` field. No existing migration adds `is_day` to `album_photos`. The D-11 inheritance override feature (per-album-photo is_day override) requires this column.

**Type update required in `src/lib/db.types.ts`:**
```typescript
export interface AlbumPhoto {
  id:         string;
  album_id:   string;
  src:        string;
  width:      number;
  height:     number;
  alt:        string | null;
  is_day:     boolean | null;   // ADD THIS
  sort_order: number;
  created_at: string;
}
```

**No migration needed for `portfolio_photos.is_day` or `albums.is_day`** — both already exist from Phase 1/2 migrations 001 and 002.

**Migration naming:** Existing migrations use `20240626000001` through `20240626000006`. Next file should be `20240626000007_add_album_photos_is_day.sql`. [ASSUMED — follows observed naming convention; no config file specifies this format]

---

## Supabase Query Patterns

### Existing patterns in actions.ts

```typescript
// Single update (lines 97-100 in actions.ts)
const { error } = await supabase
  .from('albums')
  .update({ title, year, location, category_id, description, cover_url, background_url: bg_url, is_public, access_key })
  .eq('id', id);

// Upsert array (reorderAlbumPhotos, lines 181-184)
const { error } = await supabase
  .from('album_photos')
  .upsert(updates, { onConflict: 'id' });
```

### New patterns for Phase 3

```typescript
// Single field update (new)
await supabase.from('portfolio_photos').update({ is_day: isDay }).eq('id', id);

// Bulk update using .in() (new)
await supabase.from('portfolio_photos').update({ is_day: isDay }).in('id', ids);

// Album photo override update (new)
await supabase.from('album_photos').update({ is_day: isDay }).eq('id', id);
```

### `updateAlbum` extension — formData parsing for tri-state

```typescript
// New lines to insert in updateAlbum after is_public parsing:
const isDayRaw = formData.get('is_day') as string | null;
const is_day   = isDayRaw === 'true' ? true : isDayRaw === 'false' ? false : null;

// Add to .update({...}) call:
.update({ title, year, location, category_id, description, cover_url,
          background_url: bg_url, is_public, access_key, is_day })
```

---

## Admin UI Style Patterns

### Named constants (project convention)

Every admin file defines named `React.CSSProperties` constants at the bottom. New files must follow this pattern. Phase 3 introduces new constants (see UI-SPEC for exact values):

```typescript
// New constants for PortfolioAdminGrid.tsx
const btnSelectMode:       React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#E8E4DC', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' };
const btnSelectModeActive: React.CSSProperties = { ...btnSelectMode, border: '1px solid rgba(200,169,126,0.4)', color: '#c8a97e' };
const bulkBar:             React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' };
const btnBulkDay:          React.CSSProperties = { background: 'transparent', border: '1px solid rgba(200,169,126,0.4)', color: '#c8a97e', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const btnBulkNight:        React.CSSProperties = { background: 'transparent', border: '1px solid rgba(120,140,180,0.4)', color: '#8090b0', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const btnBulkUntagged:     React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#E8E4DC', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const bulkCounter:         React.CSSProperties = { marginLeft: 'auto', fontSize: '0.58rem', letterSpacing: '0.1em', color: '#7a7a74' };
```

### Day/Night color tokens

| State | Color | Usage |
|-------|-------|-------|
| Day | `#c8a97e` | Sun icon, day badge border/bg tint, JOUR button |
| Night | `#8090b0` | Moon icon, night badge border/bg tint, NUIT button |
| NULL/untagged | `#7a7a74` | muted grey, dash indicator |
| Inherited day (muted) | `rgba(200,169,126,0.5)` | Sun icon at 50% opacity |
| Inherited night (muted) | `rgba(120,140,180,0.5)` | Moon icon at 50% opacity |
| Reset override text | `#e07070` | "ALBUM ↺" destructive color |

### Badge styles (DayNightToggleBadge for portfolio cards — top-right)

```typescript
// Positioned by parent at: position: 'absolute', top: '3px', right: '26px'
// NULL state: render a transparent 18×18px button (always present as click target), no pill visible
// Day state pill:
{
  background: 'rgba(200,169,126,0.15)',
  border: '1px solid rgba(200,169,126,0.35)',
  borderRadius: '2px',
  padding: '2px 4px',
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  width: '18px',
  height: '18px',
  justifyContent: 'center',
}
// Night state pill: same but background rgba(120,140,180,0.15) / border rgba(120,140,180,0.35)
// Pending state: opacity 0.5, pointerEvents: 'none'
```

### Badge styles (DraggablePhotoGrid inheritance — bottom-right)

```typescript
// Position on card: position: 'absolute', bottom: '3px', right: '3px'
// (Does NOT conflict with delete button at top: '3px', right: '3px')

// Explicit override — day:
const badgeDay: React.CSSProperties = {
  position: 'absolute', bottom: '3px', right: '3px',
  background: 'rgba(200,169,126,0.15)',
  border: '1px solid rgba(200,169,126,0.35)',
  borderRadius: '2px', padding: '2px 4px', fontSize: '0.58rem',
  display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer'
};
// Explicit override — night: ...badgeDay, background rgba(120,140,180,0.15), border rgba(120,140,180,0.35)

// Inherited (dimmed):
const badgeInherited: React.CSSProperties = {
  position: 'absolute', bottom: '3px', right: '3px',
  background: 'transparent',
  border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '2px', padding: '2px 4px', fontSize: '0.58rem',
  display: 'flex', alignItems: 'center', gap: '0.25rem',
  cursor: 'pointer', opacity: 0.7
};
```

---

## Common Pitfalls

### Pitfall 1: forgetting revalidatePath on the public-facing path

**What goes wrong:** Admin mutation updates the DB but the public portfolio/albums page still shows stale data (Next.js has cached the RSC output).
**Why it happens:** `revalidatePath('/admin/portfolio')` clears the admin cache but NOT the public `/portfolio` cache.
**How to avoid:** Always add BOTH paths: `revalidatePath('/admin/portfolio')` + `revalidatePath('/portfolio')`. For album mutations: `revalidatePath('/admin/albums')` + `revalidatePath('/albums')`.
**Warning signs:** DB updated but public page unchanged after navigation.

### Pitfall 2: `updateAlbum` access_key logic broken by extension

**What goes wrong:** Adding `is_day` to `updateAlbum` accidentally removes access_key regeneration for private albums.
**Why it happens:** The access_key logic fetches current album state first (lines 93-95), then assigns based on `is_public`. If `is_day` is added to `.update()` call but the existing access_key logic is not preserved, private albums lose their keys.
**How to avoid:** When extending `updateAlbum`, keep the existing `current?.access_key ?? generateAccessCode()` logic intact and simply add `is_day` to the update object alongside existing fields.
**Warning signs:** Private albums showing `access_key = null` after an admin update.

### Pitfall 3: `DraggablePhotoGrid` receives stale `albumIsDay` after album is_day changes

**What goes wrong:** User sets album is_day via the INFORMATIONS form, clicks ENREGISTRER. The page re-renders (Server Component re-fetch) BUT if the album photo grid is still mounted with the old `albumIsDay` prop value, inherited badges may show wrong state.
**Why it happens:** Server Action calls `revalidatePath('/admin/albums/${id}')` which triggers a full page re-render — this is actually correct behavior. The issue only arises if `revalidatePath` is missing.
**How to avoid:** `updateAlbum` Server Action must call `revalidatePath('/admin/albums')` AND `revalidatePath(\`/admin/albums/${id}\`)`.

### Pitfall 4: album_photos.is_day column missing in production DB

**What goes wrong:** `updateAlbumPhotoDay` Server Action throws "column album_photos.is_day does not exist."
**Why it happens:** The migration `20240626000007_add_album_photos_is_day.sql` was created in git but not applied to the remote Supabase project.
**How to avoid:** Apply the migration via Supabase MCP or `supabase db push` BEFORE deploying Phase 3 code. The plan should explicitly order: DB migration → type update → Server Action → UI component.
**Warning signs:** TypeScript compilation passes but runtime throws Supabase error.

### Pitfall 5: three-state radio with empty string for NULL not parsed correctly

**What goes wrong:** `formData.get('is_day')` returns `null` (not found) rather than `""` (empty string) when the radio group has no selection, causing `is_day` to always be set to `null` even when "NON TAGGÉ" is explicitly chosen.
**Why it happens:** HTML `<input type="radio" value="">` submits an empty string when selected. The formData parsing must handle three values: `"true"` → `true`, `"false"` → `false`, `""` or missing → `null`.
**How to avoid:** Use `isDayRaw === 'true' ? true : isDayRaw === 'false' ? false : null` — this handles both `""` and `null` correctly.

### Pitfall 6: delete button collision with DayNightToggleBadge in portfolio cards

**What goes wrong:** Rendering badge at `top: '3px', right: '3px'` overlaps with the delete ConfirmButton at the same position.
**Why it happens:** Current portfolio page puts ConfirmButton inside the card without explicit positioning. `DayNightToggleBadge` at `right: '3px'` would stack on top.
**How to avoid:** `DayNightToggleBadge` in portfolio cards goes at `right: '26px'` (20px delete button width + 3px offset + 3px buffer). Confirm button stays at `right: '3px'`. In DraggablePhotoGrid, the badge goes at the BOTTOM-RIGHT (`bottom: '3px', right: '3px'`) since the delete button is at TOP-RIGHT.

### Pitfall 7: bulk action exits select mode only on success

**What goes wrong:** On Server Action error, select mode exits and user loses their selection with no feedback.
**Why it happens:** Exit-select-mode logic placed at the wrong point in the async flow.
**How to avoid:** Only exit select mode + clear selection AFTER the Server Action resolves successfully. On error, show inline error text (`Erreur — réessayez.`) and keep select mode active.

---

## Code Examples

### Three-state cycle logic (portfolio badge)

```typescript
// Source: D-02 decision + UI-SPEC state machine
function nextIsDay(current: boolean | null): boolean | null {
  if (current === null) return true;   // NULL → day
  if (current === true) return false;  // day → night
  return null;                          // night → NULL
}
```

### Optimistic update in DayNightToggleBadge

```typescript
// Source: pattern from DraggablePhotoGrid.tsx + ConfirmButton.tsx
'use client';
import { useState, useTransition } from 'react';
import { Sun, Moon } from 'lucide-react';
import { updatePortfolioPhotoDay } from '@/app/admin/actions';

export default function DayNightToggleBadge({ photoId, isDay: initial }: { photoId: string; isDay: boolean | null }) {
  const [value, setValue] = useState<boolean | null>(initial);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const next = value === null ? true : value === true ? false : null;
    setValue(next);   // optimistic
    startTransition(async () => {
      try {
        await updatePortfolioPhotoDay(photoId, next);
      } catch {
        setValue(value);   // revert on error
      }
    });
  }

  // render pill or transparent button based on value
}
```

### Album form tri-state radio (Server Component compatible)

```typescript
// Source: existing VISIBILITÉ radio pattern in albums/[id]/page.tsx (lines 88-97)
<Row label="MODE JOUR/NUIT">
  <div style={{ display: 'flex', gap: '1.5rem' }}>
    <label style={radioLabel}>
      <input type="radio" name="is_day" value="true" defaultChecked={album.is_day === true} />
      <Sun size={10} style={{ color: '#c8a97e' }} />
      <span>JOUR</span>
    </label>
    <label style={radioLabel}>
      <input type="radio" name="is_day" value="false" defaultChecked={album.is_day === false} />
      <Moon size={10} style={{ color: '#8090b0' }} />
      <span>NUIT</span>
    </label>
    <label style={radioLabel}>
      <input type="radio" name="is_day" value="" defaultChecked={album.is_day === null} />
      <span style={{ color: '#7a7a74' }}>—</span>
      <span>NON TAGGÉ</span>
    </label>
  </div>
</Row>
```

### Inherited vs. explicit badge decision logic (DraggablePhotoGrid)

```typescript
// photo.is_day = null, albumIsDay = true  → inherited day   → muted Sun + ¹
// photo.is_day = null, albumIsDay = false → inherited night → muted Moon + ¹
// photo.is_day = null, albumIsDay = null  → no badge
// photo.is_day = true,  any albumIsDay   → explicit day    → bright Sun + !
// photo.is_day = false, any albumIsDay   → explicit night  → bright Moon + !

function getBadgeState(photoIsDay: boolean | null, albumIsDay: boolean | null) {
  if (photoIsDay === null && albumIsDay !== null) return { type: 'inherited', value: albumIsDay };
  if (photoIsDay !== null) return { type: 'explicit', value: photoIsDay };
  return null;
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Form submit → full page reload | Server Actions + `useTransition` optimistic update | Next.js 13/14 | No full reload; admin feels instant |
| Global Supabase client | `createClient()` from `@/utils/supabase/server` per action call | Phase 1 | Server Action gets fresh client per call; no stale state |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Supabase `.update().in('id', ids)` fires a single DB round-trip for bulk updates | Supabase Query Patterns | Performance only — functional outcome unchanged; could fall back to Promise.all |
| A2 | Migration numbering follows `20240626NNNNNN` convention for next file | DB Migration Required | Migration file won't be found by `supabase db push`; easily fixed by renaming |
| A3 | `album_photos` table is missing `is_day` column in the live Supabase project | DB Migration Required | If already present, migration will be a no-op (IF NOT EXISTS); safe |

**All other claims are VERIFIED against the codebase via direct file reads or CITED from observed project patterns.**

---

## Open Questions (RESOLVED)

1. **`radioLabel` font-size conflict**
   - What we know: `radioLabel` constant in `albums/[id]/page.tsx` uses `fontSize: '0.7rem'`. UI-SPEC canonicalizes it to `0.62rem`. The constant is shared with VISIBILITÉ radios.
   - What's unclear: Whether to update the existing constant (changing VISIBILITÉ appearance) or define a new `radioLabelSm` just for the MODE JOUR/NUIT row.
   - RESOLVED: Define a new `radioLabelSm` with `fontSize: '0.62rem'` for the Phase 3 row only. This preserves existing VISIBILITÉ radio appearance without risk of visual regression.

2. **`revalidatePath` scope for album photo override**
   - What we know: `updateAlbumPhotoDay` must call `revalidatePath(\`/admin/albums/${albumId}\`)` so the admin grid re-renders. The public album slug page is `/albums/[slug]` — we don't have `slug` in the Server Action, only `albumId`.
   - What's unclear: Whether Phase 3 needs to revalidate the public album page too (since album photo is_day only affects Phase 3's admin display, not Phase 2's public filtering which operates at album level).
   - RESOLVED: Revalidate `/admin/albums/${albumId}` only. The public album photo view is not filtered by is_day (Phase 2 filters at album level, not album_photos level). No public revalidation needed for album photo overrides.

---

## Environment Availability

No new external dependencies. All tooling is existing project infrastructure.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| lucide-react | Sun/Moon icons | Yes | ^0.577.0 | — |
| Next.js Server Actions | updatePortfolioPhotoDay etc. | Yes | 16.1.6 | — |
| Supabase anon client | Server Actions | Yes | ^0.9.0 | — |
| Supabase MCP or CLI | DB migration | Check at execution time | — | supabase CLI fallback |

---

## Validation Architecture

No test framework detected in `package.json` (no vitest, jest, playwright, or similar). No test files found in `src/`. The project has zero automated tests.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed |
| Config file | None |
| Quick run command | Not applicable |
| Full suite command | `next build` (type-check + lint as proxy) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PHO-01 | Inline toggle cycles NULL→true→false→NULL | manual-only | — | ❌ no test framework |
| PHO-02 | Bulk mark updates all selected photos | manual-only | — | ❌ no test framework |
| PHO-03 | Sun/Moon badge renders correctly per is_day value | manual-only | — | ❌ no test framework |
| ALB-01 | Album edit form saves is_day via updateAlbum | manual-only | — | ❌ no test framework |
| ALB-02 | Inherited vs. explicit badge shown correctly | manual-only | — | ❌ no test framework |
| ALB-03 | AlbumSortableList rows show day/night indicator | manual-only | — | ❌ no test framework |

All phase requirements require manual verification in the admin UI. TypeScript compilation (`next build`) serves as the automated gate — it will catch: type mismatches in Server Action signatures, missing `is_day` on AlbumPhoto type after migration, prop mismatches between PortfolioAdminGrid and its caller.

### Wave 0 Gaps
No automated test framework to install. TypeScript is the primary verification mechanism.

### Sampling Rate
- **Per task commit:** `rtk tsc` (TypeScript check)
- **Phase gate:** `rtk next build` (full build including lint)

---

## Security Domain

Phase 3 is admin-only. The admin layout (`src/app/admin/layout.tsx`) already enforces authentication gate.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Inherited | Admin layout auth gate (existing) |
| V4 Access Control | yes | Server Actions run server-side; no client can bypass |
| V5 Input Validation | yes | `is_day` values parsed with explicit whitelist: only `'true'`, `'false'`, `''`/null accepted |
| V6 Cryptography | no | No crypto operations in this phase |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious `is_day` value in bulk action | Tampering | Server Action accepts only `boolean | null`; TypeScript enforces type at call site |
| Unauthorized bulk update (non-admin user) | Elevation of Privilege | Admin layout auth gate; Server Actions inherit session from cookie |
| Mass update via forged `ids` array | Tampering | Supabase RLS should restrict writes to authenticated admin users (verify RLS policy exists) |

**Note:** The existing codebase uses anon key for Server Actions (not service role). If Supabase RLS is not configured on `portfolio_photos` and `album_photos` tables to restrict writes, any authenticated user could potentially call these Server Actions. This is the same risk that exists for existing admin actions — Phase 3 does not introduce new risk, but it is worth flagging. [ASSUMED — RLS configuration not verified in this session]

---

## Sources

### Primary (HIGH confidence — direct codebase reads)
- `src/app/admin/actions.ts` — exact Server Action patterns, `updateAlbum` signature, revalidatePath usage
- `src/app/admin/portfolio/page.tsx` — current portfolio admin state, inline style constants
- `src/app/admin/_components/DraggablePhotoGrid.tsx` — exact props, delete button positioning, drag state pattern
- `src/app/admin/albums/_components/AlbumSortableList.tsx` — row render, tag constants, existing is_day availability
- `src/app/admin/albums/[id]/page.tsx` — form structure, radioLabel, VISIBILITÉ pattern, DraggablePhotoGrid call
- `src/lib/db.types.ts` — confirmed AlbumPhoto has NO is_day; Album and PortfolioPhoto DO have is_day
- `supabase/migrations/` — all 6 existing migrations read; confirmed no album_photos is_day migration
- `package.json` — confirmed lucide-react ^0.577.0 installed; no test framework present
- `src/utils/supabase/server.ts` — exact createClient pattern used by Server Actions
- `.planning/phases/03-admin-controls/03-CONTEXT.md` — 13 locked decisions
- `.planning/phases/03-admin-controls/03-UI-SPEC.md` — exact style tokens, component interaction contracts

### Secondary (MEDIUM confidence — referenced from upstream planning artifacts)
- `.planning/phases/02-photo-album-filtering/02-CONTEXT.md` — D-09 confirms AlbumPhoto intentionally excluded is_day in Phase 2

---

## Metadata

**Confidence breakdown:**
- DB schema state: HIGH — read actual migration files and db.types.ts
- Server Action patterns: HIGH — read actual actions.ts file
- Component current state: HIGH — read all 4 target component files
- Style patterns: HIGH — read UI-SPEC and confirmed against actual files
- Bulk Supabase `.in()` behavior: ASSUMED (A1) — not verified via Context7

**Research date:** 2026-07-02
**Valid until:** 2026-08-02 (stable project — no fast-moving dependencies)
