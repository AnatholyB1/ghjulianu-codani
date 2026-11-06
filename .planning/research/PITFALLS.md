# Pitfalls Research — v1.1 Email-gated downloads, newsletter, KPIs

**Domain:** Photo portfolio (Next.js + Supabase + Vercel, French audience, RGPD)
**Researched:** 2026-11-07
**Confidence:** MEDIUM (training knowledge only; no live doc check. Verify items marked VERIFY.)

## Critical Pitfalls

### 1. Bundling download + newsletter consent (RGPD/ePrivacy)
- Sending the link is a service need; newsletter opt-in must be a SEPARATE, OPTIONAL, UNTICKED checkbox. Required/pre-ticked opt-in = invalid consent (RGPD art. 4(11), 7(4)).
- Store `consent_newsletter`, `consent_at`, `consent_text_version`, hashed IP/source as proof. Never add download-only emails to the newsletter list.
- **Product decision:** newsletter opt-in optional (recommended).
- Phase: email-gate + newsletter (before UI).

### 2. No / broken double opt-in
- Row starts `pending`; confirmation email with single-use hashed expiring token; `confirmed` only on click.
- Email scanners prefetch GET links: GET shows a confirm button, state change via POST. Idempotent confirm endpoint.
- Phase: newsletter.

### 3. Missing unsubscribe / legal mentions
- HMAC-signed per-recipient unsubscribe token, `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers (Gmail/Yahoo bulk-sender rules), sender identity, privacy-policy link.
- Keep hashed-email suppression entry; retention ~3 years from last contact (CNIL, VERIFY).
- Privacy policy page belongs in the FIRST phase.

### 4. Deliverability set up late
- Verify domain in Resend first on a subdomain (e.g. mail.domain.fr); SPF, DKIM, DMARC (p=none then tighten). DNS propagation = lead time.
- Separate transactional (download link) and marketing (newsletter) senders. HTML + plain text. Test Gmail/Outlook/Orange/Free.

### 5. No bounce/complaint handling
- Resend webhook (bounced, complained, delivery_delayed), Svix signature verification, idempotent; mark `suppressed`. VERIFY event names.

### 6. Signed-link leakage / sharing
- Do not email raw Supabase signed URLs. Email own opaque token URL `/dl/<token>`; store token HASH in `download_requests` (`expires_at`, `max_uses` 3-5, `used_count`); route verifies then streams or redirects to ~60s signed URL.
- Landing page with POST "Download" button so scanner GETs don't consume uses. `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex`. Expiry 24-72h. Rate-limit by token/IP; flag multi-IP use.
- Originals in PRIVATE bucket; verify no public URLs remain (anonymous request must 403).

### 7. UI-only protection mistaken for security
- Right-click/drag/long-press blocking is a deterrent only. Scope to image components (never inputs/whole document); iOS needs `-webkit-touch-callout: none` + `user-select: none`; don't break lightbox/swipe/zoom.
- Real protection: serve display derivatives only (~2000px long edge), originals private. Test iOS Safari + Android Chrome.

### 8. Vercel limits for ZIP generation
- 4.5 MB response body limit for non-streamed responses; timeouts/memory. Stream (archiver/zip-stream) and fetch sources as streams; set `maxDuration` explicitly; Node runtime not Edge; STORE (no compression) for JPEG; cap files/size.
- Better: pre-build ZIP async, store in private bucket, serve via signed URL. VERIFY plan limits. **Needs a spike.**

### 9. Supabase egress / image cost
- Each next/image width/format variant = cache miss. Limit `deviceSizes`/`imageSizes`, high `minimumCacheTTL`, AVIF/WebP only.
- Recompress once at upload and store derivatives (thumb, display, original); avoid per-request Supabase transformations. Immutable `Cache-Control` on versioned public derivatives. Track bandwidth KPI; billing alerts. Uncached signed URLs bypass CDN. VERIFY pricing.

### 10. Bot/abuse of email form
- Honeypot, min time-to-submit, Turnstile (VERIFY consent implications), rate limit by IP and email with SHARED store (Upstash/Supabase table; in-memory fails on serverless). Cap per-email sends (e.g. 3/h) and global daily. Generic response (no enumeration). Server-side validation, origin check. Monitor Resend quota.
- Same phase as email gate, not later.

### 11. View-count inflation / double counting
- Count views in a client event after real display (IntersectionObserver + dwell), not server render (prefetch/ISR/StrictMode). Dedupe per session and per day (`UNIQUE(photo_id, visitor_hash, day)`). `isbot` filter.
- Count a download only when the token route actually streams; keep requested / link opened / downloaded as separate events (funnel).
- Append-only `events` table; aggregate for dashboard; no client `count = count + 1` under open RLS; insert via rate-limited route handler. Design event schema EARLY.

### 12. Privacy-friendly analytics (cookie banner trap)
- No persistent cookie/fingerprint, no raw IP: daily-rotating salted hash `sha256(ip+ua+daily_salt)`; device class from UA then discard UA. CNIL audience-measurement exemption conditions (VERIFY). Bucket by Europe/Paris (Vercel runs UTC). Retention: purge raw events after a few months, keep aggregates. Don't show raw emails in charts.

### 13. Migration from direct downloads
- Inventory and DELETE (not hide): CartDrawer download, ZIP/folder-picker (File System Access API), `download` attrs, direct storage URLs. `410 Gone` page on old routes. Anonymous-403 test on originals.
- Private albums: server-side key validation, short-lived session token, key never in query string, rate-limit attempts, constant-time compare.
- Ship removal + gate in same release; use feature flag to verify first.

## Moderate / Minor
- Right to erasure: admin delete across subscribers, download_requests, events by email. CSV export admin-only, escape formula injection (`= + - @`), UTF-8 BOM.
- New tables: RLS deny-by-default, writes server-only, service-role key never `NEXT_PUBLIC_` (repo history: env pinning in next.config.ts was added then removed).
- No emails in URLs/logs (mask). Await Resend send or use `after()`; track status; resend cooldown; idempotency key.
- French email copy, UTF-8, legal identity/postal address (LCEN), React Email, dark-mode test. Version consent text.
- Keep next/image `remotePatterns` pinned; quality ~75-82; originals untouched.
- Dashboard: SQL views/rollups with indexes, not JS aggregation. Store UTC, bucket Paris.
- Preview deployments must not send real emails. Resend free-tier daily cap.

## Phase mapping

| Topic | Pitfall | Mitigation |
|---|---|---|
| Foundations (privacy page, DNS, schema) | late SPF/DKIM/DMARC, no policy, weak RLS | verify domain first, RLS deny-by-default |
| Email gate / signed links | bundled consent, scanner consumption, raw URLs, form abuse | optional checkbox, opaque tokens + button page, rate limit + Turnstile |
| Private albums | key in URL, brute force | server check, rate limit, session token |
| Removal of direct downloads | public bucket open | anon 403 test, 410 |
| Newsletter | no DOI, no one-click unsub, no bounce webhook | pending/confirmed, headers, Svix webhook |
| Delivery/ZIP | timeouts, body limit, egress | streaming or pre-built ZIP, limited sizes (spike) |
| KPIs | bot inflation, cookie banner, UTC | events dedupe, isbot, daily-salt hash, Paris time |
| UI protection | over-blocking | scope to images, test mobile |

## Research flags
- Deeper research: ZIP on Vercel (streamed vs pre-built), CNIL audience-measurement exemption, Resend webhooks/limits, Supabase egress pricing.
- Standard patterns: DOI, token tables, honeypot/rate limiting, RLS.
- User decisions: optional newsletter opt-in; double opt-in; in-app broadcast composer vs Resend dashboard; privacy page existence.
