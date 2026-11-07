# Phase 8b SUMMARY - PRT-01

| Requirement | Evidence |
|---|---|
| Cart direct download removed | CartDrawer has no downloadPhoto / handleDownloadAll / donation modal; e2e: no `legacy-download` testid, only `cta-request` |
| Browser ZIP removed, jszip uninstalled | `jszip` count in package.json and package-lock.json = 0; grep of `.next/static` for `jszip` / `showDirectoryPicker` = empty on a fresh build |
| Folder picker (File System Access) removed | PrivateDownloadSection / downloadWithConcurrency deleted; repo-wide grep clean (only the admin stats "downloads" counter and the e2e script itself match) |
| No UI path triggers a download | `scripts/e2e-no-direct-download.mjs` 57/57: desktop 1440x900 + iPhone 14, night + day, portfolio, albums list, public album, cart drawer, lightbox, private album after key entry; zero `download` events after clicking visible buttons; no a[download], no blob: links, no legacy copy |
| Email flow intact | `scripts/e2e-request-flow.mjs` 114/114 on the second run (first run: 2 failures caused by rows left by my own aborted runs); `scripts/e2e-image-protection.mjs` 52/52 |
| Copy | FR/EN client-space copy now describes email delivery |
| Gate | tsc 0 errors; eslint 0 errors on touched files; `npm run build` green |

Run note: the P6 e2e needs DOWNLOAD_TOKEN_SECRET and IP_HASH_SALT in the server env (test values used; ALLOW_EMAIL_SEND unset).

NOT proven: real iOS/Android devices (Chromium emulation only); public bucket URLs still allow direct fetching (D-05, private masters = v1.2); a user with devtools can still save displayed images; no real email sent (guarded mode).
