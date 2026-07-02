---
status: resolved
trigger: "le titre \"ghjulianu-codani\" n'est pas visible dans le mode jour"
created: 2026-07-02
updated: 2026-07-02
---

# Debug: titre-contact-portfolio-jour

## Symptoms

- **expected**: même rendu qu'en mode nuit — titre, bouton contact et bouton portfolio lisibles
- **actual**: titre gris sur fond noir (couleurs non adaptées au mode jour)
- **errors**: aucun message d'erreur signalé
- **timeline**: apparu après un commit récent
- **reproduction**: les deux — en basculant via toggle ET en chargeant directement en mode jour

## Current Focus

hypothesis: Le hero utilise des couleurs CSS variables (var(--text), var(--muted)) pour le titre et les boutons, mais ces éléments sont toujours rendus sur une photo de fond sombre. En mode jour, var(--text) devient #1a1a1a (quasi-noir), rendant le texte illisible sur le dégradé sombre hardcodé.
test: Vérification de page.tsx — hero h1, sous-titre, boutons CTA et hint de scroll
expecting: Couleurs hardcodées claires (#E8E4DC) pour tous les éléments du hero
next_action: done
reasoning_checkpoint: Le hero est toujours photographique (fond sombre). Les couleurs doivent être invariantes au mode jour/nuit pour ces éléments.

## Evidence

- timestamp: 2026-07-02T00:00:00Z
  finding: Hero h1 utilisait color var(--text) — devient #1a1a1a en mode jour, invisible sur gradient rgba(8,8,8,0.95)
  file: src/app/page.tsx:237
  
- timestamp: 2026-07-02T00:00:00Z
  finding: Sous-titre hero utilisait color var(--muted) — devient #666666 en mode jour, faible contraste sur fond sombre
  file: src/app/page.tsx:249
  
- timestamp: 2026-07-02T00:00:00Z
  finding: ctaStyle('outline') utilisait color var(--text) et var(--btn-border) — en mode jour couleur quasi noire sur fond sombre du hero
  file: src/app/page.tsx:619
  
- timestamp: 2026-07-02T00:00:00Z
  finding: Overlay gradient hero hardcodé rgba(8,8,8,0.95) non adapté au mode jour (trop sombre, text sombre dessus)
  file: src/app/page.tsx:226

## Eliminated

- Problème de ThemeProvider ou dayNightStore — fonctionne correctement, applique bien la classe .day sur html
- Problème de globals.css — variables .day correctement définies (--text: #1a1a1a, etc.)
- Problème de layout.tsx — inline script de flash prevention fonctionne correctement

## Resolution

root_cause: Le hero de la page d'accueil (section photo plein écran) utilisait des CSS variables mode-adaptatives (var(--text), var(--muted)) pour colorier le titre, le sous-titre, le hint de scroll et les boutons CTA. En mode jour, ces variables passent à des teintes sombres (#1a1a1a, #666666) qui deviennent invisibles sur le gradient sombre hardcodé de la photo de fond. Le hero étant toujours une photo sombre, tous ses textes doivent utiliser des couleurs claires fixes indépendantes du mode.
fix: "4 corrections dans src/app/page.tsx — (1) h1 hero: color '#E8E4DC' au lieu de var(--text); (2) sous-titre: color 'rgba(232,228,220,0.6)' au lieu de var(--muted); (3) ctaStyle: background '#E8E4DC'/color '#080808' (solid) et color '#E8E4DC'/border rgba(232,228,220,0.45) (outline) au lieu des variables; (4) scroll hint gradient: rgba(232,228,220,0.5) au lieu de var(--muted); (5) overlay gradient hero rendu mode-aware (légèrement plus transparent en mode jour)"
verification: tsc --noEmit — aucune erreur TypeScript
files_changed: src/app/page.tsx
