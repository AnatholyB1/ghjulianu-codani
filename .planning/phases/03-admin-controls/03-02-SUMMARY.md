---
plan: 03-02
status: complete
---

## Summary
Added three new Server Actions to actions.ts: updatePortfolioPhotoDay, bulkUpdatePortfolioPhotoDay, updateAlbumPhotoDay. Extended updateAlbum to read is_day from formData with whitelist parsing and write it to the albums table. access_key logic preserved. TypeScript compiles cleanly.

## Artifacts
- `src/app/admin/actions.ts` — 3 new exports + updateAlbum extended

## Verification
- rtk tsc: passes

## Commit
- `57c6b40` feat(03-02): add Server Actions for day/night tagging
