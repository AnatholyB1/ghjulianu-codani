# Phase 1: Foundation & Basic Toggle - Execution Plan

## Goal
Implement core infrastructure for day/night state management and basic UI toggle

## Tasks

### 1. Database Schema Extension
- [ ] Create migration script to add `is_day BOOLEAN DEFAULT true` column to photos table
- [ ] Create migration script to add `is_day BOOLEAN DEFAULT true` column to albums table
- [ ] Create database indexes on is_day columns for both tables
- [ ] Create migration script to backfill existing records (set to true/day)
- [ ] Verify schema changes don't break existing functionality
- [ ] Run migration against development database

### 2. State Management System (Zustand)
- [ ] Install zustand package: `npm install zustand`
- [ ] Create DayNight store with state: mode: 'day' | 'night'
- [ ] Implement actions: setMode(mode), toggleMode()
- [ ] Configure zustand/persist middleware for localStorage persistence
- [ ] Implement useDayNight hook for components
- [ ] Set default state to night mode on first visit (per 1-CONTEXT.md decision)
- [ ] Test state persistence across page reloads

### 3. Cross-tab State Synchronization
- [ ] Implement BroadcastChannel API for cross-tab communication
- [ ] Create broadcast channel named 'day-night-channel'
- [ ] Listen for storage events and update local state when external changes detected
- [ ] Prevent infinite update loops
- [ ] Add fallback to polling if events not supported (for older browsers)
- [ ] Test synchronization across multiple browser tabs/windows

### 4. Theme Implementation (CSS Variables)
- [ ] Define day/night color variables in :root or appropriate selector
- [ ] Create CSS variables for colors needed in day/theme modes
- [ ] Update src/app/globals.css to include day/night theme variables
- [ ] Implement theme switching mechanism using CSS classes or CSS variables
- [ ] Apply light theme when mode = 'day', dark theme when mode = 'night'
- [ ] Add smooth transition between themes using CSS transitions
- [ ] Ensure theme applies to entire application consistently
- [ ] Test with prefers-reduced-motion media query

### 5. UI Toggle Component
- [ ] Create DayNightToggle component (src/components/DayNightToggle.tsx)
- [ ] Display appropriate icon (sun/moon) based on current state
- [ ] Use icon library (Lucide or Heroicons as decided in 1-CONTEXT.md)
- [ ] Implement accessible button with proper ARIA labels
- [ ] Make keyboard operable (Space/Enter to toggle)
- [ ] Position consistently in header/navbar (at Nav Left End per 1-CONTEXT.md)
- [ ] Add tooltip explaining functionality
- [ ] Implement visual feedback for hover and active states

### 6. Integration & Testing
- [ ] Integrate DayNightToggle into Navbar component (src/components/Navbar.tsx)
- [ ] Connect toggle to DayNight store actions
- [ ] Ensure theme changes trigger CSS variable updates
- [ ] Verify cross-tab synchronization works with UI toggle
- [ ] Test default state (night mode on first visit)
- [ ] Verify no breaking changes to existing functionality
- [ ] Test accessibility:
  - Keyboard navigation (Tab order, focus indicators)
  - Screen Reader support (ARIA labels, live regions)
  - Color contrast compliance (WCAG AA)
  - Test with various color blindness simulators

## Files to Modify
1. `src/components/Navbar.tsx` - Add toggle button
2. `src/app/globals.css` - Add CSS variables for day/night themes
3. `src/store/dayNightStore.ts` - Zustand store (NEW)
4. `src/components/DayNightToggle.tsx` - Toggle component (NEW)
5. `src/lib/theme.ts` - Theme utility functions (if needed, NEW)
6. Migration scripts for database changes (NEW)

## Dependencies to Install
- zustand (for state management)
- lucide-react or @heroicons/react (for icons, based on final selection)

## Success Criteria
1. [ ] Zustand store created with day/night state and persistence
2. [ ] BroadcastChannel implementation for cross-tab sync
3. [ ] DayNightToggle component accessible and functional
4. [ ] CSS Variables implemented for day/night theme switching
5. [ ] Default state set to night mode on first visit
6. [ ] Theme persists across page reloads and browser tabs/windows
7. [ ] No breaking changes to existing functionality
8. [ ] Accessibility requirements met (ARIA, keyboard, screen reader)

## Verification Criteria
- Manual testing of toggle functionality across pages
- Cross-tab synchronization tested in multiple browser windows
- Theme persistence verified after page refresh and browser restart
- Accessibility audited using axe or similar tool
- Database migration tested and verified
- No console errors or warnings related to day/night functionality