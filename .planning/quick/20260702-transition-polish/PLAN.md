---
slug: transition-polish
date: 2026-07-02
status: in-progress
---

# Transition Polish — Day/Night UX

## Goal
Fluidifier les transitions jour/nuit, enrichir le wording modal et ajouter un overlay texte typewriter pendant les transitions vidéo. Garder navbar et footer visibles (Option C).

## Changes

### 1. VideoTransitionOverlay.tsx
- `top: var(--navbar-h)` → vidéo sous la navbar (Option C)
- Fade-in 600ms `cubic-bezier(0.4,0,0.2,1)` au lieu d'instantané
- Fade-out 600ms au lieu de 300ms
- Prop `message?: string` → texte typewriter centré sur la vidéo
- Typewriter démarre 400ms après fade-in, ~45ms/char

### 2. DayNightToggle.tsx
- Passer `message` à VideoTransitionOverlay
- Day→Night : "Passage en mode nuit — Retrouvez le nightlife dans Portfolio et Albums"
- Night→Day : "Passage en mode jour — Retrouvez les shootings dans Portfolio et Albums"

### 3. WelcomeModal.tsx
- Headline : "Choisissez votre expérience"
- Desc JOUR : shooting personnel, marques — visible dans Portfolio et Albums
- Desc NUIT : nightlife, événementiel — visible dans Portfolio et Albums
- Sous chaque bouton : courte ligne de contexte
