# Phase 5 Foundations - Summary

Branch `phase/05-foundations`. Requirements FND-01, FND-02, FND-03 implemented in code; DB/DNS parts need the orchestrator/owner.

## Delivered
Migration file + schema.sql mirror, server libs, admin test-email route, `.env.example`, FR/EN privacy page, `scripts/verify-rls.mjs`. Screenshots (not in git): `.planning/phases/05-foundations/evidence/privacy-{desktop,mobile}-{fr,en}.png`; no horizontal overflow at 1440 and 390 (scrollWidth equals viewport).

## FND-03 SQL review note (static review, migration NOT executed anywhere)
| Table | RLS | Policies | anon/authenticated/PUBLIC | service_role |
|---|---|---|---|---|
| subscribers | enabled | none | REVOKE ALL | ALL |
| download_requests | enabled | none | REVOKE ALL | ALL |
| events | enabled | none | REVOKE ALL | ALL (+ sequence usage) |
| events_daily | enabled | none | REVOKE ALL | ALL |
| rate_limits | enabled | none | REVOKE ALL | ALL |

Functions rate_limit_hit, consume_download_use, purge_old_events: SECURITY DEFINER, `search_path = pg_catalog, public`, EXECUTE revoked from PUBLIC/anon/authenticated, granted to service_role. All SQL is parameterised (no dynamic SQL, no string concatenation). Atomicity: rate_limit_hit = single upsert; consume_download_use = single conditional UPDATE with 15-minute session window (concurrent calls serialise on the row; a new window needs used_count < max_uses; reuse inside an open window does not increment); purge = one CTE statement (aggregate + delete together).
Caveat: Supabase default privileges may grant new public tables to anon/authenticated; the explicit REVOKE ALL handles that. Verify after apply: `node scripts/verify-rls.mjs` (expects 401/403, exit 0). Run BEFORE apply it only shows 404s (script warns that this is not proof).

## Gate
- `npx tsc --noEmit`: green.
- `npm run build`: green (under machine lock).
- `npm run lint`: 35 errors / 9 warnings, ALL pre-existing in untouched files (e.g. LanguageContext, broadcastChannel, dayNightStore); my new/changed files lint clean (`eslint` on src/lib/server, api/admin, privacy page, scripts). Not green repo-wide; not caused by this phase.

## NOT proven
- Migration never executed: SQL syntax, `NULLS NOT DISTINCT` (PG15+), the CTE purge, index on `paris_day` and RLS behaviour are unverified until applied.
- No real email sent; guard logic and Resend call path untested at runtime; SPF/DKIM/DMARC pass not tested (needs the domain verified in Resend + DNS).
- test-email route not exercised with a real admin session; tokens/unsubscribe HMAC not unit tested.
- Unauthenticated behaviour of test-email (401) not curl-tested.

## Human items
- Owner/lawyer review of the privacy text (TODO): legal bases (esp. audience measurement under CNIL exemption conditions), retention periods, processor list and transfer mechanism (Resend/Vercel SCC vs DPF), date "novembre 2026", mention of Railway still accurate, rights wording, whether LCEN postal address is needed in emails/mentions légales.
- Mentions légales page not updated (still FR-only, outside scope).
- Verify domain in Resend (subdomain), add SPF/DKIM/DMARC DNS; set env vars (see .env.example) in Vercel production only for RESEND_*; never set ALLOW_EMAIL_SEND on previews.
- Apply migration after approval, then run verify-rls.mjs.

## Notes
Funnel step 1 counts visitor-days, other steps count requests (P10 to label).
Likely merge conflicts: package.json, package-lock.json, .gitignore (P7/P9 may add deps/lines), src/lib/i18n.ts untouched by this phase.
