# Project Research — Architecture for Day/Night Photo Filtering

## Existing Architecture
From code review:
- Next.js 14 App Router structure
- Components organized in `/src/components`
- Pages in `/src/app` using route groups
- Admin routes in `/src/app/admin`
- Supabase integration via `/src/utils/supabase/*`
- Context API used for language and cart state
- Tailwind CSS for styling
- shadcn/ui components via Radix primitives

## Integration Points for Day/Night Feature

### Data Layer
- **Photos table**: Add `is_day BOOLEAN DEFAULT true` column
- **Albums table**: Add `is_day BOOLEAN DEFAULT true` column
- **Indexes**: Add indexes on `is_day` columns for query performance
- **Migration**: Backfill existing records (default to true/day)

### State Management
- **Global State**: Create `DayNightContext` using React Context API
  - State: `mode: 'day' | 'night'`
  - Actions: `setMode`, `toggleMode`
  - Persistence: Save to localStorage
- **Alternative**: Consider Zustand if state complexity grows

### Presentation Layer
- **Theme Integration**: 
  - Create `theme.ts` that generates different Tailwind configs based on mode
  - Or use CSS variables with `:root` and `[data-theme="day"]`/`[data-theme="night"]`
  - Simpler approach: Use `className` on `html` or `body` element
- **UI Components**:
  - `DayNightToggle`: Button with sun/moon icon
  - `DayNightProvider`: Wrapper component for app
  - Use shadcn/ui `Toggle` component as base

### Filtering Logic
- **Photo Queries**: Modify `getPhotos()` to include `is_day = eq($mode)` filter
- **Album Queries**: Modify `getAlbums()` similarly
- **Location**: Filtering happens in Supabase queries (server-side) for initial load
- **Client-side**: Optionally filter already-loaded data for instant UI updates

### Animation Strategy
- **Page Transitions**: Use Framer Motion or CSS transitions
- **Element Animations**: Fade/slide photos in/out when filtering changes
- **Theme Transition**: CSS transition on background/color properties
- **Duration**: 300-500ms for smooth but not distracting

### Build Order Considerations
1. Database migration (add columns)
2. Backend API updates (if needed for direct updates)
3. State management implementation
4. UI components (toggle, provider)
5. Theme switching mechanism
6. Data filtering implementation
7. Admin UI updates (checkboxes in forms)
8. Animation polish
9. Persistence (localStorage/database)

### Performance Implications
- **Database**: Index on `is_day` columns essential for large datasets
- **Network**: No additional API calls needed if filtering in existing queries
- **Client State**: Minimal overhead (single boolean + setter)
- **Rendering**: Conditional rendering of already-fetched data is efficient
- **Animation**: Use `requestAnimationFrame` or CSS transforms for smoothness

### Integration Points with Existing Code
- **Layout**: Add provider to root layout
- **Header/Navbar**: Add toggle button to navigation
- **PhotoCard/AlbumCard**: No changes needed if filtering happens upstream
- **Admin Forms**: Add checkbox to photo/album edit forms
- **Loading States**: Ensure filters work with existing loading/skeleton UIs