# Phase 4: Polish & Enhancements - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-02
**Phase:** 4-Polish & Enhancements
**Areas discussed:** Hydration flash fix, Content transition animation, prefers-reduced-motion, Performance audit scope, Higgsfield video transition (user-introduced), Welcome modal (user-introduced)

---

## Hydration Flash Fix

| Option | Description | Selected |
|--------|-------------|----------|
| Inline `<script>` in `<head>` | Tiny blocking script reads localStorage before React hydrates and adds `.day` class immediately. Zero flash, no server involvement, ~3 lines of JS. | ✓ |
| Cookie + server-side class | Toggle sets a cookie; Next.js layout reads it server-side and adds class to `<html>`. Eliminates flash but adds middleware complexity. | |
| Accept the flash | Night is the default — most users won't experience it. Minimal engineering cost. | |

**User's choice:** Inline `<script>` in `<head>`
**Notes:** User selected the recommended option (shown as a code preview). Also confirmed `suppressHydrationWarning` should be added to `<html>` to silence the intentional mismatch.

---

## Content Transition Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Fade out → fetch → fade in | Content fades to opacity:0 (300ms), Supabase re-fetches, content fades back to opacity:1 (300ms). Clean crossfade. | ✓ |
| Loading spinner/skeleton | Spinner or skeleton overlaid while fetching. Content stays visible. | |
| Instant replace | No content transition — just existing CSS var body transition (0.3s). Photos pop in when fetch completes. | |

**User's choice:** Fade out → fetch → fade in
**Notes:** Applies to photo/album grids only (PortfolioGrid, AlbumsDragTrack), not the full page. Navbar and titles remain stable.

### Toggle Icon Animation

| Option | Description | Selected |
|--------|-------------|----------|
| Rotate + crossfade | Icon rotates 180° and fades out as Moon/Sun swaps in (~200ms CSS keyframe). | ✓ |
| Scale pulse only | Icon scales down briefly (0.9×) on click. | |
| No icon animation | Keep current state — hover scale/bg already exist. | |

**User's choice:** Rotate + crossfade

---

## prefers-reduced-motion

| Option | Description | Selected |
|--------|-------------|----------|
| Global CSS kill-switch | One rule in globals.css kills all transitions and animations site-wide. Standard web practice, zero maintenance. | ✓ |
| Targeted CSS — new animations only | Only wrap Phase 4 transitions with the media query. Existing site animations keep running. | |
| JS hook (usePrefersReducedMotion) | Hook reads matchMedia and passes flag to each animated component. Most granular, most code. | |

**User's choice:** Global CSS kill-switch
**Notes:** Later in discussion, user also confirmed the video overlay (Higgsfield transition) should be skipped via JS guard when prefers-reduced-motion is active. Mode switches instantly in that case.

---

## Performance Audit Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Code + documented results | Claude runs EXPLAIN ANALYZE, checks bundle impact, records findings in commit. | ✓ |
| Code only — trust the indexes | Indexes were created in Phase 1. No explicit audit. | |
| Full Lighthouse + bundle report | Run Lighthouse CI, capture Core Web Vitals before/after, bundle analyzer. | |

**User's choice:** Code + documented results

### Component Render Memoization

| Option | Description | Selected |
|--------|-------------|----------|
| Fix if needed — don't add memo pre-emptively | Only add memoization if profiling reveals actual unnecessary re-renders. | ✓ |
| Add memo to animated components | Wrap PortfolioGrid and AlbumsDragTrack in React.memo defensively. | |

**User's choice:** Fix if needed — don't add memo pre-emptively

---

## Higgsfield Video Transition (user-introduced)

The user introduced this idea mid-discussion: a full cinematic transition using AI-generated video when the toggle is clicked, to visually communicate "different photos per mode."

| Option | Description | Selected |
|--------|-------------|----------|
| Cinematic sweep animation | CSS/canvas sweep effect (light ray or wipe) expanding from toggle button, ~800ms. | |
| AI video clip (via Higgsfield) | Higgsfield generates short day→night (or night→day) clip. Plays as fullscreen overlay. ~2-3s. | ✓ |
| Overlay text reveal | Full-screen text overlay ("JOUR" / "NUIT") as a chapter title card. | |

**User's choice:** AI video clip (via Higgsfield)

### Number of Videos
| Option | Description | Selected |
|--------|-------------|----------|
| Two separate videos | day→night clip + night→day clip. Best directional quality. | ✓ |
| One video played forward/reverse | One clip, reversed for opposite direction. Simpler but reversal may look awkward. | |

**User's choice:** Two separate videos

### Video Visual Style
| Option | Description | Selected |
|--------|-------------|----------|
| Sky timelapse — dawn or dusk | Photorealistic sky transitioning day to night. Fits photography portfolio aesthetic. | ✓ |
| Abstract light sweep | Abstract warm/cool light washing across frame. More artistic. | |
| Landscape transition | Landscape scene through golden hour into night. More narrative. | |

**User's choice:** Sky timelapse — dawn or dusk

### Video Hosting
| Option | Description | Selected |
|--------|-------------|----------|
| Public folder + preload on mount | Videos in /public/transitions/. Preloaded so toggle is instant. | ✓ |
| Supabase storage CDN | CDN delivery via Supabase bucket. More setup. | |
| Decide after generation | See file sizes first, then decide. | |

**User's choice:** Public folder + preload on mount

---

## Welcome Modal (user-introduced)

The user also introduced a tutorial/onboarding concept to explain the day/night concept to first-time visitors.

| Option | Description | Selected |
|--------|-------------|----------|
| Animated tooltip near toggle | Pulsing hint + popover near DayNightToggle on first visit. Dismissed on first click. | |
| Home page CTA section | Dedicated section on home page with Higgsfield video as illustration. Persistent. | |
| Full-screen welcome modal | First-visit modal plays clip + explains concept. User dismisses. | ✓ |
| Deferred — its own phase | Tutorial is new feature, not polish. Capture as deferred idea. | |

**User's choice:** Full-screen welcome modal

### Modal Content
| Option | Description | Selected |
|--------|-------------|----------|
| Video + 2-line copy + CTA button | Higgsfield video looping in bg, text, [JOUR] and [NUIT] buttons that set mode AND dismiss. | ✓ |
| Video only — auto-dismiss | Short clip plays, auto-closes. No text. | |
| Static image + copy — no video in modal | Modal uses static image split. Video only for toggle transition. | |

**User's choice:** Video + 2-line copy + CTA button
**Notes:** Copy specified by user: "Ce portfolio existe en deux versions : JOUR et NUIT". Buttons [JOUR] and [NUIT] both set mode AND dismiss.

### Button Behavior
| Option | Description | Selected |
|--------|-------------|----------|
| Sets mode AND dismisses | [JOUR] → day + closed. [NUIT] → night + closed. | ✓ |
| Just dismisses — mode stays default | Buttons close modal only. | |

**User's choice:** Sets mode AND dismisses

---

## Claude's Discretion

- Exact CSS keyframe for toggle icon rotate + crossfade — pick based on existing inline-style pattern in `DayNightToggle.tsx`
- Video preload technique (link rel=preload vs JS fetch vs HTMLVideoElement.load()) — pick for Next.js compatibility
- Z-index layering for video overlay and welcome modal — values above navbar
- Static fallback appearance for welcome modal under prefers-reduced-motion (gradient colors matching day/night themes)

## Deferred Ideas

- Home page CTA section — persistent section explaining concept (superseded by welcome modal)
- Animated tooltip near toggle (superseded by welcome modal)
- FUT-01: Automatic day/night detection via image analysis
- FUT-02: Time-based automatic switching (sunrise/sunset)
