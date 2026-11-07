# Phase 9 Design Contract: Gestion de la newsletter

Scope: public pages `/newsletter/confirmer` and `/newsletter/desinscription`, two email templates (double opt-in, newsletter footer), admin `/admin/newsletter`.
Source of truth for pixels: the HTML in this folder (`public/`, `email/`, `admin/`, `assets/*.css`). Prototype generator: `gen.mjs`. Gallery: `gallery.html`. Checks: `measure.mjs` (results in `measurements.json`).
Locked inputs: D-01, D-02, D-03, D-07 (token ideas reused), D-12, D-13, schema `subscribers`, URLs `/newsletter/confirmer?t=`, `/newsletter/desinscription?s=`, `POST /api/webhooks/resend`.
Context files `PRODUCT.md`/`DESIGN.md` do not exist in the repo; the design context was inferred from `src/app/globals.css`, `Footer.tsx`, `admin/layout.tsx`. Register: public pages = brand (calm, editorial, photographer's site); admin = product (dense, dark, functional).

## 1. Direction (physical scene)
Public: someone on a phone, in a train or on a couch, who opened an email 10 seconds ago and wants one unambiguous action. Calm, quiet, editorial; the site already is: Cormorant italic display, Space Grotesk body, one gold accent, hairlines, no cards stacked in cards. Day/night follows the site toggle (class `.day`), default night.
Admin: the photographer alone at a desk, dim room, doing a monthly cleanup and a CSV export. Dark `#0a0a0a`, dense table, no decoration.
Colour strategy: Restrained (tinted neutrals, gold accent under 10%). Status colours are functional only and never the only signal (icon + word in every badge).
Deliberate choices: no centered hero, no card grid, no modal (delete confirmation is inline in the row), no gradient text, no side-stripe borders, no em dashes in copy.

## 2. Tokens (see `assets/tokens.css`)
Reused from the site, unchanged: `--bg --surface --text --muted --accent --accent-text --border`, `.day` overrides, fonts `--font-cormorant`, `--font-space`, `--navbar-h:64px`.
NEW (additive, safe to add to `globals.css` under the same names):

| Token | Night | Day | Why |
|---|---|---|---|
| `--muted-text` | `#8a8a83` | `#5c5c5c` | small text on `--surface`; site `--muted` `#7a7a74` is 4.4:1 on `#0e0e0e` (fails AA) |
| `--border-strong` | `rgba(255,255,255,.22)` | `rgba(0,0,0,.32)` | inputs and outline buttons, 3:1 non-text contrast |
| `--danger` / `--danger-bg` | `#e69a90` / 10% | `#9b2c20` / 7% | errors, delete, suppressed |
| `--ok` / `--ok-bg` | `#93cfa6` / 10% | `#1f6b3a` / 8% | confirmed |
| `--warn` | `#c8a97e` | `#7a5200` | pending |
| `--focus` | `#c8a97e` | `#7a5200` | 2px outline, 3px offset |
| `--ease` | `cubic-bezier(.16,1,.3,1)` | same | ease-out expo |

Type: h1 Cormorant italic 300, `clamp(2.4rem,5.2vw,4.25rem)`/1.04; lede 17px/1.6 (65ch cap 56ch); eyebrow/labels 14px, letter-spacing .12 to .18em uppercase; body 16px. **Minimum text size on all Phase 9 surfaces is 14px** (the site's 0.58rem admin labels are intentionally not reused: below the 14px acceptance rule).
Spacing: public page padding `clamp(1rem,6vw,4rem)`; column gap `clamp(2rem,6vw,6rem)`; desktop split 7fr/5fr; breakpoint 860px (public), 820px (admin), 1100px (admin hides Source/Texte columns).
Buttons: public `.btn` 52px high; admin `.btn-a` 44px; all hit targets at least 44x44.

## 3. Screens and states

### 3.1 `/newsletter/confirmer?t=` (public, GET is read-only, button = POST)
Layout: top bar (wordmark + theme toggle 44px), main split: left = eyebrow, status icon, h1, lede (with masked address), secondary line, action; right (desktop only, stacks below on mobile) = "what you are confirming" recap: address, versioned consent text (D-01 `CONSENT_TEXT_VERSION`), request date. Footer: (c), Mentions legales, Politique de confidentialite.
Address display: always masked (`m***@example.org` form: first char + `***` + domain). The page never reveals the full address.

| State | Trigger | Icon | H1 | Action | Server rule |
|---|---|---|---|---|---|
| ready | valid token, row `pending`, not expired | mail | Confirmez votre inscription / Confirm your subscription | POST button `Confirmer mon inscription` | GET consumes nothing |
| submitting | after click | mail | same | button `aria-busy=true`, label becomes `Confirmation…`, disabled | single submit (button disabled, server idempotent) |
| error | network or 5xx | mail | same | alert above button (`role=alert`), button re-enabled | state unchanged |
| confirmed | POST ok | check | Inscription confirmee | `Retour au site` (ghost) | `pending -> confirmed`, `consent_at` stays original |
| expired | `confirm_expires_at < now()` and still `pending` | clock (danger tint) | Ce lien a expire | POST `Recevoir un nouveau lien` + link `Retour au site` | rate limited (D-09); see open question Q1 |
| already | row already `confirmed` | check | Deja confirme | `Retour au site` | idempotent, no state change |
| unknown token | no row | use `expired` copy without the address, no resend button | | | never distinguish "unknown" from "used": no enumeration |

Moving to `confirmed` replaces the section content in place (same URL after PUT/redirect), focus goes to the h1 (`tabindex=-1`), `role=status` announces. The recap aside disappears after confirmation.

### 3.2 `/newsletter/desinscription?s=` (public, one click)
Same shell, no aside. GET never unsubscribes (mail scanners prefetch links); the button is a POST. The RFC 8058 one-click `POST` to the same URL (from `List-Unsubscribe-Post`) unsubscribes immediately with no page.

| State | Trigger | H1 | Action |
|---|---|---|---|
| ready | valid signature, row not `unsubscribed` | Se desinscrire de la newsletter ? | POST `Me desinscrire` (primary) + link `Je reste abonne(e)` |
| submitting / error | as above | same | busy button / alert |
| confirmed | POST ok | Vous etes desinscrit(e) | `Retour au site` + resubscribe hint block ("Se reinscrire") |
| already | row already `unsubscribed` or `suppressed` | Deja desinscrit(e) | `Retour au site` + resubscribe hint |
| invalid | bad or tampered signature, or no row | Lien non reconnu | `Retour au site`, no address shown, support mail in copy |

Resubscribe hint (NWS-02 "resubscribe"): the only path is re-ticking the optional box on a download request, which triggers a new double opt-in. A `suppressed` address gets the same wording (we do not disclose the bounce reason to the visitor).

### 3.3 Double opt-in email (`email/confirm-{fr,en}-{light,dark}.html`)
600px max, single column, table-based, system fonts (Georgia italic for headings, Helvetica/Arial body), preheader hidden. Order: wordmark + role, rule, h1, 2 short paragraphs, primary button (links to `/newsletter/confirmer?t=`), plain-text fallback URL, "not you? ignore" line, footer with reason, legal identity, privacy and legal links.
No unsubscribe link in this transactional mail (nothing to unsubscribe from yet); the "not you" line replaces it. Sent from `RESEND_FROM` (D-12), language = site language at request time. Subject FR `Confirmez votre inscription à la newsletter`, EN `Confirm your newsletter subscription`. Plain-text part mirrors the content (HTML + text, PITFALLS #4).
Dark mode: `@media (prefers-color-scheme: dark)` plus `<meta name="color-scheme" content="light dark">`. Static previews force it with `html.dark`.

### 3.4 Newsletter footer (`email/newsletter-footer-{fr,en}-{light,dark}.html`)
Sent from the Resend dashboard (D-03); this is the footer block to paste into each broadcast. Content, top to bottom: why-you-receive-this line with masked address and consent date, **one-click unsubscribe link** (bold underlined, 44px tap height), hint about the mail-app button, legal identity line, privacy + legal notice links. Headers (set in Resend, not visible): `List-Unsubscribe: <https://…/newsletter/desinscription?s=…>, <mailto:…>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`.
Legal identity: `Ghjulianu Codani, photographe · [Adresse postale de l'editeur] · contact@example.org`. **Placeholders must be replaced by the owner with the real postal address and contact before the first send**; the prototype never contains real data.

### 3.5 `/admin/newsletter`
Add `{ label: 'NEWSLETTER', href: '/admin/newsletter' }` to `NAV` in `src/app/admin/layout.tsx` (additive).
Layout: page title + export button (right); status filter bar doubling as counts (5 cells: Tous, Confirmes, En attente, Desinscrits, Supprimes; each cell is a link `?status=`; `aria-current="true"` on the active one, gold underline); search field (`?q=`, debounce 250ms or submit on Enter, substring on email); table; pager (25 per page).
Table columns: Email | Statut (badge + optional sub-note) | Langue | Source | Consentement (date) | Texte (consent version) | Supprimer. Sub-notes: pending `Expire dans 31 h`; suppressed `Rebond definitif` or `Plainte spam` (from `suppressed_reason`); unsubscribed `Desinscrit le <date>`.
Badges: confirmed check, pending clock, unsubscribed minus, suppressed ban. Icon + text + colour.
Delete (NWS-04): `Supprimer` text+icon button per row (44px, `aria-label="Supprimer <email>"`). Click replaces the row with an inline confirmation row (`role=alertdialog`, focus on `Annuler`, Escape cancels): "Supprimer definitivement <email> ? L'adresse sera effacee de l'abonnement, des demandes de telechargement et des evenements. Cette action est irreversible." Buttons `Annuler` (focused) and `Supprimer definitivement` (danger). Not `window.confirm` (the existing `ConfirmButton` pattern is not accessible to screen-reader users in all browsers and cannot show the email); inline keeps context and avoids a modal.
After deletion: row removed, count cells update, toast `Abonne supprime : <email>` (`role=status`, 6s, `Fermer` button). Erasure scope = `subscribers`, `download_requests`, `events` matching the email (PITFALLS RGPD erasure).
Export (NWS-05): button `Exporter CSV (168)`, always the **confirmed only** set regardless of the active filter; the note under it says so. States: default; exporting (`aria-busy`, `Preparation…`, disabled); zero confirmed (disabled, note `Aucun abonne confirme a exporter.`, `aria-describedby`).
CSV spec: UTF-8 with BOM, separator `;` (French Excel), CRLF, header `email;statut;langue;source;consentement_le;texte_version`, cells starting with `= + - @ TAB CR` get a leading `'`; filename `abonnes-confirmes-AAAA-MM-JJ.csv`; route handler is admin-only.
Admin masks nothing in production (admin sees real addresses); **all mockups use masked fake addresses on `example.org/.net/.com`**.

| Admin state | File | Notes |
|---|---|---|
| default list | `admin/list.html` | 10 of 214, mixed statuses |
| filter + search | `admin/filter-search.html` | pending + "example", count line announces results |
| delete confirm | `admin/delete-confirm.html` | inline row |
| deleted | `admin/deleted.html` | toast, 213 |
| exporting | `admin/exporting.html` | busy button |
| no results | `admin/noresults.html` | dashed empty block + reset |
| empty | `admin/empty.html` | explains the 3 step funnel, export disabled, all counts 0 |
| loading | not mocked | server component streaming: use `.skeleton` rows (class exists in `admin.css`), 6 rows |
| load error | not mocked | one `role=alert` banner: `Impossible de charger les abonnes. Reessayez.` + `Reessayer` button |

Mobile (<=820px): header becomes tools row (Admin / Voir le site / Deconnexion) + horizontally scrollable nav row with the active item scrolled into view; filters wrap 2 per row; export button full width; table becomes stacked rows (email, badge, `FR · date`, delete button on the right, 44px); delete confirm row full width with stacked full-width buttons; Source and Texte columns hidden; no horizontal page scroll.

## 4. Microcopy (FR source of truth, EN mirror)
Strings are embedded in `gen.mjs` (`T`, `E`) and visible in every file. Rules: tutoiement none, vouvoiement; no em dashes; no "Oups"; buttons are verbs; errors say what happened and what to do; the address is always masked on public pages. Gender-neutral `desinscrit(e)` kept (site audience). Consent text (owned by P5 `consent.ts`, v1): FR `J'accepte de recevoir la newsletter de Ghjulianu Codani (nouveaux albums et actualites). Je peux me desinscrire a tout moment.` EN `I agree to receive the Ghjulianu Codani newsletter (new albums and news). I can unsubscribe at any time.` The confirm page recap must show exactly the stored version text.
i18n: add keys under a new `newsletter` section in `src/lib/i18n.ts` (FR and EN, appended only). Emails get their strings from `email/layout.tsx` parameterised by `lang` (D-12).

## 5. Accessibility
- One `h1` per page; `<main>`; landmarks (`header`, `main`, `footer`, `nav aria-label`); `lang` on `<html>` and on email.
- Contrast: all text at least 4.5:1 (large 3:1), measured by script on every file; non-text (inputs, outline buttons) 3:1 via `--border-strong`.
- Focus: visible 2px outline, 3px offset, never removed; skip nothing (pages are short). Focus management: after POST success move focus to the h1 (`tabindex=-1`); on delete confirm focus `Annuler`; on cancel return focus to the row's `Supprimer`; on toast do not steal focus.
- Live regions: result sections `role=status`, errors `role=alert`, search result count `aria-live=polite`.
- Status is never colour only (icon + text). Icons `aria-hidden`.
- Forms: POST buttons inside real `<form method=post>` so they work without JS (progressive enhancement); busy state through `aria-busy` + disabled.
- Table: real `<table>` with `<caption class=sr-only>` and `scope=col`; on mobile the visual stack keeps DOM order (email first); header hidden visually, still present.
- Touch: 44px minimum for every button, tab, toggle and standalone link; inline links inside paragraphs are exempt (WCAG 2.5.8 inline exception).
- Reduced motion: transitions and `rise` animation reduced to 0.01ms under `prefers-reduced-motion`.
- Email: semantic text, alt/`aria-label` on image placeholder, `lang`, 16px body, 14px minimum footer, unsubscribe link 44px tall.

## 6. Motion
Public: staggered `rise` (14px, 600ms, `--ease`, 60ms steps, max 5 children) on first paint only; buttons 300ms background/colour inversion, `:active` translateY(1px); theme toggle 250ms. Admin: filter hover 200ms, toast `rise` 400ms, skeleton shimmer 1.4s linear (loading only). Animate `transform`/`opacity`/colour only; no layout animation; no looping decoration. All gated by `prefers-reduced-motion`. Email: none.

## 7. Acceptance checks (measurable)
Automated (`node measure.mjs`, Playwright 1.65.0, 55 files x 2 viewports = 110 runs; last run: 0 findings):
- AC-A1 no horizontal overflow: `documentElement.scrollWidth <= clientWidth` at 390 and 1440.
- AC-A2 no visible text node under 14px computed font-size.
- AC-A3 every `a[href]`, `button`, `input` (outside paragraphs for links) at least 44x44 CSS px.
- AC-A4 text contrast at least 4.5:1 (3:1 for large text) against the composited effective background, day and night.
Manual / implementation checks for the builder (P9) and auditors:
- AC-M1 GET `/newsletter/confirmer?t=valid` leaves the row `pending` (check DB before and after).
- AC-M2 POST with valid token sets `confirmed`; replay returns the `already` state; expired returns `expired` and changes nothing.
- AC-M3 unknown/forged token pages leak no address and equal in timing class (no enumeration).
- AC-M4 unsubscribe: GET leaves state unchanged; POST sets `unsubscribed`, `unsubscribed_at`; a one-click RFC 8058 POST works without cookies or CSRF token.
- AC-M5 every newsletter email contains both the in-body unsubscribe link and the two List-Unsubscribe headers; the confirm email contains neither.
- AC-M6 webhook `bounced` (hard) or `complained` sets `suppressed` with `suppressed_reason`; replay is idempotent; invalid Svix signature returns 401; the admin shows the badge `Supprime` + sub-note.
- AC-M7 CSV: first bytes `EF BB BF`; opens in Excel FR with 6 columns; a subscriber whose email field is `=cmd|x` (or `+`,`-`,`@`) is prefixed with `'`; only `confirmed` rows; empty set disables the button.
- AC-M8 delete removes the email from `subscribers`, `download_requests`, `events`; Escape cancels; count cells match after reload.
- AC-M9 keyboard-only run through each screen completes the primary action; screen reader announces result states.
- AC-M10 sending in preview/dev uses the guard D-13 (no Resend call).
- AC-M11 emails render in Gmail web, Gmail iOS dark, Outlook (classic) and Apple Mail: not proven here (see MOCKUPS.md).

## 8. Requirement -> screen -> check

| Req | Screen(s) | Files | Checks |
|---|---|---|---|
| NWS-01 double opt-in, POST button | 3.3 confirm email, 3.1 confirm page (ready, confirmed, expired, already, error) | `email/confirm-*`, `public/confirm-*` | AC-M1, M2, M3, A1-A4 |
| NWS-02 one-click unsubscribe + headers | 3.2 unsubscribe page, 3.4 newsletter footer | `public/unsub-*`, `email/newsletter-footer-*` | AC-M4, M5, A1-A4 |
| NWS-03 bounce/complaint suppress | 3.5 badge `Supprime` + sub-note, filter `Supprimes` (no public screen) | `admin/list.html` | AC-M6 |
| NWS-04 admin view, filter, delete | 3.5 table, filters, search, inline delete, empty, no results, mobile | `admin/*` | AC-M8, A1-A4 |
| NWS-05 CSV confirmed-only, injection-safe, Excel | 3.5 export button states + CSV spec | `admin/list.html`, `admin/empty.html`, `admin/exporting.html` | AC-M7 |

## 9. Handoff notes for implementers
- Reuse `src/app/admin/layout.tsx` shell unchanged except NAV; the admin page is a Server Component with `searchParams` (`status`, `q`, `page`); row delete = server action + inline confirmation (small client component).
- Public pages: Server Components, server actions for the POSTs, `<meta name="robots" content="noindex">`, `Cache-Control: no-store`.
- Do not use `window.confirm` for delete (see 3.5); do not render the full address publicly.
- Email: React Email layout with inline styles (CSS here is for prototyping; clients need inlined styles). Use Georgia for headings; web fonts are not reliable in email.
