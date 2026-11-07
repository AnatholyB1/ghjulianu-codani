# Phase 10 — Design contract: `/admin/stats`

Status: prototype-backed (static HTML in this folder). Builders implement against this file; prototypes are the visual reference. All numbers in prototypes are SAMPLE DATA. Decisions D-04, D-10, D-11 of `MILESTONE-v1.1-DECISIONS.md` are respected (plain SVG/CSS, no chart library, no cookie, no raw IP).

## 1. Page anatomy (top to bottom)

1. Admin chrome (existing `layout.tsx`; NAV gets `STATS` appended, plus `NEWSLETTER` by P9).
2. Page head: eyebrow `STATISTIQUES`, H1 `Suivi des téléchargements`, period selector + range line.
3. KPI tiles (6): Téléchargements, Vues, Demandes, Inscriptions newsletter, Abonnés, Bande passante estimée.
4. Card: Vues et téléchargements par jour (two stacked panels sharing the x axis, no dual axis).
5. Card: Tunnel de téléchargement (4 steps, conversion between steps, global conversion).
6. Two cards: Photos préférées (selection adds) / Plus téléchargées (thumbnail placeholders, bar, count).
7. Card: Albums les plus consultés (views + downloads, `Privé` badge).
8. Two cards: Jour / nuit, Appareils (stacked bar + list).
9. Card: Croissance des abonnés (cumulative confirmed line).
10. Footer note (retention, privacy, bandwidth scope).

Every chart/ranking card ends with `<details>` "Voir les données (tableau)" containing a real `<table>` (caption, `th scope`).

Layout: mobile 1 column (KPI grid 2 cols); >=900 px: KPI 3 cols, `two` cards side by side; >=1200 px: KPI 6 cols. Max width 1400 px, gutters 16 px / 32 px. Admin nav scrolls horizontally inside its own row on mobile (never the page).

## 2. Tokens

Surfaces (existing admin): `--bg #0a0a0a`, `--surface #0e0e0e`, `--surface-2 #141414`, border `rgba(255,255,255,.07)`, strong `rgba(255,255,255,.14)`. Ink: `--text #E8E4DC`, `--accent #c8a97e`. **`--muted` is raised to `#9a9a93`** (existing `#7a7a74` = ~4.1:1 on `#0e0e0e`, fails 4.5:1 at body size).

Type: display `var(--font-cormorant)` italic 300 for H1/H2/KPI values/counts (`clamp(2rem,8vw,2.75rem)` KPI); sans `var(--font-space)` 14 px/1.5 for everything else. **Minimum text size 14 px everywhere** (existing admin uses 9–10 px labels; this page deliberately does not — see critique). Labels: uppercase, letter-spacing .1–.14em. Numbers `font-variant-numeric: tabular-nums`. French thousands separator = narrow/non-breaking space; decimals comma; `0 %` spacing.

Spacing scale 4/8/12/16/24/32/48. Tap target `--tap: 44px`.

Data colour (dark surface `#0e0e0e`, validated — `palette-validation.txt`):

| Role | Token | Hex | Notes |
|---|---|---|---|
| Vues | `--c-views` | `#3987e5` | views series, album view meters, funnel ramp |
| Téléchargements | `--c-downloads` | `#d95926` | downloads series, "plus téléchargées" meters |
| Subscribers / mobile | `--c-aqua` | `#199e70` | |
| Jour | `--c-day` | `#c98500` | + glyph ☀ |
| Nuit | `--c-night` | `#9085e9` | + glyph ☾ |
| Favoris | `--accent` | `#c8a97e` | single series, not categorical |
| Delta up/down/flat | `--up #5fc79a` `--down #ff8a80` `--flat #9a9a93` | | always with ▲/▼/▬ glyph + signed number + words |

Validation results (script `validate_palette.js`, mode dark, surface `#0e0e0e`): views/downloads pair all-pairs CVD dE 26.8, normal 31.8; blue/orange/aqua trio all-pairs CVD dE 9.4 (>=8), normal 20.9 (>=15), contrast >=3:1; day/night CVD 17.3-27.3, normal 27.5. All PASS. Two rejected candidate device palettes (aqua/magenta/red, aqua/magenta/violet) FAIL and are recorded in the file; the validated trio is used. Because the device trio reuses the views/downloads hues, device segments ALSO carry texture (solid / diagonal stripes / dots) and direct labels. Funnel uses a single-hue lightness ramp (`#8fbcf0 → #2a67b4`), steps are numbered and labelled in text.

Marks: lines 2.5 px, area fill 14 % opacity, end marker 10 px dot with 2 px surface ring, bars 6–14 px thick with 4 px rounded data-end, 2 px gap between stacked segments, grid lines 8 % white, no gradients on data.

## 3. Components and behaviour

- **Period selector**: a `nav` with 3 links `?p=7|30|90` (server-rendered, shareable URL, default 30). Selected item: inverted fill + ✓ glyph + `aria-current="true"` (not colour alone). Height 44 px. Range line: `8 oct. – 6 nov. 2026 · comparée au 8 sept. – 7 oct. 2026`. Periods end **yesterday** (last complete Europe/Paris day); previous period = the equal-length window just before.
- **KPI tile**: label, value, delta line, hint. Delta = `▲ +12 % vs 30 j préc.` (+ sr-only sentence). Previous value 0 and current >0 → `Nouveau` (no %). Both 0 → `▬ stable`. Delta for Abonnés = growth in confirmed subscribers over the period.
- **Time-series card**: two panels (Vues, Téléchargements) because the scales differ ~20x — no dual axis. Y ticks 0 / half / "nice" max (HTML text, not SVG text, so >=14 px at any width). X labels: 4 dates. 7 d = 7 points, 30 d = 30, 90 d = 90 daily points (no smoothing). Panel title shows period total. Legend always present. Hover/focus layer (production): crosshair + tooltip `6 nov. · 134 vues`, hit area = full column height, keyboard: plot is `tabindex=0`, arrow keys move the crosshair, tooltip content mirrored in an `aria-live=polite` region. Prototype is static; the data table is the guaranteed alternative.
- **Funnel**: ordered list; each step: name, count (display font), bar proportional to step 1. Between steps: `↓ 10,3 % passent à l'étape suivante`. Header shows global conversion (step 4 / step 1). Zero denominator → `–`.
- **Ranked lists**: position, 52 px thumbnail (`next/image` of the stored thumb; placeholder = dark gradient; `alt=""` because the title is adjacent text), title (photo name) + subtitle (album), meter, count with unit. Top 5. Tie-break: count desc, then most recent event. Rows are not links in v1.1 (open question: link to admin album).
- **Albums**: album title wraps on mobile (no truncation), `Privé` text badge for private albums, two counts (vues, téléch.).
- **Split bars** (jour/nuit, appareils): stacked bar `role="img"` with full `aria-label`, list under it with swatch + label + % + count. Percentages sum to 100 % (largest remainder rounding in code).
- **Subscriber growth**: cumulative confirmed subscribers per day; y axis is *relative gain* with note stating the baseline (`0 = 369 abonnés`) because a 412-vs-369 absolute axis starting at 0 would flatten the line.

## 4. States (ALL)

| State | Trigger | Rendering | A11y |
|---|---|---|---|
| Content | data exists | `stats-content-{7d,30d,90d}.html`, `stats-content-tables.html` (tables opened) | headings h1 > h2 per card |
| Empty (no data yet) | zero `events` rows AND zero subscribers for the selected window **and** all time | `stats-empty.html`: tiles at 0 with `Aucune donnée`, one card: illustration, `Pas encore de données`, explanation, 4-item checklist of what will appear, `Voir le site ↗` button | `role="status"` |
| Partial | data exists overall but none in window | tiles show real zeros, deltas `Pas de comparaison`; each chart card shows inline `Aucune donnée sur cette période.` instead of an empty plot; period selector stays usable | text, not blank |
| Loading | route `loading.tsx` / pending fetch | `stats-loading.html`: head and selector visible (selector `aria-disabled`), skeleton tiles + cards, shimmer 1.4 s | `aria-busy="true"`, one `role="status"` sr-only `Chargement des statistiques…`; skeleton `aria-hidden` |
| Error | RPC fail/timeout | `stats-error.html`: red-bordered alert, `Impossible de charger les statistiques`, `Réessayer` (reload), secondary link, collapsible technical detail, no stack/PII | `role="alert"`, focus moved to the alert heading on error render |
| Reduced motion | `prefers-reduced-motion` | skeleton shimmer off, all transitions off | CSS |
| Forced colours | `forced-colors: active` | selected period outlined, stack segments get borders | CSS |
| Sample banner | **prototype only** | dashed `DONNÉES D'EXEMPLE` banner; never rendered in production | — |

Retry rule: `Réessayer` re-runs the server fetch (router.refresh); selector changes during error keep the param.

## 5. Microcopy (FR)

Titles: `Suivi des téléchargements`; `Vues et téléchargements par jour`; `Tunnel de téléchargement`; `Photos préférées` (sub `Ajouts à la sélection`); `Plus téléchargées` (sub `Fichiers servis`); `Albums les plus consultés`; `Jour / nuit` (sub `Mode du site à la vue`); `Appareils` (sub `Classe d'appareil`); `Croissance des abonnés`.
Tiles hints: `fichiers servis`; `N visiteurs-jours (uniques par jour)`; `liens envoyés par email`; `x % des demandes · N confirmées`; `+N / −M sur la période`; `téléchargements uniquement`.
Notes: `Deux échelles distinctes : les vues sont environ vingt fois plus nombreuses que les téléchargements. Jours calculés en heure de Paris.` (the "vingt fois" wording is dynamic: compute the ratio, omit if < 3). `Le visiteur choisit le mode ; ce n'est pas l'heure de la vue.` Footer: `Les événements bruts sont conservés 13 mois puis supprimés ; les agrégats restent. Aucun cookie, aucune adresse IP stockée. Bande passante : octets des fichiers téléchargés, hors images du site servies par le CDN.`
Buttons: `Réessayer`, `Revenir au tableau de bord`, `Voir le site ↗`, summary `Voir les données (tableau)`.
Empty: `Pas encore de données` / `Les statistiques apparaîtront dès les premières visites. Les vues sont comptées après affichage réel de la photo, sans cookie ni adresse IP stockée.`
Error: `Impossible de charger les statistiques` / `Le serveur n'a pas répondu. Vos données ne sont pas perdues. Réessayez dans un instant.`
Numbers: `5 143`, `7,3 %`, `4,0 Go`; bandwidth unit auto (Mo < 1 Go, Go, To).

## 6. Accessibility contract

1. Every chart has a text alternative: SVG `role="img"` + `<title>` stating series, total and period; plus a visible `details` data table with caption, header scopes, scrollable region `tabindex=0 role=region aria-label`.
2. Nothing relies on colour alone: delta = glyph + sign + words; selected period = ✓ + inverted fill; day/night = ☀/☾ + label + %; devices = texture + label + %; series identified by legend AND panel titles; private = text badge.
3. Contrast: all text >= 4.5:1 (measured, see §8); data marks >= 3:1 against surface.
4. Tap targets >= 44x44 (period links, nav links, buttons, summaries, scrollable table regions).
5. Focus: 2 px `#E8E4DC` outline, 3 px offset, never removed.
6. Reduced motion respected; no animation on data.
7. Headings: one h1, h2 per card, `Indicateurs clés` sr-only h2 for tiles. Landmarks: `main`, `nav aria-label`.
8. Zoom/reflow: no horizontal page scroll at 390 px or 200 % zoom; only table regions scroll.
9. `lang="fr"`; numbers formatted with `Intl.NumberFormat('fr-FR')`.

## 7. Data definitions (what the SQL/RPC must compute)

All windows: `[start, end]` inclusive in Europe/Paris days; end = yesterday; previous window = same length immediately before. Source = `events`, `subscribers`, `download_requests` (schema contract). Delta % = `round((cur - prev)/prev*100)`, undefined if prev = 0.

- **Vues (views)**: count of `events` with `type='view'`. One `view` event = a photo actually displayed to a visitor: the client beacon (`POST /api/track`) fires when the photo (lightbox photo or album-grid card) has been >= 50 % in the viewport for >= 1 s **after load**, never on mere page load or prefetch. Dedupe: once per `(photo, visitor_hash, Paris day)` — enforced by the unique index (D-10) plus a client `sessionStorage` guard (storage only holds already-sent ids, no identifier). Bots filtered server-side (UA `isbot`/missing UA/headless) before insert. `visitor_hash = sha256(ip + ua + daily_salt)`; nothing else identifying stored. Events carry `album_id` when the photo belongs to an album.
- **Visiteurs-jours**: `count(distinct (visitor_hash, paris_day))` over `view` events. Because the salt rotates daily, one person on two days = 2.
- **Téléchargements**: count of `type='download'` — one event per file or ZIP part actually streamed by the token route (never at request time or landing-page GET). Bytes in `events.bytes`.
- **Demandes**: count of `type='request'` (successful `requestDownload`, post rate-limit and honeypot).
- **Liens ouverts**: count of **distinct `request_id`** with a `link_open` event (landing page GET that rendered a valid link; repeat opens of the same request count once).
- **Téléchargés (funnel step 4)**: count of **distinct `request_id`** with >= 1 `download` event. So KPI Téléchargements (files) >= funnel step 4 (requests).
- **Funnel**: step 1 visiteurs-jours with a view; steps 2–4 as above; conversion step n = n / (n-1); global = step 4 / step 1. Units differ between step 1 and the rest (visit-days vs requests) — documented in the critique.
- **Photos préférées (favorites)**: count of `type='select_add'` per `photo_id` — a visitor adding a photo to their selection/cart. Deduped per `(photo, visitor_hash, Paris day)` (re-adding after remove same day counts once; removals do not decrement; no event on remove). It measures *intent to download*, not "likes". Top 5 by count.
- **Plus téléchargées**: count of `download` per `photo_id` (ZIP downloads fan out to one event per included photo via `request.photos`, or are attributed per photo at part-serve time; the builder must log photo_id per file in the ZIP, else ZIP downloads are invisible to this ranking).
- **Albums les plus consultés**: views by `album_id` (photo views inside the album) and downloads by `album_id`; sorted by views. Private albums included with `Privé` badge (admin-only page).
- **Inscriptions newsletter**: `subscribers` rows with `consent_at` in the window (box ticked at request); sub-count "confirmées" = those with `status='confirmed'` today. **Taux d'inscription** = inscriptions / demandes.
- **Abonnés**: `count(*) where status='confirmed'` now; growth = confirmed in window − unsubscribed in window (`unsubscribed_at`). Daily cumulative series for the chart. (Needs a confirmation timestamp — see critique Q1.)
- **Bande passante estimée**: `sum(bytes)` of `download` events in window. Excludes site image traffic served by Vercel/Supabase CDN (not measurable from the app). Always labelled `estimée`.
- **Jour / nuit**: split of `view` events by `is_day` (the site mode the visitor had selected, not clock time). `is_day null` excluded from denominators.
- **Appareils**: split of `view` events by `device` (`mobile`/`desktop`/`tablet`; `userAgent().device.type`, undefined → desktop; UA discarded).
- **Retention**: raw `events` purged after 13 months (`purge_old_events`); the dashboard reads only the last <= 180 days, so raw is sufficient for the 3 selectors; long-term aggregates need a daily rollup table (critique Q2).

## 8. Acceptance checks (measurable)

Run `node measure.mjs <dir>` (Playwright 1.65, 390x844 @2x and 1440x900) against rendered pages; builders must reproduce on the real route with seeded data.

| ID | Check | Threshold | Prototype result |
|---|---|---|---|
| A1 | Horizontal page overflow | `scrollWidth - innerWidth = 0` at 390 and 1440 | 0 on all 14 renders |
| A2 | Min computed text size (visible text) | >= 14 px | 0 violations |
| A3 | Interactive element size | >= 44x44 px | 0 violations |
| A4 | Text contrast | >= 4.5:1 (3:1 if >= 24 px or >= 18.66 px bold) | 0 violations (disabled selector during loading is exempt, opacity .55) |
| A5 | Palette | validator PASS dark, adjacent+all-pairs for <=3 series | PASS |
| A6 | Every chart/ranking has a text alternative | `<table>` in a `details` for time series, funnel, 2 photo rankings, albums, growth (6); the two split bars use their visible list (label, %, count) as the alternative | 6 tables + 2 lists |
| A7 | No chart library in `package.json` diff | none added | n/a (prototype) |
| A8 | Delta never colour-only | glyph + sign + sr text | yes |
| A9 | Reduced motion | skeleton has `animation: none` under media query | yes |
| A10 | Totals reconcile | sum of daily series = tile value; split percents sum to 100 % | yes (generated from the same arrays) |
| A11 | Page render budget | initial server response < 800 ms with 13 months of events (SQL aggregates, not row scans) | to be measured by builder |
| A12 | Privacy | no cookie set by `/admin/stats` or `/api/track`; no IP column | builder |

## 9. Requirement → screen → check

| Req | Screen/element | Check |
|---|---|---|
| KPI-01 | Period selector, tiles Téléchargements + Vues with deltas, time-series card | A1, A8, A10, §7 Vues/Téléchargements |
| KPI-02 | Photos préférées, Plus téléchargées, Albums les plus consultés | A6, §7 favorites/downloaded/albums |
| KPI-03 | (not a screen) `/api/track` beacon; page footer states the guarantees | A12, §7 Vues dedupe + bots; builder test: two displays same photo/day = 1 row; UA bot = 0 rows |
| KPI-04 | Tunnel card, tile Inscriptions newsletter (taux) | A6, §7 funnel/inscriptions |
| KPI-05 | Albums card, Jour/nuit, Appareils | A5, A6 |
| KPI-06 | Tiles Bande passante estimée + Abonnés, Croissance des abonnés card | A6, §7 bandwidth/subscribers |
| KPI-07 | Footer retention note; no UI beyond it | `purge_old_events(13)` scheduled; test: row aged 14 months removed, aggregate kept |

## 10. Out of scope (v1.1)

Country/referrer breakdowns, per-photo drill-down, CSV export of KPIs, real-time view, comparison charts overlaying previous period (deltas only), custom date ranges.

## 11. Files

`stats.css` (tokens + components), `stats-*.html` (7 states/variants), `build.mjs` (regenerates the HTML from sample data), `measure.mjs` (screenshots + measurements), `measure-report.json`, `palette-validation.txt`, `gallery.html`, `MOCKUPS.md`, `10-DESIGN-CRITIQUE.md`. PNGs are in `shots/` (git-excluded).
