# Phase 9 Design Critique

Own critique of the prototypes (impeccable critique/audit lenses, applied by hand; the `critique` and `audit` skills themselves were not loaded, see MOCKUPS.md "Not proven").

## What works
- Public pages inherit the site's identity (italic Cormorant, gold hairline eyebrow, quiet footer); one action per screen, the primary button is the only filled element.
- The confirm page shows the exact consent text and date next to the button, which is the consent proof the owner wants to be able to defend.
- Admin: the filter bar doubles as the counts, so there is no separate hero-metric row; badges carry icon + word; delete confirmation stays in the row (no modal) and names the address.
- Everything passes the scripted checks (overflow, 14px, 44px, contrast) in both themes and both viewports.

## Weaknesses found and fixed during the pass
- Admin mobile nav overflowed to 684px: fixed with a scrollable nav row, active item scrolled into view.
- Email button rendered 80px tall (min-height + padding): fixed.
- Unsubscribe "confirmed" repeated the resubscribe hint twice: second line reworded.
- Site `--muted` `#7a7a74` fails AA on `--surface` (4.4:1): contract adds `--muted-text`.

## Residual weaknesses (accepted)
- Public layouts are deliberately plain; the desktop right column is empty on the confirmed, expired, already and unsubscribe states (the asymmetry is intended, the whitespace is large).
- Dark email on clients that force-invert (Outlook, Gmail Android) may differ from the prototype; only `prefers-color-scheme` was designed.
- Admin has no bulk actions (select many, delete many). Out of scope for v1.1 volumes (low hundreds).

## Open questions (max 5)
1. **Resend a confirmation link (expired state).** The prototype offers "Recevoir un nouveau lien" (POST, rate limited, only to the address on file, masked in UI). It needs a server action and route (`/newsletter/renvoyer`) that the locked route contract does not list. Keep it, or drop it and show only "Retour au site"? Recommendation: keep, it recovers the majority of expired confirmations.
2. **Only entry point to subscribe.** Per D-01 the box lives in the download request. The resubscribe hint therefore tells people to request photos again. Do we want a standalone footer form (source `footer` appears in the admin mock)? If not, remove the `Pied de page` source values from the mock/CSV.
3. **Legal identity line.** The site's `mentions-legales` page shows an editor address and contact; the prototype uses placeholders. Which postal address and email go into every email footer (owner decision; must be real before the first send)?
4. **CSV separator.** Semicolon + BOM is right for French Excel but wrong for Google Sheets/Resend import defaults (comma). Ship semicolon only (recommended, D-03 imports are manual) or add a second "CSV (virgule)" link?
5. **Delete semantics for a `suppressed` address.** Erasure removes the row, so a later re-subscription would not be blocked by the earlier bounce. Should delete on `suppressed` rows be disabled (keep as suppression list, legally a legitimate interest) or allowed with a stronger warning? Recommendation: keep suppressed rows by default and offer erase only on explicit request.
