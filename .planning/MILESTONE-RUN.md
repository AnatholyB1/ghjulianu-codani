# MILESTONE-RUN v1.1 (flat mode, no workstream)
Integration: branch milestone/v1.1, worktree .claude/worktrees/integration-v1.1 (base dev 149168c)
Gate: npx tsc --noEmit + npm run lint + npm run build (machine lock: mkdir C:/ghjulianu-codani/.planning/.machine-lock)
Decisions: .planning/phases/MILESTONE-v1.1-DECISIONS.md (discuss lane resolved by recommendations; user delegated)

## Log
- 2026-11-07 wave plan approved. Wave A: P5, P8a, design contracts P6/P7/P9/P10.
- Gate baseline (dev, pre-v1.1): `npm run lint` = 55 errors / 9 warnings in pre-existing files (React-compiler rules: politique-de-confidentialite 20, mentions-legales 13, broadcastChannel 4, DayNightToggle 4, ...). Lint gate = NO NEW errors vs this baseline (new/edited files must be 0 errors). tsc and build must be green.
- P8a merged (phase/08a-image-protection, e2e 52/52, real iOS long-press not proven). Design contracts P10, P6, P7 done (branches design/10-contract, design/06-contract, design/07-contract); P9 design pending. Schema amendments sent to P5: confirmed_at, events_daily rollup, view-dedupe fix, 15-min download session window.
- P5 merged (5ad3160). Migration 20261107000001 validated on throwaway local PG18: applies clean; rate_limit_hit, consume_download_use (15-min sessions, 3 max, expiry/revoke), view dedupe (photo + album level), purge->events_daily, RLS (anon/authenticated denied, service_role ok). NOT yet applied to Supabase (awaiting user approval).
- Wave B launched: P6 (a0f6472b), P7 (adabfd95), P9 (a5b42728), P10 (a945d2ae). Design contracts validated by user (white drawer in day mode, private-album thumbnails on landing page accepted).
- 2026-11-07 GATE PASSED (user approved): migration 20261107000001 applied to Supabase project ubxllsvanurkwkohzxau (portfolio, shared with gecko/sellerie/ziko apps; PG17). Verified: RLS on, no anon/authenticated grants; scripts/verify-rls.mjs 15/15 (anon denied, HTTP 401). Builders told to run full e2e.
- P9 merged (newsletter), P10 merged (KPI). tsc green after both merges.
- 2026-11-07 GATE PASSED (user approved): migration 20261107000002_v11_kpi_views.sql (kpi_dashboard, read-only) applied; anon/authenticated cannot execute (401), service_role can; returns zeros on empty data.
- Audits running: P5 (a78a357c), P8a (a96ebb86), P9 (a9fe7aac). Builders running: P6, P7. TODO: real /admin/stats + /admin/newsletter test in Chrome with user's signed-in session; then P8b after P6+P7.
- P6 merged (94d8c22, e2e 114/114 on real Supabase). Audits P5/P8a/P9 done: fix batch 1 launched (agent a0dac86e): admin allowlist (HIGH), salt fail-closed, re-subscribe consent, image-protection link compromise, env naming, newsletter hook wiring, retention purges.
- Prod ops (user explicitly authorized 2026-11-07): Resend domain mail.ghjulianu-codani.com created + DNS records in Vercel DNS (DKIM TXT, 2 CNAME rsend/send, DMARC p=none) -> VERIFIED; Resend API key "ghjulianu-codani" (sending access, domain-restricted) saved to Vercel RESEND_API_KEY (prod only, secret, pasted via clipboard, never read). Vercel env set: DOWNLOAD_TOKEN_SECRET, IP_HASH_SALT, CRON_SECRET (sensitive, prod), NEXT_PUBLIC_SITE_URL=https://www.ghjulianu-codani.com, RESEND_FROM, SUPPORT_EMAIL, LEGAL_SENDER_NAME. vercel.json cron added (daily 03:00 UTC purge). NOT deployed (no push/redeploy).
- Resend webhook creation in UI: renderer freezes after option click; pending (needs events email.bounced + email.complained, URL https://www.ghjulianu-codani.com/api/webhooks/resend), then signing secret -> Vercel RESEND_WEBHOOK_SECRET via clipboard.
