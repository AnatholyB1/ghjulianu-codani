# Project Research — Pitfalls for Day/Night Photo Filtering

## Common Mistakes When Adding Day/Night Features

### Data Modeling Issues
- **Boolean vs Enum**: Using boolean limits future expansion (dawn/dusk, golden hour, etc.)
  - Prevention: Consider using enum ('day', 'night', 'unknown') or separate timestamp fields
- **Null Values**: Forgetting to set default values causing NULLs in database
  - Prevention: Always specify DEFAULT values in migrations
- **Index Missing**: Not adding database indexes leading to slow queries on large galleries
  - Prevention: Add indexes during migration, test with production-like data sizes

### State Management Problems
- **Stale State**: Not synchronizing state between tabs/windows
  - Prevention: Use localStorage change events or broadcast channel API
- **Hydration Mismatch**: SSR/CSR mismatch when checking localStorage on mount
  - Prevention: Initialize state on client-only or use useEffect with proper guards
- **Over-fetching**: Loading all photos then filtering client-side wasting bandwidth
  - Prevention: Filter at database level for initial loads

### UI/UX Pitfalls
- **Inconsistent State**: Theme doesn't match photo filter mode
  - Prevention: Create single source of truth that controls both
- **Accessibility**: Toggle not keyboard accessible or missing screen reader labels
  - Prevention: Use proper button/role attributes, test with screen readers
- **Motion Sensitivity**: Animations triggering vestibular disorders
  - Prevention: Respect `prefers-reduced-motion` media query
- **Flash of Incorrect Theme**: Showing wrong theme during hydration
  - Prevention: Store preference in HTML attribute or use server-side detection

### Performance Bottlenecks
- **Unnecessary Re-renders**: Context updates causing entire photo grid to re-render
  - Prevention: Memoize context value, split context if needed
- **Large Initial Load**: Still loading all photos even when filtered
  - Prevention: Ensure database queries actually limit results
- **Animation Performance**: JS-based animations blocking main thread
  - Prevention: Use CSS transitions/transforms or FLIP technique

### Integration Specific Risks
- **Admin Inconsistency**: Different ways to set day/night in different admin screens
  - Prevention: Create shared component/form field for day/night selection
- **Mobile Experience**: Toggle hard to reach or too small on touch devices
  - Prevention: Ensure minimum 44x44pt touch target, consider placement
- **Conflict with Existing Features**: Interfering with search, sort, or filter features
  - Prevention: Design day/night as orthogonal filter that combines with others
- **Backup/Migration Issues**: Forgetting to migrate existing data
  - Prevention: Create comprehensive migration scripts with validation

### Testing Oversights
- **Edge Cases**: Not testing null/undefined values in day/night fields
- **Performance**: Not testing with large datasets (1000+ photos)
- **Accessibility**: Not testing with screen readers or keyboard navigation
- **Dark/Light Transitions**: Not testing rapid toggling
- **Server Components**: Issues with client-only state in Server Components

### Prevention Strategies
1. **Data First**: Complete database migration and validation before UI work
2. **Feature Flags**: Roll out behind flag for testing
3. **Component Isolation**: Build toggle/theme switching logic from presentation
4. **Comprehensive Testing**: Unit tests for filters, integration tests for flows
5. **Performance Budgets**: Set limits on query times and bundle impact
6. **Accessibility Audit**: Check with axe or similar tools during development
7. **User Testing**: Validate with actual photographers who understand day/night concepts

## Specific Recommendations for This Project
1. Start with simple boolean flags in photos/albums tables
2. Implement filtering at the database query level
3. Use React Context for global state with localStorage persistence
4. Tie theme selection directly to day/night mode (day=light, night=dark)
5. Use CSS transitions for smooth changes, respecting user preferences
6. Add clear visual indicators (sun/moon icons) with tooltips
7. In admin, use clear checkboxes labeled "Daytime photo" or similar
8. Test with existing photo dataset to ensure performance
9. Consider making album-level setting override photo-level when implemented
10. Document the feature clearly for future maintainers