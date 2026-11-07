# Phase 6 - Summary

Branch `phase/06-request-flow`. REQ-01..05 implemented and exercised end to end against the real Supabase project (v1.1 migration applied by the orchestrator) with a production build on port 3105, mail guarded (`ALLOW_EMAIL_SEND` unset).

## Requirement -> evidence
| Req | Implementation | Evidence |
|---|---|---|
| REQ-01 email request from selection | CartDrawer + RequestStep, `requestDownload`, cart v2 with DB ids | `scripts/e2e-request-flow.mjs`, 4 profiles (desktop 1440x900 / iPhone 14 emulation x night / day): cart stores real photoId/albumId/source, invalid email blocked, generic success, selection kept, row has 2 DB-resolved photos, `select_add` + `request` events logged |
| REQ-02 optional unchecked newsletter, download independent | checkbox + versioned consent (`v1`), pending subscriber, `enqueueConfirmation` stub | e2e: unchecked + not required on first render; unticked = no subscriber row; ticked = same download outcome + `pending` row with consent version/time, not confirmed |
| REQ-03 FR/EN email, 48 h, 3 uses | `DownloadLinkEmail` (600 px, light+dark, plain-text part) | e2e: expiry within 2 min of +48 h, `max_uses` 3, 64-hex token hash only, `email_status='guarded'`. Template rendered with tsx for FR/EN x 1/12 photos: dark media query + color-scheme meta present, 0 images. Wording per language not mail-client tested |
| REQ-04 abuse resistance, generic answer | honeypot, signed min-time token, IP + email limits, uniform padded latency | e2e: honeypot / <2 s / per-email throttle (3 stored, 4th silent) store nothing and return success; per-IP limit shows warning with value kept; response bodies byte-identical (1 distinct) and p50 real 1878 / honeypot 1847 / throttled 1860 ms (spread < 150 ms) |
| REQ-05 private albums | `unlockAlbum`, signed cookie, KeyForm (B1..B4) | e2e on a real private album: wrong key shows 4 attempts left; 5 wrong then locked (field disabled, key not verified); correct key opens album, key only in POST body never in a URL; cookie httpOnly / Lax / signed (not the raw key) / <= 24 h; request with cookie accepted; injected cart without cookie refused (`album_locked`), nothing stored; direct album URL without cookie shows gate |
| Guards (unit) | `scripts/test-request-guards.test.mjs` (`node --test`) | 5 tests: email validation, photo-ref parsing/cap, form token (too fast / expired / forged), album cookie (expired, other album, rotated key, legacy raw key, forged), constant-time equal |

Other contract checks run in the e2e: AC-01 no overflow (form, key page, 320 px), AC-02 min text 14 px, AC-09 honeypot out of tab order / a11y tree / viewport, AC-10 Escape closes + focus returns to the cart button, AC-13 reduced motion, AC-14 320x568 submit reachable, AC-18 address not echoed. Result: 114/114 checks passed on a fresh server. Test data (`e2e-*@example.org`, test-net IPs) and rate-limit rows are deleted at the end of the run; `albums` / `album_photos` are read only.

## Gate
- `npx tsc --noEmit`: green. `npm run build` (under the machine lock): green.
- `npx eslint` on every file touched: 0 new errors. Remaining reports are pre-existing: `src/lib/broadcastChannel.ts` (4 `no-explicit-any`), `AlbumPageClient` (set-state-in-effect, unescaped entity, existing lines), `CartContext` hydrate effect (same pattern as before), Lightbox unused-expression warning.

## NOT proven
- No real email was sent: Resend call path, SPF/DKIM/DMARC, inbox placement and rendering in Gmail / Outlook / Apple Mail / Orange / Free untested. The email only rendered to HTML with tsx, not viewed in a client.
- AC-12 (axe-core), screen readers (VoiceOver / TalkBack / NVDA), AC-15 (200 % zoom), real iOS keyboard / pinned footer: not run (iPhone is Chromium emulation).
- Timing equalisation (AC-08) was measured with the mail guard (no network send). In production Resend latency may exceed the 1.8 s floor; if it does, the real path becomes slower than the silent paths. Re-measure on a preview with the sending guard bypassed to a sandbox address, or raise `GENERIC_MIN_MS`.
- Multi-instance behaviour of the Postgres rate limiter under concurrency; production IP header handling (`x-forwarded-for` first hop, trusted behind Vercel).
- Newsletter confirmation email (phase 9) and the download landing page (phase 7) are not part of this phase.

## Human items
- Set `LEGAL_POSTAL_ADDRESS` + `LEGAL_SENDER_NAME` (LCEN identity in the email footer) in production (`PUBLISHER_ADDRESS` is a deprecated alias).
- Owner/lawyer review of the consent wording (`src/lib/consentCopy.ts`; bump `CONSENT_TEXT_VERSION` if changed after launch) and privacy line.
- Env on Vercel: `DOWNLOAD_TOKEN_SECRET`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL`, `RESEND_*` (see `.env.example`). `DOWNLOAD_TOKEN_SECRET` is now required by the request form (without it `issueFormToken` returns null and requests fail with `server_error`).
- Existing private-album visitors lose their old 30-day raw-key cookie (they re-enter the key once).

## Notes for the merge
- Likely conflict files: `src/lib/server/consent.ts` (P5 file, now derived from `consentCopy.ts`), `src/app/globals.css` (tokens appended at the end), `src/components/Lightbox.tsx` and `AlbumPageClient.tsx` (P8a / P8b), `src/app/admin/actions.ts` (verifyAlbumKey / findAlbumByKey removed), `.env.example`.
- Phase 8b: remove the LEGACY blocks in `CartDrawer.tsx` (downloadPhoto, handleDownloadAll, donation modal, secondary button) and `PrivateDownloadSection` in `AlbumPageClient.tsx`.
- Phase 9: fill `enqueueConfirmation` in `src/lib/server/newsletterHook.ts`.
- Phase 7 can rely on `download_requests.photos = [{photo_id, source}]`, `album_id` (null when mixed / portfolio), `lang`, `token_hash`, and `email_status`.
