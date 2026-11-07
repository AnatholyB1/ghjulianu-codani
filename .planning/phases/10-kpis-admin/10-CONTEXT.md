# Phase 10 - Context (Suivi des événements & KPIs admin)

Requirements: KPI-01..07. Decisions applied: D-04 (favorites = `select_add`), D-10 (no cookie, no raw IP, daily salted hash, Europe/Paris days, 13-month raw retention), D-11 (plain SVG/CSS charts, no library). Design contract: `design/10-DESIGN-CONTRACT.md` (implemented as written).

## Choices made
- Photo identification without touching other phases' files: the beacon observes every `<img>` (MutationObserver + IntersectionObserver, >= 50 % visible for 1 s, loaded) and sends only `{type:'view', src}` (original storage URL extracted from `/_next/image?url=`). The server resolves `src` (or a uuid) against `album_photos` then `portfolio_photos`, so album, is_day, device, country and visitor hash are server-derived. Images that are not photo rows (hero, covers, logos) are dropped silently.
- Client may only send `view`. `select_add`, `request`, `link_open`, `download` are logged server-side by P6/P7 with `logEvent`.
- Dedupe: sessionStorage (already-sent URLs only) + DB unique index `events_view_dedupe_idx` (P5), 23505 is swallowed by `logEvent`.
- Bots: small regex in `src/lib/server/bots.ts` (no `isbot` dependency, package.json untouched); missing UA = bot. Bots, rate-limited and unknown photos all get 204 and write nothing.
- Rate limit: `hit('track:<visitor_hash>', 90, 60)` (P5 RPC, fails closed).
- `/api/track` and `/api/cron/*` excluded from the Supabase session proxy matcher (no auth lookup, no session cookie possible).
- Whole dashboard = one RPC `kpi_dashboard(p_days, p_end)` returning jsonb (one round trip). Counts union raw `events` + `events_daily`; distinct metrics (visitor-days, distinct request_id) use raw rows only.
- No `vercel.json` in the repo, so no cron entry was added (see SUMMARY, human items).

## Known caveats (labelled in the UI)
- Funnel step 1 counts visitor-days, steps 2-4 count requests.
- Bandwidth = bytes of `download` events only, not CDN image traffic.
- Days older than 13 months come from `events_daily`; distinct metrics are 0 there.
