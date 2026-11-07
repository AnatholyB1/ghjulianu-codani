# Phase 10 — Design critique (self-review of the mockups)

Method: reviewed the rendered 390x844@2x and 1440x900 PNGs against the dataviz anti-pattern list and the contract's measured checks. The `critique`/`audit` skills were not run as separate tool passes (time-boxed); this file is a manual pass with the same intent. Not reviewed by a human or a real screen reader.

## What works
- One accent of data colour per entity (blue views, orange downloads), single axis per panel, no dual axis, legend + panel titles, delta never colour-only.
- Measured: 0 horizontal overflow, 0 text < 14 px, 0 tap targets < 44 px, 0 contrast failures, on all 14 renders.
- Honest funnel and bandwidth labelling; tables for every chart.

## Weaknesses found and fixed during the pass
- Tables variant overflowed 48 px on mobile (grid item min-width) — fixed (`.two > * {min-width:0}`).
- Subscriber growth sample did not reconcile with the tile (+30 vs +50) — now generated from the tile's net.
- Album titles truncated on mobile — now wrap.
- Funnel step 1 was mislabelled "visiteurs uniques" — now "visiteurs-jours".

## Known remaining weaknesses
- Hover/crosshair is specified but not prototyped (static HTML); keyboard model unproven.
- 90-day chart has 90 points in ~300 px on mobile (3 px each): readable as a trend only; the table is the precise view.
- Device colours reuse views/downloads hues (palette limit of 3 validated all-pairs slots); mitigated by texture and labels, not eliminated.
- Raised `--muted` and 14 px minimum make this page visually heavier than the other admin pages (which use 9–10 px labels). Consistency vs accessibility trade-off taken in favour of accessibility.
- Disabled period links in loading state use opacity .55 (below 4.5:1 by design, exempt as disabled).
- Admin nav on mobile scrolls horizontally with the last items cut off and no scroll affordance.

## Open questions (max 5, need an owner decision)
1. **Subscriber growth needs a confirmation date.** The schema has `consent_at`, `created_at`, `unsubscribed_at` but no `confirmed_at`; "new confirmed per day" cannot be computed truthfully. Recommend adding `confirmed_at timestamptz` to the (not yet applied) migration, set by the confirm POST (P9).
2. **KPI-07 "aggregates remain" has no table.** The schema only has `purge_old_events`. Recommend a `events_daily` rollup (day, type, album_id, photo_id, device, is_day, count, bytes) filled by the purge job before deleting, otherwise history older than 13 months disappears and "aggregates remain" is false. Is rollup in scope for P10?
3. **View dedupe index and NULL `photo_id`.** The partial unique index `(type, photo_id, visitor_hash, day)` does not dedupe rows where `photo_id` is NULL (PostgreSQL treats NULLs as distinct). Contract counts only photo-level views; confirm that album-page-only visits are not a KPI, or require `coalesce(photo_id, zero-uuid)` in the index.
4. **Funnel unit mismatch.** Step 1 is visit-days, steps 2–4 are requests, so "view → request" is a ratio of different units (a visitor can make several requests; a request can come from a visitor with no view that day). Accept as "indicative" (current design) or switch step 1 to "visitors who added a photo to selection" (`select_add`, more comparable but excludes direct requests)?
5. **Bandwidth scope.** Estimated bandwidth counts only bytes of served downloads; the dominant cost (CDN image delivery of thumbnails/gallery) is invisible to the app. Is that acceptable for the "cost control" goal, or should the footer/tile promise less (rename to "Volume téléchargé")?
