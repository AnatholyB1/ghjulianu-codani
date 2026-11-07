# Phase 7 design critique (self-review of the mockups)

Method: `critique` (LLM review + deterministic detector `npx impeccable --json screens`) and `audit` (measured by `shoot.mjs` on 72 renders, plus the detector). Reviewed my own work, so scores are conservative and the open questions below are the real output.

## Design health (Nielsen, 0-4)

| Heuristic | Score | Note |
|---|---|---|
| Visibility of system status | 3 | Busy bar and polite status exist, but real progress is unknowable (browser-native); uses-left is optimistic until refresh |
| Match with real world | 4 | "Utilisation", "Partie 1 sur 3", plain dates, no jargon |
| User control and freedom | 2 | A click spends a use and cannot be undone or retried free (see Q1) |
| Consistency and standards | 3 | Reuses site tokens, fonts, square gold CTA; 14px floor deviates from the site's 9-10px labels (deliberate) |
| Error prevention | 3 | Cost shown before click, last-use callout, ZIP recommended; but 3 ZIP parts silently eat all uses unless the lede is read |
| Recognition over recall | 4 | Everything needed is on screen |
| Flexibility and efficiency | 3 | One-tap ZIP for novices, per-photo for picky users; no multi-select subset ZIP (out of scope) |
| Aesthetic and minimalism | 3 | Calm, one accent; the left panel on desktop is sparse below the CTA |
| Error recovery | 3 | Every terminal state has a next step; "request again" re-enters the whole cart flow |
| Help | 2 | No contact/support line anywhere; a failed download has no human fallback |
| **Total** | **30/40** | Good; the gap is policy (uses) and help, not visuals |

Audit (technical): Accessibility 3 (measured AA on text, targets, overlaps; not yet screen-reader tested), Performance 3 (static, opacity/transform only; real page depends on thumbnail derivatives), Theming 4 (all colours via tokens, day and night both measured), Responsive 3 (390 and 1440 verified, 768 and 320 reasoned but not rendered), Anti-patterns 3. **16/20.**

## Anti-pattern verdict

Does it look AI-made? Mostly no: it is the site's own language (square gold CTA, Cormorant italic, hairlines), no gradients, glass, cards-in-cards, icon-card grids or side stripes. Detector findings and decisions:

| Finding | Decision |
|---|---|
| `hero-eyebrow-chip` on valid page | **Fixed**: eyebrow removed (the label restated the h1). |
| `cramped-padding` on tile tags | **Fixed** (2px vertical padding added). 132 residual hits are the hatched placeholder `figure` (flagged as "no inset"): false positive, it is an image frame. |
| `italic-serif-display` (Cormorant italic h1) | **Kept**: it is the site's established display voice (CartDrawer, headings), and the register is a photographer's portfolio. Flagged for the orchestrator (Q5). |
| `overused-font` (Space Grotesk) | **Kept**: already the site body font. |
| `repeating-stripes-gradient` | **Kept**: placeholder hatch, disappears when real thumbnails land. |
| `marquee` | False positive: the 2px indeterminate progress bar. |

## What works

- One primary action per screen and the cost is stated before the click ("compte pour 1 utilisation").
- Terminal states are honest and identical for invalid/revoked (no enumeration), each with a way forward.
- True-ratio tiles with download on the tile give photographers a real preview and per-photo control without cards.

## Priority issues (after fixes made)

1. **[P1] Uses vs parts.** With D-07 literal, a 3-part ZIP uses all 3 uses and individual photo clicks burn uses fast. The page explains it but the policy is user-hostile. Fix: policy decision (Q1); layout already supports either.
2. **[P2] No human fallback.** Add a "Besoin d'aide ? Écrivez-moi" mailto/contact link in the footer of error, dlerror and exhausted states (needs a contact address, Q4 of the shared site). Suggested: /clarify.
3. **[P2] Interrupted downloads.** A 120 MB part on mobile data will fail sometimes; the copy cannot promise a refund that the route may not give. Suggested: /harden after Q1.
4. **[P3] Desktop left panel is thin under the CTA** when the grid is long (sticky helps). Acceptable; could host the privacy note.
5. **[P3] 320 and 768 not rendered**; 390 and 1440 only. Builder should add them to AC runs.

## Persona red flags

- **Anxious first-timer on iPhone (from the email)**: after tapping "Télécharger" nothing visibly happens on the page; the text says so, but Safari's download UI is subtle. Mitigated by the status line, not proven on a real device.
- **Client who got the link forwarded**: sees "Lien personnel : ne le partagez pas" but nothing stops sharing; by design (D-07 caps at 3 uses).
- **Power user wanting 40 of 96 photos**: has to download all parts or click each tile; no subset ZIP. Out of scope for v1.1.

## Open questions (max 5, need a decision)

1. **Use accounting.** Should "Tout télécharger" in N parts cost 1 use total (grace window of about 30 min per token on `consume_download_use`, parts of the same set free), and should a failed/interrupted stream be refunded or retryable for about 10 min? Recommended: yes to both; otherwise a 3-part ZIP leaves no retry. This changes D-07 and the SQL function, so it is the orchestrator's call.
2. **Landing-time data exposure.** The landing page shows album name, counts, sizes and thumbnails to anyone holding the link, including a private album's photos. Confirm that this is intended (the link is the capability), and that thumbnails come from public-bucket derivatives (D-05) rather than token-gated URLs.
3. **Where does "Redemander mes photos" lead?** Recommended: the album page for public albums, `/` for private albums and portfolio selections (never expose a private album slug from an expired token). Needs the P6 request form to be reachable without the old cart state.
4. **Support contact.** Is there an address/link for a human fallback (issue 2), FR and EN?
5. **Site-wide 14px floor and italic h1.** Confirm that this page may exceed the site's 9-10px label sizes (recommended: yes, accessibility), and that the detector's "italic serif display" warning is accepted as brand voice.
