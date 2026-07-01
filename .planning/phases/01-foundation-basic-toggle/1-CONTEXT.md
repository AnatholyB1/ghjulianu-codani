# Phase 1 Context: Foundation & Basic Toggle

## Decisions Summary

### State Management
**Decision**: Use Zustand for state management  
**Reasoning**: 
- Provides better performance and developer experience compared to Context API
- Minimal bundle impact
- Built-in middleware support for persistence
- Simpler API for cross-component state sharing
- Alternative considered: React Context API (would require more boilerplate)

### Theme Implementation
**Decision**: Use CSS Variables approach  
**Reasoning**:
- Allows dynamic theme switching without full page reload
- Maintains single CSS bundle
- Easy to override specific variables for day/night modes
- Works well with existing Tailwind setup
- Alternative considered: CSS classes on HTML element (would require more CSS overrides)

### Toggle Placement
**Decision**: Place toggle at Nav Left End (before logo)  
**Reasoning**:
- Consistent placement across all pages
- Doesn't interfere with primary navigation or CTA
- Follows common UI patterns for theme toggles
- Alternative considered: Nav Right End (would conflict with language switcher)

### Cross-tab Synchronization
**Decision**: Use Broadcast Channel API  
**Reasoning**:
- More reliable than storage events for real-time sync
- Better performance than polling
- Built-in browser support in modern browsers
- Fallback consideration: Could add storage event listener as backup

### Icon Source
**Decision**: Use Icon Library (Lucene or Heroicons)  
**Reasoning**:
- Consistent visual style with existing UI
- Scalable and customizable
- Better accessibility than Unicode emojis
- Alternative considered: Inline SVGs (would increase bundle size slightly)

### Initial State
**Decision**: Default to Night Mode on first visit  
**Reasoning**:
- User preference expressed during discussion
- Aligns with photography site aesthetic (many photographers prefer dark mode for portfolio viewing)
- Can still respect user's stored preference if available

### Accessibility
**Decision**: Implement Comprehensive Accessibility  
**Reasoning**:
- Ensures usability for all users
- Includes: ARIA labels, keyboard support (Space/Enter), live region announcements for state changes, and contrast testing
- Critical for public-facing website

## Open Questions / Gray Areas Requiring Further Investigation

### 1. Database Schema Migration
- Need to verify exact table names for photos (portfolio_photos vs potential other tables)
- Need to check if there are existing photo tables beyond portfolio_photos and album_photos
- Should we add indexes during migration or separately?

### 2. Zustand Persistence Middleware
- Should we use zustand/persist middleware for localStorage storage?
- How to handle synchronization between Zustand state and BroadcastChannel?

### 3. CSS Variable Implementation Details
- Where should we define the day/night color variables? (:root vs specific selector)
- How many color variables need to be duplicated for day/night themes?
- Should we create a theme.css file or modify globals.css?

### 4. Broadcast Channel Implementation
- What should we name the broadcast channel? (e.g., 'day-night-channel')
- How to handle browser compatibility (IE11 doesn't support it)
- Should we implement a fallback mechanism?

### 5. Icon Library Selection
- Which icon library to use? Lucide, Heroicons, or another?
- Need to check if already installed in project
- If not, what's the bundle impact?

### 6. Animation Requirements
- Phase 1 doesn't require complex animations, but we should consider:
  - CSS transition duration for theme changes
  - Should we respect prefers-reduced-motion media query?

## Impact on Existing Code

### Files Likely to Require Modification:
1. `src/components/Navbar.tsx` - Add toggle button
2. `src/app/globals.css` - Add CSS variables for day/themes
3. New state management files (to be created)
4. Potential new components: `DayNightToggle.tsx`

### New Files to Create:
1. `src/store/dayNightStore.ts` - Zustand store
2. `src/components/DayNightToggle.tsx` - Toggle component
3. `src/lib/theme.ts` - Theme utility functions (if needed)
4. Migration script for database changes

## Dependencies to Consider
- If using Zustand: `npm install zustand`
- If using Icon Library: May need to install (e.g., `npm install lucide-react` or `@heroicons/react`)
- No additional dependencies for Broadcast Channel API (browser API)
- No additional dependencies for CSS Variables approach

## Success Criteria for Phase 1
1. [ ] Zustand store created with day/night state and persistence
2. [ ] BroadcastChannel implementation for cross-tab sync
3. [ ] DayNightToggle component accessible and functional
4. [ ] CSS Variables implemented for day/night theme switching
5. [ ] Default state set to night mode on first visit
6. [ ] Theme persists across page reloads and browser tabs/windows
7. [ ] No breaking changes to existing functionality
8. [ ] Accessibility requirements met (ARIA, keyboard, screen reader)