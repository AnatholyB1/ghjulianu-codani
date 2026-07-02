# Phase 04 — Video Generation Prompts

## Purpose

Two AI-generated sky timelapse MP4 videos for the VideoTransitionOverlay and WelcomeModal components. Both are served from `/public/transitions/` and referenced by path in Wave 2 components.

## Output Files

| File | Path |
|------|------|
| Day→Night timelapse | `public/transitions/day-to-night.mp4` |
| Night→Day timelapse | `public/transitions/night-to-day.mp4` |

## Prompt A — day-to-night.mp4

"Photorealistic sky timelapse transitioning from bright golden hour afternoon to deep blue dusk and into early night. Pure sky only — no landscape, no horizon, no ground. Cinematic. Smooth, continuous motion. ~2-3 seconds. The sky begins as warm golden amber, gradually shifts through twilight purples and deep blues to a star-dotted dark navy. Ultra HD, no camera movement, stable composition."

## Prompt B — night-to-day.mp4

"Photorealistic sky timelapse transitioning from deep navy star-filled night sky to warm amber sunrise. Pure sky only — no landscape, no horizon, no ground. Cinematic. Smooth, continuous motion. ~2-3 seconds. The sky begins as deep navy with visible stars, gradually shifts through dark blue and pre-dawn grey to a warm amber and golden sunrise glow. Ultra HD, no camera movement, stable composition."

## Technical Specifications

| Parameter | Value |
|-----------|-------|
| Format | MP4 / H.264 |
| Resolution | 1080p minimum |
| Duration | ~2–3 seconds |
| Usage | `<video autoPlay muted playsInline>` fullscreen overlay |
| Playback | No loop on overlay (plays once); looping in WelcomeModal |

## Generation Status

Status: COMPLETED — 2026-07-02
Model: cinematic_studio_video_v2 (Higgsfield)
Resolution: 1344×768 (16:9)
Duration: 5 seconds each

| File | Job ID | Size |
|------|--------|------|
| day-to-night.mp4 | 9d2ebe23-015a-4fd3-8b7e-faa201a0da72 | 3.4 MB |
| night-to-day.mp4 | ce79994b-00b5-484a-80d0-91e9751252f0 | 4.0 MB |
