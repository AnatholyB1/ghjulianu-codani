# Phase 3: Admin Controls - Pattern Map

**Mapped:** 2026-07-02
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `supabase/migrations/20240626000007_add_album_photos_is_day.sql` | migration | batch | `supabase/migrations/20240626000001_add_is_day_to_photos.sql` | exact |
| `src/lib/db.types.ts` | model | transform | `src/lib/db.types.ts` (self — Album interface as template) | exact |
| `src/app/admin/actions.ts` | service | request-response | `src/app/admin/actions.ts` (self — deletePortfolioPhoto / updateAlbum patterns) | exact |
| `src/app/admin/portfolio/page.tsx` | controller (Server Component) | request-response | `src/app/admin/albums/page.tsx` (thin-shell pattern with Client Component child) | exact |
| `src/app/admin/portfolio/_components/PortfolioAdminGrid.tsx` | component (Client) | CRUD + event-driven | `src/app/admin/albums/_components/AlbumSortableList.tsx` | exact |
| `src/app/admin/_components/DayNightToggleBadge.tsx` | component (Client) | event-driven | `src/app/admin/_components/ConfirmButton.tsx` (useTransition + optimistic) | role-match |
| `src/app/admin/_components/DraggablePhotoGrid.tsx` | component (Client) | CRUD | `src/app/admin/_components/DraggablePhotoGrid.tsx` (self — extend) | exact |
| `src/app/admin/albums/_components/AlbumSortableList.tsx` | component (Client) | CRUD | `src/app/admin/albums/_components/AlbumSortableList.tsx` (self — extend) | exact |
| `src/app/admin/albums/[id]/page.tsx` | controller (Server Component) | request-response | `src/app/admin/albums/[id]/page.tsx` (self — extend) | exact |

---

## Pattern Assignments

### `supabase/migrations/20240626000007_add_album_photos_is_day.sql` (migration, batch)

**Analog:** `supabase/migrations/20240626000001_add_is_day_to_photos.sql`

**Migration file pattern** — read the analog to confirm naming and SQL style:

```sql
-- Naming convention: 20240626000007_add_album_photos_is_day.sql
-- All existing migrations use ALTER TABLE ... ADD COLUMN IF NOT EXISTS ... DEFAULT NULL
ALTER TABLE album_photos ADD COLUMN IF NOT EXISTS is_day BOOLEAN DEFAULT NULL;
```

**Key detail:** Use `IF NOT EXISTS` to make the migration idempotent (assumption A3 in RESEARCH.md — the column may already exist in some environments).

---

### `src/lib/db.types.ts` (model, transform)

**Analog:** `src/lib/db.types.ts` — existing `Album` interface (lines 10-29) as template for the `is_day` field shape.

**Current `AlbumPhoto` interface** (lines 31-40 — MODIFY this block):
```typescript
export interface AlbumPhoto {
  id:         string;
  album_id:   string;
  src:        string;
  width:      number;
  height:     number;
  alt:        string | null;
  sort_order: number;
  created_at: string;
}
```

**Target shape after Phase 3** — copy `is_day` field position from `Album` (line 20) and `PortfolioPhoto` (line 48):
```typescript
export interface AlbumPhoto {
  id:         string;
  album_id:   string;
  src:        string;
  width:      number;
  height:     number;
  alt:        string | null;
  is_day:     boolean | null;   // ADD — same type as Album.is_day and PortfolioPhoto.is_day
  sort_order: number;
  created_at: string;
}
```

**Field alignment pattern:** All three table types (`Album`, `PortfolioPhoto`, `AlbumPhoto`) use the exact same declaration `is_day: boolean | null` — place it before `sort_order` for visual consistency with `PortfolioPhoto`.

---

### `src/app/admin/actions.ts` (service, request-response)

**Analog:** `src/app/admin/actions.ts` — self file. Three patterns to copy from:

**Imports block** (lines 1-8 — unchanged, shown for context):
```typescript
'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
```

**Core single-row update pattern** (lines 211-217 — `deletePortfolioPhoto` as nearest shape):
```typescript
export async function deletePortfolioPhoto(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('portfolio_photos').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}
```

Copy this skeleton for **`updatePortfolioPhotoDay`** and **`updateAlbumPhotoDay`** — replace `.delete()` with `.update({ is_day: isDay })`:
```typescript
export async function updatePortfolioPhotoDay(id: string, isDay: boolean | null) {
  const supabase = await createClient();
  const { error } = await supabase.from('portfolio_photos').update({ is_day: isDay }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}

export async function updateAlbumPhotoDay(id: string, albumId: string, isDay: boolean | null) {
  const supabase = await createClient();
  const { error } = await supabase.from('album_photos').update({ is_day: isDay }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/albums/${albumId}`);
  // No public revalidation needed — public album filtering is at album level, not photo level
}
```

**Bulk update pattern** — extend from `reorderAlbumPhotos` upsert (lines 178-187) but use `.in()` instead of upsert:
```typescript
export async function bulkUpdatePortfolioPhotoDay(ids: string[], isDay: boolean | null) {
  const supabase = await createClient();
  const { error } = await supabase.from('portfolio_photos').update({ is_day: isDay }).in('id', ids);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
}
```

**Extending `updateAlbum`** (lines 82-105 — CRITICAL: preserve access_key logic at lines 93-95):
```typescript
// Lines 82-100 of updateAlbum — copy structure, add is_day parsing after is_public line:
export async function updateAlbum(id: string, formData: FormData) {
  const supabase    = await createClient();
  // ... existing field parsing (lines 84-91) ...
  const is_public   = formData.get('is_public') === 'true';
  // ADD THESE TWO LINES after is_public:
  const isDayRaw    = formData.get('is_day') as string | null;
  const is_day      = isDayRaw === 'true' ? true : isDayRaw === 'false' ? false : null;

  // Lines 93-95 — MUST preserve this block exactly:
  const { data: current } = await supabase.from('albums').select('access_key').eq('id', id).single();
  const access_key = is_public ? null : (current?.access_key ?? generateAccessCode());

  // Line 97-100 — add is_day to update object:
  const { error } = await supabase
    .from('albums')
    .update({ title, year, location, category_id, description, cover_url, background_url: bg_url, is_public, access_key, is_day })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/albums');
  revalidatePath(`/admin/albums/${id}`);   // ADD: so album edit page re-renders after save
  revalidatePath('/albums');
}
```

---

### `src/app/admin/portfolio/page.tsx` (controller, request-response — MODIFY to thin shell)

**Analog:** `src/app/admin/albums/page.tsx` — thin Server Component that fetches and passes `initialAlbums` to `AlbumSortableList`.

**Current portfolio page structure** (lines 1-69 — read in full above). The fetch query (lines 9-13) stays unchanged:
```typescript
const { data: photos } = await supabase
  .from('portfolio_photos')
  .select('*')
  .order('sort_order')
  .order('created_at', { ascending: false });
```

**Inline style constants to KEEP** (lines 61-68 — used by the header section that remains):
```typescript
const subLabel:   React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.22em', color: '#7a7a74', marginBottom: '0.4rem' };
const pageTitle:  React.CSSProperties = { fontFamily: 'var(--font-cormorant,serif)', fontSize: '2rem', fontStyle: 'italic', fontWeight: 300, color: '#E8E4DC' };
const card:       React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '1.5rem' };
const cardTitle:  React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74' };
```

**Constants to REMOVE** (no longer needed in page — they move to `PortfolioAdminGrid`):
`formCol`, `labelS`, `inputS`, `btnPrimary` — these live in the form components, not the page shell.

**Phase 3 replacement** — the inner grid div (lines 30-56) replaced by:
```typescript
// ADD import at top:
import PortfolioAdminGrid from './_components/PortfolioAdminGrid';

// REPLACE lines 30-56 with:
<PortfolioAdminGrid initialPhotos={photos ?? []} />
```

`AddPortfolioPhotoForm` import and render stay. Two-column layout grid stays.

---

### `src/app/admin/portfolio/_components/PortfolioAdminGrid.tsx` (component, CRUD + event-driven — NEW)

**Primary analog:** `src/app/admin/albums/_components/AlbumSortableList.tsx` (lines 1-175) — same exact pattern: `'use client'`, receives `initial*` prop, owns all interaction state, imports actions from `../../actions`.

**Secondary analog:** `src/app/admin/_components/DraggablePhotoGrid.tsx` (lines 1-171) — grid layout, card structure with `position: 'relative'`, `aspectRatio: '1'`, per-card absolute-positioned buttons.

**Imports pattern** (copy from AlbumSortableList lines 1-7, adapt):
```typescript
'use client';

import { useState, useTransition } from 'react';
import type { PortfolioPhoto }       from '@/lib/db.types';
import ConfirmButton                 from '../../_components/ConfirmButton';
import DayNightToggleBadge           from '../../_components/DayNightToggleBadge';
import { deletePortfolioPhoto, bulkUpdatePortfolioPhotoDay } from '../../actions';
```

**Props + state pattern** (copy AlbumSortableList lines 11-15, adapt):
```typescript
export default function PortfolioAdminGrid({ initialPhotos }: { initialPhotos: PortfolioPhoto[] }) {
  const [photos,        setPhotos]        = useState<PortfolioPhoto[]>(initialPhotos);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [bulkPending,   startBulkTrans]   = useTransition();
```

**Bulk action handler pattern** (copy from AlbumSortableList's `onDragEnd` useTransition pattern, lines 39-46, adapt):
```typescript
  function handleBulkUpdate(isDay: boolean | null) {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    startBulkTrans(async () => {
      try {
        await bulkUpdatePortfolioPhotoDay(ids, isDay);
        setSelectedIds(new Set());
        setSelectionMode(false);
      } catch {
        // keep selection mode active on error — see RESEARCH.md Pitfall 7
      }
    });
  }
```

**Card grid layout** (copy from DraggablePhotoGrid lines 78-84):
```typescript
<div style={{
  display:             'grid',
  gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))',  // 140px matches original portfolio page
  gap:                 '4px',
}}>
```

**Per-card structure** (copy from DraggablePhotoGrid card div pattern, lines 90-153):
```typescript
<div key={photo.id} style={{ position: 'relative', background: '#1a1a1a' }}>
  <img src={photo.src} alt={photo.alt ?? ''} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
  {/* DayNightToggleBadge — hidden in selection mode */}
  {/* ConfirmButton delete — hidden in selection mode */}
  {/* checkbox overlay — only in selection mode */}
  {/* bottom info bar */}
</div>
```

**Delete button positioning** (copy from portfolio page lines 41-46 — ConfirmButton inline style):
```typescript
// Delete at right: '3px', top: '3px'
// DayNightToggleBadge at right: '26px', top: '3px'  ← 20px button + 3px offset + 3px buffer
```

**Inline style constants** (append to bottom of file — copy `tag`, `btnEdit`, `btnDelete` naming convention from AlbumSortableList lines 172-174):
```typescript
// From RESEARCH.md Admin UI Style Patterns section — exact values:
const btnSelectMode:       React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#E8E4DC', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'inherit' };
const btnSelectModeActive: React.CSSProperties = { ...btnSelectMode, border: '1px solid rgba(200,169,126,0.4)', color: '#c8a97e' };
const bulkBar:             React.CSSProperties = { background: '#0e0e0e', border: '1px solid rgba(255,255,255,0.07)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' };
const btnBulkDay:          React.CSSProperties = { background: 'transparent', border: '1px solid rgba(200,169,126,0.4)', color: '#c8a97e', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const btnBulkNight:        React.CSSProperties = { background: 'transparent', border: '1px solid rgba(120,140,180,0.4)', color: '#8090b0', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const btnBulkUntagged:     React.CSSProperties = { background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#E8E4DC', padding: '0.25rem 0.75rem', fontSize: '0.62rem', letterSpacing: '0.14em', cursor: 'pointer', fontFamily: 'inherit' };
const bulkCounter:         React.CSSProperties = { marginLeft: 'auto', fontSize: '0.58rem', letterSpacing: '0.1em', color: '#7a7a74' };
const cardTitle:           React.CSSProperties = { fontSize: '0.58rem', letterSpacing: '0.18em', color: '#7a7a74' };
```

---

### `src/app/admin/_components/DayNightToggleBadge.tsx` (component, event-driven — NEW)

**Primary analog:** `src/app/admin/_components/ConfirmButton.tsx` (lines 1-30) — same micro-component pattern: `'use client'`, single `useTransition`, disabled + opacity-0.5 pending state.

**Imports pattern** (copy ConfirmButton lines 1-3, extend):
```typescript
'use client';

import { useState, useTransition } from 'react';
import { Sun, Moon }                from 'lucide-react';
import { updatePortfolioPhotoDay }  from '@/app/admin/actions';
```

**Props + state pattern** (ConfirmButton Props interface lines 5-9 as template):
```typescript
export default function DayNightToggleBadge({ photoId, isDay: initial }: { photoId: string; isDay: boolean | null }) {
  const [value,     setValue]    = useState<boolean | null>(initial);
  const [isPending, startTrans]  = useTransition();
```

**Core pattern** (copy ConfirmButton handleClick lines 15-17, adapt to optimistic):
```typescript
  function handleClick() {
    const next = value === null ? true : value === true ? false : null;
    setValue(next);        // optimistic update
    startTrans(async () => {
      try {
        await updatePortfolioPhotoDay(photoId, next);
      } catch {
        setValue(value);   // revert on error
      }
    });
  }
```

**Pending state** (copy ConfirmButton line 26 — `opacity: pending ? 0.5 : 1, pointerEvents` pattern):
```typescript
// Applied to the button element:
style={{ ...pillStyle, opacity: isPending ? 0.5 : 1, pointerEvents: isPending ? 'none' : 'auto' }}
```

**Inline style constants** (from RESEARCH.md Badge styles section):
```typescript
// NULL state: transparent 18×18 click target (always rendered — no pill)
const btnNull: React.CSSProperties = {
  background: 'transparent', border: 'none', width: '18px', height: '18px', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
};
// Day state pill:
const pillDay: React.CSSProperties = {
  background: 'rgba(200,169,126,0.15)', border: '1px solid rgba(200,169,126,0.35)', borderRadius: '2px',
  padding: '2px 4px', display: 'flex', alignItems: 'center', cursor: 'pointer', width: '18px', height: '18px', justifyContent: 'center',
};
// Night state pill: same but rgba(120,140,180,0.15) / rgba(120,140,180,0.35)
const pillNight: React.CSSProperties = {
  background: 'rgba(120,140,180,0.15)', border: '1px solid rgba(120,140,180,0.35)', borderRadius: '2px',
  padding: '2px 4px', display: 'flex', alignItems: 'center', cursor: 'pointer', width: '18px', height: '18px', justifyContent: 'center',
};
```

**Positioning note:** This component renders only the pill/button element itself. The caller (`PortfolioAdminGrid`) wraps it in `<div style={{ position: 'absolute', top: '3px', right: '26px' }}>`.

---

### `src/app/admin/_components/DraggablePhotoGrid.tsx` (component, CRUD — MODIFY)

**Analog:** Self file (lines 1-171 — read in full above).

**Props interface** (lines 8-11 — MODIFY):
```typescript
// CURRENT:
interface Props {
  photos:  AlbumPhoto[];
  albumId: string;
}
// AFTER:
interface Props {
  photos:    AlbumPhoto[];
  albumId:   string;
  albumIsDay?: boolean | null;   // ADD — parent album's is_day for inheritance badge
}
```

**Import additions** (after line 5 — `import type { AlbumPhoto }`):
```typescript
import { Sun, Moon }          from 'lucide-react';
import { updateAlbumPhotoDay } from '../actions';
```

**Second useTransition** (add alongside existing line 25):
```typescript
const [isPending,    startTrans]    = useTransition();   // existing — drag reorder
const [badgePending, startBadgeTrans] = useTransition(); // ADD — for badge Server Action
```

**Badge render** (insert inside card div, after position badge at lines 119-131, before delete button at lines 133-153):

Badge decision logic (from RESEARCH.md Code Examples):
```typescript
// photo.is_day = null, albumIsDay != null → inherited badge
// photo.is_day != null                    → explicit override badge
// both null                               → no badge
const badgeState = photo.is_day !== null
  ? { type: 'explicit' as const, value: photo.is_day }
  : (albumIsDay != null
      ? { type: 'inherited' as const, value: albumIsDay }
      : null);
```

Badge position (from RESEARCH.md — must not conflict with delete button at `top: '3px', right: '3px'`):
```typescript
<div style={{ position: 'absolute', bottom: '3px', right: '3px' }}>
  {/* badge content */}
</div>
```

**Inline style constants** (append to file after existing `hint` constant at line 166):
```typescript
// From RESEARCH.md Badge styles (DraggablePhotoGrid inheritance — bottom-right):
const badgeDay: React.CSSProperties = {
  position: 'absolute', bottom: '3px', right: '3px',
  background: 'rgba(200,169,126,0.15)', border: '1px solid rgba(200,169,126,0.35)',
  borderRadius: '2px', padding: '2px 4px', fontSize: '0.58rem',
  display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer',
};
const badgeNight: React.CSSProperties = {
  ...badgeDay,
  background: 'rgba(120,140,180,0.15)', border: '1px solid rgba(120,140,180,0.35)',
};
const badgeInherited: React.CSSProperties = {
  position: 'absolute', bottom: '3px', right: '3px',
  background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
  borderRadius: '2px', padding: '2px 4px', fontSize: '0.58rem',
  display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', opacity: 0.7,
};
const badgeReset: React.CSSProperties = {
  ...badgeInherited, color: '#e07070', opacity: 1,
};
```

---

### `src/app/admin/albums/_components/AlbumSortableList.tsx` (component, CRUD — MODIFY)

**Analog:** Self file (lines 1-175 — read in full above).

**Import addition** (after line 7 — `import ConfirmButton`):
```typescript
import { Sun, Moon } from 'lucide-react';
```

**Target location for new span** (lines 123-129 — the info `<div>` with tags):
```typescript
// CURRENT (lines 123-129):
<div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
  {album.year     && <span style={tag}>{album.year}</span>}
  {album.category && <span style={tag}>{album.category.name}</span>}
  <span style={{ ...tag, color: album.is_public ? '#6dbf7a' : '#c8a97e' }}>
    {album.is_public ? '● PUBLIC' : '🔒 PRIVÉ'}
  </span>
  <span style={{ ...tag, color: 'rgba(122,122,116,0.4)' }}>#{album.sort_order}</span>
</div>

// AFTER — insert is_day span after is_public span (before sort_order span):
<div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
  {album.year     && <span style={tag}>{album.year}</span>}
  {album.category && <span style={tag}>{album.category.name}</span>}
  <span style={{ ...tag, color: album.is_public ? '#6dbf7a' : '#c8a97e' }}>
    {album.is_public ? '● PUBLIC' : '🔒 PRIVÉ'}
  </span>
  {/* ADD: day/night indicator */}
  {album.is_day === true  && <span style={{ ...tag, color: '#c8a97e', display: 'flex', alignItems: 'center' }}><Sun size={9} /></span>}
  {album.is_day === false && <span style={{ ...tag, color: '#8090b0', display: 'flex', alignItems: 'center' }}><Moon size={9} /></span>}
  {album.is_day === null  && <span style={{ ...tag, color: 'rgba(122,122,116,0.4)' }}>—</span>}
  <span style={{ ...tag, color: 'rgba(122,122,116,0.4)' }}>#{album.sort_order}</span>
</div>
```

**No new style constants needed** — the `tag` constant (line 172) covers all three states with inline color overrides per existing pattern.

---

### `src/app/admin/albums/[id]/page.tsx` (controller, request-response — MODIFY)

**Analog:** Self file (lines 1-149 — read in full above).

**Import addition** (after line 9 — `import DraggablePhotoGrid`):
```typescript
import { Sun, Moon } from 'lucide-react';
```

**`DraggablePhotoGrid` call change** (line 122):
```typescript
// CURRENT:
<DraggablePhotoGrid photos={photos ?? []} albumId={id} />
// AFTER:
<DraggablePhotoGrid photos={photos ?? []} albumId={id} albumIsDay={album.is_day} />
```

**New form row — MODE JOUR/NUIT** (insert after VISIBILITÉ `<Row>` block ending at line 98, before ENREGISTRER button at line 99):
```typescript
<Row label="MODE JOUR/NUIT">
  <div style={{ display: 'flex', gap: '1.5rem' }}>
    <label style={radioLabelSm}>
      <input type="radio" name="is_day" value="true" defaultChecked={album.is_day === true} />
      <Sun size={10} style={{ color: '#c8a97e' }} />
      <span>JOUR</span>
    </label>
    <label style={radioLabelSm}>
      <input type="radio" name="is_day" value="false" defaultChecked={album.is_day === false} />
      <Moon size={10} style={{ color: '#8090b0' }} />
      <span>NUIT</span>
    </label>
    <label style={radioLabelSm}>
      <input type="radio" name="is_day" value="" defaultChecked={album.is_day === null} />
      <span style={{ color: '#7a7a74' }}>—</span>
      <span>NON TAGGÉ</span>
    </label>
  </div>
</Row>
```

**New style constant** (append to constants block at bottom, after existing `radioLabel` at line 148):
```typescript
// NEW — separate from radioLabel to avoid changing VISIBILITÉ radio appearance
const radioLabelSm: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.62rem', color: '#E8E4DC', cursor: 'pointer', letterSpacing: '0.1em' };
```

**CRITICAL:** Do NOT modify the existing `radioLabel` constant (line 148) — it is shared by VISIBILITÉ radios and changing its `fontSize` from `0.7rem` to `0.62rem` would be a visual regression.

---

## Shared Patterns

### Server Action boilerplate
**Source:** `src/app/admin/actions.ts` lines 30-37 (`createCategory` as simplest example)
**Apply to:** All three new Server Actions (`updatePortfolioPhotoDay`, `bulkUpdatePortfolioPhotoDay`, `updateAlbumPhotoDay`)
```typescript
const supabase = await createClient();
const { error } = await supabase.from('TABLE').update({ FIELD }).eq('id', ID);
if (error) throw new Error(error.message);
revalidatePath('/admin/PATH');
revalidatePath('/public/PATH');   // omit for album_photos — no public filter at that level
```

### useTransition optimistic update
**Source:** `src/app/admin/_components/DraggablePhotoGrid.tsx` lines 25 + 58 + 74
**Apply to:** `PortfolioAdminGrid.tsx`, `DayNightToggleBadge.tsx`, `DraggablePhotoGrid.tsx` (badge handler)
```typescript
const [isPending, startTrans] = useTransition();
// optimistic: update local state first
setState(next);
// then fire Server Action inside transition
startTrans(() => serverAction(id, next));
// pending indicator: isPending && <span style={{ color: '#c8a97e' }}>SAUVEGARDE…</span>
```

### Inline style constants convention
**Source:** `src/app/admin/albums/_components/AlbumSortableList.tsx` lines 172-174
**Apply to:** All new and modified components
```typescript
// Constants defined at BOTTOM of file (after component function)
// Named in camelCase, typed as React.CSSProperties
// Zero Tailwind, zero shadcn
const tag:       React.CSSProperties = { ... };
const btnEdit:   React.CSSProperties = { ... };
const btnDelete: React.CSSProperties = { ... };
```

### Day/Night color tokens
**Source:** `src/app/admin/albums/_components/AlbumSortableList.tsx` lines 126-127 (amber for is_public) + RESEARCH.md
**Apply to:** All badge/indicator renders across all modified files
```
Day   → color: '#c8a97e'  (amber)   — Sun icon, day pill border/bg tint
Night → color: '#8090b0'  (indigo)  — Moon icon, night pill border/bg tint
NULL  → color: '#7a7a74'  (muted)   — dash, no badge, or greyed icon
```

### revalidatePath dual-path rule
**Source:** `src/app/admin/actions.ts` lines 199-201 (`addPortfolioPhoto`), lines 103-104 (`updateAlbum`)
**Apply to:** All Server Actions that write to public-facing tables
```typescript
// After every mutation on portfolio_photos:
revalidatePath('/admin/portfolio');
revalidatePath('/portfolio');
// After every mutation on albums:
revalidatePath('/admin/albums');
revalidatePath('/albums');
// After album_photos mutation (no public revalidation needed — public filter is at album level):
revalidatePath(`/admin/albums/${albumId}`);
```

---

## No Analog Found

All files have close analogs in the existing codebase.

---

## Metadata

**Analog search scope:** `src/app/admin/`, `src/lib/`, `supabase/migrations/`
**Files scanned:** 7 source files + 6 migration files
**Pattern extraction date:** 2026-07-02
