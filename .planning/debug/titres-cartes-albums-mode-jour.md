---
status: resolved
trigger: "en mode jour, les titres dans les cartes albums dans la page /albums ne sont pas assez visibles"
created: "2026-07-01"
updated: "2026-07-01"
---

## Symptoms

- **Expected:** Les titres des cartes albums sont lisibles en mode jour (contraste suffisant)
- **Actual:** Les titres ne sont pas assez visibles en mode jour — problème de contraste
- **Error messages:** Aucune erreur console
- **Timeline:** Probablement lié au changement de défaut jour/nuit (plan 02-06) ou existait avant
- **Reproduction:** Aller sur /albums en mode jour — observer les titres des cartes albums

## Current Focus

hypothesis: "RESOLVED"
test: ""
expecting: ""
next_action: "none"
reasoning_checkpoint: ""

## Evidence

- timestamp: 2026-07-01
  file: src/app/albums/AlbumsDragTrack.tsx
  line: 210
  finding: "Gradient overlay hardcoded to rgba(8,8,8,0.8) — always dark regardless of mode. Title uses var(--text) which is #1a1a1a (dark) in day mode. Dark text on dark gradient = invisible."

- timestamp: 2026-07-01
  file: src/app/globals.css
  finding: "Day mode: --bg=#fafafa, --text=#1a1a1a. Night mode: --bg=#080808, --text=#E8E4DC. Gradient rgba(8,8,8,0.8) is correct only for night mode."

## Eliminated

- CSS variable mis-assignment on var(--text): eliminated — var(--text) adapts correctly; problem was gradient only.
- Opacity on title element: eliminated — no opacity applied to h2.

## Resolution

root_cause: "Line 210 of AlbumsDragTrack.tsx: the card gradient overlay was hardcoded to rgba(8,8,8,0.8) (dark) regardless of day/night mode. In day mode, var(--text) resolves to #1a1a1a (dark), producing dark text on a dark gradient scrim — near-zero contrast."
fix: "Replaced hardcoded gradient with a mode-reactive computed value (cardGradient): in day mode uses rgba(250,250,250,0.88) (light scrim matching --bg=#fafafa), in night mode retains rgba(8,8,8,0.8). Title var(--text) now always contrasts against the scrim in both modes."
verification: "Visual check: /albums in day mode — titles readable against light scrim. Night mode unchanged."
files_changed:
  - src/app/albums/AlbumsDragTrack.tsx
