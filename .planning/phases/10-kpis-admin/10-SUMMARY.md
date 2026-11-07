# Phase 10 - Summary

Branch `phase/10-kpis` (milestone/v1.1 merged in). Migration `supabase/migrations/20261107000002_v11_kpi_views.sql` is a FILE only: NOT applied to Supabase.

## Delivered
- `POST /api/track` (`src/app/api/track/route.ts`), `src/lib/server/bots.ts`, `src/components/ViewBeacon.tsx` (mounted additively in `SiteShell` public branch only), proxy matcher excludes `api/track|api/cron`.
- `/admin/stats` (`src/app/admin/stats/*`: page, StatsView, format, loading, RetryButton, scoped `stats.css`), `src/lib/server/stats.ts`, NAV entry `STATS`.
- `POST|GET /api/cron/purge-events` (Bearer `CRON_SECRET`, fails closed 503/401), `.env.example` gets `CRON_SECRET`.
- SQL: `kpi_dashboard(p_days int, p_end date)` (service_role only, RLS posture as P5).
- Verification: `scripts/verify-kpi-sql.mjs` + `scripts/kpi-sql-test.sql` (local Postgres 18, port 55410, P5 + P10 migrations, 62 assertions), `scripts/e2e-kpis.mjs` (Playwright).

## Requirement -> evidence
| Req | Status | Evidence |
|---|---|---|
| KPI-01 period selector, deltas | Code + SQL proven; UI proven on harness | SQL: views/downloads cur+prev, Paris bucketing (22:30Z vs 23:30Z, 04-01 excluded), daily sum = tile. UI: `?p=7/30/90` links, `delta()` glyph+sign+words; harness screenshots `evidence/stats-preview-*`. Real route not run (needs 000002 + admin session) |
| KPI-02 favorites, most downloaded, top albums | SQL proven; UI proven on harness | SQL asserts top lists, ties, album titles, private flag. Tables present for each card (e2e A6, 6 tables) |
| KPI-03 views after real display, once per session/day, bots filtered, no cookie/IP | Proven end to end against real `events` table | e2e: beacon fires after >=1 s display (desktop 26, iPhone 6), 0 beacons after reload in same session, payload = `src,type` only, no cookie (context cookies empty, `document.cookie` empty, response has no Set-Cookie), 5 bot UAs + empty UA = 204 and 0 rows, duplicate POST = exactly 1 row (unique index), row has no IP/UA, hashed visitor, device desktop/mobile, 400 on bad type/uuid/http src/oversized/foreign Origin/invalid JSON, rate-limit counter 98 > 90 |
| KPI-04 funnel + signup rate | SQL proven; UI harness | distinct request_id for link_open/download (2/2), requests 3, visitor-days 3; signups cur/confirmed; labelled caveat note in UI |
| KPI-05 albums, day/night, devices | SQL proven; UI harness | day/night 2/2, devices 2/1/1, percents sum to 100 (largest remainder) |
| KPI-06 bandwidth + subscriber growth | SQL proven; UI harness | bytes cur 3500 / prev 4000, series 2,3,3,2 with unsubscribe, base/gained/lost/now |
| KPI-07 purge, aggregates kept | SQL proven locally; route proven | SQL: 14-month rows deleted, `events_daily` sums (2 views, 2 downloads, 1000 bytes), dashboard answers identically before/after purge, second purge deletes 0. Route: 401 without/with wrong secret, 200 with secret (`purged=0` on real DB). Cron scheduling NOT configured (see below) |

Also: A1 no horizontal overflow, A2 min 14 px text, A3 interactive >= 44 px, A6 data table per chart: 0 violations on harness at 1440x900 and iPhone 14 for p=sql/7/30/90 (dark). A12: no cookie from `/api/track`; `events` has no IP/UA column (SQL assertion).

## Gate
`npx tsc --noEmit` green; `npm run build` green under machine lock (post-merge; one earlier build failed on a transient Google Fonts fetch, retry green); eslint on all P10 files 0 errors, 2 warnings (unused vars in scripts); repo baseline errors elsewhere untouched.

## NOT proven
- `/admin/stats` on the real route with data: needs migration 000002 applied AND an admin session. Only the unauthenticated redirect (to `/admin/login`) and no-leak were exercised. Content rendering was verified on a TEMPORARY harness page (not committed) fed by the real `kpi_dashboard` output on local Postgres plus synthetic 30/90-day data; error and empty/loading states are coded per contract but screenshots of them were not taken. The opt-in `E2E_ADMIN_AUTH=1` path in `scripts/e2e-kpis.mjs` is written but not run.
- SQL ran on PostgreSQL 18 locally, not on the Supabase server version; `generate_series`, jsonb and LATERAL usage are standard.
- A11 (< 800 ms with 13 months of data) not measured; the function aggregates with the existing indexes but was tested on tiny data only.
- Hero/cover images and photos not present in `album_photos`/`portfolio_photos` are not counted (by design). Beacon behaviour on real iOS Safari is emulation only.
- `visitor_days` for the previous period and the distinct funnel steps are 0 for days whose raw rows were purged.
- Admin header on a 390 px viewport (existing layout, now with STATS + NEWSLETTER entries) was not re-measured.

## Human items
- Approve/apply `20261107000002_v11_kpi_views.sql` (orchestrator), then rerun `E2E_ADMIN_AUTH=1 ... node scripts/e2e-kpis.mjs` (or log in manually) to check real `/admin/stats`.
- Schedule the purge: no `vercel.json` exists. Set `CRON_SECRET` (>= 16 chars) in Vercel, then add a cron (e.g. in a new `vercel.json`: `{"crons":[{"path":"/api/cron/purge-events","schedule":"0 3 * * 0"}]}`); Vercel Cron calls with GET and the Bearer secret, both accepted. Add to DEPLOY notes. Also set `IP_HASH_SALT` in production (empty salt still works but weakens the daily hash).
- Privacy page (P5) should mention audience measurement without cookie (legal review already a P5 human item).

## Likely merge conflicts
`src/app/admin/layout.tsx` (NAV, already resolved with P9), `src/components/SiteShell.tsx` (ViewBeacon line, ImageProtection/P6 edits), `src/proxy.ts` (matcher line), `.env.example`, `.gitignore`.
