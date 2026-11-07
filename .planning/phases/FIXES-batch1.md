# FIXES batch 1 (branch `fix/v11-audit-batch1`, from `milestone/v1.1`)

Finding -> disposition -> commit. Commit hashes are on the branch (`git log --oneline milestone/v1.1..fix/v11-audit-batch1`).

| # | Sev | Finding | Disposition | Commit |
|---|-----|---------|-------------|--------|
| 1 | HIGH | "admin" = any logged-in Supabase user; shared project has open sign-up | FIXED. `ADMIN_EMAILS` allowlist (comma separated, case-insensitive, trimmed) in ONE helper `src/lib/server/requireAdmin.ts` (`isAdminEmail`, `isAdminUser`, `getAdminUser`, `requireAdmin`). Enforced in `src/proxy.ts` (`/admin/**` except `/admin/login`, and `/api/admin/**` -> 401 JSON), all 19 actions of `src/app/admin/actions.ts`, `newsletter/actions.ts`, `newsletter/export/route.ts`, `api/admin/test-email/route.tsx`, `admin/stats/page.tsx`, `admin/newsletter/page.tsx`. Fails CLOSED when unset/empty (one-time server warning). Non-admin authenticated = same response as anonymous. `.env.example` + DEPLOY-CHECKLIST updated. Unit test `scripts/test-require-admin.test.mjs` (6 tests). curl proof against own `next start` (see below). | a38f88b |
| 2 | MED | `IP_HASH_SALT` may be unset/short in `rateLimit.ts` and `events.ts` | FIXED. `requireSalt()` throws when `IP_HASH_SALT` < 16 chars; `hashIdentifier` and `visitorHash` use it. `logEvent` still never throws; `safeVisitorHash()` (returns null + warns) used in the two call sites where a throw would have broken a flow (`select-add`, `telechargement/actions`). `unlockAlbum` returns `locked` instead of an unhandled error. Test `scripts/test-salt-failclosed.test.mjs`. | 3a264c0 |
| 3 | MED | Re-subscription (unsubscribed / stale pending) kept old consent proof | FIXED. `resubscribePatch()` in `newsletter.ts` refreshes `consent_at`, `consent_text_version`, `source`, clears `unsubscribed_at`, status back to `pending`. Unit test `scripts/test-resubscribe.test.mjs` + DB step in `scripts/e2e-newsletter-hook.mjs`. | f884ca8 |
| 4 | MED | ImageProtection cancels keyboard menu and link menu on link-wrapped images | FIXED with a documented compromise (see below). `scripts/e2e-image-protection.mjs` updated and re-run. | b3bd170 |
| 5 | MED | `PUBLISHER_ADDRESS` (phase 6) vs `LEGAL_POSTAL_ADDRESS`/`LEGAL_SENDER_NAME` (phase 9) | FIXED. Canonical `LEGAL_POSTAL_ADDRESS` + `LEGAL_SENDER_NAME` in code, `.env.example`, phase 6 docs. `PUBLISHER_ADDRESS` still read as a deprecated fallback (2 one-line spots). | 14066a3 |
| 6 | integ. | Phase 6 `newsletterHook.ts` stub vs phase 9 real `enqueueConfirmation` | FIXED. Stub deleted; request flow imports `enqueueConfirmation(email, lang)` from `newsletter.ts`; the duplicate `recordPendingSubscriber` in `telechargement/actions.ts` is removed (single implementation; source value is now `download`, matching the admin label map). e2e: `scripts/e2e-newsletter.mjs` all passed; `scripts/e2e-request-flow.mjs` extended with the end-to-end path (tick box -> pending + token hash/48 h -> mail logged as guarded -> confirm page GET read-only -> POST -> `confirmed` + `confirmed_at`). | f884ca8 |
| 7 | MED | Privacy page retention promises not implemented | FIXED. `src/lib/server/retention.ts` + `api/cron/purge-events/route.ts` (same `CRON_SECRET` auth): download_requests 90 d after `expires_at`, rate_limits > 2 d, subscribers `pending` untouched > 30 d, plus the existing events purge. Steps independent, idempotent, counts returned. No migration needed. Test `scripts/e2e-retention.mjs` (marked rows `ret-e2e-*@example.org`, `ret-e2e:*`, scoped, cleaned). | 393e108 |
| 8a | LOW | `verify-rls.mjs` missed `events_daily` and `kpi_dashboard` | FIXED (19/19 checks pass, all HTTP 401). | c3d3a96 |
| 8b | LOW | Missing `RESEND_FROM` silently ignores all webhook events | FIXED. Loud `console.error` on every webhook call without `RESEND_FROM`; still 200. | c3d3a96 |
| 8c | LOW | Missing `DOWNLOAD_TOKEN_SECRET` -> unhandled 500 on unsubscribe routes | FIXED. `verifyUnsubscribe` never throws (logs, returns null -> generic invalid page); one-click POST returns a handled `503 not_configured`; rate-limit/hash errors in that route are inside the try. | c3d3a96 |

## Documented only (not fixed)

- **Dashboard-newsletter unsubscribe sync (Resend broadcasts).** D-03 sends newsletters from the Resend dashboard. An unsubscribe done through a broadcast's own link is NOT synced back into `subscribers` (the webhook handles only bounce + complaint, and broadcasts cannot carry the per-recipient HMAC link). Operational rule until v1.2: before every broadcast export the CSV (confirmed only) and reconcile with Resend's unsubscribed contacts by hand. Also in `DEPLOY-CHECKLIST-v1.1.md`.
- **Suppressed subscribers cannot be erased** (the row is the suppression list). Needs a stated legal basis in the privacy page or an anonymisation option (phase 9 LOW, unchanged).
- **RLS on albums/photos/categories** (pre-v1.1 tables) is outside this batch. The admin UI writes with the user's own Supabase session; the new allowlist protects the app, not direct REST calls by another signed-up user. Reviewing those policies is a human item (DEPLOY-CHECKLIST).

## Item 1 verification (curl, own `next start -p 3123`)

Anonymous / garbage-cookie requests, run once with `ADMIN_EMAILS` unset and once set to a non-matching address: `/admin`, `/admin/stats`, `/admin/newsletter`, `/admin/albums`, `/admin/portfolio`, `/admin/categories`, `/admin/newsletter/export` -> 307 to `/admin/login?redirect=...`; `POST /api/admin/test-email` -> 401 `{"error":"unauthorized"}`; server-action POST (`Next-Action` header) to an admin path -> 307 login. `/admin/login` -> 200.
NOT proven: the positive path (an allowlisted real admin gets in) and the negative path for a real signed-in non-admin, because that needs a live Supabase user and the project is shared (no auth DML). Covered by unit tests of the helper only.

## Item 4 compromise (ImageProtection)

- Keyboard-initiated menus (Menu key, Shift+F10: `detail 0`, `button != 2`, no mouse/touch/pen pointer) are never cancelled. Touch long-press (`pointerType touch`) and mouse right-click still are.
- An image that is the sole content of an `a[href]` (no text, one `<img>`) keeps its context menu, so "Open link in new tab / Copy link address" works. Cost: those link-wrapped images are not shielded from "Save image as" via the mouse menu. The geometric fallback no longer fires when the target is inside a link. dragstart is still blocked everywhere.
- `PortfolioGrid.tsx` had its own pre-existing `onContextMenu={e => e.preventDefault()}` on the image wrapper that cancelled the keyboard menu too; removed (ImageProtection already covers mouse and touch there).
- Still a deterrent only (D-06).

## Verification summary

- Unit: `scripts/test-require-admin.test.mjs` (6), `scripts/test-salt-failclosed.test.mjs` (4), `scripts/test-resubscribe.test.mjs` (2), `scripts/test-newsletter-units.mjs` (20 ok), run with `node --test --conditions=react-server --import ./scripts/ts-register.mjs <file>`.
- Live (own `next start -p 3123`, mail guarded, marked rows only, cleaned): `e2e-newsletter.mjs` ALL PASSED; `e2e-request-flow.mjs` 130/130 (a first run showed 129/130 with the failing line not captured; the full re-run was 130/130, so one flaky/timing-dependent check is suspected, not identified); `e2e-retention.mjs` 4/4; `e2e-image-protection.mjs` 59/59 (Playwright 1.65, Chromium emulation only); `verify-rls.mjs` 19/19; cron with correct Bearer -> 200 with retention counts.
- Build: `npm run build` OK under the machine lock. The worktree is nested under a parent dir that has its own lockfile, so Turbopack inferred the wrong root and the font plugin failed; built with a temporary, UNCOMMITTED `turbopack: { root: process.cwd() }` in `next.config.ts` (reverted). Not an issue on Vercel.
