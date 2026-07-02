---
status: diagnosed
phase: 03-admin-controls
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md, 03-05-SUMMARY.md
started: 2026-07-02T00:00:00.000Z
updated: 2026-07-02T12:00:00.000Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start the application from scratch with `npm run dev`. Server starts without errors. Navigate to the admin area — page loads and shows existing data (portfolio photos, albums). No console errors related to missing columns or failed queries.
result: pass

### 2. Portfolio photo — DayNightToggleBadge cycling
expected: Go to /admin/portfolio. Each photo card shows a badge at top-right (or no visible pill if untagged — null state is a transparent click target). Clicking a photo's badge cycles: no pill → amber sun pill (JOUR) → indigo moon pill (NUIT) → no pill again. Badge updates instantly (optimistic), then confirms via server. Clicking during pending state has no effect (opacity 0.5).
result: issue
reported: "je ne vois pas de badge sur les photos"
severity: major

### 3. Portfolio — Bulk day/night tagging
expected: On /admin/portfolio, click SÉLECTIONNER. Checkboxes appear on all cards; badges and delete buttons hide. Select 2–3 photos (amber outline + tint on selected). The JOUR / NUIT / NON TAGGÉ buttons appear in a bulk action bar with a selected count. Click JOUR — selected photos all switch to amber sun badge. Click ANNULER — selection mode exits, checkboxes disappear, badges reappear.
result: pass

### 4. Album list — day/night indicators
expected: Go to /admin/albums. Each album row shows a small icon between the public/private indicator and the sort order: sun icon (amber) for jour, moon icon (indigo) for nuit, or a dim dash for untagged. The icons are read-only (not interactive).
result: pass

### 5. Album edit — MODE JOUR/NUIT radio
expected: Open an album in edit mode (/admin/albums/[id]). A row labeled "MODE JOUR/NUIT" appears with three radio options: JOUR / NUIT / NON TAGUÉ. The radio pre-selects the album's current value. Selecting a different option and saving persists the change — after returning to the album list the row shows the updated icon.
result: pass

### 6. Album photos — inheritance badge
expected: Open an album that has a day/night setting AND contains photos. Each photo card in the draggable grid shows a badge at bottom-right. Photos inheriting the album value (photo.is_day is null) show a muted icon + '↓'. Photos with an explicit override show a bright icon + '!'. Clicking an inherited badge sets an explicit override (opposite of the album value). Clicking an override badge shows "ALBUM ↩" for ~1.5 s then resets the photo to null (back to inheriting). No badge appears when both album and photo are untagged (both null).
result: issue
reported: "the badge is not really visible"
severity: cosmetic

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Each portfolio photo card shows a DayNightToggleBadge at top-right (transparent click target when null, amber sun pill when jour, indigo moon pill when nuit)"
  status: failed
  reason: "User reported: je ne vois pas de badge sur les photos"
  severity: major
  test: 2
  root_cause: "null state renders a completely transparent borderless 18×18 button (btnNull style). Since all photos start as is_day=null, nothing is visible. Feature is undiscoverable."
  artifacts:
    - path: "src/app/admin/_components/DayNightToggleBadge.tsx"
      issue: "btnNull style has background:transparent and no border — invisible when is_day is null"
  missing:
    - "Add a faint visible indicator for null state (e.g. subtle border rgba(255,255,255,0.15) or a dim ☀ placeholder)"
  debug_session: ""

- truth: "Album photo inheritance badge is clearly visible at bottom-right of each card (muted icon + ↓ for inherited, bright icon + ! for override)"
  status: failed
  reason: "User reported: the badge is not really visible"
  severity: cosmetic
  test: 6
  root_cause: "badgeInherited style uses border:1px solid rgba(255,255,255,0.06) (nearly invisible) + opacity:0.7 + icon color rgba(200,169,126,0.5). On photo content the badge blends in completely."
  artifacts:
    - path: "src/app/admin/_components/DraggablePhotoGrid.tsx"
      issue: "badgeInherited: border too faint (0.06 alpha), no background, icon at 50% opacity"
  missing:
    - "Increase badgeInherited contrast: add rgba(0,0,0,0.5) background, raise border to rgba(255,255,255,0.2), raise icon opacity to 0.75"
  debug_session: ""
