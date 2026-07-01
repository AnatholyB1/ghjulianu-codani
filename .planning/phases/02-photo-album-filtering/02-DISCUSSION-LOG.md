# Phase 2: Photo & Album Filtering - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-01
**Phase:** 2-Photo & Album Filtering
**Areas discussed:** Filtering architecture, Untagged photos behavior, Empty state & coverage, TypeScript types

---

## Filtering Architecture

| Option | Description | Selected |
|--------|-------------|----------|
| Client components fetch | Move Supabase fetch into Client Components (PortfolioGrid, AlbumsDragTrack). Server components become thin shells. | ✓ |
| URL search param ?mode=day\|night | Server Components read the URL param and pass mode to Supabase. Changes URL on toggle. | |
| Server Action / Route Handler | Client calls Server Action with mode; server fetches. Extra network hop. | |

**User's choice:** Client components fetch  
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Thin shells | Server components render only the client component — no server-side fetch. Slight loading flash on first render. | ✓ |
| SSR initial + client re-fetch | Server Component fetches all (unfiltered) for instant render; client re-fetches filtered. | |

**User's choice:** Thin shells  
**Notes:** None

---

| Option | Description | Selected |
|--------|-------------|----------|
| Re-fetch from Supabase on mode change | Each toggle triggers a new Supabase query. Honors CTR-05/06 requirement. | ✓ |
| Fetch once, filter client-side | In-memory filtering on toggle. Faster but violates Supabase-level filtering requirement. | |

**User's choice:** Re-fetch from Supabase on mode change  
**Notes:** Requirement compliance (CTR-05/06) was explicit priority

---

## Untagged Photos Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| is_day=true means day only (strict) | Night mode shows nothing until Phase 3 tags content. Site empty in night mode post-Phase 2. | |
| is_day=NULL means untagged, show everywhere | NULL = universal. Explicitly tagged true=day only, false=night only. Requires migration existing → NULL. | ✓ |
| is_day=true is universal default, show in both | true means "all modes". Night-specific content = false. Inverts intuitive naming. | |

**User's choice:** is_day=NULL means untagged, show everywhere  
**Notes:** Site must remain functional between Phase 2 and Phase 3

---

| Option | Description | Selected |
|--------|-------------|----------|
| Set all existing records to NULL | Migration sets portfolio_photos and albums to NULL. Clean slate. | ✓ |
| Keep existing records, NULL only for future | Change DB default to NULL but don't touch existing. Night mode still empty for existing content. | |

**User's choice:** Set all existing records to NULL  
**Notes:** None

---

Filter logic confirmed: day mode → `is_day = true OR is_day IS NULL`; night mode → `is_day = false OR is_day IS NULL`

---

## Empty State & Coverage

| Option | Description | Selected |
|--------|-------------|----------|
| Simple empty message | Short text like "No photos available in this mode yet". Minimalist. | ✓ |
| Nothing (completely blank) | Empty grid — no message. | |
| Redirect to showing all | Auto-remove filter and show all with indicator. | |

**User's choice:** Simple empty message  
**Notes:** Must match site's minimalist aesthetic — no CTA, no redirect

---

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, filter home page albums too | Consistent experience — day/night filtering everywhere. | ✓ |
| No, home page shows all albums | Home page as showcase — always show all. | |

**User's choice:** Yes, filter home page albums too  
**Notes:** None

---

## TypeScript Types

| Option | Description | Selected |
|--------|-------------|----------|
| boolean \| null | Reflects DB reality after NULL migration. TypeScript enforces null checks. | ✓ |
| boolean (non-nullable) | Simpler but doesn't match DB. Silent null bugs possible. | |

**User's choice:** boolean | null  
**Notes:** None

---

Interfaces to update: `PortfolioPhoto`, `Album`. `AlbumPhoto` excluded — filtering at album level, not individual photo level.

---

## Claude's Discretion

- Loading state while re-fetching on mode change (spinner, skeleton, or nothing)
- Whether to use `useEffect` + direct client or a custom `useFilteredPhotos` hook

## Deferred Ideas

None
