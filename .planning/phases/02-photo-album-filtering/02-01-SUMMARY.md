---
phase: 02-photo-album-filtering
plan: "01"
subsystem: data-layer
tags: [migration, typescript, is_day, schema]
dependency_graph:
  requires: []
  provides: [migration-005, db-types-is_day]
  affects: [02-02, 02-03, 02-04]
tech_stack:
  added: []
  patterns: [sql-transaction-migration, typescript-interface-extension]
key_files:
  created:
    - supabase/migrations/20240626000005_reset_is_day_to_null.sql
  modified:
    - src/lib/db.types.ts
decisions:
  - "Used portfolio_photos table name (matches application queries) rather than photos table name used in older migrations 001/004"
  - "is_day field added after alt in PortfolioPhoto and after background_url in Album per plan spec"
  - "AlbumPhoto interface intentionally unchanged per D-09"
metrics:
  duration: "~5 minutes"
  completed: "2026-07-01"
  tasks_completed: 2
  tasks_total: 2
---

# Phase 2 Plan 01: DB Migration + TypeScript Types Summary

**One-liner:** SQL migration resetting is_day to NULL on all rows, plus TypeScript interfaces updated with is_day: boolean | null on Album and PortfolioPhoto.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create migration 005 — reset is_day to NULL | 6d82bff | supabase/migrations/20240626000005_reset_is_day_to_null.sql |
| 2 | Update db.types.ts — add is_day to Album and PortfolioPhoto | 5a94eb1 | src/lib/db.types.ts |

## What Was Built

Migration `20240626000005_reset_is_day_to_null.sql` wraps two UPDATE statements in a transaction block:
- `UPDATE portfolio_photos SET is_day = NULL` — resets all portfolio photo rows
- `UPDATE albums SET is_day = NULL` — resets all album rows

This provides a clean slate for Phase 3 admin tagging (D-05).

`src/lib/db.types.ts` was updated to add `is_day: boolean | null` to:
- `Album` interface (after `background_url`)
- `PortfolioPhoto` interface (after `alt`)

`AlbumPhoto` was intentionally left without `is_day` per decision D-09.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Table name reconciliation: portfolio_photos vs photos**
- **Found during:** Task 1
- **Issue:** Existing migrations 001 and 004 reference table `photos`, but the TypeScript application code in `src/app/portfolio/page.tsx`, `src/app/admin/actions.ts`, and others consistently queries `portfolio_photos`. The plan's must_haves explicitly require `UPDATE portfolio_photos`.
- **Fix:** Used `portfolio_photos` as the table name in migration 005, consistent with the application code and the plan's explicit artifact requirements.
- **Files modified:** supabase/migrations/20240626000005_reset_is_day_to_null.sql
- **Commit:** 6d82bff

### Alignment note: is_day field spacing

The plan's verify command `grep -c "is_day: boolean | null"` will return 0 due to column-aligned spacing in `db.types.ts` (e.g., `is_day:         boolean | null`). The field is correctly present in both interfaces — the verify grep pattern is not fixed-string-aware. Both occurrences confirmed via `grep -c "is_day"`.

## Known Stubs

None — this plan creates a migration and type definitions only, no UI components.

## TypeScript Check

`tsc --noEmit` reports 1 error in `src/store/dayNightStore.ts` (TS2561: `getStorage` not in `PersistOptions`). This error is pre-existing and unrelated to any files modified by this plan. No new errors introduced.

## Threat Flags

None — migration file is static SQL with no user input. No new network endpoints, auth paths, or trust-boundary surfaces introduced.

## Self-Check: PASSED

- [x] supabase/migrations/20240626000005_reset_is_day_to_null.sql — exists, contains UPDATE portfolio_photos and UPDATE albums
- [x] src/lib/db.types.ts — contains is_day: boolean | null in Album (line 20) and PortfolioPhoto (line 48), absent from AlbumPhoto
- [x] Commit 6d82bff — exists (migration file)
- [x] Commit 5a94eb1 — exists (db.types.ts update)
