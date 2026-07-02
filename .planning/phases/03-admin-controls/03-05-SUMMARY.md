---
plan: 03-05
status: complete
---

## Summary
Implemented ALB-02 inheritance badge system in DraggablePhotoGrid. Each album photo card now shows inherited (muted icon + '1') or explicit override (bright icon + '!') badges at bottom-right. Clicking inherited badge sets explicit override (opposite of album value). Clicking explicit badge shows 'ALBUM ↩' reset label for 1500ms then fires updateAlbumPhotoDay with null. No badge when both photo.is_day and album.is_day are null.

## Artifacts
- `src/app/admin/_components/DraggablePhotoGrid.tsx` — inheritance badge UI, getBadgeState function, handleBadgeClick/handleResetToAlbum handlers, 4 new style constants

## Verification
- rtk tsc: passes
