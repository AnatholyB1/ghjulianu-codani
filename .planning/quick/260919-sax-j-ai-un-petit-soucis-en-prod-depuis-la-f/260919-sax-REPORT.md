# Diagnostic — Uploads d'album lents / échouent depuis fin août

## 1. Résumé

Les correctifs récemment déployés (le lot de commits `8a1a6f6`, `d8267ee`, `3969ff2`, `d4ee7ba`,
`f9c303d` — thème jour/nuit, layout albums en deux rangées, transition typewriter) **ne
concernent en rien l'import ou le chargement des images**. Pire : l'un de ces commits,
`d4ee7ba` ("feat(hotfix): theme scoped to portfolio, albums two-row layout, quality & UX
fixes", 2 juillet 2026), est **la cause directe** de l'échec d'import des miniatures d'album.
Son propre message de commit l'annonce explicitement : *"Image uploads skip all compression —
original quality preserved."* Il n'existe dans l'historique du dépôt aucun correctif antérieur
ciblant l'upload, la compression ou le chargement des images. Réponse directe à la question
"est-ce que nos solutions appliquées marchent correctement ?" : **non, elles ne traitent pas ce
problème** — elles concernent le thème et la mise en page, pas la performance des uploads.

Deux correctifs à faible risque ont été appliqués dans ce plan (voir section 6). Un troisième
symptôme (chargement des images publiques) reste partiellement non résolu et nécessite une
intervention supplémentaire décrite en section 5.

---

## 2. Symptôme 1 — "L'import des miniatures d'album ne marche pas"

**Root Cause A : la compression a été retirée du composant `ImageUploadField.tsx`.**

- **Fichier concerné :** `src/app/admin/_components/ImageUploadField.tsx`
- **Commit fautif :** `d4ee7ba43c7e9917238d1139ec63b3e7c5721213` (2 juillet 2026)
- **Preuve (diff du commit) :**
  ```diff
  -import { compressImage, getBucketPreset, formatSize } from '@/lib/compressImage';
  ...
  -        const compressed = await compressImage(file, getBucketPreset(bucket));
  -        const pub = await uploadFile(bucket, compressed.file);
  +        const pub = await uploadFile(bucket, file);
  ```
  Le commit retire l'import de `compressImage`/`getBucketPreset`/`formatSize`, l'état `savings`,
  et surtout remplace l'upload du fichier compressé par l'upload du **fichier original brut**
  choisi par le photographe.
- **Usage impacté :** ce composant sert le champ "MINIATURE (COVER)" (`bucket="album-covers"`)
  et "PHOTO DE FOND" (`bucket="album-backgrounds"`) dans
  `src/app/admin/albums/[id]/page.tsx` (lignes 82-87).
- **Pourquoi ça échoue :** `next.config.ts` (lignes 6-9) fixe
  `experimental.serverActions.bodySizeLimit: '10mb'`. Les photos modernes (appareil photo/
  smartphone) pèsent couramment 5 à 20+ Mo, parfois au format HEIC. Toute photo de couverture ou
  de fond au-dessus de 10 Mo fait échouer la Server Action au niveau du transport, **avant même
  d'atteindre la logique métier**. L'erreur remontée à l'admin est le message générique de
  `ImageUploadField.tsx` ligne ~42 : *"Échec de l'upload. Vérifiez le bucket Supabase."* — un
  message trompeur qui pointe vers une mauvaise piste (config Supabase) alors que la vraie cause
  est la taille du fichier.
- **Pourquoi seules les miniatures/fonds sont touchés, pas les photos de galerie en masse :**
  `src/app/admin/_components/MultiImageUpload.tsx` (upload en masse de photos de galerie
  d'album/portfolio) appelle toujours `compressImage(item.file, preset)` avant l'upload — ce
  fichier n'a jamais été modifié par `d4ee7ba`. C'est cette asymétrie qui explique pourquoi le
  symptôme touche spécifiquement les miniatures/fonds et pas l'ajout de photos en masse.

**Statut : CORRIGÉ dans ce plan (Tâche 1).** Voir section 6.

---

## 3. Symptôme 2 — "L'import des images est long"

**Root Cause C : la boucle d'upload en masse est entièrement séquentielle.**

- **Fichier concerné :** `src/app/admin/_components/MultiImageUpload.tsx`, fonction
  `handleUploadAll()`.
- **Preuve (avant correctif) :** la fonction utilisait `for (const item of pending) { ... await
  compressImage(...); ... await uploadFile(...); ... }` — chaque photo attendait la fin complète
  (compression canvas côté client + aller-retour réseau vers la Server Action) de la précédente
  avant de démarrer.
- **Impact :** pour un album de 30 à 100+ photos, le temps total croît linéairement avec le
  nombre de photos. C'est le mécanisme exact derrière "l'import des images est long".
- **Nuance importante :** contrairement au Symptôme 1, ceci **n'est pas une régression** — ce
  comportement séquentiel existait avant `d4ee7ba` et n'a jamais été touché par les commits
  récents. C'est un problème de performance latent, pas une casse récente.

**Statut : CORRIGÉ dans ce plan (Tâche 2).** Voir section 6.

---

## 4. Symptôme 3 — "Le chargement des images semble long"

**Root Cause B : les miniatures/fonds d'album contournent l'optimisation d'images de Next.js.**

- **Fichiers concernés :**
  - `src/app/albums/AlbumsDragTrack.tsx`, ligne 285 : rendu de `album.cover_url` dans une balise
    `<img>` brute (`eslint-disable-next-line @next/next/no-img-element` juste au-dessus, ligne
    284), pas via `next/image`.
  - `src/app/albums/[slug]/AlbumPageClient.tsx`, ligne 554 : même schéma pour le fond de héros
    (`album.background_url ?? album.cover_url`), avec un second `<img>` similaire ligne 404.
- **Preuve de la configuration inutilisée :** `next.config.ts` configure déjà AVIF/WebP
  (`formats`), des `deviceSizes`/`imageSizes` détaillés, et un `remotePatterns` pour le bucket
  Supabase — mais rien de tout cela ne s'applique tant que ces deux composants utilisent `<img>`
  au lieu de `next/image`.
- **Aggravation par le Symptôme 1 :** depuis `d4ee7ba`, les couvertures/fonds nouvellement
  uploadés étaient en plus **non compressés** (originaux bruts) — donc le public recevait des
  images potentiellement énormes, servies sans aucune optimisation Next.js. Combinaison des deux
  causes = la page `/albums` et les pages de détail d'album chargent des originaux non optimisés
  en taille réelle.
- **Ce que la Tâche 1 corrige, et ce qu'elle ne corrige pas :** la Tâche 1 restaure la
  compression pour les **nouveaux** uploads de couverture/fond (donc les futures images seront
  déjà réduites en poids). Mais elle ne change rien pour :
  1. les couvertures/fonds **déjà en production**, uploadés en taille originale depuis le 2
     juillet — ils resteront lourds tant qu'ils ne sont pas ré-uploadés manuellement ;
  2. le contournement de `next/image` (Root Cause B lui-même), qui reste entier même pour des
     fichiers déjà compressés — une image de 300 Ko servie en `<img>` brut n'a toujours ni
     AVIF/WebP automatique, ni `srcset` responsive, ni lazy-loading natif optimisé par Next.js.

**Statut : PARTIELLEMENT adressé (compression future via Tâche 1) — non corrigé pour le
contournement `next/image` ni pour les images déjà en production.** Voir recommandations (a) et
(d) en section 5.

---

## 5. Solutions restantes recommandées (non appliquées ici)

Classées par priorité décroissante :

**(a) Convertir les deux `<img>` en `next/image`** — *priorité haute, non appliqué automatiquement*
`AlbumsDragTrack.tsx` (ligne 285) et `AlbumPageClient.tsx` (lignes 404 et 554) devraient utiliser
`next/image` avec `sizes`/`fill` explicites pour bénéficier d'AVIF/WebP, du `srcset` responsive
et du cache CDN de 30 jours déjà configurés dans `next.config.ts`. **Non appliqué dans ce plan**
car `AlbumsDragTrack.tsx` utilise un carrousel à défilement par transformation CSS dont le
dimensionnement dépend de mesures DOM précises (`getBoundingClientRect`/transform) — un
changement de balise `<img>` vers `<Image fill>` peut casser le layout drag sans QA visuelle
manuelle. De plus, le placeholder de secours `https://picsum.photos/seed/...` utilisé dans ces
deux fichiers n'est pas dans `remotePatterns` de `next.config.ts` : soit il faut l'y ajouter,
soit remplacer ce placeholder par un asset statique local avant de basculer vers `next/image`
(sinon `next/image` lèvera une erreur de configuration au premier rendu du fallback).

**(b) Ajouter un garde-fou de taille côté serveur dans `uploadFile()`** — *priorité moyenne*
`src/app/admin/actions.ts` (ligne 252, fonction `uploadFile`) ne fait aujourd'hui aucune
vérification de taille avant d'appeler `supabase.storage.from(bucket).upload(...)`. Ajouter une
vérification explicite (`if (file.size > MAX_BYTES) throw new Error('Fichier trop volumineux
(max 10 Mo)')`) avant l'appel Supabase permettrait de transformer un futur dépassement de la
limite `serverActions.bodySizeLimit` en message clair et actionnable côté admin, au lieu du
message générique actuel de `ImageUploadField.tsx`. Non appliqué ici car cela touche une action
serveur partagée par plusieurs points d'upload — jugé hors du périmètre volontairement restreint
de ce diagnostic (deux fichiers, correctifs ciblés).

**(c) Rejeter ou convertir les fichiers HEIC côté client avant compression** — *priorité moyenne*
`compressImage()` (`src/lib/compressImage.ts`) utilise l'API Canvas via `new Image()`, qui ne
sait pas décoder le format HEIC dans Chrome/Firefox. Les photos iPhone étant fréquemment en HEIC
par défaut, un fichier HEIC provoquera aujourd'hui un échec silencieux ou un message d'erreur peu
clair ("Impossible de lire l'image"/"Compression échouée") sans indiquer à l'admin que le format
du fichier est en cause. Ajouter une détection de type MIME (`file.type === 'image/heic' ||
file.type === 'image/heif'`) avec un message explicite ("Format HEIC non supporté, convertissez
en JPEG") éviterait la confusion. Non appliqué ici, car cela introduit une nouvelle branche de
validation UX qui mérite sa propre vérification (messages, tests avec un vrai fichier HEIC).

**(d) Backfill ponctuel des couvertures/fonds déjà en production** — *priorité basse mais à ne
pas oublier* La Tâche 1 ne corrige que les **futurs** uploads. Toutes les couvertures/fonds
d'album uploadés entre le 2 juillet (commit `d4ee7ba`) et l'application de ce correctif restent
des fichiers non compressés en base. Un script serveur ponctuel (ex. via `sharp`, exécuté une
fois en admin/CLI) qui relit chaque `album.cover_url`/`album.background_url`, re-compresse via la
même logique que `compressImage`/`getBucketPreset`, et réécrit le fichier dans le bucket Supabase
correspondant, permettrait de rattraper l'existant sans attendre que chaque admin ré-uploade
manuellement. Non appliqué dans ce plan (nécessite un script serveur hors périmètre des deux
fichiers ciblés et un accès direct au bucket avec `sharp`, une dépendance non encore présente
dans le projet).

---

## 6. Fixes appliqués dans ce plan

**Tâche 1 — Restauration de la compression sur les uploads de couverture/fond d'album**
Fichier : `src/app/admin/_components/ImageUploadField.tsx`
`handleFile()` compresse maintenant le fichier via `compressImage(file, getBucketPreset(bucket))`
avant d'appeler `uploadFile(bucket, compressed.file)`, exactement comme avant le commit `d4ee7ba`.
Le label de gain de compression ("-X%") est réaffiché dans le JSX. Annule précisément la
régression introduite par `d4ee7ba` pour ce fichier, sans toucher au thème/layout/UX de ce même
commit.

**Tâche 2 — Parallélisation de l'upload de photos de galerie en masse**
Fichier : `src/app/admin/_components/MultiImageUpload.tsx`
`handleUploadAll()` traite désormais `pending` par lots de 3 éléments en concurrence
(`Promise.all` par lot) au lieu d'une boucle séquentielle `for`. La logique par élément
(compression → upload → transitions d'état `compressing`/`uploading`/`done`/`error`) a été
extraite dans une fonction locale `processItem(item)`, sans changement de comportement par
élément — seul l'ordonnancement change.

Ces deux correctifs sont indépendants, chacun limité à un seul fichier, et ne modifient aucun
comportement issu des commits récents de thème/UX (`8a1a6f6`, `d8267ee`, `3969ff2`, `d4ee7ba`,
`f9c303d`).
