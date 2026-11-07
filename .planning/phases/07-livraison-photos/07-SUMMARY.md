# Phase 7 Livraison des photos - Summary

Branch `phase/07-delivery` (from `milestone/v1.1`). See `07-CONTEXT.md` for decisions and flagged deviations.

## Requirement -> evidence
| Req | Status | Evidence (all run against `next build && next start -p 3106` + the real Supabase project with the v1.1 migration applied) |
|---|---|---|
| DLV-01 landing, thumbnails, expired/used-up, no use consumed | Done (status caveat) | `scripts/e2e-landing.mjs`: 64 renders (8 states x FR/EN x night/day x desktop 1440x900 / iPhone 14) all pass: no horizontal overflow, text >= 14 px, targets >= 44 px, 0 running animations under reduced motion, zero `/api/download` requests before a click, token absent from non-download hrefs/title/console, day theme applied. `e2e-delivery.mjs`: 3 GET + 3 HEAD leave `used_count` 0; privacy headers + both `<meta>`; revoked and random bodies byte-identical (404). Caveat: expired/used-up answer 200 (Next pages cannot emit 410). |
| DLV-02 single photo or streamed ZIP, server not blocked | Done | Photo = pass-through stream, sha256 equals source. ZIP: `fflate`, pull-driven; 250 photos / 168 MB in 5 parts, slow reader on part 1, server RSS 146 -> max 162 MB (+16 MB) -> 153 MB (`e2e-delivery-memory.mjs`). Playwright real click gives a browser download event for photo and ZIP. |
| DLV-03 light files, STORE, cap + parts | Done | Local-header method == 0 for every entry; hashes of all files equal sources; 250 photos split as expected (60 files/part, cap check on every part); `scripts/test-delivery-plan.mjs` covers the 120 MB byte cap, oversize file, determinism, 96 x 2.57 MB = 3 parts. Real data never reached 120 MB per part (photos avg 0.7-1.2 MB), so the byte cap is proven by unit test only. |
| DLV-04 atomic count + bytes | Done | 10 concurrent requests in one window: all 200, `used_count` 1; 10 racers at window expiry: exactly +1; sessions 2 and 3 served; 4th distinct session -> 410, count stays 3; all 5 ZIP parts in one session = 1 use; 36/36 e2e checks. `download` events with bytes > 0 recorded (per photo; ZIP files tagged `zip:N`); `link_open` once per 6 loads. |
| PRT-03 one source resolver | Done | `resolvePhotoSource()` is the only code mapping a row to a file URL (landing, photo route, ZIP route, sizes all use it); host/path allow-list; extension point documented. |

## Gate
- `npx tsc --noEmit`: green. `npm run build`: green (under machine lock). eslint on all my files: 0 errors (4 warnings in `scripts/*.mjs`: unused-expression style in the tiny `ok()` helpers). Repo-wide baseline of pre-existing errors untouched.
- Test data: rows marked `e2e-delivery-TEST-*@example.invalid`, deleted by each script (verified `cleanup` lines).

## Vercel assumptions to verify on a preview
- `maxDuration = 300` is accepted by the plan (Fluid compute / Pro); a 120 MB part to a slow client (3G ~ 2 Mbit/s = 8 min) will exceed 300 s: raise the value (Pro allows up to 800 s) or lower `ZIP_PART_MAX_BYTES`.
- Streaming responses have no 4.5 MB limit on Node functions: confirm a 100 MB part streams (no buffering by the platform) and that `after()` completes the event insert after the stream.
- Memory number above is local Node 26; Vercel function memory default (1-2 GB) is far above it.
- Supabase egress: every download re-reads the files from storage through the function (app-mediated, D-05).
- `x-forwarded-for` / `x-vercel-ip-country` are real on Vercel only; locally IP is `::1`/unknown (rate-limit keys still work).

## NOT proven
- Real iOS Safari / Android download behaviour (only Chromium via Playwright); link without `download` attribute relies on `Content-Disposition: attachment`.
- Client abort mid-ZIP (cancel path, bytes partial, upstream released) is implemented and covered by code review only: no automated abort test, no leak measurement after aborts.
- Upstream failure in the middle of a ZIP (truncated archive) not simulated.
- WCAG contrast and Lighthouse (AC-04, AC-20) not re-measured on the built page (design agent measured the prototypes); AC-17 only checks that Tab reaches a control, not full order/ring.
- 410 for expired/used-up (see CONTEXT), AC-19 (original URL absent from HTML) not achievable in v1.1.
- Email-to-link flow (P6) not exercised: rows were seeded directly.
- Lint repo-wide not re-run (baseline 35 pre-existing errors elsewhere).

## Human items
- Set `SUPPORT_EMAIL` in Vercel (footer contact), keep `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL`.
- Decide expiry/used-up HTTP 410 vs 200 and the `maxDuration` / part size vs slow mobile connections.
- Test a real phone download from a preview deployment.

## Likely merge conflicts
`package.json`/`package-lock.json` (untouched by me), `src/components/SiteShell.tsx` (one condition line), `next.config.ts` (new `headers()` block), `src/app/robots.ts` (disallow array), `.planning/ROADMAP.md`/`REQUIREMENTS.md` if others tick boxes.
