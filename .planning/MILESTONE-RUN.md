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
