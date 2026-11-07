# Index des maquettes, phase 6

Généré par `_tools/gallery.mjs`. Ouvrir `gallery.html` (chemins relatifs). Les PNG sont régénérables (`_tools/measure.mjs`) et ne sont pas versionnés.

- Tokens : `tokens.css` (tokens réels du site + ajouts marqués NEW). Composants : `app.css`. Générateur : `_tools/build.mjs`.
- Rendus : 390x844 @2x (mobile, tiroir plein écran) et 1440x900 (tiroir 440 px sur page grisée), thèmes nuit et jour, FR (EN pour les états les plus longs).
- Mesures : `_tools/measure.mjs` écrit `_tools/measure-report.json` (voir 06-DESIGN-CONTRACT.md section 9).

## A. Demande par email (tiroir panier / sélection)

| Écran | Fichiers |
|---|---|
| Panier vide (`a-cart-empty`) | [fr night](screens/a-cart-empty.fr.night.html) · [fr day](screens/a-cart-empty.fr.day.html) |
| Panier avec photos, point d’entrée (`a-cart-list`) | [fr night](screens/a-cart-list.fr.night.html) · [fr day](screens/a-cart-list.fr.day.html) |
| Formulaire, état initial (`a-form-default`) | [fr night](screens/a-form-default.fr.night.html) · [en night](screens/a-form-default.en.night.html) · [fr day](screens/a-form-default.fr.day.html) · [en day](screens/a-form-default.en.day.html) |
| Email invalide (validation locale) (`a-form-invalid`) | [fr night](screens/a-form-invalid.fr.night.html) · [en night](screens/a-form-invalid.en.night.html) · [fr day](screens/a-form-invalid.fr.day.html) · [en day](screens/a-form-invalid.en.day.html) |
| Newsletter cochée par le visiteur (`a-form-newsletter`) | [fr night](screens/a-form-newsletter.fr.night.html) · [fr day](screens/a-form-newsletter.fr.day.html) |
| Envoi en cours (`a-form-loading`) | [fr night](screens/a-form-loading.fr.night.html) · [fr day](screens/a-form-loading.fr.day.html) |
| Succès générique (`a-success`) | [fr night](screens/a-success.fr.night.html) · [en night](screens/a-success.en.night.html) · [fr day](screens/a-success.fr.day.html) · [en day](screens/a-success.en.day.html) |
| Succès, newsletter demandée (`a-success-newsletter`) | [fr night](screens/a-success-newsletter.fr.night.html) · [fr day](screens/a-success-newsletter.fr.day.html) |
| Erreur serveur / envoi (`a-error-server`) | [fr night](screens/a-error-server.fr.night.html) · [fr day](screens/a-error-server.fr.day.html) |
| Limite de débit atteinte (`a-error-rate`) | [fr night](screens/a-error-rate.fr.night.html) · [en night](screens/a-error-rate.en.night.html) · [fr day](screens/a-error-rate.fr.day.html) · [en day](screens/a-error-rate.en.day.html) |

## B. Album privé : saisie de la clé (/mon-album)

| Écran | Fichiers |
|---|---|
| Clé : état initial (`b-key-default`) | [fr night](screens/b-key-default.fr.night.html) · [fr day](screens/b-key-default.fr.day.html) |
| Clé : vérification (`b-key-loading`) | [fr night](screens/b-key-loading.fr.night.html) · [fr day](screens/b-key-loading.fr.day.html) |
| Clé : incorrecte (essais restants) (`b-key-wrong`) | [fr night](screens/b-key-wrong.fr.night.html) · [en night](screens/b-key-wrong.en.night.html) · [fr day](screens/b-key-wrong.fr.day.html) · [en day](screens/b-key-wrong.en.day.html) |
| Clé : trop d’essais (`b-key-locked`) | [fr night](screens/b-key-locked.fr.night.html) · [en night](screens/b-key-locked.en.night.html) · [fr day](screens/b-key-locked.fr.day.html) · [en day](screens/b-key-locked.en.day.html) |

## C. Email transactionnel (600 px)

| Écran | Fichiers |
|---|---|
| Email transactionnel, 12 photos (`c-email-multi`) | [fr light](screens/c-email-multi.fr.light.html) · [fr dark](screens/c-email-multi.fr.dark.html) · [en light](screens/c-email-multi.en.light.html) · [en dark](screens/c-email-multi.en.dark.html) |
| Email transactionnel, 1 photo (`c-email-single`) | [fr light](screens/c-email-single.fr.light.html) · [fr dark](screens/c-email-single.fr.dark.html) · [en light](screens/c-email-single.en.light.html) · [en dark](screens/c-email-single.en.dark.html) |

