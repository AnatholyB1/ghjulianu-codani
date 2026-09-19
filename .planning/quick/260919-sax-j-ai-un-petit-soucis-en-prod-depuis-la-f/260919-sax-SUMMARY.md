---
slug: sax-import-perf-diagnostic
status: complete
date: 2026-09-19
subsystem: admin-uploads
tags: [next.js, image-compression, server-actions, performance]

key-files:
  created:
    - .planning/quick/260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/260919-sax-REPORT.md
  modified:
    - src/app/admin/_components/ImageUploadField.tsx
    - src/app/admin/_components/MultiImageUpload.tsx

key-decisions:
  - "Restored the exact pre-d4ee7ba compression pattern in ImageUploadField.tsx rather than a new implementation, matching the still-live pattern in MultiImageUpload.tsx"
  - "Bounded bulk-upload concurrency to 3 (not unbounded Promise.all) to avoid overwhelming the Supabase Storage Server Action"
  - "Did not touch next/image conversion (Root Cause B) or backfill of already-uploaded oversized covers — flagged as follow-up recommendations, not auto-applied, due to layout/QA risk"

commit: b1b73ce
---

# Summary — sax-import-perf-diagnostic

**Restored client-side image compression (removed by commit d4ee7ba) on album cover/background uploads, and parallelized bulk gallery photo upload from sequential to 3-way concurrent batches.**

## Performance

- **Tasks:** 3/3 completed
- **Files modified:** 2 code files + 1 report

## Accomplishments

- Identified and confirmed with git evidence that commit `d4ee7ba` (2026-07-02) is the direct
  cause of album cover/background upload failures — it removed the `compressImage` call in
  `ImageUploadField.tsx`, causing large originals to exceed the `10mb` `serverActions.bodySizeLimit`
  configured in `next.config.ts`.
- Confirmed the recent theme/UX commit cluster (`8a1a6f6`, `d8267ee`, `3969ff2`, `d4ee7ba`,
  `f9c303d`) never addressed upload/loading performance — one of them caused this regression.
- Restored compression in `ImageUploadField.tsx` for both `album-covers` and `album-backgrounds`
  buckets, mirroring the pattern still live in `MultiImageUpload.tsx`.
- Parallelized `MultiImageUpload.tsx`'s `handleUploadAll()` from a sequential `for` loop to
  bounded-concurrency batches of 3, cutting bulk-import wall time for large albums.
- Wrote a French diagnostic report (`260919-sax-REPORT.md`) covering all three reported symptoms,
  root causes with commit/file/line evidence, fix status, and prioritized remaining
  recommendations.

## Task Commits

Each task was committed atomically:

1. **Task 1: Restore compression on album cover/background uploads (Root Cause A fix)** - `59bc180` (fix)
2. **Task 2: Parallelize bulk gallery photo upload (Root Cause C fix)** - `eaa270d` (perf)
3. **Task 3: Write diagnostic report** - `b1b73ce` (docs)

_Note: this is a quick task, not a phase plan — no separate plan-metadata commit follows._

## Files Created/Modified

- `src/app/admin/_components/ImageUploadField.tsx` - re-added `compressImage`/`getBucketPreset`/`formatSize` import, `savings` state, and compress-before-upload logic in `handleFile()`; restored the "-X%" savings label
- `src/app/admin/_components/MultiImageUpload.tsx` - extracted per-item compress+upload logic into `processItem(item)`, replaced sequential `for` loop with `Promise.all` batches of 3 in `handleUploadAll()`
- `.planning/quick/260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/260919-sax-REPORT.md` - French diagnostic report (created)

## Decisions Made

- Used the exact pre-regression implementation shape specified in the plan's `<interfaces>`
  section rather than inventing a new compression flow, since it was already proven in
  production and matches the still-working sibling component.
- Chose concurrency = 3 for bulk uploads (per plan spec) as a bounded value that speeds up
  large-album imports without risking Supabase Storage rate limiting from unbounded parallelism.

## Deviations from Plan

None - plan executed exactly as written. Both code fixes matched the `<interfaces>` reference
implementation and task `<action>` specs; `rtk npx tsc --noEmit` reported no new type errors
after each task.

## Issues Encountered

None. The quick-task plan directory `260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/` existed
only in the main repository checkout (untracked) and not yet in this worktree at spawn time — the
plan and supporting evidence were read directly from the main repo path
(`C:\ghjulianu-codani\.planning\quick\...`), and all code/report outputs were written and
committed inside this worktree as required.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Both applied fixes are self-contained, scoped to one file each, and verified with `tsc`.
- Symptom 3 (slow public image loading) is only partially addressed — the `<img>` vs `next/image`
  bypass in `AlbumsDragTrack.tsx` and `AlbumPageClient.tsx`, and the backfill of already-uploaded
  oversized covers/backgrounds, remain open follow-ups documented with priority in the report
  (section 5, recommendations a-d).
- No blockers for shipping these two fixes; recommend scheduling recommendation (a) (next/image
  conversion) as the next highest-priority follow-up given it affects every public album page
  visitor, not just admins.

---
*Quick task: 260919-sax*
*Completed: 2026-09-19*

## Self-Check: PASSED

- FOUND: src/app/admin/_components/ImageUploadField.tsx
- FOUND: src/app/admin/_components/MultiImageUpload.tsx
- FOUND: .planning/quick/260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/260919-sax-REPORT.md
- FOUND: commit 59bc180 (Task 1)
- FOUND: commit eaa270d (Task 2)
- FOUND: commit b1b73ce (Task 3)
