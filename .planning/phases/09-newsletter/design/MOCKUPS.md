# Phase 9 mockups

Open `gallery.html` (live iframes) or any file below directly in a browser. PNG renders are produced locally by `measure.mjs` into `_png/` (git-excluded). Regenerate everything: `node gen.mjs && node gallery.mjs`, then `PW=<path to node_modules/playwright> node measure.mjs`.

| Group | Files | Count |
|---|---|---|
| Confirm page | `public/confirm-{ready,error,confirmed,expired,already}-{fr,en}-{night,day}.html` | 20 |
| Unsubscribe page | `public/unsub-{ready,error,confirmed,invalid,already}-{fr,en}-{night,day}.html` | 20 |
| Double opt-in email | `email/confirm-{fr,en}-{light,dark}.html` | 4 |
| Newsletter + footer | `email/newsletter-footer-{fr,en}-{light,dark}.html` | 4 |
| Admin | `admin/{list,filter-search,delete-confirm,deleted,exporting,noresults,empty}.html` | 7 |

Viewports measured: 390x844 at DPR 2 and 1440x900 at DPR 1 (Chromium via Playwright 1.65.0). Every file is responsive and was measured at both sizes (110 runs).

## Measurements (`measurements.json`, from `measure.mjs`)
| Check | Rule | Result |
|---|---|---|
| Horizontal overflow | scrollWidth <= clientWidth | 0 of 110 runs fail |
| Text size | no visible text under 14px | 0 findings |
| Tap targets | buttons, inputs, standalone links >= 44x44 | 0 findings |
| Contrast | 4.5:1 text (3:1 large) vs composited background | 0 findings |

Deliberate exclusions: inline links inside paragraphs (tap rule), `.sr-only` elements, preheader, disabled controls (contrast).

## Not proven
- Real email clients (Gmail, Outlook, Apple Mail, dark-mode inversion) were not tested; the email CSS is a prototype and must be inlined by React Email.
- The contrast checker was not given a deliberate failing control; it found a real overflow earlier, but a negative control for contrast was not run.
- Fonts are loaded from Google Fonts; offline renders use fallbacks, metrics may differ slightly.
- The `shape`, `layout`, `typeset`, `adapt`, `frontend-design`, `critique`, `audit` skills were not loaded as separate runs; `shape`, `impeccable`, `high-end-visual-design` and `design-taste-frontend` were loaded and then deliberately overridden by the site's existing identity (serif display, gold accent, no Phosphor icons added). Critique and audit were done by hand and by script.
- No keyboard or screen reader pass was done on real browsers beyond DOM semantics; no real data, no JS behaviour (focus management, toast timing) is prototyped.
