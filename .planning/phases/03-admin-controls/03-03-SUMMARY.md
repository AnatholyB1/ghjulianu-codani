---
phase: 03
plan: "03-03"
subsystem: admin-controls
status: complete
tags: [portfolio, day-night, bulk-select, client-component]
key-files:
  created:
    - src/app/admin/_components/DayNightToggleBadge.tsx
    - src/app/admin/portfolio/_components/PortfolioAdminGrid.tsx
  modified:
    - src/app/admin/portfolio/page.tsx
decisions:
  - DayNightToggleBadge renders a transparent 18x18 button for null state to maintain a consistent click target
  - PortfolioAdminGrid owns all selection state; DayNightToggleBadge owns per-photo toggle state
  - Bulk action optimistic update reverts photos array on error and preserves selection mode
metrics:
  duration: ~10min
  completed: 2026-07-02
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 03 Plan 03: Portfolio admin grid with DayNightToggleBadge Summary

**One-liner:** Reusable 3-state DayNightToggleBadge (null→day→night→null cycle) plus PortfolioAdminGrid Client Component with bulk-select mode and optimistic updates.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create DayNightToggleBadge Client Component | 7031f2e |
| 2 | Create PortfolioAdminGrid + convert page.tsx to thin shell | 7031f2e |

## What Was Built

### DayNightToggleBadge (`src/app/admin/_components/DayNightToggleBadge.tsx`)
- `'use client'` micro-component, Props: `{ photoId: string, isDay: boolean | null }`
- 3-state cycle on click: `null → true → false → null`
- Optimistic local state update via `useState`, Server Action via `useTransition`
- Pending state: opacity 0.5, pointerEvents none — matches ConfirmButton pattern
- Null state renders transparent 18x18 button (always clickable, no visible pill)
- Day state: amber pill with `<Sun size={10} color="#c8a97e" />`
- Night state: indigo pill with `<Moon size={10} color="#8090b0" />`
- aria-labels cycle: "Marquer comme jour" / "Marquer comme nuit" / "Retirer le marquage"
- Error handling: reverts to previous state on Server Action failure

### PortfolioAdminGrid (`src/app/admin/portfolio/_components/PortfolioAdminGrid.tsx`)
- `'use client'` component, Props: `{ initialPhotos: PortfolioPhoto[] }`
- State: `photos`, `selectionMode` (boolean), `selectedIds` (Set<string>), `bulkPending` (useTransition)
- SÉLECTIONNER/ANNULER toggle button with amber active style
- Bulk action bar (visible in selectionMode): JOUR / NUIT / NON TAGGÉ buttons + counter
- Buttons disabled (opacity 0.4, pointerEvents none) when no selection or during pending
- `handleBulkUpdate`: optimistic photo is_day update → Server Action → clear selection on success → revert + error message on failure
- Card: checkbox overlay (top-left 14x14px) in selection mode; amber fill when selected; card outline + bg tint on selection
- Normal mode: DayNightToggleBadge at top-right (right: 26px) + ConfirmButton delete at top-right (right: 3px)
- Selection mode hides badges and delete buttons

### portfolio/page.tsx (thin shell)
- Removed: inline grid, ConfirmButton import, style constants (formCol, labelS, inputS, btnPrimary, btnDelete)
- Kept: Supabase fetch query (unchanged), AddPortfolioPhotoForm, header section, 2-column layout
- Added: `import PortfolioAdminGrid` + `<PortfolioAdminGrid initialPhotos={photos ?? []} />`

## Deviations from Plan

None — plan executed exactly as written. TypeScript exits 0.

## Self-Check: PASSED

- FOUND: src/app/admin/_components/DayNightToggleBadge.tsx
- FOUND: src/app/admin/portfolio/_components/PortfolioAdminGrid.tsx
- FOUND: src/app/admin/portfolio/page.tsx
- FOUND commit: 7031f2e
