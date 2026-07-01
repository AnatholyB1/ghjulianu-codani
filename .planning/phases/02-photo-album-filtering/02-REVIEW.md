---
phase: 02-photo-album-filtering
reviewed: 2026-07-01T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/app/albums/AlbumsDragTrack.tsx
  - src/app/albums/page.tsx
  - src/app/layout.tsx
  - src/app/page.tsx
  - src/app/portfolio/PortfolioGrid.tsx
  - src/app/portfolio/page.tsx
  - src/lib/db.types.ts
  - src/store/dayNightStore.ts
  - supabase/migrations/20240626000005_reset_is_day_to_null.sql
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-07-01T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase implements day/night mode filtering for albums and portfolio photos using a Zustand store, a BroadcastChannel cross-tab sync wrapper, and client-side Supabase queries. The general architecture is sound, but there are three critical defects: unhandled Supabase errors that silently swallow data-fetch failures, a broadcast-channel subscription that is never unregistered (causing an update loop and stale-closure memory leak on every module re-evaluation), and a cross-tab infinite-toggle loop produced by the subscriber calling `setMode`, which itself broadcasts again. There are also several warnings around global event-handler clobbering, missing cleanup of an in-flight fetch race, and Supabase query error handling throughout.

---

## Critical Issues

### CR-01: Broadcast subscriber calls `setMode`, which re-broadcasts — infinite loop across tabs

**File:** `src/store/dayNightStore.ts:34-37`

**Issue:** The module-level subscriber calls `useDayNightStore.getState().setMode(mode)`. `setMode` unconditionally calls `dayNightBroadcastChannel.send(...)` (lines 16-18). If two tabs are open, tab A broadcasts → tab B's subscriber calls `setMode` → `setMode` broadcasts again → tab A's subscriber fires → calls `setMode` again → etc. The guard `useDayNightStore.getState().mode !== mode` only prevents a loop within a single tab; it does not stop the cross-tab ping-pong because the second broadcast goes back to the first tab, whose mode has already updated, so the condition is now `false` and the guard passes again on the next message.

The fix is to introduce a separate internal setter that updates state without re-broadcasting, and have the subscriber call that instead.

**Fix:**
```typescript
// In DayNightState interface, add:
_setModeInternal: (mode: 'day' | 'night') => void;

// In create():
_setModeInternal: (mode) => set({ mode }),

setMode: (mode) => {
  set({ mode });
  dayNightBroadcastChannel.send('DAY_NIGHT_UPDATE', { mode });
},

// Subscriber uses the non-broadcasting setter:
dayNightBroadcastChannel.subscribe('DAY_NIGHT_UPDATE', ({ mode }) => {
  if (useDayNightStore.getState().mode !== mode) {
    useDayNightStore.getState()._setModeInternal(mode);
  }
});
```

---

### CR-02: Broadcast subscriber is never unregistered — permanent memory leak and growing listener list

**File:** `src/store/dayNightStore.ts:34-37`

**Issue:** `dayNightBroadcastChannel.subscribe(...)` returns an unsubscribe function, but the return value is discarded. This code runs at module-evaluation time (not inside a React effect), so there is no cleanup path. Every hot-module reload during development re-evaluates the module, appending another listener to the `listeners` Map inside `BroadcastChannelWrapper`. In production a module is evaluated once per page load, but if `dayNightStore` is ever imported in multiple dynamic chunks that are both loaded, the listener accumulates. Additionally, the `toggleMode` function captures the initial `get` closure — calling the subscriber with a stale `setMode` reference after re-import will silently no-op. This is a guaranteed memory leak in development and a latent production bug.

**Fix:**
```typescript
// Capture the unsubscribe function at module level so it can be called
// if the module is ever torn down (e.g., via a cleanup wrapper or test):
const _unsubDayNight = dayNightBroadcastChannel.subscribe('DAY_NIGHT_UPDATE', ({ mode }) => {
  if (useDayNightStore.getState().mode !== mode) {
    useDayNightStore.getState()._setModeInternal(mode);
  }
});
// Export for test teardown if needed:
export { _unsubDayNight };
```

---

### CR-03: Supabase errors silently discarded in all three fetch sites — invisible data-fetch failures

**Files:**
- `src/app/albums/AlbumsDragTrack.tsx:37-39`
- `src/app/page.tsx:95-97`
- `src/app/portfolio/PortfolioGrid.tsx:106-108`

**Issue:** All three locations call `.then(({ data }) => ...)` and never check `error`. When Supabase returns an error (network outage, RLS rejection, row-level security misconfiguration after the `is_day` migration, etc.), `data` is `null` and `error` is populated. The code falls through to `data ?? []` / `if (data) ...`, sets an empty list, and renders "No albums/photos available in this mode yet" with no logging or user feedback. A silent empty state is indistinguishable from a legitimate empty result; failures are completely invisible.

**Fix (apply to all three sites):**
```typescript
// AlbumsDragTrack.tsx (line 37-39):
query.then(({ data, error }) => {
  if (error) {
    console.error('[AlbumsDragTrack] fetch error:', error.message);
    // Optionally set an error state for user feedback
    return;
  }
  setAlbums(data ?? []);
});

// page.tsx (line 95-97):
filteredQuery
  .order('created_at', { ascending: false })
  .limit(3)
  .then(({ data, error }) => {
    if (error) { console.error('[HomePage] albums fetch error:', error.message); return; }
    if (data) setRecentAlbums(data as Album[]);
  });

// PortfolioGrid.tsx (line 106-108):
query.then(({ data, error }) => {
  if (error) { console.error('[PortfolioGrid] fetch error:', error.message); return; }
  setPhotos(shuffle(data ?? []));
});
```

---

## Warnings

### WR-01: Global `window.on*` assignments clobber any other listeners on the page

**File:** `src/app/albums/AlbumsDragTrack.tsx:90-95`

**Issue:** The drag-track effect assigns directly to `window.onmousedown`, `window.onmouseup`, `window.onmousemove`, `window.ontouchstart`, `window.ontouchend`, `window.ontouchmove`. These are singular slots — any other component that also assigns these handlers (e.g., a future modal, lightbox, or third-party widget) will be silently replaced. The cleanup on line 111-118 sets them to `null`, which is correct only because currently there is no competition, but this is fragile. The existing code comment ("guarantees no other listener clashes") is incorrect — it is the opposite: it guarantees that any other listener IS clobbered.

**Fix:** Replace `window.on*` assignments with `window.addEventListener` / `window.removeEventListener`:
```typescript
const md = (e: MouseEvent) => handleOnDown(e.clientX);
const ts = (e: TouchEvent) => handleOnDown(e.touches[0].clientX);
const mu = () => handleOnUp();
const te = () => handleOnUp();
const mm = (e: MouseEvent) => handleOnMove(e.clientX);
const tm = (e: TouchEvent) => handleOnMove(e.touches[0].clientX);

window.addEventListener('mousedown',  md);
window.addEventListener('touchstart', ts, { passive: true });
window.addEventListener('mouseup',    mu);
window.addEventListener('touchend',   te);
window.addEventListener('mousemove',  mm);
window.addEventListener('touchmove',  tm, { passive: false });

return () => {
  window.removeEventListener('mousedown',  md);
  window.removeEventListener('touchstart', ts);
  window.removeEventListener('mouseup',    mu);
  window.removeEventListener('touchend',   te);
  window.removeEventListener('mousemove',  mm);
  window.removeEventListener('touchmove',  tm);
  cancelAnimationFrame(rafRef.current);
};
```

---

### WR-02: Race condition — in-flight fetch result applied after mode change

**Files:**
- `src/app/albums/AlbumsDragTrack.tsx:24-40`
- `src/app/page.tsx:85-98`
- `src/app/portfolio/PortfolioGrid.tsx:94-109`

**Issue:** All three `useEffect` hooks trigger a new Supabase query whenever `mode` changes, but none cancel the previous in-flight request. If the user toggles day/night quickly, an older fetch (for the previous mode) can resolve after a newer fetch and overwrite the correctly-filtered result with stale data. The comment in `PortfolioGrid.tsx` at line 95 ("Do NOT clear photos — keep previous list visible while new fetch is in-flight") acknowledges the in-flight state but does nothing to cancel stale responses.

**Fix:** Use an `isCancelled` flag (or an `AbortController` if the Supabase client supports it) to ignore stale responses:
```typescript
useEffect(() => {
  let cancelled = false;
  const supabase = createClient();
  // ... build query ...
  query.then(({ data, error }) => {
    if (cancelled) return;
    if (error) { console.error(error); return; }
    setAlbums(data ?? []);
  });
  return () => { cancelled = true; };
}, [mode]);
```

---

### WR-03: `BroadcastChannel` singleton instantiated at module parse time in SSR context

**File:** `src/lib/broadcastChannel.ts:89`

**Issue:** `export const dayNightBroadcastChannel = new BroadcastChannelWrapper('day-night-channel')` executes at module load. The constructor checks `typeof BroadcastChannel !== 'undefined'` before using the API, which avoids a hard crash. However, the `else` branch at line 29 calls `window.addEventListener('storage', ...)` without a `typeof window !== 'undefined'` guard. If Next.js ever evaluates this module server-side (e.g., via a server component import chain, or during static analysis), `window` will be `undefined` and the code will throw a `ReferenceError`. The `BroadcastChannel` guard only fires in the truthy branch; the `else` branch assumes `window` exists.

**Fix:**
```typescript
} else if (typeof window !== 'undefined') {
  this.storageListener = (event) => { ... };
  window.addEventListener('storage', this.storageListener);
}
```

---

### WR-04: `hasDragged` ref not reset when category changes — links incorrectly suppressed

**File:** `src/app/albums/AlbumsDragTrack.tsx:121-131`

**Issue:** The category-change `useEffect` (lines 122-131) resets the track position and refs `imgTargetRef` and `imgCurrentRef`, but does not reset `hasDragged.current`. If the user drags to filter by category and then clicks an album link, `hasDragged.current` is still `true` from the drag gesture, and `onClick` at line 195 calls `e.preventDefault()`, silently preventing navigation. The user must do a full mouse-down/up cycle after changing category to reset the flag.

**Fix:** Add `hasDragged.current = false;` to the category reset effect:
```typescript
useEffect(() => {
  const track = trackRef.current;
  if (!track) return;
  track.dataset.mouseDownAt    = '0';
  track.dataset.prevPercentage = '0';
  track.dataset.percentage     = '0';
  track.animate({ transform: 'translate(0%, -50%)' }, { duration: 0, fill: 'forwards' });
  imgTargetRef.current  = 0;
  imgCurrentRef.current = 0;
  hasDragged.current    = false;   // ← add this line
}, [cat]);
```

---

### WR-05: `shuffle()` called on every mode-change re-render — photos reorder on each toggle

**File:** `src/app/portfolio/PortfolioGrid.tsx:107`

**Issue:** `setPhotos(shuffle(data ?? []))` shuffles the fetched array before storing it. Every time the user switches day/night mode, an entirely new shuffle is applied. This means the same set of photos appears in a different (random) order each time the user toggles, which is likely unintentional and confusing UX. Additionally, the shuffle is seeded by `Math.random()`, which is non-deterministic and non-cryptographic — fine for display order, but the inconsistency across mode switches is a correctness concern for UX.

**Fix:** Either shuffle once on initial load (not on every mode change) by comparing `data` identity, or remove the shuffle entirely and rely on the database `sort_order` column:
```typescript
query.then(({ data, error }) => {
  if (cancelled) return;
  if (error) { console.error(error); return; }
  // Shuffle only on first load, preserve order on mode switch:
  setPhotos((prev) => prev.length === 0 ? shuffle(data ?? []) : (data ?? []));
});
```

---

## Info

### IN-01: Hardcoded English fallback string in JSX

**File:** `src/app/albums/AlbumsDragTrack.tsx:186`

**Issue:** The empty-state message `"No albums available in this mode yet"` is hardcoded in English inside JSX. All other text in the component is accessed through the `useT()` hook for localisation. This string will not be translated for French users and is inconsistent with the rest of the i18n approach.

**Fix:** Add a key (e.g., `t.albums.emptyState`) to the translation hook and replace the hardcoded string.

---

### IN-02: Same hardcoded English fallback in PortfolioGrid

**File:** `src/app/portfolio/PortfolioGrid.tsx:119`

**Issue:** `"No photos available in this mode yet"` is hardcoded in English. Same localisation inconsistency as IN-01. The `PortfolioGrid` component does not use `useT()` at all — it should be introduced here.

**Fix:** Add `useT()` to `PortfolioGrid` and route the empty-state message through the translation system.

---

### IN-03: `sort_order` ordering direction inconsistency between albums and portfolio

**File:** `src/app/albums/AlbumsDragTrack.tsx:29`

**Issue:** Albums are fetched with `.order('sort_order', { ascending: false })` (descending). The `portfolio_photos` table in `PortfolioGrid.tsx` fetches without any `order()` call at all (line 98-108), relying on database row-insertion order. The `PortfolioPhoto` type in `db.types.ts` defines a `sort_order` field (line 47) which is never used for ordering. This means the portfolio grid ordering is undefined and can differ between environments or after vacuuming. If intentional (because shuffle replaces ordering), the `sort_order` column is dead weight in the type definition for this query path.

**Fix:** Either add `.order('sort_order', { ascending: true })` to the portfolio query before shuffling, or document why ordering is intentionally omitted.

---

_Reviewed: 2026-07-01T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
