---
status: resolved
trigger: "le bouton 'tout' dans la page /albums n'est pas accessible en mode jour"
created: "2026-07-01"
updated: "2026-07-01"
---

## Symptoms

- **Expected:** Le bouton "tout" (filtre catégorie) est lisible et cliquable en mode jour
- **Actual:** Le bouton affiche un bloc noir — le texte est invisible/illisible
- **Error messages:** Aucune erreur console signalée
- **Timeline:** Inconnu — peut avoir existé avant ou après le passage au mode jour par défaut (plan 02-06)
- **Reproduction:** Aller sur /albums en mode jour — le bouton "tout" apparaît comme un bloc noir sans texte lisible

## Current Focus

hypothesis: "ROOT CAUSE CONFIRMED"
test: "Inspecté AlbumsDragTrack.tsx ligne 150"
expecting: "Bug dans la couleur de texte du bouton actif en day mode"
next_action: "fix applied"
reasoning_checkpoint: "En day mode, --text vaut #1a1a1a (quasi-noir). Le bouton actif (cat === 'all') a background: var(--text) (fond noir) et color: '#080808' (texte quasi-noir) — les deux sont noirs, donc texte invisible."

## Evidence

- timestamp: 2026-07-01T00:00:00Z
  file: src/app/albums/AlbumsDragTrack.tsx
  line: 150
  note: "Bouton 'tout' actif — background: cat === 'all' ? 'var(--text)' : 'transparent', color: cat === 'all' ? '#080808' : 'var(--muted)'. En day mode var(--text)=#1a1a1a (fond sombre), texte codé #080808 (quasi-noir). Fond et texte sont tous les deux noirs."

- timestamp: 2026-07-01T00:00:01Z
  file: src/app/globals.css
  line: 48
  note: ".day { --text: #1a1a1a } — en night mode --text=#E8E4DC (crème clair). La couleur fixe #080808 pour le texte du bouton actif était conçue pour le mode nuit (fond clair sur fond sombre). En day mode le fond devient #1a1a1a et le texte #080808 — deux noirs."

- timestamp: 2026-07-01T00:00:02Z
  file: src/app/globals.css
  line: 24-29
  note: "Night mode (défaut) : --bg=#080808, --text=#E8E4DC. Le bouton actif avait fond=#E8E4DC (crème) et texte=#080808 (noir) — contraste excellent. En day mode : fond=#1a1a1a, texte=#080808 — contraste quasi-nul."

## Eliminated

- Problème de store Zustand : non, le store et le hook fonctionnent correctement
- Problème de classe CSS .day non appliquée : non, src/lib/theme.ts applique bien la classe sur document.documentElement
- Problème sur les autres boutons de catégories : même bug, même code ligne 159

## Resolution

root_cause: "Le texte du bouton actif est codé en dur à '#080808' (noir) alors que le fond actif est 'var(--text)' qui vaut '#1a1a1a' en day mode — les deux couleurs sont quasi-identiques, rendant le texte invisible."
fix: "Remplacer color: '#080808' par color: 'var(--bg)' pour les boutons actifs — en day mode --bg=#fafafa (blanc cassé, contraste excellent sur #1a1a1a), en night mode --bg=#080808 (noir sur crème, contraste inchangé)."
verification: "Tester en mode jour et nuit : bouton actif doit être lisible dans les deux modes."
files_changed: ["src/app/albums/AlbumsDragTrack.tsx"]
