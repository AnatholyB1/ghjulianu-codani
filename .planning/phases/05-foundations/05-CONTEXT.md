# Phase 5 Foundations - Context (decisions applied)

Applied from MILESTONE-v1.1-DECISIONS.md: D-09 (rate_limit_hit RPC), D-10 (hashed visitor id, Paris day), D-13 (email guard), D-14 (retention), D-12 (FR/EN emails, RESEND_FROM).

## Schema (supabase/migrations/20261107000001_v11_email_downloads.sql, NOT applied)
Contract followed, plus orchestrator amendments:
- `subscribers.confirmed_at` added (growth KPIs).
- `events_daily` rollup table (unique nulls not distinct on day,type,album_id,photo_id,is_day,device; needs PG15+). Same RLS/grants as other tables.
- `purge_old_events` aggregates rows into `events_daily` and deletes them in ONE statement (data-modifying CTE) so aggregates survive the 13-month purge (KPI-07).
- View dedupe index uses `coalesce(photo_id, album_id, nil-uuid)` + visitor_hash + `paris_day(created_at)`, partial `type='view'` (function-based; `paris_day` is an IMMUTABLE wrapper, executable by PUBLIC on purpose).
- D-07 amended: 3 download sessions of 15 minutes each, 48 h expiry. `download_requests.window_started_at` added; `consume_download_use(p_token_hash, p_window_minutes default 15)` is one atomic UPDATE: inside an open window it does not increment; otherwise it requires used_count < max_uses, increments and opens a new window. Returns `(request_id, photos, email, remaining, window_open)`; `window_open=true` means an existing window was reused (no use consumed). Revoked/expired still refused. `SUPPORT_EMAIL` added to `.env.example`.
- Extras (non-contract, additive): lowercase CHECK on subscribers.email, jsonb array CHECK, indexes on download_requests(expires_at, email).
- All functions SECURITY DEFINER, `search_path = pg_catalog, public`, EXECUTE revoked from PUBLIC/anon/authenticated, granted to service_role.
- `supabase/schema.sql` mirrors the migration (appended).

## Libs (src/lib/server, all `import 'server-only'`)
supabaseAdmin, tokens, rateLimit (fails closed), email/send (guard), email/layout, events (never throws; `deviceClass`, `countryOf` helpers added), consent. Deps added: resend 6.37.0, @react-email/components 1.0.12, @react-email/render 2.2.0, fflate 0.8.3, server-only 0.0.1.

## Other
- `POST /api/admin/test-email`: Supabase session required (proxy.ts only guards page routes, so the route checks itself), 5/hour per admin, sends only to the admin's own address, via sendEmail().
- `.env.example` (and `!.env.example` in .gitignore, because `.env*` was ignored).
- Privacy page: server `page.tsx` (metadata) + client `PrivacyContent.tsx` using `useLang()` for FR/EN (site language is a client localStorage context).
- Funnel note for P10: step 1 counts visitor-days, the other steps count requests.
