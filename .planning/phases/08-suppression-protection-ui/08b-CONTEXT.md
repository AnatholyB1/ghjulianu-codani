# Phase 8b CONTEXT - PRT-01 removal of the old direct download

Scope: delete every client-side direct download so the email flow (P6 request -> P7 delivery) is the only product path.
Fixer-owned (untouched here): src/proxy.ts, src/app/admin/**, newsletter wiring, ImageProtection.tsx, src/app/api/cron/**.

Removed:
- CartDrawer.tsx: downloadPhoto (fetch + blob + a.download), handleDownloadAll, LEGACY footer button (`legacy-download`), donation modal tied to the download ("TELECHARGER QUAND MEME"). /don page and its links untouched.
- AlbumPageClient.tsx: extFromUrl, downloadWithConcurrency (File System Access), downloadWithZip (JSZip), PrivateDownloadSection and its mount for private albums, the unused `prefix` prop / `downloadName` on cart photos.
- CartContext.tsx: `downloadName` field (only used by legacy download). requestCopy.ts: `legacyDownload` FR/EN strings.
- i18n.ts client page copy (FR/EN): no longer promises "download directly"; now says view the album and receive the download link by email.
- `jszip` uninstalled (package.json + package-lock.json: 0 matches).

Kept: RequestStep, KeyForm, select-add logging, CtaBanner copy (already email-flow), /telechargement/** and /api/download/** (server delivery, email-token gated).
Lint touch-ups on touched files: escaped apostrophe in CtaBanner; scoped eslint-disable for the existing localStorage hydration in CartContext.

Honest limit (D-05): buckets stay public, so file URLs can still be fetched directly. This removes the product path, not file access.
