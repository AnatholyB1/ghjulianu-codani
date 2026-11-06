---
gsd_state_version: 1.0
milestone: v1.1
milestone_name: Téléchargement par email, newsletter & KPIs admin
status: planning
last_updated: "2026-11-06T23:46:17.741Z"
last_activity: 2026-11-06
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-11-06 — Milestone v1.1 started

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260919-sax | Diagnose prod issue: album thumbnail import failures since end of Aug, slow image import/loading; restore compression regression + parallelize bulk upload | 2026-09-19 | 88a4ef0 | [260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f](./quick/260919-sax-j-ai-un-petit-soucis-en-prod-depuis-la-f/) |

## Decisions

- Used IF NOT EXISTS guard in migration 007 for idempotency (03-01)
- is_day field in AlbumPhoto placed between alt and sort_order, matching PortfolioPhoto convention (03-01)
- UUID whitelist validation in bulkUpdatePortfolioPhotoDay before DB query (03-02)
- radioLabelSm added as separate constant (0.62rem) to avoid visual regression on existing radioLabel (0.7rem) (03-04)
- Badges in DraggablePhotoGrid at bottom:3px to avoid conflict with delete button at top:3px (03-05)
- Inheritance is app-level only — no DB computed columns (03-05)
- WelcomeModal ssr:false moved to WelcomeModalLoader client wrapper — Next.js App Router does not allow dynamic() with ssr:false in Server Components (04-06 fix)
- Seq Scans on portfolio_photos/albums are correct at current table sizes (58/20 rows); is_day index will activate at scale (04-07)
