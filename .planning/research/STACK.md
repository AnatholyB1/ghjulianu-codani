# Project Research — Stack for Day/Night Photo Filtering

## Existing Context
This Next.js 14+ app uses:
- React 18+ with App Router
- Tailwind CSS for styling
- Supabase for backend/storage
- TypeScript for type safety
- Shadcn/ui components via Radix UI primitives

## Stack Additions/Changes Needed
- **State Management**: Add global state for day/night toggle (Zustand or React Context)
- **Theme Integration**: Extend Tailwind config with day/night color schemes
- **Database Schema**: Add `is_day` boolean field to photos and albums tables
- **API Routes**: Create endpoint to update photo/album day/night flags
- **Components**: 
  - ThemeToggle component (using shadcn/ui toggle)
  - DayNightFilterProvider context
  - Updated photo/album filtering utilities
- **Utilities**: 
  - Image analysis helper for auto-detecting day/night (optional)
  - Date/time helpers for determining time of day

## Recommended Versions/Integrations
- Keep Next.js 14+ (App Router)
- Keep Tailwind CSS (extend config)
- Keep Supabase (extend schema)
- Consider adding: 
  - `zustand` for lightweight state management OR enhance existing Context API usage
  - `date-fns` for time-based day/night detection
  - Potential: `sharp` or similar for image analysis (if implementing auto-detection)

## Integration Points
- Global layout/context to provide theme state
- Photo and album query functions to filter by `is_day` field
- Admin forms to toggle day/night flag
- Theme provider that switches based on day/night selection