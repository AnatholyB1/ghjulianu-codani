# FIXES batch 3 (branch fix/v11-audit-batch3), from FINAL-REVIEW-v1.1 and FINAL-VERIFICATION-v1.1

| # | Finding | Disposition | Commit |
|---|---|---|---|
| 1 | HIGH build fails: Tailwind scans `.planning/` and crashes on a SQL token quoted in FIXES-batch2.md | FIXED. Token removed (whole repo grepped, 0 hits; it must never be quoted anywhere). `globals.css` now uses `@import "tailwindcss" source(none); @source "..";` so only `src/` is scanned (`.planning`, `supabase`, `scripts`, docs excluded). Proved: a throwaway `.planning/x.md` containing the crash token did not affect `npm run build`; file deleted. | 58d7a85 |
| 2 | HIGH next 16.1.6 advisories (proxy bypass x3, image optimizer RCE, SSRF, DoS) | FIXED. next and eslint-config-next 16.4.5 (npm `latest`), `npm audit fix` for sharp/postcss/ws/source-map-js/nanoid. `npm audit --omit=dev` remainder: 4 LOW (deepmerge prototype poisoning via @react-email/components > render > html-to-text; no upstream fix). tsc and build green. Admin bypass probes re-run on the upgraded build: 500 requests (25 paths x GET/HEAD/OPTIONS/POST/PUT x 4 header variants incl. three `x-middleware-subrequest` forms), 0 responses 200; all 307-to-login / 401 / 404 / 308-then-guarded. | d8cf8d5 |
| 3 | HIGH admin defense in depth | FIXED. New `requireAdminPage(returnTo)` (redirects to `/admin/login?redirect=...`) at the top of admin dashboard, albums, albums/[id], albums/new, categories, portfolio (stats and newsletter already had it). `admin/layout.tsx` stays presentation-only. Unauthenticated probe of each page: 307 to login. NOTE the proxy answers first, so the page-level check is not independently exercised by curl on a production build. | ccd1665 |
| 4 | MED email relay | FIXED. Global cap hit now returns `service_unavailable` (visible FR/EN message with SUPPORT_EMAIL mailto, or /contact link; loud `console.error`), never fake success. New per-IP DAILY cap `DOWNLOAD_IP_DAILY_CAP` (default 20) checked before the global bucket, visible `rate_limited`; per-IP hourly cap unchanged. Unit tests for both caps; e2e `scripts/e2e-caps.mjs` drives the UI. | 3c73380 |
| 5 | MED `.env.example` | FIXED. Added NEXT_PUBLIC_CONTACT_WEBHOOK_URL, PUBLISHER_ADDRESS (deprecated), DOWNLOAD_IP_DAILY_CAP; diff of every `process.env.X` in `src` against the file: only NODE_ENV and VERCEL_ENV (platform-provided, noted in a comment). | 7d7a7c7 |
| 6a | LOW open redirect on admin login | FIXED. `safeRelativePath` (`src/lib/safeRedirect.ts`): only a single leading `/`; rejects `//`, backslash, schemes, control chars. Unit test. | ccd1665 |
| 6b | LOW Unicode folding in allowlist | FIXED. Allowlist entries NFKC+lowercase; candidate must be pure ASCII (checked on the raw string, so U+212A Kelvin and fullwidth letters are refused before folding). Unit test. | ccd1665 |
| 6c | LOW NULL `updated_at` subscribers never purged | FIXED. pending rule is `updated_at < cutoff OR (updated_at IS NULL AND created_at < cutoff)`. e2e-retention extended (NULL stale purged, NULL fresh kept): 4/4 ok, marked rows only. | 3d044e5 |
| 6d | LOW 500 on private album with fake cookie, secret unset | FIXED. `verifyAlbumAccess` catches the missing-secret throw and returns false (no cookie). Unit test. | 3c73380 |
| 6e | LOW bot regex misses 10 UAs | FIXED. Added Google-InspectionTool, GoogleOther, Mediapartners-Google, APIs-Google, Qwantify, Iframely, ia_archiver, NewRelicPinger, Google-Read-Aloud, NetcraftSurveyAgent; table test extended, human UAs still 0 false positives. | 68c8a5a |
| 6f | LOW webhook / unsubscribe unconfigured | NO CHANGE NEEDED. Code reviewed: JSON bodies `not_configured` (500/503) with server log only, no stack traces. | - |
| 6g | LOW security headers | FIXED (no CSP). Global `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, declared BEFORE the per-route rules so `/telechargement` and `/api/download` keep `no-referrer`, `noindex`, `no-store`. CSP and X-Frame-Options: v1.2. | 7d7a7c7 |
| 7 | (verification F2, MED) `/albums/<private>` indexable | FIXED. `generateMetadata` returns generic noindex metadata (no canonical) whenever the anon lookup finds no public album (private or unknown). Checked on the production build: public `furtive-32` robots `index, follow` with its own title; private `aa` `noindex, nofollow`, generic title, no canonical; unknown slug is a 404 page (noindex). The 404 vs gate difference is inherent to the page itself. | b1041bd |
| 8 | (verification F3, LOW) silent click while a download is starting | FIXED. Blocked click now shows an aria-live FR/EN hint, and the busy lock is capped at 3 s (was 8/15 s) so a second download works. | b1041bd |

## Documented only (owner decision, NOT touched)

RLS finding: `albums`, `album_photos`, `portfolio_photos`, `categories` and `storage.objects` (photo buckets) grant ALL to any `authenticated` user (`auth.role()='authenticated'`) and the shared Supabase project has open sign-up. A self-registered user can read private albums' `access_key`, write or delete rows and storage objects with their own JWT, bypassing the app-level ADMIN_EMAILS allowlist. Needs a DB policy migration (admin predicate such as `auth.jwt()->>'email'` matched against an admin table) or disabling public sign-up on the project (affects other apps). No migration written, nothing applied.

## v1.2

CSP, X-Frame-Options, captcha on the request form, Resend unsubscribe sync, server action body limit split (25 MB applies to public actions too).

## Test notes

- Unit: `node --test --conditions=react-server --import ./scripts/ts-register.mjs scripts/test-*.test.mjs` all green (bots, require-admin incl. Kelvin, safe-redirect, request-guards incl. caps and secret-unset album cookie, resubscribe, salt-failclosed).
- e2e harness fixes (no product change): `e2e-request-flow.mjs` tolerates a lost server-action response body (Chromium drops it after re-render) and waits for the rAF focus before checking A4.
- Re-running `e2e-request-flow.mjs` reuses the same fake IPs: clear `rate_limits` keys `dlreq:%` between runs or the per-IP caps trip.
