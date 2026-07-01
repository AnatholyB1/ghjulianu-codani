# Phase 3: Admin Controls - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-02
**Phase:** 3-Admin Controls
**Areas discussed:** Portfolio photo tagging, Indicator style, Bulk selection UX, Album inheritance (SC-5)

---

## Portfolio Photo Tagging

| Option | Description | Selected |
|--------|-------------|----------|
| Inline toggle on card | Small ☀/🌙 toggle icon directly on the photo card. Clicks fire a Server Action. No new page needed. | ✓ |
| New per-photo edit form | Add /admin/portfolio/[id] edit page with all photo fields including is_day. | |
| Bulk-only (no per-photo) | Skip individual toggles — all is_day tagging via bulk select only. | |

**User's choice:** Inline toggle on card

---

| Option | Description | Selected |
|--------|-------------|----------|
| Show as 'untagged' / neutral | Third visual state (grey icon/dash) for NULL. Cycles: untagged → day → night → untagged. | ✓ |
| Default to day on first click | NULL looks like 'day' visually. First click sets is_day = true explicitly. | |

**User's choice:** Neutral untagged state for NULL, three-state cycle

---

| Option | Description | Selected |
|--------|-------------|----------|
| Portfolio photos only | Album photos controlled at album level — no per-album-photo toggle. | ✓ |
| Both portfolio and album photos | Add per-photo is_day toggle inside DraggablePhotoGrid too. | |

**User's choice:** Portfolio photos only

---

## Indicator Style

| Option | Description | Selected |
|--------|-------------|----------|
| Small icon badge on card | Tiny ☀/☾ icon overlaid at top-right corner. NULL = no badge. | ✓ |
| Colored bottom border | 2px bottom border: amber = day, indigo = night, none = untagged. | |
| Text tag below image | DAY / NIGHT / — label beneath photo alt text. | |

**User's choice:** Small icon badge on card top-right

---

| Option | Description | Selected |
|--------|-------------|----------|
| Same icon, inline in the row | Small ☀/☾/— icon at end of each album row in AlbumSortableList. | ✓ |
| Colored dot in row | Small dot (amber/indigo/grey) before album title. | |

**User's choice:** Same icon inline in album list row

---

## Bulk Selection UX

| Option | Description | Selected |
|--------|-------------|----------|
| Separate 'Select' mode | 'SELECT' toggle button above grid. Checkboxes on cards when active. Bulk action bar at bottom. | ✓ |
| Click-to-toggle select | Shift+click or long-press to enter selection mode. | |

**User's choice:** Separate SELECT mode with bulk action bar

---

| Option | Description | Selected |
|--------|-------------|----------|
| Extract grid into a Client Component | PortfolioAdminGrid as 'use client' component. Server page passes photos as props. | ✓ |
| Keep server, use form checkboxes | Standard HTML checkboxes + form with bulk action. No JS. | |

**User's choice:** Extract into PortfolioAdminGrid Client Component

---

| Option | Description | Selected |
|--------|-------------|----------|
| Simple loading state | Disable buttons + "Updating..." while Server Action runs. | ✓ |
| Per-item progress | Update each photo card individually as confirmed. | |
| No progress indicator | Just wait for page revalidation. | |

**User's choice:** Simple loading state (disable + text)

---

## Album Inheritance (SC-5)

| Option | Description | Selected |
|--------|-------------|----------|
| Album toggle only — defer inheritance to Phase 4 | Just add is_day to album edit form. Inheritance logic in Phase 4. | |
| Album toggle + inheritance indicator | Album toggle + show when photo's is_day is overridden by album setting. | |
| Album toggle + full inheritance UI (ALB-02) | Full override controls per album photo, showing inherited vs. explicit. | ✓ |

**User's choice:** Full ALB-02 — badge + override toggle per photo in DraggablePhotoGrid

---

| Option | Description | Selected |
|--------|-------------|----------|
| Badge + override toggle per photo | Inherited (muted badge + ¹) vs. explicit override (highlighted badge + !). Click to override. | ✓ |
| Separate 'Exceptions' list below grid | Default = inherit album. Separate panel lists photos with explicit overrides. | |

**User's choice:** Badge per photo showing inherited vs. explicit state, click to override

---

| Option | Description | Selected |
|--------|-------------|----------|
| App-level in Server Action | album.is_day takes precedence at query logic level. No DB changes. | ✓ |
| DB-level computed column or view | Supabase view resolves effective_is_day = COALESCE(album_setting, photo_is_day). | |

**User's choice:** App-level inheritance resolution

---

## Claude's Discretion

- Icon implementation: lucide-react Sun/Moon (Phase 1 chose lucide-react — maintain consistency)
- Tri-state checkbox/toggle for album edit form: Claude picks what renders cleanly in the Server Component form pattern

## Deferred Ideas

None — discussion stayed within phase scope.
