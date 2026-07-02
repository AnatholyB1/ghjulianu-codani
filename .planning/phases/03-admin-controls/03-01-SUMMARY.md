---
plan: 03-01
status: complete
phase: 03-admin-controls
subsystem: data-layer
tags: [migration, typescript, is_day, album_photos, schema]
dependency_graph:
  requires: []
  provides: [migration-007, album-photo-type-is_day]
  affects: [03-02, 03-03, 03-04, 03-05]
tech_stack:
  added: []
  patterns: [sql-if-not-exists-migration, typescript-interface-extension]
key_files:
  created:
    - supabase/migrations/20240626000007_add_album_photos_is_day.sql
  modified:
    - src/lib/db.types.ts
decisions:
  - "Used IF NOT EXISTS guard in migration for idempotency, consistent with existing migration style"
  - "is_day field placed between alt and sort_order in AlbumPhoto, matching field order in PortfolioPhoto"
  - "DEFAULT NULL chosen (not DEFAULT true) because album photos need explicit tagging — no safe default"
metrics:
  duration: "~10 minutes"
  completed: "2026-07-02"
  tasks_completed: 2
---

# Phase 03 Plan 01: Add is_day column to album_photos + update AlbumPhoto type — Summary

Added `is_day BOOLEAN DEFAULT NULL` column to album_photos table via migration `20240626000007_add_album_photos_is_day.sql`. Updated AlbumPhoto TypeScript interface to include `is_day: boolean | null`. TypeScript compiles cleanly. Migration file committed and ready for database push.

## Summary

Migration file `20240626000007_add_album_photos_is_day.sql` adds `is_day BOOLEAN DEFAULT NULL` to the `album_photos` table using `IF NOT EXISTS` guard for idempotency. The `AlbumPhoto` TypeScript interface in `src/lib/db.types.ts` was extended with `is_day: boolean | null` inserted between the `alt` and `sort_order` fields, matching the field ordering convention used in the `PortfolioPhoto` interface.

## Artifacts

- `supabase/migrations/20240626000007_add_album_photos_is_day.sql` — adds is_day column with IF NOT EXISTS guard
- `src/lib/db.types.ts` — AlbumPhoto interface now includes `is_day: boolean | null` between alt and sort_order

## Verification

- rtk tsc: passes (TypeScript compilation completed)
- supabase db push: **pending** — supabase CLI not installed on this machine; migration file is committed and must be pushed via `supabase db push` or the Supabase MCP `apply_migration` tool in the parent Claude Code session. Column verified ABSENT from remote before this plan; migration file contains the correct DDL.

## Deviations from Plan

### Auto-handled: Supabase CLI unavailable

- **Found during:** Task 2
- **Issue:** `supabase` CLI is not installed (`command not found`). The Management API requires a personal access token (not a project service role key). No `exec_sql` RPC function exists in the database. No `pg` client package in `node_modules`.
- **Fix:** The plan specifies the Supabase MCP `apply_migration` tool as the fallback, but MCP tools are stripped from spawned sub-agents (known limitation: upstream bug anthropics/claude-code#13898). The migration file is committed with correct DDL. The push step must be completed by running `supabase db push` or using the MCP `apply_migration` tool manually in the parent session.
- **Impact:** Code artifacts are complete and TypeScript compiles. Only the remote DB column creation is pending.

## Known Stubs

None — this plan creates a migration file and type definition only; no UI components or data-fetching code.

## Threat Flags

None — migration file is static DDL with no user input. No new network endpoints, auth paths, or trust-boundary surfaces introduced.

## Self-Check

- [x] `supabase/migrations/20240626000007_add_album_photos_is_day.sql` — exists, contains `ALTER TABLE album_photos ADD COLUMN IF NOT EXISTS is_day BOOLEAN DEFAULT NULL`
- [x] `src/lib/db.types.ts` — AlbumPhoto interface contains `is_day:     boolean | null` between alt and sort_order
- [x] Commit 51d336f — exists
- [x] `rtk tsc` — passes
- [ ] `supabase db push` — pending (CLI not available in sub-agent context)
