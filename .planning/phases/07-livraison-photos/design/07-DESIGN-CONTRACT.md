# Phase 7 design contract: `/telechargement/[token]`

Scope: the page opened from the emailed link (DLV-01..04, PRT-03 UI side). Binding for the P7 builder. Prototypes: `screens/<state>.<fr|en>.html` (`?theme=day` for day), index in `MOCKUPS.md`, browse in `gallery.html`. Sample data (album "Lumières de Corse", sizes, dates) is invented. Thumbnails are labelled placeholders, never fake photos.

Context note: no PRODUCT.md / DESIGN.md exists in the repo, so the register was inferred: **brand-adjacent, calm, transactional** (a photographer's site delivering personal files). The site's own tokens are the design system.

## 1. Decisions (locked unless the orchestrator says otherwise)

| # | Decision | Why |
|---|---|---|
| UX-1 | Landing GET is read-only and says so ("Ouvrir cette page ne consomme rien"). Every `href` to `/api/download/...` is a plain link with `download`, `rel="nofollow noreferrer"`. No auto-download, no `<meta refresh>`, no prefetch of download routes. | D-07; email scanners and link previews only ever GET the landing page. |
| UX-2 | Cost is shown before the click: "1 utilisation" is in each button's accessible name; the page header says "photo seule ou ZIP, compte pour 1 utilisation". | No surprise debit. |
| UX-3 | One primary action per state. Valid: "Tout télécharger". Terminal: "Redemander mes photos". Error: "Réessayer". | Anxious, one-time visitor from an email. |
| UX-4 | Thumbnails keep their true aspect ratio (CSS columns masonry, 2 / 3 columns). Download button sits on each tile (44x44). | Photographers judge composition; per-photo KPI granularity (FEATURES). |
| UX-5 | Desktop: sticky left panel (title, meta, CTA / parts) + right grid. Mobile: CTA above the fold, grid below. No sticky bottom bar. | Single CTA in DOM order, no duplicated control. |
| UX-6 | Invalid, malformed and revoked tokens render the SAME screen (no enumeration, no hint that a link was revoked). | Security. |
| UX-7 | Download feedback is browser-native: we cannot read progress. We show an indeterminate bar + `role="status"` text, not a percentage. | Honest; streamed ZIP has no Content-Length. |
| UX-8 | Language = `download_requests.lang` (language at request time). FR/EN toggle in the header, `lang` attribute on `<html>`. Terminal states for unknown tokens use `Accept-Language`, default FR. | D-12. |
| UX-9 | Theme follows the site's persisted choice (ThemeProvider, `.day` on `<html>`), default night. No toggle on this page. | Consistency. |
| UX-10 | Large selections (> part caps of D-08): parts list replaces the single CTA; grid shows the first 12 thumbnails + "Afficher les N autres" (client-side reveal, 24 per click). | Keeps the page light for 96+ photos. |

Cost model displayed in the mockups is the literal D-07 (each ZIP part = 1 use, so 3 parts exhaust 3 uses). The UI reads cost from the server (`costLabel`, `partsNeedUses`), so a different policy (see critique Q1) only changes copy, not layout.

## 2. Route, headers, privacy (acceptance-tested)

- `GET /telechargement/[token]`: `export const dynamic = 'force-dynamic'`; never calls `consume_download_use`. Reads via a non-consuming lookup (hash only). May call `logEvent('link_open')` (not a use).
- Response headers on the page AND on `/api/download/*`: `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex, nofollow, noarchive`, `Cache-Control: private, no-store`. Also `<meta name="robots" content="noindex, nofollow, noarchive">` and `<meta name="referrer" content="no-referrer">` in the document (see prototypes).
- `robots.txt`: `Disallow: /telechargement/` and `/api/download/`. Page absent from the sitemap.
- Outbound links (site, privacy, album) use `rel="noopener noreferrer"`; the token never appears in any link, `<title>`, `og:*`, analytics beacon payload or console log. `POST /api/track` receives the route pattern, never the token.
- Thumbnails: optimized derivatives (about 480 px, next/image or the existing resize path), never the original master URL. Original URLs must not appear in the HTML source (PRT-03: URL comes only from `resolvePhotoSource()` server side).
- HTTP status: valid 200; expired/used-up/invalid 404 for unknown/revoked, 410 for expired and used-up (known token); error 500. Bodies carry no token-derived data beyond the expiry timestamp.

## 3. Tokens

Real tokens are copied from `src/app/globals.css` into `tokens.css`. Added tokens are marked `[NEW]` and are additive.

| Token | Night | Day | Use |
|---|---|---|---|
| `--bg` | #080808 | #fafafa | page |
| `--surface` | #0e0e0e | #f5f5f5 | placeholder tile |
| `--text` | #E8E4DC | #1a1a1a | text |
| `--muted` | #7a7a74 | #666666 | site-wide muted (not used for body text here) |
| `--muted-ar` [NEW] | #92928b | #5c5c5c | muted text >= 4.5:1 on bg and surface (site `--muted` is 4.4:1 on night surface) |
| `--accent` | #c8a97e | #c8a97e | primary button fill, filled pips |
| `--accent-text` | #c8a97e | #7a5200 | accent used as text/line |
| `--on-accent` [NEW] | #080808 | #080808 | text on accent (as CartDrawer) |
| `--line` [NEW] | rgba(255,255,255,.14) | rgba(0,0,0,.2) | control borders |
| `--tint`, `--tint-line` [NEW] | accent 9% / 45% | accent 16% / amber 50% | info callout (full border, never a side stripe) |
| `--danger-*` [NEW] | #e49a8b | #9a2e1f | alert callout |
| `--focus` [NEW] | #c8a97e | #7a5200 | focus ring |

Type: Cormorant Garamond italic 300 for h1/h2 (site's display voice), Space Grotesk 400-700 for everything else (both already loaded by `layout.tsx`). Scale: 14 (floor) / 16 (body) / 20 / 28 (h2) / h1 `clamp(40px, 1.6rem + 4vw, 72px)`; ratio >= 1.25 between steps. Buttons: 14px, 700, tracking .16em, uppercase (site CTA style). Body measure <= 46ch. **Deviation:** the site's own labels are 0.58rem to 0.62rem (about 9 to 10px); this page uses a 14px floor because the visitor arrives from an email, often on a phone, to do one task.

Space (4pt): 4, 8, 12, 16, 24, 32, 48, 72, 96. Radius 2px (site buttons are square). Tap target 44px minimum, primary buttons 56px.

## 4. Layout and breakpoints

| Range | Behaviour |
|---|---|
| 320-767 (mobile first; verified at 390x844 DPR2) | Single column, 16px gutters. Header 64px. Order: h1, [banner], meta list, CTA/parts, note, grid heading, grid (2 columns, 8px gap), more, footer. |
| 768-1023 | Single column, 32px gutters, grid 3 columns, 12px gap. CTA max 420px. |
| >= 1024 (verified at 1440x900) | Two columns `minmax(340px,4fr) / 8fr`, gap 72px, left panel `position: sticky; top: 32px`, container max 1280px, gutters 48px at >= 1200. Grid 3 columns. |
| Terminal states | Text block left (max 46ch), actions max 420px; at >= 1024 a decorative 240px line glyph (opacity .35, `aria-hidden`) sits right. |

No horizontal scroll at any width from 320. Use `100dvh`, never `100vh`. Browser zoom to 200% must not clip (rem units, no fixed heights).

## 5. Components

- **Top bar**: site name link (to `/`, 44px tall), FR/EN links (44x44, `aria-current`).
- **Meta list** (`dl`): Album, Photos (count, size), Utilisations restantes (3 pips + "n sur 3"; pips `aria-hidden`, text carries the value), Valable jusqu'au (absolute date, 24h French format "14 h 32"; EN 12h "2:32 pm"). Dates formatted in `Europe/Paris`, server side, no countdown (avoids hydration drift and re-render).
- **Primary CTA** (valid, single ZIP): file icon + "Tout télécharger" + sub line "ZIP, 14 photos, 38 Mo". Full width on mobile, panel width on desktop.
- **Parts list** (`ol`): per part name, range and size, button "Télécharger" (accessible name includes "(1 utilisation)"). States per part: idle, busy (`aria-busy="true"`, label "Préparation…", ghost style, indeterminate bar, status line).
- **Tile**: placeholder/thumbnail `figure` with tag "NN | ratio" top-left, download icon button bottom-right (aria-label "Télécharger la photo 3 sur 14 (1 utilisation)"). Real thumbnails: `alt=""` is NOT allowed; use `alt="Photo 3 sur 14"` since the image is the content.
- **Callout**: `role="status"` (last use) or `role="alert"` (refused). Full 1px border + tint, icon, bold title + sentence.
- **Footer**: "Lien personnel : ne le partagez pas." + Confidentialité + Retour au site.

## 6. States (all rendered, FR+EN, day+night, 390 and 1440)

| Id | Trigger | Screen content | CTA | HTTP | Uses consumed |
|---|---|---|---|---|---|
| `valid` | token ok, uses left, not expired | h1, meta (3 sur 3), "Tout télécharger", note, grid | Tout télécharger | 200 | 0 |
| `parts` | selection above D-08 caps | parts list (3), grid first 12, "Afficher les 84 autres" | per part | 200 | 0 |
| `started` | user clicked a part/photo/ZIP | clicked control busy + bar + status text; meta decremented optimistically (2 sur 3); `router.refresh()` after 4 s to resync | other parts | 200 | 1 per click |
| `last` | 1 use left | callout "Dernière utilisation" above meta, pips 1/3 | Tout télécharger | 200 | 0 |
| `dlerror` | route answered 429/5xx before serving | `role="alert"` callout "Trop de téléchargements d'affilée", nothing debited | unchanged | 200 | 0 |
| `expired` | known hash, `expires_at < now()` | "Ce lien a expiré", date, advice | Redemander mes photos + Retour | 410 | 0 |
| `exhausted` | `used_count >= max_uses` | "Ce lien est épuisé" | idem | 410 | 0 |
| `invalid` | unknown, malformed, revoked | "Lien introuvable" (identical for all three) | idem | 404 | 0 |
| `error` | landing GET threw | "Un souci de notre côté", states nothing was consumed | Réessayer + Retour | 500 | 0 |

Precedence when several apply: revoked/unknown (`invalid`) > `exhausted` > `expired` > `valid`.

Not separate screens (specified here): loading is server-rendered, so no skeleton; thumbnails use `loading="lazy"` with the aspect-ratio box reserved (no layout shift) and a `--surface` background while loading. Empty: a valid link with zero resolvable photos shows the `error` screen (builder logs it).

## 7. Microcopy (FR / EN, final)

| Key | FR | EN |
|---|---|---|
| h1 valid | Vos photos sont prêtes | Your photos are ready |
| meta | Album / Photos / Utilisations restantes / Valable jusqu'au | Album / Photos / Downloads left / Valid until |
| uses | 3 sur 3 | 3 of 3 |
| date | lundi 9 novembre, 14 h 32 | Monday 9 November, 2:32 pm |
| CTA all | Tout télécharger | Download all |
| CTA sub | ZIP, 14 photos, 38 Mo | ZIP, 14 photos, 38 MB |
| cost note | Ouvrir cette page ne consomme rien. Chaque téléchargement, photo seule ou ZIP, compte pour 1 utilisation. Pour plusieurs photos, le ZIP est le plus économe. | Opening this page costs nothing. Each download, a single photo or a ZIP, counts as 1 use. For several photos, the ZIP is the cheapest. |
| grid h2 | Ou photo par photo | Or photo by photo |
| tile aria | Télécharger la photo 3 sur 14 (1 utilisation) | Download photo 3 of 14 (1 use) |
| more | Afficher les 84 autres | Show the other 84 |
| parts h2 | Tout télécharger en 3 parties | Download all in 3 parts |
| parts lede | Votre sélection pèse 247 Mo. Elle est découpée en 3 fichiers ZIP à télécharger un par un. Les 3 parties utiliseront les 3 utilisations du lien. | Your selection weighs 247 MB. It is split into 3 ZIP files to download one by one. The 3 parts will use all 3 uses of the link. |
| part | Partie 1 sur 3 / Photos 1 à 40, 104 Mo / Télécharger | Part 1 of 3 / Photos 1 to 40, 104 MB / Download |
| busy | Préparation… | Preparing… |
| started | Téléchargement lancé. Votre navigateur l'affiche dans ses téléchargements. Les grosses parties peuvent mettre quelques secondes à démarrer. Rien ne s'affiche sur cette page, c'est normal. | Download started. Your browser shows it in its downloads. Large parts can take a few seconds to start. Nothing moves on this page, that is normal. |
| last | **Dernière utilisation** Après ce téléchargement, ce lien ne fonctionnera plus. Choisissez « Tout télécharger » pour tout récupérer d'un coup. | **Last use** After this download the link will stop working. Choose "Download all" to get everything in one go. |
| 429 | **Trop de téléchargements d'affilée** Patientez une minute puis réessayez. Aucune utilisation n'a été consommée. | **Too many downloads in a row** Wait a minute, then try again. No use was consumed. |
| expired | Ce lien a expiré / Il était valable jusqu'au lundi 9 novembre à 14 h 32. Par sécurité, un lien dure 48 heures. / Sélectionnez à nouveau vos photos sur le site pour recevoir un nouveau lien. | This link has expired / It was valid until Monday 9 November at 2:32 pm. For safety, a link lasts 48 hours. / Select your photos again on the site to receive a new link. |
| used up | Ce lien est épuisé / Les 3 utilisations de ce lien ont été consommées. Par sécurité, un lien est limité à 3 téléchargements. / (même suite) | This link is used up / All 3 uses of this link have been consumed. For safety, a link is limited to 3 downloads. / (same) |
| invalid | Lien introuvable / Ce lien est incomplet, a été annulé ou n'existe plus. Vérifiez que l'adresse a été copiée en entier depuis l'e-mail. / Sinon, redemandez vos photos depuis le site. | Link not found / This link is incomplete, was cancelled, or no longer exists. Check that the whole address was copied from the email. / Otherwise, request your photos again from the site. |
| error | Un souci de notre côté / La page n'a pas pu se charger. Ouvrir cette page ne consomme jamais de téléchargement : votre lien reste valable. / Réessayez dans un instant. | Something went wrong on our side / The page could not load. Opening this page never uses a download: your link is still valid. / Try again in a moment. |
| CTAs | Redemander mes photos / Retour au site / Réessayer | Request my photos again / Back to the site / Try again |
| footer | Lien personnel : ne le partagez pas. / Confidentialité / Retour au site | Personal link: do not share it. / Privacy / Back to the site |

Voice: plain verbs, sentence case in prose, no apology, no exclamation, no em dashes. A button keeps one name across the flow ("Télécharger" is the button, "Téléchargement lancé" the confirmation). Terminal screens never reveal album name, photo count or email.

"Redemander mes photos" goes to the album page for a public album (where the cart request form lives), else to `/`. "Retour au site" always goes to `/`.

## 8. Motion and reduced motion

- One orchestrated entrance: the panel/heading block rises 14px + fades (600 ms, `cubic-bezier(.22,1,.36,1)`); tiles do the same with a 40 ms stagger, capped at 12 tiles (so 150 ms to 600 ms total delay). Only `transform` and `opacity`.
- Interaction: hover/press on buttons 160 ms (colour, `translateY(1px)` on active). Busy bar: a 40% wide gold segment translating across a 2px track, 1.6 s, infinite, only while a control is busy and never longer than 15 s (then the status text switches to the "still nothing" hint).
- `prefers-reduced-motion: reduce`: no entrance, no stagger, transitions about 0 ms, bar becomes a static 50% gold line with the same text (verified: all screenshots are rendered with reduced motion on).
- No parallax, no skeleton shimmer, no layout-property animation.

## 9. Accessibility

- Landmarks: `header`, `main`, `footer`, nav labelled "Langue/Language". One `h1`; `h2` for parts and grid. Document `lang` set; FR/EN links carry `lang`/`hreflang`.
- Focus: 2px outline `--focus`, 3px offset, on every link/button; logical DOM order equals visual order (CSS columns flow down column 1 then 2, same as DOM). Skip link not needed (short page); the h1 is the first focusable-adjacent content.
- Names: every icon button has an `aria-label` with cost; pips and glyphs are `aria-hidden`; the busy state uses `aria-busy` + a polite `role="status"` region (inserted when the click happens, announced once). The 429 callout is `role="alert"`.
- Contrast (WCAG AA): normal text >= 4.5:1, large text >= 3:1 in both themes (measured, see section 10). Do not use `--muted` for text on `--surface`; use `--muted-ar`. Accent as text uses `--accent-text`.
- Targets >= 44x44 CSS px (links in the footer and header included).
- Zoom 200% and text-only 200%: no clipping or horizontal scroll. `maximum-scale` stays 5.
- Colour is never the only signal: callouts carry an icon and a title; used pips come with "2 sur 3".

## 10. Measurable acceptance checks

Automated by `shoot.mjs` (72 renders = 9 states x FR/EN x night/day x 390/1440; last run 0 issues):

| Id | Check | Threshold |
|---|---|---|
| AC-01 | `document.scrollWidth <= innerWidth` | no horizontal overflow at 390 and 1440 |
| AC-02 | Computed font-size of every text element | >= 14px |
| AC-03 | Bounding box of every `a[href]`, `button` | >= 43.5 x 43.5 CSS px |
| AC-04 | Contrast of every text node against its composited background | >= 4.5 (>= 3 if >= 24px, or >= 18.66px bold) |
| AC-05 | Interactive controls do not overlap text boxes (tag, chip, headings, paragraphs) | zero overlaps |

Behavioural (builder tests, Playwright against the real route):

| Id | Check |
|---|---|
| AC-10 | `GET /telechargement/<valid>` three times in a row (also `HEAD`) leaves `used_count` unchanged and shows "3 sur 3". |
| AC-11 | Response headers contain `Referrer-Policy: no-referrer`, `X-Robots-Tag: noindex...`, `Cache-Control: private, no-store`; HTML has the two `<meta>` tags. |
| AC-12 | The token string does not appear in: any `href` other than download routes of the same token, `<title>`, console output, any network request to another origin, `POST /api/track` body. |
| AC-13 | Valid page makes zero requests to `/api/download/*` until a user click (network log). |
| AC-14 | Expired, used-up, revoked and random tokens: expired 410, used-up 410, revoked and random 404 with byte-identical bodies for the last two (diff = empty). |
| AC-15 | Clicking one control twice quickly in the same tab results in one request (button disabled while busy) and still, server side, 3 concurrent hits consume at most 3 uses. |
| AC-16 | After a click, meta shows the decremented value within 100 ms and matches the server after `router.refresh()`. |
| AC-17 | Keyboard only: Tab reaches every control in visual order; Enter on a part button triggers the download; focus ring visible (screenshot diff >= 2px ring). |
| AC-18 | `prefers-reduced-motion: reduce`: no running CSS animations (`document.getAnimations().length === 0`). |
| AC-19 | HTML source contains no original-master storage URL (grep for the originals bucket path returns zero). |
| AC-20 | Lighthouse accessibility >= 95 on `valid` and `expired`, FR and EN. |

## 11. Traceability

| Requirement | Screen(s) | Checks |
|---|---|---|
| DLV-01 landing with thumbnails, expired/used-up states, no use consumed | `valid`, `parts`, `last`, `expired`, `exhausted`, `invalid`, `error` | AC-01..05, AC-10, AC-13, AC-14 |
| DLV-02 single photo or streamed ZIP, server not blocked | `valid` (tile buttons, CTA), `started`, `dlerror` | AC-13, AC-15, AC-17 (stream behaviour itself is a route test) |
| DLV-03 light files, store mode, size cap with parts | `parts`, `started` (parts list, sizes, "Les 3 parties...") | part labels match D-08 constants (test: 96 photos / 247 MB renders 3 parts, each <= 120 MB / 60 files) |
| DLV-04 atomic use count + bytes recorded | `started`, `last`, `exhausted`, `dlerror` (uses left, 1 use per click, 429 consumes none) | AC-15, AC-16 (bytes logging is server-side, no UI) |
| PRT-03 one source resolver, ready for private originals | `valid` (thumbnails and links come from the resolver) | AC-19 |
| Cross-cutting: links do not leak, page not indexed | all | AC-11, AC-12 |

## 12. Builder notes

- Files: `src/app/telechargement/[token]/page.tsx` (server component, no `'use client'`), one small client component `DownloadControls` for busy state + `router.refresh()`, copy in `src/lib/i18n.ts` (append keys, additive). Reuse the prototype class names only as a reference: port `base.css` rules into the site's styling approach (globals/Tailwind), keep the tokens.
- Prototype `--font-space`/`--font-cormorant` in `tokens.css` exist only because the static files lack `next/font`; do not copy them.
- Anchors that trigger downloads need `download` and must hit the route with `Content-Disposition: attachment`; the click handler only sets the busy state (never `preventDefault`, never `fetch`, so the browser streams natively and iOS Safari behaves).
- iOS Safari: ZIP and image downloads land in Files/Downloads; the status text deliberately says "dans ses téléchargements" (generic). Test on real iOS and Android before sign-off (not proven by this contract).
- Busy state resets after 8 s (single file) or 15 s (ZIP part) because success cannot be observed; the control then reads "Télécharger à nouveau (1 utilisation de plus)".
