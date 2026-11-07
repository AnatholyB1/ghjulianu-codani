# Requirements — v1.1 Téléchargement par email, newsletter & KPIs admin

(v1.0 archived in `.planning/milestones/v1.0-REQUIREMENTS.md`)

## v1 Requirements

### Fondations (FND)
- [ ] **FND-01**: Le visiteur peut lire une politique de confidentialité FR/EN à jour (finalités, durées de conservation, sous-traitants Resend/Supabase/Vercel, droits RGPD)
- [ ] **FND-02**: L'admin peut envoyer des emails depuis un domaine vérifié (SPF/DKIM/DMARC) sans envoi réel depuis les previews
- [ ] **FND-03**: Les données email, jetons et événements sont inaccessibles au public (RLS sans politique, accès serveur uniquement)

### Demande de téléchargement (REQ)
- [ ] **REQ-01**: Le visiteur peut demander ses photos sélectionnées en saisissant son email
- [ ] **REQ-02**: Le visiteur peut cocher une case newsletter facultative, décochée par défaut, sans que le téléchargement en dépende
- [ ] **REQ-03**: Le visiteur reçoit un email (FR/EN) avec un lien expirant (48 h, 3 utilisations)
- [ ] **REQ-04**: Le formulaire résiste aux abus (champ piège, limitation par IP et par email, réponse générique)
- [ ] **REQ-05**: Le visiteur d'un album privé saisit sa clé d'accès, vérifiée côté serveur avec limitation des essais, puis suit le même flux email

### Livraison (DLV)
- [ ] **DLV-01**: Le visiteur ouvre le lien et voit une page d'accueil (vignettes, états expiré/épuisé) sans consommer d'utilisation
- [ ] **DLV-02**: Le visiteur peut télécharger une photo seule ou toutes en un ZIP streamé, sans bloquer le serveur
- [ ] **DLV-03**: Les fichiers livrés restent légers (WebP déjà optimisé, ZIP en mode « store », plafond de taille avec découpage en parties)
- [ ] **DLV-04**: Chaque utilisation de lien est comptée de façon atomique et enregistrée avec le volume transféré

### Suppression de l'ancien système et protection UI (PRT)
- [ ] **PRT-01**: Tout ancien téléchargement direct (panier, ZIP navigateur, sélecteur de dossier) est supprimé, `jszip` désinstallé
- [ ] **PRT-02**: Le clic droit, le glisser-déposer et l'appui long sont bloqués sur les images publiques seulement (pas sur les champs, sans casser la lightbox), testé iOS/Android
- [ ] **PRT-03**: Une fonction unique choisit la source des fichiers, pour brancher des originaux privés en v1.2

### Newsletter (NWS)
- [ ] **NWS-01**: L'abonné confirme son inscription par un email de double opt-in (confirmation par bouton POST)
- [ ] **NWS-02**: L'abonné peut se désinscrire en un clic (lien signé + en-têtes `List-Unsubscribe`)
- [ ] **NWS-03**: Les rebonds et plaintes Resend suppriment automatiquement l'adresse (webhook signé)
- [ ] **NWS-04**: L'admin peut voir, filtrer et supprimer les abonnés (droit à l'effacement)
- [ ] **NWS-05**: L'admin peut exporter les abonnés confirmés en CSV (protégé contre l'injection de formules, accents corrects dans Excel)

### KPIs admin (KPI)
- [ ] **KPI-01**: L'admin voit le nombre de téléchargements et de vues avec sélecteur de période et variation
- [ ] **KPI-02**: L'admin voit les photos préférées (ajouts à la sélection) et les plus téléchargées
- [ ] **KPI-03**: Les vues sont comptées côté client après affichage réel, dédoublonnées par session et jour, robots filtrés, sans cookie ni IP brute
- [ ] **KPI-04**: L'admin voit le tunnel (vue → demande → lien ouvert → téléchargé) et le taux d'inscription newsletter
- [ ] **KPI-05**: L'admin voit les albums les plus consultés/téléchargés, la répartition jour/nuit et les appareils
- [ ] **KPI-06**: L'admin voit la bande passante estimée et la croissance des abonnés
- [ ] **KPI-07**: Les événements bruts sont purgés après environ 13 mois, les agrégats conservés

## Future Requirements
Éditeur d'envoi dans l'admin, originaux privés et plusieurs résolutions, cache de ZIP pré-construit, CAPTCHA, synchronisation Resend Audience, digest hebdomadaire.

## Out of Scope
- Filigrane — écarté par le propriétaire (protection UI seulement)
- DRM / protection serveur des fichiers — buckets publics en v1.1, originaux privés en v1.2
- Comptes visiteurs — inutiles pour le flux par email
- Outil d'analytics tiers — événements first-party sans cookie

## Traceability
(filled by roadmap)
