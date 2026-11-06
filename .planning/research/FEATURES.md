# Feature Landscape: v1.1 Email-gated downloads, newsletter, admin KPIs

**Domain:** Photographer portfolio (FR, RGPD) on Next.js + Supabase + Resend
**Researched:** 2026-11-07
**Overall confidence:** MEDIUM. Behaviour patterns come from established practice (CNIL guidance, Resend/Supabase capabilities, gallery products such as Pic-Time, Pixieset and ShootProof). I did not re-verify against live docs in this session. Items marked (verify) need a check in phase research.

Existing and reused: day/night filtering, cart/selection, private-album access keys, admin area, i18n FR/EN, Supabase storage. The scope is only the new v1.1 features.

---

## 1. Email-gated download flow

### How it typically works
1. The visitor selects photos or an album with the existing cart or selection.
2. A "Recevoir par email" step replaces "Télécharger". It asks for an email and has an optional newsletter checkbox.
3. The server validates the request, creates a download request row, and sends an email through Resend with a signed expiring link.
4. The link opens a landing page, or streams a ZIP, with optimized files. It expires after N days or N uses.

### Table stakes

| Feature | Why expected | Complexity | Notes / dependency |
|---|---|---|---|
| Email field with validation, plus honeypot and rate limit | Prevents abuse and bot-driven email bombing | Low | Rate limit per IP and per email (Upstash or a Supabase table counter) |
| Newsletter checkbox, **unchecked by default and optional** | CNIL: consent must be free, specific and unbundled. Making download conditional on newsletter consent is risky (not "freely given") | Low | **Key RGPD decision.** The email is processed to deliver the file. Newsletter consent is a separate, optional purpose. The "email + consent" wording in PROJECT.md should be a checkbox that is not mandatory |
| Privacy notice at the form (purpose, controller, retention, rights link) | RGPD art. 13 | Low | i18n FR/EN; link to a privacy page, which may be missing today |
| Signed, expiring, unguessable link | Core of the milestone | Med | Random token (32+ bytes) stored hashed in `download_requests`, with `expires_at`, `max_uses` and `album_id/photo_ids`. Supabase signed URLs can serve the final files |
| Transactional email via Resend (FR/EN, plain and HTML) | Delivery vehicle | Low-Med | Needs a verified sending domain with SPF, DKIM and DMARC, or mail lands in spam. Detect the locale from the page |
| Expiry message and "request a new link" path | Expired links are the top support issue | Low | Landing page shows a clear state (expired, used up, invalid) |
| Download-event logging (request, link opened, file downloaded) | Feeds the KPIs and the audit trail | Low-Med | Foundation of the dashboard. Must be designed first |
| Removal of the old direct paths (cart ZIP, folder picker) | Stated goal | Low-Med | Includes server routes and any public storage URLs. Verify that original files cannot be fetched by guessing the URL (bucket policies) |
| Optimized delivered images (resize to about 2400-3000px long edge, JPEG q82-88, sRGB, metadata policy) | Cuts bandwidth and cost | Med | Use `sharp`. Pre-generate on upload or lazily cache in a Supabase bucket |
| ZIP streaming (archiver or fflate) with per-request cap on count and size | Avoids serverless memory and timeout blow-ups | Med-High | The Vercel function time limit is the main risk. Consider a cached ZIP per album or selection hash |
| Cart persistence across the email step | The existing cart must feed the request | Low | Depends on cart state shape |

### Differentiators (cheap, valued)

| Feature | Value | Complexity | Notes |
|---|---|---|---|
| Landing page with thumbnails, per-photo download and "download all" | Better than a bare ZIP, and easier to log per photo | Med | Per-photo downloads give KPI granularity |
| Remember email in localStorage for a repeat request | Less friction | Low | Prefill only; never auto-consent |
| Double opt-in for the newsletter (confirmation in the same email) | Strong proof of consent, fewer spam traps | Med | Not strictly legally required in France, but the CNIL expects the controller to prove consent. Recommended |
| Selection of size (web / high-res) | Photographer control | Med | Defer. One optimized size is enough for v1.1 |
| Admin "resend link" or "revoke link" | Support convenience | Low-Med | Cheap once `download_requests` exists |

### Anti-features

| Anti-feature | Why avoid | Instead |
|---|---|---|
| Watermarking | Already decided against in PROJECT.md | UI blocking only |
| Making newsletter consent mandatory, or pre-checking the box | Not valid consent under RGPD/CNIL | Optional unchecked box |
| Permanent public URLs of originals | Defeats the gate | Private bucket plus signed URLs |
| Account or login system for visitors | Over-scoped for a portfolio | Email-only, token-based |
| Email-only "verification before sending" (extra confirm round trip) | Adds friction for little gain (the link goes to the email anyway) | The link itself proves ownership |
| CAPTCHA at first sight | Hurts conversion | Honeypot and rate limit first; Turnstile only if abused |

---

## 2. UI blocking of right-click, drag and long press

### How it works
Client-side deterrence only. It cannot truly prevent saving (DevTools, screenshots, network tab). It must be presented to the owner as a deterrent.

### Table stakes

| Feature | Complexity | Notes |
|---|---|---|
| `contextmenu` preventDefault on gallery and lightbox images | Low | Scope to image elements, not the whole page (keeps form inputs and accessibility working) |
| `draggable={false}` plus `dragstart` prevented | Low | |
| iOS long-press: `-webkit-touch-callout: none`, `user-select: none` | Low | Must be tested on real iOS Safari |
| Transparent overlay or `pointer-events` strategy on images | Low-Med | Check it does not break the lightbox swipe, zoom or day/night toggle |
| Applies to the private albums too | Low | Shared image component |

### Differentiators
- Serve gallery images as `next/image` optimized derivatives (about 1600px) so the displayed image is not the original. This is already partly done (commit 438caa9). Low cost and the real protection.
- Disable the Next.js image URL for the original resolution. Low.

### Anti-features
- Blocking keyboard shortcuts, DevTools detection or blank-on-print tricks. These are fragile, hostile and hurt accessibility.
- CSS background-image hacks that break SEO, alt text and a11y.
- Blocking the right-click on the whole page, which harms usability.

---

## 3. Private albums via access key, same flow

### How it works
The visitor enters a key, the server validates it, and the album is shown. Downloads go through the same email flow.

### Table stakes

| Feature | Complexity | Notes |
|---|---|---|
| Reuse the existing key mechanism and gate the album listing server-side | Low | Already built. Verify the key check happens on the server and not only in the client |
| Download request carries `album_id` and is authorized by a valid key | Med | The signed link must not become a bypass: verify the key at request time |
| Brute-force protection on the key | Low-Med | Rate limit, constant-time compare |
| Private album excluded from sitemap, search, KPIs "top albums" public surfaces | Low | `noindex` |
| Admin can see which email requested which private album | Low | Free from `download_requests` |

### Differentiators
- Key expiry and revocation per album (admin). Low-Med.
- Optional "only download if email is in the allowed list" (client delivery). Med. Defer.

### Anti-features
- Putting the key in the URL query string (leaks via referrer and logs). Prefer a POST plus a short-lived cookie.
- Per-client user accounts.

---

## 4. Newsletter subscriber management

### How it works
Consent captured at download time (or a standalone footer form), stored with proof, and managed from admin. Sending goes through Resend.

### Table stakes

| Feature | Complexity | Notes |
|---|---|---|
| `subscribers` table: email, `consent_at`, consent text version, source (download / footer), locale, IP hash optional, `unsubscribed_at`, status | Low | Row-level security on; service role only |
| Separate the delivery email from newsletter consent in the data model | Low | A download requester who did not opt in is **not** a subscriber. Keep the request log with a retention limit |
| One-click unsubscribe link in every newsletter (signed token, no login) | Low-Med | Plus `List-Unsubscribe` and `List-Unsubscribe-Post` headers (Gmail/Yahoo bulk sender rules; RFC 8058) (verify in Resend docs) |
| Admin list with search, status filter, counts | Low-Med | In the existing admin area |
| CSV export (email, consent date, source, status, locale) | Low | Escape CSV formula injection (prefix `=`, `+`, `-`, `@`) |
| Admin delete (erasure right) | Low | Hard-delete or anonymize |
| Retention policy (CNIL: about 3 years after last contact) | Low | Document it; a purge job is optional |
| Suppression of unsubscribed and bounced addresses before any send | Med | Use Resend webhooks (bounce and complaint) to update status |

### Differentiators

| Feature | Value | Complexity | Notes |
|---|---|---|---|
| Double opt-in confirmation | Proof of consent | Med | See section 1 |
| Simple broadcast composer (subject, body, send test, send to all active) via Resend | Makes the list useful | Med-High | Could be deferred: sending from the Resend dashboard (Audiences or Broadcasts) is a legitimate v1.1 stance. Decide in roadmap |
| Sync to Resend Audience | Lets Resend handle unsubscribe pages | Med | Dual source of truth risk; Supabase stays the master (verify API) |
| Subscriber growth chart | Cheap KPI | Low | |

### Anti-features
- Buying or importing lists, or auto-subscribing everyone who downloaded.
- Third-party tracking pixels beyond Resend's own open and click tracking. Consider turning open-tracking off (privacy, and Apple Mail Privacy Protection makes it unreliable).
- Building a full campaign editor, A/B tests or automations.

---

## 5. Admin KPI dashboard

### Recommended KPI set (prioritized)

**Required (stated in the milestone)**

| KPI | Definition | Complexity |
|---|---|---|
| Downloads | Count of distinct download events (file-level and request-level) over a period | Low (needs event log) |
| Views | Photo views (lightbox opens) and album views | Med (needs a client beacon) |
| Favorite photos | Most added to cart or selection, and most downloaded. Define "favorite" explicitly as selection and download frequency | Low-Med |

**Complementary (recommended, in value order)**

| KPI | Why useful for a photographer | Complexity |
|---|---|---|
| Conversion: views to request to link opened to downloaded | Funnel shows where visitors drop off | Med |
| Top albums and top photos (views vs downloads) | Guides what to promote | Low |
| New subscribers and consent rate (opt-in rate among requesters) | Measures the newsletter goal | Low |
| Day vs night split | Unique to this site's concept | Low (existing mode field logged on events) |
| Devices: mobile / desktop / tablet, browser, OS (from User-Agent) | Layout priorities | Low-Med |
| Bandwidth served (bytes per period, per album) | Cost control on Supabase and Vercel | Med (log bytes at delivery) |
| Country or region (coarse, from Vercel geo header) | Audience understanding | Low |
| Time series (7/30/90 days) and a period selector | Needed for any KPI | Med |
| Referrer and traffic source | Useful but optional | Low-Med |

### Table stakes
- A period selector and delta versus the previous period.
- Totals cards, one time-series chart, and top-N tables.
- Data comes from the server and is aggregated in SQL (views or RPC). Avoid scanning raw events at render time.
- Admin-only access, reusing the existing admin auth.

### Differentiators
- Per-photo detail drill-down. Low-Med.
- CSV export of KPI tables. Low.
- Weekly digest email to the photographer. Med, defer.

### Anti-features
- Embedding Google Analytics or any cookie-based tracker. It would force a consent banner and undermines the privacy stance.
- Real-time dashboards and heatmaps.
- Storing raw IP addresses or fingerprinting visitors.

### RGPD note for analytics
First-party audience measurement can be exempt from consent under CNIL conditions (anonymous, limited purpose, no cross-site tracking, no cookie needed). Count views server-side or via a beacon without cookies, and use a daily-rotating salted hash for unique visitors, never raw IPs. Keep raw events about 13 months at most, then aggregate (verify the CNIL exemption conditions in phase research). Downloads linked to an email are personal data and must be covered by the retention policy.

---

## Feature dependencies

```
Event logging schema (views, downloads, bytes, mode, device)
   -> KPI dashboard (all KPIs)
Optimized image pipeline (sharp, cache)
   -> ZIP streaming / landing page  -> Email link target
download_requests table + signed token
   -> Resend transactional email  -> landing page  -> download logging
Private album key (existing) -> download request authorization
Consent capture (checkbox + versioned text) -> subscribers table
   -> unsubscribe tokens -> CSV export -> (optional) broadcast
Existing cart/selection -> "send by email" step
UI blocking (independent; touches shared image component and lightbox)
Resend domain verification (SPF/DKIM) -> everything email (external, start early)
```

## MVP recommendation

Prioritize, in order:
1. Data model and event logging (requests, tokens, subscribers, events). Everything depends on it.
2. Email request flow with signed link, optimized delivery, ZIP streaming, rate limiting, then removal of direct download paths.
3. Private album reuse of the flow.
4. Subscriber management: consent proof, unsubscribe, CSV export, bounce handling.
5. UI image blocking (small, parallelizable).
6. KPI dashboard: required three, then funnel, top albums, day/night, devices, bandwidth.

Defer:
- Broadcast composer: use the Resend dashboard at first.
- Multiple resolutions, key expiry UI, weekly digests, Resend Audience sync.

## Sources

- CNIL guidance on consent, cookies and audience-measurement exemption, and email prospecting rules (L34-5 CPCE: B2C requires prior consent). Training knowledge, MEDIUM. (verify current text)
- Gmail/Yahoo bulk sender requirements and RFC 8058 one-click unsubscribe. MEDIUM.
- Resend docs (webhooks, Audiences, Broadcasts, domain verification). Not re-verified this session, MEDIUM.
- Common gallery-delivery products (Pic-Time, Pixieset, ShootProof) for expected behaviour. LOW-MEDIUM.
- .planning/PROJECT.md for scope and decisions.
