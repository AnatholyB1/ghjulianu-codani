# Architecture Patterns - v1.1 (email-gated downloads, newsletter, KPIs)

**Domain:** photo portfolio (Next.js 16 App Router + Supabase + Vercel)
**Researched:** 2026-11-07
**Confidence:** MEDIUM-HIGH (codebase read directly; Vercel limit specifics from training knowledge, flagged below)

## Existing facts that drive the design (verified in repo)

- All buckets (`album-photos`, `portfolio-photos`, `album-covers`, ...) are PUBLIC. DB stores full public URLs in `album_photos.src` / `portfolio_photos.src`. `next.config.ts` image `remotePatterns` only allows `/storage/v1/object/public/**`.
- Admin upload already compresses client-side (`src/lib/compressImage.ts`: WebP, max 2400px, q 0.85). So the "original" the visitor downloads today is ALREADY a web-optimised WebP (<= 2400px). There is no separate full-res original.
- Downloads are 100% client-side: `CartDrawer.downloadPhoto` (fetch+blob loop), `AlbumPageClient` `downloadWithConcurrency` (File System Access API) and `downloadWithZip` (JSZip in browser). No server API routes exist (`src/app/api` absent). Server mutations = `src/app/admin/actions.ts` server actions.
- Private albums: `albums.access_key`, cookie `album-access-{slug}` checked in `albums/[slug]/page.tsx` with `createServiceClient()`; `AccessKeyGate` exists. Key compare is plain string equality.
- `src/proxy.ts` (Next 16 replacement for middleware) guards `/admin` via Supabase auth and calls `updateSession`. Matcher runs on everything except static/images; new `/api/*` routes pass through it.
- Cart = `CartContext` (localStorage `photo-cart`, items = `CartPhoto{id=src,src,width,height,alt,context,downloadName}`). Cart id is the URL, not a DB id.
- Deps: `jszip`, `@supabase/ssr`, `@vercel/analytics`, `zustand`. No Resend, no zip-streaming lib, no sharp declared (Next bundles sharp for next/image, but do not rely on importing it without adding it).

## Key decisions

### 1. Where originals live: keep PUBLIC bucket for display; delivery gate is application-level (recommended for v1.1)
Because PROJECT.md decided "UI-only protection, no watermark", and existing files are only 2400px WebP, moving files to a private bucket buys little and would break next/image + every stored URL. Decision:
- Public buckets unchanged (display, SEO, next/image).
- The "signed link" is an APPLICATION token (see 2) pointing at a server route that streams the files. The public URLs remain technically guessable; this is accepted and must be stated in requirements (consent/lead capture, not DRM).
- Optional later (v1.2): add private bucket `deliveries` for higher-res masters on new uploads, with `photos.master_path` columns; server route prefers master over public src. Design the route so the "resolve file source" function is one swap point (`resolvePhotoSource(photo)`), so this needs no API change.
- Do NOT use Supabase `createSignedUrl` as the user-facing link: it cannot count uses, cannot be bound to email, cannot be revoked per-request, and exposes the supabase.co host. Use own token.

### 2. Signed link mint/validate/expire: DB-backed opaque token (not JWT)
- Mint (server action `requestDownload` or `POST /api/download-request`): validate email + consent, rate limit, create `download_requests` row with `token_hash` = sha256(random 32 bytes base64url), `expires_at = now()+48h` (config), `max_uses` (e.g. 3), `photo_ids`/`album_id` scope. Raw token only goes into the Resend email: `https://site/telechargement/{token}`.
- Store only hash (DB leak does not leak links). Lookup by hash with service client. Expiry/uses/revocation enforced in SQL: `UPDATE download_requests SET use_count=use_count+1 WHERE token_hash=$1 AND expires_at>now() AND use_count<max_uses RETURNING *` (atomic, prevents race and over-use).
- Why DB over stateless HMAC/JWT: need use-count, revoke, KPI join (request -> email -> downloads), and per-request photo list; volume is tiny.
- Landing page `app/telechargement/[token]/page.tsx` (server component) shows status (valid/expired) and a button hitting `GET /api/download/[token]` (single-file) or `/api/download/[token]/zip`. Do NOT consume a use on page view (email scanners/link prefetchers will burn it); consume on the file/zip GET only, and count one use per ZIP, per single file allow a bounded count.
- Private albums: access key still gates viewing (`album-access-{slug}` cookie). Request mint for a private album must verify cookie server-side (re-check against `albums.access_key`, constant-time compare). Fix to timing-safe compare while there.

### 3. ZIP production within Vercel limits
- 4.5 MB limit applies to request/response bodies of buffered serverless responses; a STREAMED response (ReadableStream from a Node route handler) is not capped by it. Duration is the real bound: use `export const runtime = 'nodejs'` and `export const maxDuration = 60` (raise to 300 if plan/Fluid compute allows; verify in Vercel project settings - MEDIUM/LOW confidence on exact plan limits, flag for phase research).
- Build the ZIP as a stream, never buffer: use `fflate` (`Zip` + `ZipPassThrough`, STORE mode - JPEG/WebP don't recompress) or `archiver`; pipe `fetch(publicUrl).body` of each photo sequentially (or concurrency 2-3) into the zip stream, return `new Response(readableWeb, {headers:{'Content-Type':'application/zip','Content-Disposition':...}})`. Memory stays ~ one chunk. Avoid `jszip` server-side (buffers everything).
- Size guard: sum of known sizes (add `file_size` to photo rows or HEAD requests at mint time) capped (e.g. <= 300 MB / 150 photos). Over cap -> split into parts (`part=1..n`, each its own ZIP link) rather than a bigger function.
- Optimised delivery ("recompression, reasonable dimensions"): since stored files are already <=2400 WebP, v1.1 delivery = pass-through. If re-encoding needed, do it once at upload time in the admin client (existing `compressImage`) - NOT per download in the function (CPU/duration cost). Offer a JPEG-conversion only if clients demand it; if so add `sharp` explicitly and a cache.
- ZIP cache: optional optimisation, phase-late. Store built ZIP in private bucket `zip-cache` keyed `{album_id}/{hash(photo_ids)}.zip`, serve via 302 to a short `createSignedUrl` (60 s) so bytes bypass the function. Requires build-time upload (Supabase file limit 50 MB on free plan, check) - so only for small albums; keep streaming path as primary and fallback.
- Cart multi-photo selection: same endpoint, request scope = list of photo ids (resolved server-side from DB; cart `id` is URL so mint must map URL -> row, or add `photoId` to `CartPhoto` and persist version bump in localStorage).
- Bandwidth: Supabase egress is the cost; the function adds Vercel egress too. Streaming logs `bytes_sent` for KPI "bande passante".

### 4. Where events are recorded
Single table `events` written ONLY by server code (service role), RLS on with no public policies.
- `download` events: written inside the download route (server truth). Insert at start (`started`) and update bytes at end (`transfer-complete` in stream `flush`), or insert once with `bytes` from stream counter in a `TransformStream` flush; use `after()` (next/server) so the insert does not block the stream.
- `view` events: client `navigator.sendBeacon('/api/track', json)` from a tiny `TrackView` client component (album page, lightbox open, portfolio photo). Server route validates type enum, derives device class and country from headers (`user-agent`, `x-vercel-ip-country`), never trusts client for those. Do not log in Server Component render (ISR/bots/prefetch inflate). Debounce per session (sessionStorage) and filter bots by UA.
- `favorite` ("photos préférées"): cart add is the existing favorite signal; fire `track('favorite', photoId)` from `CartContext.add`. Needs photoId in `CartPhoto` (see above). Confirm with owner that "préférées" = cart-add.
- Day/night KPI: join to `photos.is_day`/`album_photos.is_day` (already exists), no extra column on events except denormalised `is_day` for cheap aggregates.
- `@vercel/analytics` stays for page analytics; custom table gives per-photo and per-email attribution that Vercel Analytics cannot.

### 5. Rate limiting
No Redis in stack. Use Postgres: `rate_limits(key text, window_start timestamptz, count int, primary key(key,window_start))` incremented by an RPC `rate_limit_hit(key, window, max)` returning boolean. Keys: `ip:{hash}:request` (e.g. 5/h), `email:{hash}:request` (3/day), `ip:{hash}:download`. Hash IPs (sha256+salt) - GDPR. Upgrade path: Upstash if needed (Vercel Marketplace). Also add Cloudflare-style honeypot field + minimal email normalisation. Cap total emails sent per day to protect Resend quota.

### 6. Newsletter
- Consent is captured at the download form (checkbox, unchecked by default; download must work with consent=false - gating on newsletter consent is a GDPR "bundled consent" problem; email is needed for the link under "contract/legitimate interest", newsletter separate opt-in).
- `subscribers` table: `email citext unique`, `consent_newsletter bool`, `consented_at`, `consent_source`, `consent_text_version`, `unsubscribed_at`, `unsub_token` (random, stored plain or hashed). Double opt-in recommended (send confirm mail) - flag for requirements decision; at minimum timestamped consent + one-click unsubscribe (`/desabonnement/[token]`, plus `List-Unsubscribe` + `List-Unsubscribe-Post` headers in Resend emails).
- Export CSV: admin route handler `GET /admin/newsletter/export` (proxy already auth-guards `/admin/*`; ALSO check `getUser()` inside handler - defense in depth). Neutralise CSV formula injection (prefix `'` on cells starting `= + - @`).
- Send campaigns: Resend Broadcasts/Audiences or loop via batch API from an admin server action; keep v1.1 to transactional + simple broadcast. Run long sends in chunks (Resend batch 100) respecting maxDuration.
- Privacy page (`politique-de-confidentialite`) must be updated (modified file).

### 7. UI image protection
Client-only, additive: a `ProtectedImage`/CSS layer, global `onContextMenu`/`onDragStart` prevention scoped to `img` inside gallery wrappers (`PortfolioGrid`, `AlbumPageClient` `PhotoCard`, `Lightbox`), CSS `-webkit-touch-callout:none; user-select:none; pointer-events` overlay for long-press. Implement as one wrapper/hook, applied in `layout.tsx` via a small `ImageProtection` client component using delegated event listeners on `document` (one place, no per-component edits). Do not break keyboard/lightbox clicks. Document that it is deterrence only.

## Recommended architecture

```
Browser
  CartDrawer / AlbumPageClient (modified: no direct fetch of src)
     -> <DownloadRequestForm/> (NEW: email + newsletter checkbox + honeypot)
          -> server action requestDownload()  (NEW, src/app/actions/download.ts)
               -> rate_limit_hit RPC -> insert download_requests (token_hash)
               -> Resend send "Votre lien" (NEW lib/email/resend.ts + templates)
               -> upsert subscribers (if consent)
  Email link -> /telechargement/[token] (NEW page, server)
     -> GET /api/download/[token]            (NEW, single file stream)
     -> GET /api/download/[token]/zip        (NEW, streaming zip, nodejs runtime)
          -> atomic use_count++ ; stream from public bucket ; after(): insert events
  sendBeacon -> POST /api/track (NEW) -> events
Admin
  /admin (modified nav) -> /admin/stats (NEW KPIs: SQL views/RPC) , /admin/newsletter (NEW list+export+send)
```

### Component boundaries

| Component | Status | Responsibility | Talks to |
|---|---|---|---|
| `src/lib/downloadTokens.ts` | NEW | gen token, hash, TTL config | download actions/routes |
| `src/lib/email/resend.ts`, templates | NEW | Resend client + FR email templates | actions |
| `src/lib/rateLimit.ts` | NEW | RPC wrapper | actions, routes |
| `src/lib/track.ts` (client) / `/api/track` | NEW | beacon + server insert | events table |
| `src/lib/zipStream.ts` | NEW | fflate streaming zip from URLs | download route |
| `src/app/api/download/[token]/**` | NEW | validate+stream | DB, storage public URLs |
| `src/app/telechargement/[token]/page.tsx` | NEW | link landing/status | DB |
| `src/components/DownloadRequestForm.tsx` | NEW | email/consent UI (modal for cart, inline for album) | server action |
| `src/components/ImageProtection.tsx` | NEW | UI blocking | layout |
| `src/app/admin/stats/*`, `admin/newsletter/*` | NEW | KPIs, subscribers | SQL views, service client |
| `CartDrawer.tsx` | MODIFIED | remove `downloadPhoto` loop; button opens request form; the existing donation modal flow kept before form | form |
| `CartContext.tsx` | MODIFIED | add `photoId`/`albumId` to `CartPhoto`; favorite tracking; bump storage key (`photo-cart-v2`) to avoid stale items | track |
| `AlbumPageClient.tsx` | MODIFIED | delete `downloadWithConcurrency`, `downloadWithZip`, File System Access path; `PrivateDownloadSection` becomes "recevoir par email"; copy "sans compression" must change; add TrackView | form |
| `albums/[slug]/page.tsx` | MODIFIED | pass album id to client; constant-time key compare | - |
| `PortfolioGrid.tsx` | MODIFIED | protection wrapper, view tracking | - |
| `admin/actions.ts` | MODIFIED (small) | revoke link, delete-cascade considerations | - |
| `src/proxy.ts` | MODIFIED | verify `/api/*` and `/telechargement/*` are not blocked; ensure session refresh not run unnecessarily on `/api/track` (perf) | - |
| `package.json` | MODIFIED | add `resend`, `fflate`; `jszip` can be removed once client zip gone | - |

## DB schema additions (new migrations in `supabase/migrations/`, also mirror into `schema.sql`)

```sql
create extension if not exists citext;

create table subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  consent_newsletter boolean not null default false,
  consent_at timestamptz, consent_source text, consent_text_version text,
  confirmed_at timestamptz,            -- if double opt-in
  unsubscribed_at timestamptz,
  unsub_token text not null unique default encode(gen_random_bytes(24),'hex'),
  created_at timestamptz default now()
);

create table download_requests (
  id uuid primary key default gen_random_uuid(),
  subscriber_id uuid references subscribers(id) on delete set null,
  email citext not null,
  album_id uuid references albums(id) on delete cascade,
  scope text not null check (scope in ('album','selection')),
  photo_ids uuid[],                    -- null = whole album
  token_hash text not null unique,
  expires_at timestamptz not null,
  max_uses int not null default 3,
  use_count int not null default 0,
  revoked_at timestamptz,
  ip_hash text, created_at timestamptz default now()
);

create table events (
  id bigint generated always as identity primary key,
  type text not null check (type in ('view_album','view_photo','download','favorite','request')),
  album_id uuid, photo_id uuid, request_id uuid,
  is_day boolean, device text, country text,
  bytes bigint, session_id text,
  created_at timestamptz default now()
);
create index on events (type, created_at desc);
create index on events (album_id, type);

create table rate_limits (key text, window_start timestamptz, count int default 1, primary key (key, window_start));
-- RPC rate_limit_hit(key, window_seconds, max) security definer
-- Optionally file_size bigint on album_photos/portfolio_photos for ZIP size guard.
```
RLS: enable on all four with NO policies (service-role only). Aggregates for admin via SQL views or RPCs (`kpi_daily`, `kpi_top_albums`) called from admin server components with the service client after `getUser()` check. Retention: purge `events`/`rate_limits` older than N months (pg_cron or admin action) and `download_requests` after expiry+30d - GDPR minimisation.

## Data flow (download)
Cart/album -> form (email, consent) -> server action: honeypot, rate limit, resolve photo ids from DB (never trust client URLs), private-album cookie check -> insert request -> Resend email -> user clicks -> landing validates (read-only) -> user clicks download -> route atomically consumes use -> streams from Storage -> `after()` records `download` event with bytes.

## Anti-patterns to avoid
- Trusting client-sent `src` URLs for ZIP contents (SSRF/arbitrary proxy): always resolve by DB id, and only allow host = project Supabase storage.
- Buffering ZIP in memory / using jszip server-side.
- Consuming link on GET of landing page (email security scanners burn it).
- Putting newsletter consent as a condition to receive the download.
- Recording views in Server Components or via Vercel logs.
- Public `events` insert via anon key + RLS (spam / metric poisoning).
- Hardcoding Supabase host/anon keys again (recent commits show env pinning trouble: reuse `utils/supabase/server` `createServiceClient`, and add `RESEND_API_KEY`, `DOWNLOAD_TOKEN_TTL_HOURS`, `IP_HASH_SALT` env vars to Vercel).

## Suggested build order (dependency-driven)
1. **Schema + infra foundations**: migrations (subscribers, download_requests, events, rate_limits), Resend client + domain verification (DNS lead time - start early), env vars, `photoId` in `CartPhoto`.
2. **Request flow + email**: form component, `requestDownload` action, token lib, rate limit, subscriber upsert, email template. Wire into CartDrawer and private-album section (old client download code still present behind removal in step 4 to keep a rollback).
3. **Delivery routes**: landing page, single-file route, streaming ZIP route, size guard, use-count/expiry. Test large album on Vercel preview (duration/memory).
4. **Remove direct downloads** (delete client ZIP/dir-picker/fetch code, jszip dep, update copy) + **UI image protection**. Doing this only after 3 works avoids a window with no download path.
5. **Newsletter admin**: list, unsubscribe page + headers, CSV export, (double opt-in/broadcast), privacy page update.
6. **Event tracking + KPI dashboard**: track endpoint/beacon, download events in step 3 routes (instrument events there from the start; step 6 only adds views/favorites + UI), admin stats with SQL views, charts (plain SVG/CSS to avoid heavy deps).
7. **Optimisations**: ZIP cache, retention jobs, optional private masters bucket.

Note: event writes for downloads should be added in step 3 (cheap) so KPI history starts accumulating before the dashboard exists.

## Research flags
- Phase 3 (ZIP streaming): NEEDS verification on Vercel plan (maxDuration cap, memory, streaming response behaviour, fflate vs archiver on Node 20+/Turbopack). Prototype early.
- Phase 2/5: Resend domain verification, sending limits, Broadcast vs batch API, GDPR/CNIL wording (double opt-in) - legal copy in French.
- Phase 6: define "photos préférées" and bot filtering; verify `x-vercel-ip-country` availability.
- Phase 4: UI protection is standard patterns; low risk.

## Scalability
| Concern | Now (hundreds/mo) | 10K downloads/mo | Beyond |
|---|---|---|---|
| ZIP streaming | per-request stream OK | cap sizes, add cache + 302 to signed Storage URL | CDN/object-storage prebuilt zips |
| events | single table | indexes + daily rollup view | partition / PostHog |
| rate limit | Postgres RPC | fine | Upstash |

## Sources / confidence
- Repo files read: AlbumPageClient.tsx, CartDrawer.tsx, CartContext.tsx, albums/[slug]/page.tsx, proxy.ts, next.config.ts, schema.sql, compressImage.ts (HIGH).
- Vercel streaming/maxDuration/4.5MB, Resend features, Supabase upload limits: from training knowledge, not re-verified this session (MEDIUM/LOW) - verify in phase research (Vercel Functions limits docs, Resend docs, Supabase Storage limits).
