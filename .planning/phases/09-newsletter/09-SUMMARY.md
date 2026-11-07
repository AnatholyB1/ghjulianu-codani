# Phase 9 Newsletter - Summary

Branch `phase/09-newsletter`. Verified against the real Supabase project (migration applied by the orchestrator), own `next build && next start -p 3107`, mail guarded (no Resend call).

## Requirement -> evidence
| Req | Implementation | Evidence |
|---|---|---|
| NWS-01 | `enqueueConfirmation`, `ConfirmSubscriptionEmail`, `/newsletter/confirmer` + `confirmAction` | e2e (4 profiles): GET x3 leaves `pending`; POST -> `confirmed` + `confirmed_at`, consent_at kept; replay = already; expired/unknown/missing = same copy without address; hook script: pending row + sha256 hash + 48.00 h, token rotation, suppressed never re-enabled, FR/EN html+text render, no unsubscribe link |
| NWS-02 | `/newsletter/desinscription`, `POST /api/newsletter/unsubscribe`, `listUnsubscribeHeaders`, `NewsletterFooter` | e2e: GET leaves confirmed; POST -> `unsubscribed` + `unsubscribed_at`; replay = already; tampered sig -> invalid page / 400; one-click POST (no cookie/CSRF) -> 200 + unsubscribed, GET -> 303 no change; never downgrades `suppressed`. Unit: HMAC tamper cases |
| NWS-03 | `/api/webhooks/resend`, `lib/newsletter/svix.ts` | e2e: bad/wrong/stale/missing signature -> 401; signed hard bounce and complaint -> `suppressed` with reason; replay 0 rows changed; foreign sender domain, Transient bounce, other event types, unknown recipient -> 200 no effect. Unit: 8 signature/filter checks |
| NWS-04 | `/admin/newsletter`, `SubscriberTable`, `deleteSubscriber` | Build ok; unauthenticated redirect to login (e2e); erasure query sequence executed on the real schema (subscriber + download_request + event gone); admin UI itself NOT driven (see below) |
| NWS-05 | `/admin/newsletter/export`, `lib/newsletter/csv.ts` | Unit: BOM bytes EF BB BF, 6 columns, `;`, CRLF, `=cmd\|x`/`+`/`-`/`@`/TAB/CR prefixed, accents, quotes/semicolons, Paris-day filename. Unauthenticated export returns no CSV (e2e). Route with a session NOT run |

## Gate
`npx tsc --noEmit` green; `npm run build` green under the machine lock (one transient next/font/google fetch failure, rebuilt ok); eslint on all phase files 0 errors (baseline 35 elsewhere untouched). `node --conditions=react-server scripts/test-newsletter-units.mjs`: 20 checks. `scripts/e2e-newsletter.mjs`: ALL PASSED (desktop 1440x900 + iPhone 14, night + day; per page: no horizontal overflow, no text under 14px, tap targets >= 44px; test rows on example.org deleted afterwards, verified 0 left). Screenshots in `.planning/phases/09-newsletter/evidence/` (not committed; some captured mid fade-in animation).

## NOT proven
- Admin UI with a real admin session (list, filters, search, inline delete, toast, mobile stacked layout, CSV download via route): no admin credentials; creating an auth user in the shared project was avoided. `deleteSubscriber` and the export route are only covered indirectly (same queries, unit CSV).
- Contrast (AC-A4) not measured on the implemented pages; keyboard-only and screen-reader runs not done.
- No real email: Resend call path, SPF/DKIM, Gmail/Outlook/Apple rendering, dark mode in clients, List-Unsubscribe button in Gmail not tested.
- Real Resend webhook delivery (payload shape taken from the installed SDK types and the bounce.type values Permanent/Transient/Undetermined).
- `src/lib/i18n.ts` not extended (deviation, see CONTEXT).
- Gap to decide: newsletters are sent from the Resend dashboard (D-03), which cannot embed a per-recipient HMAC unsubscribe link or custom headers. `NewsletterFooter`/`listUnsubscribeHeaders` serve any in-app sender; for dashboard broadcasts use Resend's own unsubscribe placeholder and add a webhook handler for `contact.updated` if wanted.

## Human items
Create the Resend webhook (URL `<site>/api/webhooks/resend`, events email.bounced + email.complained) and set `RESEND_WEBHOOK_SECRET`; set `LEGAL_SENDER_NAME`, `LEGAL_POSTAL_ADDRESS`, `RESEND_FROM`; send a real test newsletter to Gmail and check the native Unsubscribe button; review consent wording.

## Likely merge conflicts
`src/app/admin/layout.tsx`, `src/components/SiteShell.tsx`, `src/components/ThemeProvider.tsx`, `src/lib/server/email/layout.tsx`, `.env.example`, `package.json` (untouched here).
