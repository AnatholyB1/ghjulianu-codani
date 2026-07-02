---
phase: 03-admin-controls
plan: "04"
subsystem: album-admin-ui
tags: [day-night, album-list, album-edit, indicators, radio, props]
dependency_graph:
  requires: [03-01, 03-02]
  provides: [album-list-indicators, album-edit-mode-jour-nuit, albumIsDay-prop]
  affects: [src/app/admin/albums/_components/AlbumSortableList.tsx, src/app/admin/albums/[id]/page.tsx, src/app/admin/_components/DraggablePhotoGrid.tsx]
tech_stack:
  added: []
  patterns: [lucide-react icons in list rows, tri-state radio for nullable boolean, prop pass-through for Plan 05]
key_files:
  modified:
    - src/app/admin/albums/_components/AlbumSortableList.tsx
    - src/app/admin/albums/[id]/page.tsx
    - src/app/admin/_components/DraggablePhotoGrid.tsx
decisions:
  - radioLabelSm defined as separate constant (0.62rem) to avoid visual regression on existing radioLabel (0.7rem)
  - albumIsDay passed as optional prop to DraggablePhotoGrid; Plan 05 will consume it
metrics:
  completed: "2026-07-02"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 03 Plan 04: Album list indicators and edit form MODE JOUR/NUIT Summary

**One-liner:** Sun/Moon/dash indicators in album list rows and tri-state JOUR/NUIT/NON TAGUÉ radio in album edit form, with albumIsDay prop wired to DraggablePhotoGrid.

## Tasks Completed

### Task 1: Add day/night indicator to AlbumSortableList rows
- Added `import { Sun, Moon } from 'lucide-react'` to AlbumSortableList.tsx
- Inserted three conditional spans between the is_public span and sort_order span:
  - `album.is_day === true`: Sun icon (size 9, color #c8a97e)
  - `album.is_day === false`: Moon icon (size 9, color #8090b0)
  - `album.is_day === null`: dash character (color rgba(122,122,116,0.4))
- Read-only indicator — no new state or event handlers

### Task 2: Add MODE JOUR/NUIT radio and albumIsDay prop to album edit page
- Added `import { Sun, Moon } from 'lucide-react'` to albums/[id]/page.tsx
- Added Row with label 'MODE JOUR/NUIT' containing three radio inputs (name='is_day', values 'true'/'false'/'')
- `defaultChecked` logic: `album.is_day === true` / `=== false` / `=== null`
- Added `radioLabelSm` constant (fontSize 0.62rem) separate from existing `radioLabel` (0.7rem unchanged)
- DraggablePhotoGrid call updated: `albumIsDay={album.is_day}` prop added
- DraggablePhotoGrid Props interface: added `albumIsDay?: boolean | null`

## Verification

- `rtk tsc` exits 0 — TypeScript compilation passes

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — albumIsDay prop is wired but not yet consumed by DraggablePhotoGrid (Plan 05 will add the inheritance badge UI).

## Self-Check: PASSED

- AlbumSortableList.tsx: Sun/Moon import present, three is_day conditional spans in place
- albums/[id]/page.tsx: Sun/Moon import, MODE JOUR/NUIT row, radioLabelSm, DraggablePhotoGrid albumIsDay prop
- DraggablePhotoGrid.tsx: albumIsDay?: boolean | null in Props interface
- All changes confirmed in git commit 7031f2e
