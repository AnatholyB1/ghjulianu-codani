# Phase 7 Livraison des photos - Context (decisions applied)

Applied: MILESTONE-v1.1-DECISIONS D-05, D-07 (amended: a "use" = a 15-minute download SESSION via `consume_download_use`, 3 sessions, 48 h), D-08, D-09, D-10; design contract `design/07-DESIGN-CONTRACT.md`.

## Architecture
- `src/lib/server/photoSource.ts` (PRT-03): `resolvePhotoSource(row, purpose)` is the only place that turns a photo row into a file source (v1.1: public bucket URL, host/path allow-listed against `NEXT_PUBLIC_SUPABASE_URL`, SSRF guard). Documented extension point for private masters (v1.2). Also owns the upstream access (`fetchPhotoSource`, `photoSize`).
- `src/lib/server/deliveryPlan.ts`: ALL limits in one file (part caps 120 MB / 60 files, rate limits, session minutes, assumed size) + deterministic `planParts`, file naming (`downloadPrefix` rule of the legacy cart: slug without dashes, upper case, 12 chars; `FURTIVE2025_007.jpg`, `FURTIVE2025_part2of3.zip`).
- `src/lib/server/zipStream.ts`: fflate `Zip` + `ZipPassThrough` (STORE, level 0), pull-driven `ReadableStream`, files fetched one at a time, `countingStream` for bytes.
- `src/lib/server/delivery.ts`: non-consuming lookup (`getDeliveryState`), the one consuming call (`consumeDownloadUse`), photo row loading, `planDelivery` (HEAD sizes + parts). `deliveryHttp.ts`: privacy headers, gate (token shape, rate limit per IP 90/min and per token 60/min, state), page-friendly refusals, `download` event writer.
- Routes: `GET /api/download/[token]/photo/[photoId]`, `GET /api/download/[token]/zip?part=N` (Node runtime, `maxDuration = 300`, `force-dynamic`).
- Landing: `src/app/telechargement/[token]/` (server page + `DeliveryView` client + `Terminal`, `not-found.tsx` = invalid screen, `error.tsx`, scoped CSS `.dlp`, copy in `copy.ts`).
- Shared files touched (additive, one line/block each): `SiteShell.tsx` (no site chrome on `/telechargement/*`), `robots.ts` (Disallow), `next.config.ts` (`headers()` for the two path families).

## Route behaviour (order matters)
1. gate: token shape (43 base64url chars), rate limit (BEFORE any use), non-consuming state check.
2. membership of photoId / valid `part` (404, nothing consumed).
3. HEAD pre-flight of the file (missing file must not burn a use).
4. `consume_download_use` (atomic; an open 15-minute window is reused for free; a new window needs `used_count < max_uses`).
5. open the upstream and stream. Failure after step 4 leaves the session open: retry is free for 15 minutes.
Refusals: browsers (Sec-Fetch-Dest document / Accept html) get `303` to the landing page (`?e=rate|error` shows the callout), scripts get JSON with 404/410/429/502. Success responses are `Content-Disposition: attachment`, so the page stays in place; because of that the links deliberately have NO `download` attribute (with it, an error redirect would be saved as an .html file).

## Decisions / deviations from the contract (flagged)
- Cost copy reworded for the session model ("1 utilisation = session de 15 minutes, all parts/photos inside it are free"), plus a "session open until HH:MM" note. The contract's literal "each ZIP part = 1 use" is superseded by the D-07 amendment.
- HTTP status of the landing: invalid/revoked/malformed 404 (not-found.tsx), error 500, but **expired and used-up render with 200**: Next.js pages cannot set 410. Pages are `noindex`, so no practical effect; a 410 would need a route handler instead of a page.
- Upstream access uses node `https` (HTTP/1.1), not global `fetch`: on Node 26 `fetch` multiplexes everything to the Supabase host on one HTTP/2 connection and a slowly-read body stalled the `consume_download_use` RPC for 60 s then failed with NGHTTP2_PROTOCOL_ERROR (reproduced, fixed, covered by the e2e).
- `maxDuration` must be a literal for Next; it is `300` and `DOWNLOAD_MAX_DURATION_SECONDS` documents it.
- Copy lives in `copy.ts` next to the page, not `src/lib/i18n.ts` (page language = `download_requests.lang`, `?lang=` overrides; the site language context is client-only and not mounted on this route).
- Theme: the site's ThemeProvider forces night outside /portfolio, so the page reads the persisted `day-night-storage` itself and applies `.dlp-day` to its own scope (UX-9).
- Thumbnails: `next/image` (quality 60, responsive `sizes`). Buckets are public (D-05) so the optimizer URL contains the public object URL; AC-19 ("no original URL in HTML") cannot hold in v1.1, it becomes true when v1.2 serves derivatives from `resolvePhotoSource(row,'thumbnail')`.
- Part sizes come from HEAD `Content-Length` (cached 1 h in memory). If a HEAD fails, `ASSUMED_PHOTO_BYTES` (3 MB) is used and the page shows "≈". Page and ZIP route recompute the plan, so a failure that hits only one of them could shift a boundary; files are immutable, so in practice both see the same sizes.
- Events: one `download` row per file (photo route: that photo; ZIP: each file that streamed, `session_key = 'zip:<part>'`) with bytes actually transferred (also on client abort). For the funnel count DISTINCT `request_id`, not rows. `link_open` is logged once per (request, visitor hash) per 30 min via `rate_limit_hit('lo:<id>:<visitor>', 1, 1800)`, never for bots.
- Not done: multi-IP flagging; Content-Length for ZIP (UX-7 says none); private masters; DB-side refund when an upstream file fails mid-ZIP.
- `SUPPORT_EMAIL` env: footer link `mailto:` with fallback `/contact`.
