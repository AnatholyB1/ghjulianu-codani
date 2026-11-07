# Milestone v1.1 — Shared decisions & contracts (read by EVERY agent)

Decided from research (.planning/research/SUMMARY.md) + user answers. User delegated remaining choices to recommendations. Changing a contract below requires the orchestrator.

## Product decisions (locked)
- D-01 Newsletter opt-in is a SEPARATE, OPTIONAL, UNCHECKED box; download never depends on it. Versioned consent text (`CONSENT_TEXT_VERSION = 'v1'`).
- D-02 Double opt-in: newsletter row stays `pending` until the person presses a button (POST) in a confirmation email.
- D-03 Newsletters are sent from the Resend dashboard using the CSV export in v1.1. No in-app composer.
- D-04 "Favorite photos" = selection/cart adds (event `select_add`), shown beside most-downloaded.
- D-05 Buckets stay PUBLIC in v1.1. Delivery is app-mediated pass-through; one function `resolvePhotoSource()` picks the file source (private masters = v1.2). No watermark, no sharp, no bucket migration.
- D-06 UI protection = block context menu / drag / long-press on public images only (never inputs, never the lightbox gestures). Deterrent only.
- D-07 Link: random 32-byte token, only SHA-256 hash stored; 48 h TTL, 3 uses; landing page GET never consumes a use; a use is consumed atomically when a file/ZIP route actually serves.
- D-08 ZIP: Node runtime, `fflate` streaming, store mode (no compression), source files fetched one at a time, part cap ~120 MB / 60 files per ZIP part (constants in one file), `export const maxDuration` explicit.
- D-09 Rate limiting: Postgres RPC `rate_limit_hit` (no Redis). Keys use hashed IP/email.
- D-10 Analytics: no cookie, no raw IP; `visitor_hash = sha256(ip + ua + daily_salt)`, daily salt derived from `IP_HASH_SALT` + date; device class via `userAgent()` from `next/server`; country from `x-vercel-ip-country`; days bucketed in Europe/Paris; raw events purged after 13 months.
- D-11 Charts: plain SVG/CSS components (no chart library) unless a builder shows a concrete need.
- D-12 Emails are FR or EN following the site language at request time; sender from env `RESEND_FROM` (recommended `Julianu Codani <photos@mail.ghjulianucodani.com>` on a verified subdomain).
- D-13 Previews/dev never send real mail: `sendEmail()` only calls Resend when `VERCEL_ENV === 'production'` or `ALLOW_EMAIL_SEND === '1'`; otherwise it logs a redacted line and returns `{ sent:false, reason:'guard' }`.
- D-14 Retention: subscribers ~3 years after last contact, events 13 months, download_requests 90 days after expiry.

## Schema contract (migration FILE only: `supabase/migrations/20261107000001_v11_email_downloads.sql`; applied by the orchestrator after user approval)
All tables: RLS ENABLED, NO policies, `REVOKE ALL ... FROM anon, authenticated`. Functions `SECURITY DEFINER`, `EXECUTE` granted to `service_role` only.

- `subscribers(id uuid pk default gen_random_uuid(), email text not null unique /* lowercased */, status text not null check (status in ('pending','confirmed','unsubscribed','suppressed')), lang text not null default 'fr', consent_text_version text, consent_at timestamptz, confirm_token_hash text, confirm_expires_at timestamptz, unsubscribed_at timestamptz, suppressed_reason text, source text, created_at timestamptz default now(), updated_at timestamptz default now())`
- `download_requests(id uuid pk default gen_random_uuid(), email text not null, lang text not null default 'fr', token_hash text not null unique, expires_at timestamptz not null, max_uses int not null default 3, used_count int not null default 0, album_id uuid null, photos jsonb not null /* [{photo_id uuid, source 'album_photos'|'portfolio_photos'}] */, ip_hash text, revoked_at timestamptz, email_status text not null default 'queued' check (email_status in ('queued','sent','failed','guarded')), created_at timestamptz default now())`
- `events(id bigint generated always as identity pk, type text not null check (type in ('view','select_add','request','link_open','download')), photo_id uuid, album_id uuid, request_id uuid, is_day boolean, device text, country text, visitor_hash text, session_key text, bytes bigint, created_at timestamptz not null default now())` + indexes `(created_at)`, `(type, created_at)`, `(photo_id, created_at)`, partial unique for view dedupe: `unique (type, photo_id, visitor_hash, ((created_at at time zone 'Europe/Paris')::date)) where type='view'` (builder may implement as a function-based unique index).
- `rate_limits(key text, window_start timestamptz, count int not null default 0, primary key (key, window_start))`
- `rate_limit_hit(p_key text, p_limit int, p_window_seconds int) returns boolean` — atomic upsert; true = allowed.
- `consume_download_use(p_token_hash text) returns table(request_id uuid, photos jsonb, email text, remaining int)` — atomic `update ... set used_count = used_count+1 where token_hash=$1 and revoked_at is null and expires_at>now() and used_count<max_uses returning ...`; zero rows = refused.
- `purge_old_events(p_months int default 13) returns int` (used by P10).
- Seed no data. Backfill none.

## Shared server libs (P5 owns; others import, never redefine) — all under `src/lib/server/` and `import 'server-only'`
- `supabaseAdmin.ts` → `getAdminClient()` (service role, no session persistence)
- `tokens.ts` → `newToken()`, `hashToken(t)`, `signUnsubscribe(email)`/`verifyUnsubscribe(sig)` (HMAC with `DOWNLOAD_TOKEN_SECRET`)
- `rateLimit.ts` → `hit(key, limit, windowSeconds): Promise<boolean>`, `hashIdentifier(value)`
- `email/send.ts` → `sendEmail({to, subject, react|html, text, headers?, tags?})` (guard D-13), `email/layout.tsx` base React Email layout FR/EN
- `events.ts` → `logEvent(e)` (never throws; swallows + console.warn), `visitorHash(req)`
- `consent.ts` → `CONSENT_TEXT_VERSION`, FR/EN consent strings
- Env names (document in `.env.example` + DEPLOY-CHECKLIST): `RESEND_API_KEY`, `RESEND_FROM`, `SUPABASE_SERVICE_ROLE_KEY` (exists), `DOWNLOAD_TOKEN_SECRET`, `IP_HASH_SALT`, `NEXT_PUBLIC_SITE_URL`, `ALLOW_EMAIL_SEND` (dev only), `RESEND_WEBHOOK_SECRET` (P9)

## Route/URL contract
- Landing page: `/telechargement/[token]` (GET read-only)
- Single file: `GET /api/download/[token]/photo/[photoId]`; ZIP: `GET /api/download/[token]/zip?part=N` (both consume a use)
- Request: server action `requestDownload` in `src/app/telechargement/actions.ts` (P6)
- Newsletter: `/newsletter/confirmer?t=…` (POST button), `/newsletter/desinscription?s=…`, webhook `POST /api/webhooks/resend` (P9)
- Tracking: `POST /api/track` (P10). Admin: `/admin/stats`, `/admin/newsletter`

## Ownership of shared files
- P5 owns: migration, `src/lib/server/*`, `.env.example`, privacy page, root layout metadata links
- P6 owns: `CartDrawer.tsx`, `CartContext.tsx` (adds `photoId`, `albumId`, `source`; storage key → `photo-cart-v2`), `AlbumPageClient.tsx` request UI
- P7 owns: `/telechargement/[token]`, `/api/download/*`
- P8a owns: `ImageProtection` component + root layout mount (additive). P8b removes old download code AFTER P6+P7 merge
- P9 owns: `/admin/newsletter`, newsletter pages, webhook. P10 owns: `/admin/stats`, `/api/track`, beacon client
- Shared & additive only (new keys/entries appended): `src/lib/i18n.ts`, `src/app/admin/layout.tsx` NAV, `package.json`, `src/proxy.ts`

## Hard rules (every agent)
Own worktree; reserved port only (P5 3103, P8a 3104, P6 3105, P7 3106, P9 3107, P10 3108, design agents 3110+, auditors 3120+); never `taskkill /IM`; never `npm ci` in a shared worktree (use `npm install --no-save`); no push; no `main`/`master`/`dev`/integration writes; no writes to real DBs (migration FILES only; for local verification use pure-SQL review or the Supabase branch MCP ONLY if the orchestrator says so); never call Resend for real (guard D-13); explicit `git add <paths>`; atomic commits; gate before finishing = `npx tsc --noEmit` + `npm run lint` + `npm run build` (dummy public env vars allowed; `.env.local` is copied, never print it); prefix shell commands with `rtk` (also inside && chains; use `rtk proxy <cmd>` if a filter hides output; plain command if a wrapper is broken); FINAL ANSWER under 30 lines with an honest list of what was NOT proven.
