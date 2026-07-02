# Root Cause Analysis: Next.js Layout Theme Error

## Problem
The `src/app/layout.tsx` file had two conflicting Next.js constraints:
1. It used React hooks (`useEffect`, `useLayoutEffect`) which require a client component
2. It exported `metadata` which is only allowed in server components

## Root Cause
Attempting to use React hooks for theme switching in a layout that also needed to export metadata violated Next.js's server/client component boundaries.

## Solution
Separated concerns by:
1. Keeping the metadata export in the server component (RootLayout)
2. Moving the theme logic to a separate client component (ThemeProvider) wrapped with `'use client'` directive
3. Using the Context Pattern to provide theme state to children

## Changes Made
- Added `'use client'` directive before the ThemeProvider function
- Moved `useDayNight` hook and `setMode` call into the ThemeProvider client component
- Wrapped `<SiteShell>` and `<Analytics>` with `<ThemeProvider>` in RootLayout
- Preserved all metadata exports in the server component portion

## Verification
The solution follows Next.js best practices:
- Server components handle data fetching and metadata
- Client components handle interstate and browser APIs
- Proper separation of concerns maintains compatibility with both SSR and client-side navigation