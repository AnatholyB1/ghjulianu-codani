# Research Summary — v1.1 Email-gated downloads, newsletter, admin KPIs

**Confidence:** MEDIUM (repo facts + npm versions solid; Vercel/Resend limits and CNIL wording not re-verified)

## Executive Summary
v1.1 replaces client-side downloads (cart fetch loop, browser JSZip, folder picker) with a server-mediated flow: visitor gives an email (optional newsletter opt-in), receives a Resend email with an opaque expiring link. Every step writes to a first-party `events` table feeding an admin KPI dashboard. Also: UI-only image blocking, private albums reusing the flow, subscriber management.

**Approach:** DB-backed token (SHA-256 hash, atomic use-count in SQL); streamed ZIP with `fflate` (store mode) in a Node route; subscribers in Supabase, Resend only sends; server-only events; KPIs aggregated in SQL.

**Resolved conflict:** STACK assumed private originals + sharp; ARCHITECTURE found all buckets public and files already 2400px WebP with no master. Follow ARCHITECTURE: v1.1 = pass-through from public buckets, no sharp, no bucket migration; add `resolvePhotoSource()` so private masters can come in v1.2. Consequence: URLs stay guessable — the gate is lead capture, not DRM.

## Stack (additions)
- `resend` ^6.37 + `@react-email/components` + `@react-email/render`; `fflate` ^0.8.3; remove `jszip`.
- Node `crypto` for tokens/HMAC unsubscribe; `userAgent()` from `next/server` (no ua-parser-js, AGPL).
- Rate limiting: Postgres RPC (no new vendor); Upstash is upgrade path.
- `recharts` ^3.10 dynamic in admin (or plain SVG).
- Skip: sharp, archiver, JWT, CAPTCHA, Resend Audiences/Broadcasts, analytics SaaS.
- Resend batch: max 100 emails, no attachments → always send links.
- Env: RESEND_API_KEY, RESEND_FROM, SUPABASE_SERVICE_ROLE_KEY, DOWNLOAD_TOKEN_SECRET, IP_HASH_SALT, DOWNLOAD_TOKEN_TTL_HOURS, NEXT_PUBLIC_SITE_URL.

## Features
- **Must:** request form (honeypot, rate limit, FR/EN notice); optional unchecked newsletter box with versioned consent; expiring link + landing page (expired/used-up states); streaming ZIP + single-file routes with size cap; download events from day one; removal of old client code; private albums with server-side key check + brute-force limiting; subscriber admin (unsubscribe + List-Unsubscribe headers, CSV export w/ formula-injection guard, deletion, bounce/complaint suppression); UI blocking scoped to images; KPIs downloads/views/favorites with period selector.
- **Should:** double opt-in; landing page thumbnails + per-photo download; funnel, top albums, day/night split, devices, estimated bandwidth, subscriber growth; admin revoke/resend link.
- **Defer:** broadcast composer, multiple resolutions/private masters, ZIP pre-build cache, weekly digest, Resend Audience sync, CAPTCHA. **Rejected:** watermark, DRM, visitor accounts.

## Architecture
- `requestDownload` server action: honeypot → rate limits → resolve photo IDs from DB (never client URLs) → private-album cookie check → insert `download_requests` → upsert subscriber if consent → send email.
- Email links to `/telechargement/[token]` (read-only); button hits `/api/download/[token]` or `.../zip`, which consumes a use atomically and writes the event (bytes) via `after()`.
- Views: `sendBeacon` → `/api/track`; device/country derived server-side.
- Tables: `subscribers`, `download_requests`, `events`, `rate_limits` (RLS on, no policies; service role only).
- Admin: `/admin/stats`, `/admin/newsletter`. `ImageProtection` client component in layout.
- Modified: `CartContext` (photoId/albumId, key `photo-cart-v2`), `CartDrawer`, `AlbumPageClient`, `albums/[slug]/page.tsx`, `PortfolioGrid`, `proxy.ts`.

## Critical Pitfalls
1. Bundled consent → newsletter optional, download works without it.
2. Scanner-burned links → GET landing doesn't consume a use; DOI confirm is POST; store token hash; no-referrer + noindex.
3. No unsubscribe/DOI/bounce handling → HMAC unsubscribe token, List-Unsubscribe headers, Svix-verified Resend webhook.
4. Late deliverability → verify Resend domain (subdomain) first; previews must not send real mail.
5. ZIP limits on Vercel → never buffer, set maxDuration, cap size/count, spike early on preview.
6. Gate shipped with bypass → delete old code same release; private-album key checked server-side, never in query string.
7. KPI quality → beacon views, session dedupe, bot filter, no cookies/raw IPs, Europe/Paris buckets, purge raw events ~13 months.

## Open Product Decisions
| # | Decision | Recommendation |
|---|---|---|
| 1 | Newsletter consent optional? | Optional, unchecked |
| 2 | Double opt-in? | Yes |
| 3 | Broadcast composer? | Defer; send from Resend dashboard using CSV export |
| 4 | Privacy page | Required in Phase 1 (check if exists; FR legal copy review) |
| 5 | "Favorite photos" | Cart/selection adds, next to most-downloaded |
| 6 | Public vs private originals | Keep public in v1.1; private masters v1.2 |

Settings to fix in requirements: token TTL/max uses (48h, 3 uses), ZIP size cap, landing thumbnails.

## Suggested Phases (numbering continues from 5)
1. Foundations: schema + RLS, Resend domain, env vars, photoId in cart, rate-limit RPC, token lib, privacy page, consent text.
2. Request flow + email: form, action, template, subscriber upsert, cart/private-album wiring (old code kept as rollback).
3. Delivery routes + ZIP streaming: landing, file/ZIP routes, size guard, atomic use-count, download events. Highest risk — spike first.
4. Removal of direct downloads + UI protection (after Phase 3 verified).
5. Newsletter management: DOI, unsubscribe, bounce webhook, admin list + CSV, erasure/retention.
6. Event tracking + KPI dashboard: /api/track, favorites, bot filter, SQL views, /admin/stats, retention purge.

**Research flags:** Phase 3 (Vercel maxDuration/memory, fflate on Turbopack); Phases 1/2/5 (Resend limits, webhook events, List-Unsubscribe pass-through, FR legal copy); Phase 6 (CNIL audience-measurement exemption, x-vercel-ip-country).

## Gaps
Vercel plan limits; Resend limits/events; privacy page existence; no `file_size` column for ZIP guard; cart IDs are URLs today; CNIL retention figures; rate-limit store and chart lib (low stakes).
