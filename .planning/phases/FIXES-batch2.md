# FIXES batch 2 (branch `fix/v11-audit-batch2`, from `milestone/v1.1` after batch 1)

Phases 6, 7, 10. Commits: `git log --oneline milestone/v1.1..fix/v11-audit-batch2` (hashes filled in the table by subject).

New migration FILE (NOT applied, for the orchestrator to review/apply): `supabase/migrations/20261107000004_v11_audit_batch2.sql`
(000003 is unused: no batch-1 migration exists). It creates 2 indexes and replaces `kpi_dashboard` (same signature, same JSON shape).
Apply BEFORE or together with deploying the code: the code works without it, but the funnel keeps its old (non cohort) numbers and the dashboard stays slow until it is applied.

| Phase | Finding | Disposition | Commit subject |
|---|---|---|---|
| 7 | M1 HEAD consumes a use | FIXED. Explicit `HEAD` handlers on `photo/[photoId]` and `zip`: gate + membership/part validation, headers only, never `consume_download_use`. e2e: HEAD zip/photo -> 200, bad part -> 404, `used_count` stays 0 and no window opens. | fix(p7): HEAD handlers never consume ... ; test(p7): e2e HEAD |
| 7 | M2 pre-flight only on first item | FIXED. ZIP route refuses (`error`, nothing consumed) unless EVERY item of the requested part has a known size (HEAD ok). `planDelivery` retries failed HEADs once. Size cache entries are evicted on a non-200 HEAD and on a 404/403 GET. **Missing item policy**: a photo present in the request but gone from storage makes ITS part undownloadable (no use burned, no truncated archive); other parts still work; photos deleted from the DB are skipped silently at plan time (unchanged). | same |
| 7 | M3 download source serialised in HTML | FIXED. Landing tiles use `resolvePhotoSource(row, 'thumbnail')`; the download source never reaches the page props. (Today both resolve to the same public URL; v1.2 private masters will diverge.) | same |
| 7 | M4 non deterministic splitting | FIXED. When ANY size is unknown, `planParts` ignores bytes and splits by count (20 per part, so 20 x 3 MB assumed < cap) whichever item is unknown. Known sizes -> byte split. Residual: if the landing page saw all sizes but a later ZIP request has a persistent HEAD failure, the plans differ (see not proven). Persisting sizes at request time was not done (needs a migration + reading storage at request time). | same |
| 7 | M5 cap | FIXED. `ZIP_PART_MAX_BYTES` 120 -> 70 MB, 60 files kept, all constants stay in `deliveryPlan.ts`. No user-facing copy mentions the cap (copy shows computed sizes only), so nothing to change there; `test-delivery-plan.mjs` updated (96 x 2.57 MB -> 4 parts; 10 x 50 MB -> 10 parts) plus unknown-size cases. **maxDuration reasoning**: the route is streamed with `maxDuration = 300 s`; a part must be fully sent inside it. 70 MB * 8 / 300 s = 1.9 Mbit/s minimum sustained (the old 120 MB needed 3.2 Mbit/s, which a slow mobile link fails). 70 MB is the compromise between that and the number of parts (a 250 MB selection = 4 files). Upstream fetch is not the limit (server side). Still unverified on a real Vercel preview. | same |
| 7 | `visitorHash` -> `safeVisitorHash` | FIXED in `telechargement/[token]/page.tsx` (link_open skipped when no salt, page still renders) and `deliveryHttp.ts` (`logDownloads`: null hash). | same |
| 6 | F2 silent failures | FIXED. Only the honeypot and the "under 2 s" case are silent (the latter is padded to the same 1.8 s floor as a real success, same response body). Missing/forged/malformed/expired form token -> `server_error`; missing `DOWNLOAD_TOKEN_SECRET` -> `checkFormToken` throws -> `server_error`. | fix(p6): form-token failures return server_error ... |
| 6 | F3 email relay | FIXED (except Turnstile). Global daily cap: env `DOWNLOAD_EMAIL_DAILY_CAP` (default 80; invalid/0/negative -> 80) via `rate_limit_hit('dlreq:global:day', cap, 86400)`. Over the cap: generic success, no row, no mail, loud `console.error`. Per-email bucket moved AFTER photo/album validation (a malformed cart cannot burn a victim's quota); IP limit and the other limits unchanged. Documented in `.env.example`. **Turnstile / CAPTCHA is NOT added in v1.1: v1.2.** Note: the cap is a fixed 24 h window of the RPC (UTC aligned), and an attacker can fill it (denial of service for real users until the window rolls): that is the accepted trade-off, bounded by the 8/h/IP limit; watch the log line. | same |
| 6 | F4 private album metadata | FIXED in `generateMetadata` (`albums/[slug]/page.tsx` only): private album -> title "Album privé", no description, no cover, `robots: { index:false, follow:false }`. | fix(p6): generic noindex metadata ... |
| 6 | Low: cart cap | FIXED client side in `CartContext.add` (200, same as the server), friendly bilingual notice rendered by the provider (CartDrawer/AlbumPageClient untouched), hydration also capped. | fix(p6/p10): cap cart ... |
| 6/10 | Low / M1: `/api/select-add` | FIXED. Photo must exist (`album_photos` or `portfolio_photos`), `album_id` derived from the DB row, client `albumId` ignored; unknown ids dropped silently (still 204). Fixes the favorites pollution. | same |
| 10 | H1 `/api/track` inflation | FIXED, no migration needed. Per-IP limit (`track:ip:<salted IP hash>`, 120/min) applied BEFORE any visitor hash, independent of UA. `view` events now carry an IP-only daily hash (`ipVisitorHash`), so the existing unique index (target, visitor_hash, Paris day) = 1 row per IP per target per day. e2e: 40 distinct UAs from one IP -> 204 x 40 and exactly 1 row. Trade-off: visitors behind one shared IP count once per target per day (visitor-days slightly under-counted); the daily salt still prevents cross-day linking. Existing rows keep their old (UA based) hash. | fix(p10): IP-only per-IP limit ... |
| 10 | M2 `kpi_dashboard` perf | FIXED in the new migration. See timings below. | perf(p10): kpi_dashboard single-pass rewrite ... |
| 10 | M3 funnel > 100% | FIXED in the new migration: `requests` / `links_opened` / `downloaded` form a cohort (requests created in the window, joined by `request_id`; opens/downloads after the window end still count for their request). `StatsView`: step labels "Parmi elles : ...", headline = downloaded / requests, note explains units (step 1 stays visitor-days, indicative). SQL test asserts a previous-window request is excluded, a post-window open included, never above 100%. | same + fix(p10) |
| 10 | Low: bot regex | FIXED. Pinterest / DuckDuckGo / Baidu app / Cubot / Slack in-app are humans; real crawlers kept (their own tokens: bot, spider, slack-imgproxy, duckduckgo-favicons, baidu-). Table test `scripts/test-bots.test.mjs` (9 humans, 17 bots). | same |
| 10 | Low: cron bearer | FIXED. `constantTimeEqual` (SHA-256 digests of both sides, length independent). | same |
| - | Side finding | Tailwind 4.2.1 crashes (`V.map is not a function`) when it scans a file containing the token `row-constructor`; the build scans `supabase/`. A SQL comment tripped it (`next build` failed). Reworded. Worth remembering for any future comment/SQL text. | fix(p10): reword migration comment |

## kpi_dashboard(90) timing, throwaway local Postgres 18, 200k synthetic events (marked synthetic, local only)

Mix: 132k view, 19k select_add, 12k request, 18k link_open, 18k download over 180 days, 500 photos, 30k visitors. Script `scripts/perf-kpi-sql.mjs`.

| Version | 3 consecutive runs |
|---|---|
| before (migration 000002) | 2497 / 3033 / 3254 ms |
| after (migration 000004) | 490 / 458 / 466 ms (hash aggregation; first attempt with sort-based aggregation and `paris_day()` calls: 1.3-2.3 s) |

What mattered: `paris_day()` carries a `SET` clause so it cannot be inlined (it was called ~4 times per row on 200k rows) -> inline `(created_at AT TIME ZONE 'Europe/Paris')::date` in the hot paths; one pre-aggregation (`g`, grouped by day/type/album/is_day/device, a few thousand rows) instead of ~20 scans of a materialised CTE; visitor-days once per window by hash aggregation of a scalar text key; function-local `work_mem = 64MB` so the aggregates do not spill a sort. The result is identical to the old function outside `funnel` (checked with `old = new` on the same data for 90 d, 7 d and a shifted 30 d window). Funnel cohort part costs ~15 ms (index scans).

## Other notes

- Sample e2e residue: the global cap key `dlreq:global:day` lives in `rate_limits` of the SHARED project; the e2e run deleted it afterwards so the production quota is not eaten by tests.
- Env additions: `DOWNLOAD_EMAIL_DAILY_CAP` (optional, default 80).
