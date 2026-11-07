# Phase 6, Design critique and audit of own mockups

Method: critique skill (heuristics, cognitive load, AI-slop check) and audit skill (a11y, theming, responsive, anti-patterns) applied by the author, plus the deterministic detector (`npx impeccable --json screens`) and the Playwright measurements (`_tools/measure-report.json`). This is a self-review, not independent: no second reviewer or real users were involved.

## Scores (honest, self-assigned)

| Heuristic | /4 | Key issue |
|---|---|---|
| Visibility of status | 3 | loading and success are clear; no progress for slow mail, acceptable |
| Match with real world | 4 | plain French, "boîte mail", "spam" |
| User control | 3 | can go back to selection and change address; cannot cancel an in-flight send |
| Consistency | 3 | reuses cart and `/mon-album` structure, but day-mode drawer is now white where the live site keeps it dark |
| Error prevention | 3 | email validated on blur and submit; consent box cannot be accidentally required |
| Recognition over recall | 4 | labels always visible, selection summary repeated |
| Flexibility | 2 | no "remember my email" prefill (deliberately not specified) |
| Minimalism | 3 | request step carries 6 blocks on mobile; consent text is long (6 lines at 390 px) |
| Error recovery | 3 | values kept on every error; no way to resend (by design, no enumeration) |
| Help | 3 | spam hint and contact link; no FAQ |
| **Total** | **31/40** | good |

Audit: Accessibility 3 (AA measured, not screen-reader tested), Performance 4 (static, no images), Responsive 3 (390 and 1440 only), Theming 4 (all colours are tokens, night and day), Anti-patterns 3. **17/20, good.**

## Detector findings (and verdict)

- `overused-font` (Space Grotesk, 40 hits): false positive for this task. It is the site's real UI font; consistency beats novelty here.
- `repeating-stripes-gradient` (40): the labelled image placeholder only. Not shipped; production shows real thumbnails.
- `italic-serif-display`, `kicker-above-heading`, `hero-eyebrow-chip`: the Cormorant italic title plus uppercase eyebrow is the site's established signature (CartDrawer, `/mon-album`). Kept for consistency, but the eyebrow is now 14 px and `--muted-aa` (the site's 9 px eyebrows are not carried over).
- `cream-palette` (4, light email): the outer background `#f1ede4` is warm. Acceptable, matches the gold accent; swap to a neutral `#f2f2f0` if the owner finds it too yellow.
- `cramped-padding` (16): inline field error (`.msg--inline`) has no box padding by design, it is plain text under the field.
- No gradient text, no side stripes, no glassmorphism, no card grids, no modal-in-modal, no em dashes, no bounce easing.

## What works

1. One primary action per state and the success screen never reveals whether an address is known, so it doubles as the abuse defence.
2. The consent box is visibly separate and lighter than the submit button, with the "optional, you get your photos anyway" sentence inside it, which removes the bundling ambiguity without extra screens.
3. All measured thresholds pass in both themes: min 14 px text, min 4.60:1 text contrast, min 3.31:1 control borders, 380 targets at or above 44 px, no overflow.

## Problems still present

- [P2] Consent block is the heaviest element on the form (6 lines on 390 px, a bordered box). It risks looking more important than the email field. Fix in build: reduce sub-line to one sentence ("Facultatif. Confirmation par email, désinscription en un clic.") only if legal review accepts the shorter text; any change bumps `CONSENT_TEXT_VERSION`.
- [P2] On success the visitor has no recovery if mail does not arrive other than "use another address". Acceptable for anti-enumeration; the spam hint carries the load. Consider a mailto contact line.
- [P3] Drawer in day mode is white while the site's drawer is hard-coded dark. Intentional (token `--panel`), needs owner sign-off (Q2).
- [P3] Locked key state shows a disabled empty field, which can read as broken. Alternative: hide the field and show only the message plus contact link.
- [P3] Desktop drawer is 440 px with a large empty area on success; fine, but a 1440 composition for the key page was only checked as a centred column.

## Open questions (max 5)

1. **Donation interstitial.** The current cart shows an "Avant de télécharger" donation modal before downloading. This contract removes it as a gate. Keep it as a soft, skippable line on the success screen (a link "Soutenir le travail"), or drop it entirely?
2. **Day theme drawer.** Accept a white drawer in day mode (new `--panel` token), or keep the current always-dark drawer and give the form dark-only tokens?
3. **Clear the cart after success?** Contract keeps the selection (visitor may retry with another address). Clearing matches the old behaviour (`clear()` after download) but loses the selection if the mail never arrives.
4. **Per-email throttle and resend.** Contract returns generic success and silently sends nothing when the per-email limit is hit, and offers no "resend" button. Confirm this over a visible "resend in N min" control (which would reveal a prior request).
5. **Size limits.** Should the UI cap a request (for example 60 photos, matching the ZIP part cap of D-08), warn above it, or let P7 split into parts silently? The mockups assume no cap and no warning.
