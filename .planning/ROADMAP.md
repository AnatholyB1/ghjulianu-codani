# Day/Night Photo Filtering Roadmap

## Phase 1: Foundation & Basic Toggle

**Goal**: Implement core infrastructure for day/night state management and basic UI toggle
**Requirements**: CTR-01, CTR-02, TEC-01, TEC-02
**Success Criteria**:

1. Database migration adding is_day columns to photos and albums tables completed
2. DayNightContext React provider implemented with localStorage persistence
3. Visible toggle switch displayed in header with sun/moon icons
4. Basic theme switching (light/dark) working based on toggle state
5. Cross-tab state synchronization functional

## Phase 2: Photo & Album Filtering

**Goal**: Implement filtering logic to show/hide content based on day/night selection
**Requirements**: CTR-03, CTR-04, CTR-05, CTR-06, CTR-07, CTR-08
**Success Criteria**:

1. Photo gallery displays only photos matching current day/night mode
2. Album listing displays only albums matching current day/night mode
3. Filtering happens at Supabase query level (not client-side only)
4. Default state shows all content when no preference set (or defaults to day)
5. Database indexes created on is_day columns for performance

## Phase 3: Admin Controls

**Goal**: Enable users to mark photos and albums as day or night
**Requirements**: PHO-01, PHO-02, PHO-03, ALB-01, ALB-02, ALB-03
**Plans:** 4/5 plans executed
Plans:
**Wave 1**

- [x] 03-01-PLAN.md — Schema migration: add is_day to album_photos + type update
- [x] 03-02-PLAN.md — Server Actions: 3 new + extend updateAlbum with is_day

**Wave 2** *(blocked on Wave 1 completion)*

- [x] 03-03-PLAN.md — PortfolioAdminGrid + DayNightToggleBadge + bulk selection
- [x] 03-04-PLAN.md — AlbumSortableList indicator + album edit form is_day radio

**Wave 3** *(blocked on Wave 2 completion)*

- [ ] 03-05-PLAN.md — DraggablePhotoGrid inheritance badge (ALB-02)

**Success Criteria**:

1. Admin photo edit form includes checkbox to mark photo as day/night
2. Admin album edit form includes checkbox to mark album as day/night
3. Visual indicators show day/night status in admin lists
4. Bulk selection tools allow marking multiple items as day/night
5. Album-level day/night setting takes precedence over photo-level when implemented

## Phase 4: Polish & Enhancements

**Goal**: Add animations, accessibility improvements, and refine user experience
**Requirements**: ANI-01, ACC-01, ACC-02, ACC-03, PER-01, PER-02, PER-03
**Success Criteria**:

1. Smooth animated transitions when switching between modes (300-500ms)
2. Respects prefers-reduced-motion user setting
3. Full keyboard accessibility for all controls
4. WCAG AA color contrast compliance
5. No flash of incorrect theme during hydration/loading
6. Performance validated with large datasets (1000+ photos)
7. User preference persists reliably across sessions and devices
8. Final QA passes accessibility and performance audits

## Phase Details

### Phase 1: Foundation & Basic Toggle

Goal: Implement core infrastructure for day/night state management and basic UI toggle
Requirements: CTR-01, CTR-02, TEC-01, TEC-02
Success Criteria:

1. Database migration adding is_day columns to photos and albums tables completed
2. DayNightContext React provider implemented with localStorage persistence
3. Visible toggle switch displayed in header with sun/moon icons
4. Basic theme switching (light/dark) working based on toggle state
5. Cross-tab state synchronization functional

### Phase 2: Photo & Album Filtering

Goal: Implement filtering logic to show/hide content based on day/night selection
Requirements: CTR-03, CTR-04, CTR-05, CTR-06, CTR-07, CTR-08
Success Criteria:

1. Photo gallery displays only photos matching current day/night mode
2. Album listing displays only albums matching current day/night mode
3. Filtering happens at Supabase query level (not client-side only)
4. Default state shows all content when no preference set (or defaults to day)
5. Database indexes created on is_day columns for performance

### Phase 3: Admin Controls

Goal: Enable users to mark photos and albums as day or night
Requirements: PHO-01, PHO-02, PHO-03, ALB-01, ALB-02, ALB-03
Success Criteria:

1. Admin photo edit form includes checkbox to mark photo as day/night
2. Admin album edit form includes checkbox to mark album as day/night
3. Visual indicators show day/night status in admin lists
4. Bulk selection tools allow marking multiple items as day/night
5. Album-level day/night setting takes precedence over photo-level when implemented

### Phase 4: Polish & Enhancements

Goal: Add animations, accessibility improvements, and refine user experience
Requirements: ANI-01, ACC-01, ACC-02, ACC-03, PER-01, PER-02, PER-03
Success Criteria:

1. Smooth animated transitions when switching between modes (300-500ms)
2. Respects prefers-reduced-motion user setting
3. Full keyboard accessibility for all controls
4. WCAG AA color contrast compliance
5. No flash of incorrect theme during hydration/loading
6. Performance validated with large datasets (1000+ photos)
7. User preference persists reliably across sessions and devices
8. Final QA passes accessibility and performance audits
