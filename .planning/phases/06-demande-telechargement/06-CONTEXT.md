# Phase 6 - Demande de telechargement par email - Context (decisions applied)

Applied from MILESTONE-v1.1-DECISIONS.md: D-01, D-02 (pending only, hook for P9), D-07 (48 h, 3 uses; P7 amendment: a use = 15 min session), D-09, D-10, D-12, D-13. UI follows the validated `design/06-DESIGN-CONTRACT.md` (day-mode white drawer and new tokens approved).

## Server
- `src/app/telechargement/actions.ts`: `requestDownload` + `issueFormToken`. Order: honeypot -> signed render timestamp (>= 2 s) -> per hashed-IP limit (8/h, visible `rate_limited`) -> email validation -> per hashed-email limit (3/h, silent generic success) -> photo ids resolved FROM THE DB (album_photos / portfolio_photos, cap 200, client URLs never read) -> private-album cookie check -> insert `download_requests` (token hash only) -> optional pending subscriber (consent version + time) + `enqueueConfirmation` hook -> React Email send (guarded D-13) -> `email_status` update -> `request` event. Generic success is padded to >= 900 ms so honeypot / throttled / real paths are not distinguishable by timing.
- Deviation from the contract's 4 result codes: additive `album_locked` (private album cookie missing or expired; reveals nothing about any email). Expired render token returns `server_error`.
- Order tweak: the IP limiter runs before email validation, the email limiter after (it needs a valid address).
- `src/lib/server/requestGuards.ts`: pure helpers (email normalise/validate, photo-ref parsing, HMAC form token, HMAC album access cookie, constant-time compare, LIMITS). Unit tested.
- `src/lib/server/newsletterHook.ts`: `enqueueConfirmation(email, lang)` stub that phase 9 fills. Phase 6 sends no marketing.
- `src/lib/server/email/templates/DownloadLinkEmail.tsx`: FR/EN, 600 px, light + dark (`prefers-color-scheme`), plain-text part, no remote images, footer with privacy link and optional `LEGAL_POSTAL_ADDRESS` (LCEN; `PUBLISHER_ADDRESS` = deprecated alias). Does not contain the recipient address.
- `POST /api/select-add`: fire-and-forget `select_add` event (uuid-validated, 120/min/IP, always 204). A route instead of a server action so it can never queue in front of `requestDownload`.

## Private albums (REQ-05)
- `src/app/mon-album/actions.ts` `unlockAlbum(key, slug?)`: key in the POST body only; limit 5 attempts / 15 min per hashed IP + album (`*` when the album is unknown) plus 20 / 15 min per IP overall; over the limit the key is NOT verified; compares against every candidate with SHA-256 + `timingSafeEqual` (no early exit); same error for unknown and wrong key.
- Cookie `album-access-<slug>`: `<exp>.<HMAC(slug, sha256(key)[:16], exp)>`, httpOnly, sameSite lax, secure in production, path `/`, 24 h. Bound to the album's CURRENT key, so regenerating the key in admin revokes it. Legacy raw-key cookies are rejected.
- Removed the unlimited `verifyAlbumKey` / `findAlbumByKey` server actions from `src/app/admin/actions.ts` (each exported server action is a public endpoint, so they were a brute-force bypass). Admin key generation / display / regeneration untouched.

## Client
- `CartContext` v2: `photoId`, `albumId`, `source`; storage `photo-cart-v2`; old `photo-cart` removed; malformed items dropped. `id` = `photoId`. `add()` fires the `select_add` beacon.
- Producers updated: `AlbumPageClient` (PhotoCard + lightbox photos) and `Lightbox`. Portfolio lightbox passes `showCart={false}` and has no DB ids, so it adds nothing.
- `CartDrawer` rewritten around the contract (dialog semantics, focus trap, Escape, focus return, `inert` when closed). Primary path = "RECEVOIR PAR EMAIL" -> `RequestStep`. The OLD direct download and donation modal are kept, marked `LEGACY`, reachable through a secondary ghost button (phase 8b removes them).
- Copy lives in `src/lib/requestCopy.ts` (not `i18n.ts`) and consent wording in `src/lib/consentCopy.ts` (client-safe). `src/lib/server/consent.ts` now builds `CONSENT_TEXT` from those strings, so the displayed text is the stored proof text (version stays `v1`; never shipped before).
- Tokens appended at the END of `globals.css` (`:root` + `.day`); component CSS in `src/components/cart/request.css` (`rq-` prefix).
