# DEPLOY-CHECKLIST v1.1 (human / gated actions)
- [ ] Resend account + API key -> RESEND_API_KEY in Vercel (via CLI stdin, never in chat)
- [ ] Resend domain mail.ghjulianucodani.com verified (SPF/DKIM/DMARC records; emailed code = human)
- [ ] Resend webhook (bounce/complaint) -> /api/webhooks/resend, secret RESEND_WEBHOOK_SECRET; FILTER on own sender domain
- [ ] Vercel env: RESEND_FROM, DOWNLOAD_TOKEN_SECRET, IP_HASH_SALT, NEXT_PUBLIC_SITE_URL, RESEND_WEBHOOK_SECRET
- [x] (applied 2026-11-07, verify-rls 15/15) Apply migration supabase/migrations/20261107000001_v11_email_downloads.sql to project ubxllsvanurkwkohzxau (needs user approval)
- [ ] Owner review of FR/EN privacy policy text
- [ ] Real Gmail send test (List-Unsubscribe pass-through)
- [ ] Merge to deploy branch / push: ONLY on explicit user request
