---
slug: sax-import-perf-diagnostic
date: 2026-09-19
status: pending
files_modified:
  - src/app/admin/_components/ImageUploadField.tsx
  - src/app/admin/_components/MultiImageUpload.tsx
  - .planning/quick/260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/260919-sax-REPORT.md
autonomous: true
---

<objective>
Diagnose the production regression reported by the user (French): depuis fin août, l'import des
miniatures d'album échoue pour beaucoup d'albums, l'import des images est lent, et le chargement
des images dans l'app semble lent. Confirm root causes with git evidence, verify whether the
recent theme/album/UX commits already fixed anything relevant (they did not — one of them is the
actual regression source), apply the two obvious low-risk fixes found, and produce a written
diagnostic report with prioritized, applicable solutions for what remains unaddressed.

Purpose: Stop silent upload failures on large album cover/background photos and give the user a
clear, evidence-based answer to "est-ce que nos solutions appliquées marchent correctement ?"
(no — this repo has never had a fix targeting this; one commit is the cause).
Output: `260919-sax-REPORT.md` + two applied code fixes (cover/background compression restored,
bulk photo upload parallelized).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/PROJECT.md
@.planning/perf-notes.md

<!-- perf-notes.md is Phase 4 DB/bundle-size validation (PER-01/02/03) — it covers query and
bundle performance only, NOT image upload/import pipeline or unoptimized <img> thumbnails.
It is NOT relevant to this issue beyond confirming no prior work touched this area. -->

## Confirmed Findings (already investigated — do not re-run full discovery, spot-check only)

### Root Cause A — cover/background upload compression was deliberately removed
`src/app/admin/_components/ImageUploadField.tsx` is used for the album "MINIATURE (COVER)" field
(`bucket="album-covers"`) and "PHOTO DE FOND" field (`bucket="album-backgrounds"`) in
`src/app/admin/albums/[id]/page.tsx` (lines 82-87).

Commit `d4ee7ba` ("feat(hotfix): theme scoped to portfolio, albums two-row layout, quality & UX
fixes") removed the `compressImage`/`getBucketPreset`/`formatSize` import and call from
`ImageUploadField.tsx`, with the commit message explicitly stating: "Image uploads skip all
compression — original quality preserved." Since that commit, `handleFile()` calls
`uploadFile(bucket, file)` directly with the **original, unresized, unrecompressed file** the
photographer selected.

Consequence: modern camera/phone photos (routinely 5-20MB+, sometimes HEIC) are uploaded as-is.
`next.config.ts` sets `experimental.serverActions.bodySizeLimit: '10mb'` — any cover/background
photo above that silently fails the Server Action with a body-size error, surfaced to the admin
only as the generic `'Échec de l\'upload. Vérifiez le bucket Supabase.'` message (misleading —
looks like a Supabase config problem, not a file-size problem). This matches "l'import des
miniatures d'album beaucoup ne marchent pas" — it started exactly when this commit shipped.

By contrast, `src/app/admin/_components/MultiImageUpload.tsx` (used for bulk album/portfolio
gallery photos, NOT covers) still calls `compressImage(item.file, preset)` before upload — it was
never touched by d4ee7ba, which is why only cover/background thumbnails are affected, not gallery
photo bulk-add.

### Root Cause B — album cover/background thumbnails bypass Next.js Image Optimization
`src/app/albums/AlbumsDragTrack.tsx` line ~285 renders `album.cover_url` in a plain `<img>` tag
(`eslint-disable-next-line @next/next/no-img-element`), not `next/image`. Same pattern in
`src/app/albums/[slug]/AlbumPageClient.tsx` line ~555 for the hero background
(`album.background_url ?? album.cover_url`). `next.config.ts` already configures AVIF/WebP,
`deviceSizes`, and a Supabase `remotePatterns` entry — none of it applies to these two `<img>`
tags. Combined with Root Cause A (now-uncompressed originals), the public `/albums` listing and
album hero were, since d4ee7ba, serving full-resolution unoptimized originals directly to every
visitor — this is the "chargement des images semble long" symptom. (The fallback placeholder
`https://picsum.photos/seed/...` used in these `<img>` tags is also not in `remotePatterns`, so a
literal `next/image` swap is not a same-file drop-in fix — flag as a follow-up, do not auto-apply.)

### Root Cause C — bulk gallery photo import is fully sequential
`MultiImageUpload.tsx` `handleUploadAll()` uses a `for (const item of pending)` loop that awaits
compress-then-upload for one photo at a time before starting the next. For an album with 30-100+
photos this scales linearly with photo count (each round-trip = client canvas compression + a
Next.js Server Action network call), which matches "l'import des images est long". This is
independent of Root Causes A/B and is not a regression — it has always been sequential — but it is
a legitimate, low-risk, contained fix (bound concurrency in one function, same per-item
status/id-keyed state updates already used).

### What the recent theme/album/UX commits actually did
Commits `8a1a6f6`, `d8267ee`, `3969ff2`, `d4ee7ba`, `f9c303d` (the cluster referenced in the user's
report) are all about the day/night theme scoping, album two-row drag layout, and transition
animation polish (Phase 4 milestone work, confirmed via `.planning/STATE.md` and
`.planning/ROADMAP.md` Phase 4). **None of them address import/upload/loading performance** — and
`d4ee7ba` is the direct cause of Root Cause A. There is no prior fix for this issue anywhere in
history; the user's applied "solutions" for theme/UX did not and could not have touched this.
</context>

<interfaces>
<!-- Pre-d4ee7ba reference implementation to restore in ImageUploadField.tsx (Task 1).
     Use this exact shape — it is the last known-working version, already proven in production
     before the regression, and mirrors the pattern still live in MultiImageUpload.tsx. -->

Restore this import:
`import { compressImage, getBucketPreset, formatSize } from '@/lib/compressImage';`

Restore this state:
`const [savings, setSavings] = useState('');`

Restore `handleFile` body (inside the `start(async () => { ... })` transition):
- compress first: `const compressed = await compressImage(file, getBucketPreset(bucket));`
- upload the compressed file, not the original: `const pub = await uploadFile(bucket, compressed.file);`
- reset `setSavings('')` at the top of `handleFile`, alongside the existing `setError('')`
- after a successful upload, compute and set the savings label:
  `const pct = Math.round((1 - compressed.compressedSize / compressed.originalSize) * 100);`
  `if (pct > 0) setSavings(...)` using `formatSize(compressed.originalSize)` and
  `formatSize(compressed.compressedSize)`

Restore the savings JSX block directly after the existing `✓ {url.split('/').pop()}` paragraph,
before the hidden `<input type="file">`.

`getBucketPreset('album-covers')` already returns `{ maxWidth: 900, maxHeight: 1200, quality: 0.88 }`
and `getBucketPreset('album-backgrounds')` returns `{ maxWidth: 1920, maxHeight: 1080, quality: 0.85 }`
(`src/lib/compressImage.ts`) — no preset changes needed, they were already correct before removal.
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Restore compression on album cover/background uploads (Root Cause A fix)</name>
  <files>src/app/admin/_components/ImageUploadField.tsx</files>
  <action>
    Revert the compression removal introduced in commit d4ee7ba for this file only. Re-add the
    `compressImage`/`getBucketPreset`/`formatSize` import and the `savings` state, and change
    `handleFile()` so it compresses the selected file via `compressImage(file, getBucketPreset(bucket))`
    before calling `uploadFile(bucket, compressed.file)` — never upload `file` directly. Restore the
    savings percentage label in the JSX exactly as described in the `<interfaces>` section above.
    Keep every other change from d4ee7ba (theme scoping, layout, unrelated files) untouched — only
    touch this one file's compression logic. Do not change `ImageUploadField`'s public props or its
    usage sites in `src/app/admin/albums/[id]/page.tsx`.
  </action>
  <verify>
    <automated>rtk npx tsc --noEmit</automated>
  </verify>
  <done>ImageUploadField.tsx imports and calls compressImage/getBucketPreset before uploadFile for both album-covers and album-backgrounds buckets; tsc reports no new type errors; the "-X%" savings label reappears in the component's JSX.</done>
</task>

<task type="auto">
  <name>Task 2: Parallelize bulk gallery photo upload (Root Cause C fix)</name>
  <files>src/app/admin/_components/MultiImageUpload.tsx</files>
  <action>
    In `handleUploadAll()`, replace the sequential `for (const item of pending)` loop with a
    bounded-concurrency batch loop (concurrency = 3). Extract the existing per-item logic
    (compressing → uploading → done/error state transitions, exactly as currently written,
    including the `continue`-on-compression-failure behavior) into a local async function
    `processItem(item: FileItem)` that performs the same `setItems` state updates keyed by
    `item.id` (these are already safe to call from concurrent async tasks since each update is a
    functional `setItems((prev) => ...)` keyed by id). Then iterate `pending` in chunks of 3,
    calling `await Promise.all(batch.map(processItem))` per chunk before moving to the next chunk.
    Keep `setRunning(true)`/`setRunning(false)`, `onComplete?.()`, and the auto-clear `setTimeout`
    exactly where they are now (before the loop and after all chunks finish, respectively). Do not
    change the component's public `Props` interface or `FileItem` type.
  </action>
  <verify>
    <automated>rtk npx tsc --noEmit</automated>
  </verify>
  <done>handleUploadAll processes pending items in batches of 3 concurrent compress+upload operations instead of one at a time; per-item status (compressing/uploading/done/error) still updates correctly; tsc reports no new type errors.</done>
</task>

<task type="auto">
  <name>Task 3: Write diagnostic report</name>
  <files>.planning/quick/260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/260919-sax-REPORT.md</files>
  <action>
    Write the report in French (matching the user's request language), structured as:
    1. Résumé — one paragraph answering directly: les correctifs déjà appliqués (commits
       theme/album/UX de la fin août) ne concernent pas ce problème, et l'un d'eux (d4ee7ba) en est
       la cause directe.
    2. Symptôme 1 — "l'import des miniatures d'album ne marche pas" → Root Cause A: cite commit
       d4ee7ba, the removed compressImage call in ImageUploadField.tsx, the 10mb
       serverActions.bodySizeLimit in next.config.ts, and the misleading generic error message.
       Note the fix applied in Task 1.
    3. Symptôme 2 — "l'import des images est long" → Root Cause C: cite the sequential
       for-loop in MultiImageUpload.tsx handleUploadAll. Note the fix applied in Task 2.
    4. Symptôme 3 — "le chargement des images semble long" → Root Cause B: cite the plain
       `<img>` tags in AlbumsDragTrack.tsx (~line 285) and AlbumPageClient.tsx (~line 555)
       bypassing next/image, worsened by Root Cause A's uncompressed originals (partially fixed by
       Task 1 for new uploads; existing already-uploaded large covers stay uncompressed until
       re-uploaded).
    5. Solutions restantes recommandées (non appliquées ici, avec justification) — prioritized:
       (a) convert the two `<img>` tags to `next/image` with explicit `sizes`/`fill`, and either add
       `picsum.photos` to `remotePatterns` or replace the placeholder fallback with a local static
       asset (flagged as needing layout verification, not auto-applied because AlbumsDragTrack.tsx
       uses CSS-transform drag-carousel sizing that needs manual QA);
       (b) add a server-side file-size guard in `uploadFile()` (`src/app/admin/actions.ts`) that
       throws a clear French error ("Fichier trop volumineux (max 10 Mo)") before hitting the
       Server Action body-limit wall, so future oversized files fail with an actionable message
       instead of a generic one;
       (c) reject/convert HEIC uploads client-side before compression (canvas `Image()` cannot
       decode HEIC in Chrome/Firefox) with a clear error, since iPhone photos may default to HEIC;
       (d) one-time backfill: re-run existing album cover/background URLs through compressImage
       server-side (e.g. a small admin script using `sharp`) to shrink already-uploaded oversized
       originals, since Task 1 only fixes new uploads going forward.
    6. Fixes appliqués dans ce plan — list Task 1 and Task 2 explicitly with file paths.
  </action>
  <verify>
    <human-check>Report exists, is in French, covers all three symptoms with root cause + evidence + fix status for each, and lists prioritized remaining recommendations.</human-check>
  </verify>
  <done>260919-sax-REPORT.md exists with all six sections above, correctly distinguishing "already fixed in this plan" from "still needs action".</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|--------------|
| Admin browser -> Server Action (`uploadFile`) | Admin-uploaded file content and size are attacker-adjacent only if admin credentials are compromised; no new boundary crossed by these fixes. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|------------------|
| T-sax-01 | Denial of Service | `uploadFile` Server Action | accept | Oversized-file rejection is a UX/reliability fix here, not a security control; admin-only surface already behind auth. Server-side size guard is recommended (Solution b) but out of scope for this diagnostic plan's auto-applied fixes. |
| T-sax-02 | Tampering | MultiImageUpload concurrency change | accept | Increasing to 3 concurrent uploads does not change trust boundary or validation logic; each upload is still independently validated by the existing `uploadFile` action. |
</threat_model>

<verification>
- `rtk npx tsc --noEmit` passes after Task 1 and Task 2 (no new type errors).
- `260919-sax-REPORT.md` exists and answers the user's exact question: whether previously applied
  fixes (theme/album/UX commits) address this — confirmed no, plus which specific commit caused
  the regression.
- Both applied fixes (Task 1, Task 2) are scoped to a single file each, touch only the
  compression/upload logic, and do not alter any other behavior from the recent theme/UX commits.
</verification>

<success_criteria>
- Root cause of album thumbnail import failures identified with commit-level evidence (d4ee7ba).
- Root cause of slow bulk image import identified (sequential loop in MultiImageUpload.tsx).
- Root cause of slow image loading identified (unoptimized `<img>` + uncompressed originals).
- Compression restored for album cover/background uploads (Task 1).
- Bulk gallery photo upload parallelized with bounded concurrency (Task 2).
- Written French diagnostic report delivered at the specified path with prioritized remaining
  solutions for what these two fixes do not cover.
</success_criteria>

<output>
Create `.planning/quick/260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/260919-sax-SUMMARY.md` when done.
</output>
