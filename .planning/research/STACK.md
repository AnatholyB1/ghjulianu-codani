# Technology Stack — Milestone v1.1 (email download flow, newsletter, KPIs)

**Project:** ghjulianu-codani photo portfolio
**Researched:** 2026-11-07
**Scope:** only NEW capabilities. Next.js 16.1.6, React 19.2.3, Supabase (@supabase/ssr 0.9, supabase-js 2.98), zustand, framer-motion, lucide-react, next/image, @vercel/analytics are kept as-is.
**Overall confidence:** MEDIUM-HIGH (versions verified against the npm registry on 2026-11-07; Vercel runtime limits and Resend rate limits are not re-verified, see Gaps).

## Recommended additions

| Technology | Version | Purpose | Why |
|---|---|---|---|
| `resend` | ^6.37.0 | Transactional emails (download link) and newsletter sends | Already chosen. Official SDK. Needs `@react-email/render` as a peer dependency. Node >= 20. |
| `@react-email/components` | ^1.0.12 | Email templates in TSX | Lets you share Tailwind-free, inline-styled templates and pass `react:` to Resend. Provides `@react-email/render`, which the `resend` peer needs. Keep to 1-2 templates (download link, newsletter). |
| `@react-email/render` | ^2.2.0 | Peer of `resend` | Must be installed explicitly. |
| `sharp` | ^0.34.5 (pin to Next's range, NOT 0.35.x) | Server-side recompression and resize of originals before delivery | Next 16.1.6 already depends on `sharp ^0.34.4` (0.34.5 is installed). Staying on the 0.34 line gives a single native binary and avoids Vercel bundling surprises. 0.35.5 is the latest but does not match Next's range, so skip it until Next bumps. Node >= 20.9. |
| `fflate` | ^0.8.3 | Streaming ZIP (store mode, no compression) | MIT, zero dependencies, pure JS, has a streaming `Zip` + `ZipPassThrough` API. Replaces `jszip` which builds the whole ZIP in memory. JPEGs are already compressed, so use store mode: negligible CPU, flat memory. |
| `@upstash/ratelimit` | ^2.2.0 | Rate limiting for the request-link, download and newsletter endpoints | Serverless-safe (Vercel has no shared memory between invocations). Sliding-window algorithm, per-IP and per-email keys. |
| `@upstash/redis` | ^1.41.0 | Redis client for the above | REST-based, works in route handlers and in `proxy.ts`. Install via the Vercel Marketplace, which injects the env vars. The free tier is enough for a portfolio. |
| `recharts` | ^3.10.1 | Admin KPI charts (line, bar, donut) | Peer deps explicitly include React 19. Composable and declarative. Load it with `next/dynamic` (`ssr: false`) only in the admin KPI page so it stays out of public bundles. |

Node built-ins used (no install needed):
- `node:crypto` for download token generation (`randomBytes(32)`, store only the SHA-256 hash), HMAC-signed unsubscribe tokens, and `timingSafeEqual`.
- `userAgent()` from `next/server` for device and browser parsing. It is built in, so do NOT add `ua-parser-js`.

## Integration decisions (the "how")

### 1. Email and signed expiring links
- **Do not use Supabase `createSignedUrl` as the link emailed to the user.** It cannot be counted, revoked, rate-limited or tied to an email and consent. Use your own opaque token.
- Table `download_requests`: `id`, `email`, `token_hash`, `album_id` or `photo_ids[]`, `expires_at`, `used_count`, `max_uses`, `created_at`. The emailed link is `/api/dl/[token]`.
- The route handler hashes the token, checks expiry and use count, logs a KPI event, then either streams the ZIP or returns a 302 to a short-lived (about 60 s) `supabase.storage.createSignedUrl(path, 60, { download })` on the private bucket. Create that signed URL with the service-role client on the server only.
- Originals should live in a private bucket (or be served only through this route). Public bucket URLs for originals defeat the flow. This is a migration point to verify in the existing storage layout.
- Server-only Supabase service-role client in `src/utils/supabase/admin.ts`. Never import it from client code.
- Resend: send from a verified domain. Add `List-Unsubscribe` and `List-Unsubscribe-Post` through the `headers` option (the Resend docs say `headers` accepts custom headers; they do not mention special handling of List-Unsubscribe, so treat it as pass-through and test).
- Newsletter blasts: `resend.batch.send` takes at most 100 emails per call and does NOT support attachments (verified in the Resend docs). Chunk by 100 and respect rate limits. Send the download ZIP as a link, never as an attachment.
- Use Resend only for sending. Keep subscribers in your Supabase `newsletter_subscribers` table (`email`, `consent_at`, `consent_source`, `unsubscribed_at`, `unsub_token`). Do NOT use Resend Audiences or Broadcasts, because the decision is Supabase as the source of truth and you need CSV export and timestamped consent.

### 2. Image recompression
- Use `sharp` in a Node-runtime route handler (`export const runtime = 'nodejs'`): `.rotate().resize({ width: 2560, height: 2560, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true })`. Keep EXIF orientation via `.rotate()`. Strip metadata by default (privacy plus size).
- There is already `src/lib/compressImage.ts`, which is presumably client-side upload compression. Reuse its target dimensions and quality to stay consistent, and avoid duplicating the logic.
- Cache the result: write the recompressed version to a derived storage path (for example `deliverables/{photoId}-2560.jpg`) on first request or at upload time. Do not recompress per download.

### 3. ZIP streaming
- `fflate` `Zip` with `ZipPassThrough` entries. Pipe into a web `ReadableStream` and return `new Response(stream, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': ... } })`. Fetch the photos sequentially or with a concurrency cap of 3, so memory stays roughly one image at a time.
- Optional cache: for albums, build the ZIP once and store it in a private Supabase bucket (key = album id + hash of photo ids). Later requests redirect to a signed URL. This saves CPU, and the bandwidth is billed to Supabase instead of Vercel function time.
- Remove `jszip` and `showDirectoryPicker` code paths once migrated (`AlbumPageClient.tsx` is the only current user of jszip or directory picker).

### 4. Rate limiting
- Limiters (suggested starting values, tune later):
  - request-link: 5 per hour per email and 10 per hour per IP;
  - download route: 20 per hour per IP;
  - newsletter subscribe: 5 per hour per IP.
- Apply them in route handlers or server actions rather than a global `proxy.ts` matcher. They need the email, and middleware cannot cheaply read the body.
- Add a honeypot field and a minimal email-format check. Do NOT add a CAPTCHA library in this milestone (defer it).
- Fallback if Upstash is refused: a Postgres counter via a Supabase RPC. It works, but it adds latency and write load. Upstash is preferred.

### 5. KPI tracking
- Own the data: a Supabase `events` table (`type` in view / download_request / download / favorite / newsletter_signup, `album_id`, `photo_id`, `period` day or night, `device`, `bytes`, `session_hash`, `created_at`). Write with the service-role client from route handlers or server actions, using `userAgent()` for device. Do not store raw IPs (hash with a daily salt if a unique visitor count is needed). Mention this in the privacy policy.
- Aggregate with SQL views or RPC functions (`date_trunc`, `group by`), and call them from server components. No analytics SaaS and no ETL.
- `@vercel/analytics` is kept for page-level traffic, but it has no read API worth depending on, so the admin dashboard must run off your own events table.
- Bandwidth KPI = sum of `bytes` logged at the download route, plus an estimate for views (`size` per photo x views). Label it clearly as an estimate.
- View tracking: fire a debounced, beacon-style POST (`navigator.sendBeacon`) from the album and photo client components. Dedupe per session in `sessionStorage`.

### 6. Charts and CSV
- `recharts` for the charts. CSV export of subscribers is a ~15-line server route handler (escape quotes and prefix `=+-@` cells against CSV injection). Add no CSV library.

## Alternatives considered

| Category | Recommended | Alternative | Why not |
|---|---|---|---|
| ZIP streaming | `fflate` | `archiver` 8.0.0 | Heavier, Node-streams only (needs `Readable.toWeb` glue) and more dependencies. A fine fallback if fflate streaming misbehaves. |
| ZIP streaming | `fflate` | keep `jszip` | In-memory, which risks out-of-memory failures and timeouts on large albums. |
| Rate limiting | Upstash | Postgres counter / in-memory Map | In-memory does not work across serverless instances. Postgres adds load and latency. |
| Device parsing | `userAgent()` from Next | `ua-parser-js` 2.x | v2 is AGPL-3.0-or-later (verified on npm), which is a licensing risk. Next ships the helper already. |
| Charts | `recharts` | `chart.js`/`react-chartjs-2`, `@tremor/react`, `visx` | Recharts is the simplest declarative fit with React 19 and Tailwind. Tremor brings a large UI layer you do not need. Hand-built SVG is fine for only 1-2 sparklines but does not scale to the KPI set. |
| Newsletter store | Supabase table | Resend Audiences/Broadcasts | You lose consent timestamps and CSV control. Out of line with the Supabase decision. |
| Download link | own token + route | Supabase signed URL emailed directly | No revocation, no usage counting, no per-email binding. |
| Analytics | own Supabase events | PostHog/Plausible | New vendor and a cookie/GDPR surface, and overkill for a single-photographer site. |
| Email templates | react-email | raw HTML strings | Raw HTML is acceptable for two templates, so react-email is optional. Pick one and skip it if bundle or complexity matters. |

## What NOT to add
- `ua-parser-js` (AGPL), `jszip` (remove), `archiver` (unless fflate fails), `nodemailer`, `csv-stringify`/`papaparse`, `jsonwebtoken` or `jose` (opaque DB tokens are simpler and revocable), Redis beyond Upstash, any watermark library, any DRM/anti-screenshot lib (decision: UI-only blocking), any CAPTCHA, Resend Audiences, `react-query` or SWR (server components cover the admin).
- Do not bump `sharp` past Next's range, and do not add `@vercel/og`-style extras.
- UI blocking (right-click, drag, long-press) needs no library: CSS `user-select: none`, `-webkit-touch-callout: none`, `pointer-events` plus `draggable={false}`, and `onContextMenu`/`onDragStart` handlers. Do not apply `pointer-events: none` to `<img>` if it breaks lightbox taps. Prefer a transparent overlay element.

## Installation

```bash
npm install resend@^6.37.0 @react-email/components@^1.0.12 @react-email/render@^2.2.0 \
  sharp@^0.34.5 fflate@^0.8.3 @upstash/ratelimit@^2.2.0 @upstash/redis@^1.41.0 recharts@^3.10.1
npm uninstall jszip
```

New environment variables: `RESEND_API_KEY`, `RESEND_FROM`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `DOWNLOAD_TOKEN_SECRET` (unsubscribe HMAC), `NEXT_PUBLIC_SITE_URL`.

## Gaps to validate in phase research
- Vercel function max duration and memory for the plan in use (ZIP streaming of big albums may need `maxDuration` or the cached ZIP approach). Not re-verified here.
- Resend rate limit per second on the account and domain verification (SPF/DKIM) lead time. The batch docs page did not state it.
- Whether original photos currently live in a PUBLIC Supabase bucket (affects the entire protection model). Check `src/lib/storage.ts`.
- `next.config.ts` `serverActions.bodySizeLimit` is already 25mb. Downloads use route handlers, so no change is needed.
- Gmail/Apple "one-click unsubscribe" behavior with Resend headers must be tested with a real send.

## Sources
- npm registry (`npm view`), 2026-11-07: resend 6.37.0, @react-email/components 1.0.12, @react-email/render 2.2.0, sharp 0.35.5 latest (0.34.5 installed via Next), fflate 0.8.3 (MIT), archiver 8.0.0, @upstash/ratelimit 2.2.0, @upstash/redis 1.41.0, recharts 3.10.1 (peer React 19 OK), ua-parser-js 2.0.10 (AGPL-3.0-or-later). HIGH.
- Local `node_modules/next/package.json`: `sharp ^0.34.4`. HIGH.
- https://resend.com/docs/api-reference/emails/send-batch-emails (100 per batch, no attachments, custom headers). HIGH.
- Design recommendations (token flow, event schema, limiter values): reasoned from the architecture, MEDIUM.
