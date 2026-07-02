# Research Summary: Day/Night Photo Filtering

## Stack Additions
- No new libraries required - can be implemented with existing stack (Next.js, React, Tailwind, Supabase)
- Optional: Consider Framer Motion for advanced animations if needed
- Database migration required to add `is_day` boolean columns to photos and albums tables

## Feature Table Stakes
**Essential Features:**
- Global toggle switch to switch between day/night views
- Visual indicator showing current mode (sun/moon icon)
- Automatic filtering of photo galleries based on selected mode
- Separate storage of day/night classification for each photo/album
- Theme coordination (light theme for day mode, dark theme for night mode)
- Persistent user preference (via localStorage)
- Admin controls to mark photos as day/night
- Admin controls to mark albums as day/night (checkbox/slider)

## Watch Out For
**Common Pitfalls:**
- Forgetting to add database indexes on the new `is_day` columns causing slow queries
- Not synchronizing state between browser tabs/windows
- Accessibility issues with toggle button (keyboard navigation, screen readers)
- Flash of incorrect theme during hydration
- Performance issues if filtering client-side instead of database-level
- Inconsistent state between theme and photo filtering
- Motion sensitivity concerns with animations
- Admin interface inconsistency (different ways to set day/night in different places)

**Prevention Strategies:**
- Add database indexes during migration
- Use localStorage events or BroadcastChannel for cross-tab sync
- Follow accessibility guidelines (ARIA labels, keyboard navigation)
- Store theme preference in HTML attribute to prevent FOIT
- Ensure filtering happens at database query level
- Create single source of truth for day/night state that controls both theme and filtering
- Respect `prefers-reduced-motion` CSS media query
- Create shared UI components for day/night selection in admin interfaces