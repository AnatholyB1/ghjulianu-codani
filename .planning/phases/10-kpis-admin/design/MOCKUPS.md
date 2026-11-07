# Mockups — Phase 10 `/admin/stats`

Static HTML + CSS + inline SVG (no JS). Open `gallery.html` for a side-by-side view, or any file directly. All figures are sample data. Regenerate with `node build.mjs`; render/measure with `node measure.mjs <this-dir>` (needs `playwright@1.65.0`; PNGs go to `shots/`, git-excluded).

| File | State | Notes |
|---|---|---|
| `stats-content-30d.html` | Content, default period | all 6 tiles, all cards |
| `stats-content-7d.html` | Content, 7 days | 7-point series |
| `stats-content-90d.html` | Content, 90 days | 90-point series |
| `stats-content-tables.html` | Content, data tables opened | table alternatives visible |
| `stats-empty.html` | Empty, no data yet | |
| `stats-loading.html` | Loading skeleton | selector disabled |
| `stats-error.html` | Error | `role="alert"`, retry |

Viewports: 390x844 @2x and 1440x900 @1x. Measurements: `measure-report.json` (0 overflow / small text / small tap / low contrast on all 14 renders). Palette validation: `palette-validation.txt`.

Gallery: `gallery.html`. Spec: `10-DESIGN-CONTRACT.md`. Review: `10-DESIGN-CRITIQUE.md`.
