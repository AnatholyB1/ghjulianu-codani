# DEPLOY-CHECKLIST v1.1 (human / gated actions)
- [x] Resend API key (sending access, domain-restricted) -> Vercel RESEND_API_KEY prod (done 2026-11-07)
- [x] Resend domain mail.ghjulianu-codani.com verified; DNS (DKIM, rsend/send CNAME, DMARC p=none) added in Vercel DNS (done 2026-11-07). NB: real domain is ghjulianu-codani.com (hyphen), canonical host www
- [ ] (migration 000002 kpi_dashboard applied) Resend webhook (bounce/complaint) -> /api/webhooks/resend, secret RESEND_WEBHOOK_SECRET; FILTER on own sender domain
- [ ] Vercel env: RESEND_FROM, DOWNLOAD_TOKEN_SECRET, IP_HASH_SALT, NEXT_PUBLIC_SITE_URL, RESEND_WEBHOOK_SECRET
- [x] (applied 2026-11-07, verify-rls 15/15) Apply migration supabase/migrations/20261107000001_v11_email_downloads.sql to project ubxllsvanurkwkohzxau (needs user approval)
- [ ] Owner review of FR/EN privacy policy text
- [ ] Real Gmail send test (List-Unsubscribe pass-through)
- [ ] Merge to deploy branch / push: ONLY on explicit user request
- [ ] Vercel env: CRON_SECRET, LEGAL_SENDER_NAME, LEGAL_POSTAL_ADDRESS, SUPPORT_EMAIL, RESEND_WEBHOOK_SECRET; add cron (GET/POST /api/cron/purge-events with Bearer CRON_SECRET) in Vercel project settings (repo has no vercel.json)
- [ ] Resend dashboard broadcasts cannot carry per-recipient HMAC unsubscribe: use Resend's own unsubscribe placeholder (no sync handler built) — decide v1.2
- [ ] Shared Supabase project: our tables are unprefixed in public (others use gecko_/sv_/ziko_): consider a prefix in v1.2

- [x] Vercel env set 2026-11-07: DOWNLOAD_TOKEN_SECRET, IP_HASH_SALT, CRON_SECRET (sensitive, prod only), NEXT_PUBLIC_SITE_URL, RESEND_FROM, SUPPORT_EMAIL, LEGAL_SENDER_NAME
- [x] vercel.json cron (daily 03:00 UTC /api/cron/purge-events) committed on milestone/v1.1 (active only after deploy)
- [ ] STILL TO SET: LEGAL_POSTAL_ADDRESS (postal address for email footers, unknown), ADMIN_EMAILS (admin allowlist, fix batch 1), RESEND_WEBHOOK_SECRET (after webhook creation)
- [ ] Resend webhook: https://www.ghjulianu-codani.com/api/webhooks/resend, events email.bounced + email.complained only (UI froze; retry)
