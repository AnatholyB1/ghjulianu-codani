# Photo Portfolio Application

## Current Milestone: v1.1 Téléchargement par email, newsletter & KPIs admin

**Goal:** Remplacer les téléchargements directs par un flux consenti (email + lien signé) qui alimente une newsletter, protéger l'affichage public côté UI, et ajouter un tableau de bord de KPIs dans l'admin.

**Target features:**
- Blocage UI des téléchargements non consentis (clic droit, drag, appui long) sur les images publiques
- Suppression du téléchargement direct (panier, ZIP, sélecteur de dossier) au profit d'un flux email : email + consentement newsletter -> lien signé expirant envoyé via Resend
- Albums privés : sélection par clé d'accès, téléchargement via le même flux email
- Newsletter : emails stockés dans Supabase (consentement horodaté, désinscription, export CSV), envoi via Resend
- Images livrées optimisées (recompression, dimensions raisonnables, ZIP en streaming/cache, limitation de débit)
- KPIs admin : téléchargements, vues, photos préférées + KPIs complémentaires (conversion email, albums top, jour/nuit, appareils, bande passante)

**Decisions:** protection = blocage UI uniquement (pas de filigrane) ; livraison = lien par email ; stockage = Supabase + Resend ; phase numbering continue from Phase 5.

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

*Last updated: 2026-11-07 — milestone v1.1 started*