---
phase: 01-foundation-basic-toggle
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - src/store/dayNightStore.ts
  - src/hooks/useDayNight.ts
  - src/lib/storage.ts
autonomous: true

# Goal-backward verification (derived during planning, verified after execution)
must_haves:
  truths:
    - "Zustand store exists with day/night state management"
    - "State persists to localStorage"
    - "Custom hook useDayNight provides access to store"
    - "Default state is night mode on first visit"
  artifacts:
    - path: "src/store/dayNightStore.ts"
      provides: "Zustand store for day/night state"
    - path: "src/hooks/useDayNight.ts"
      provides: "Custom hook to access day/night state"
    - path: "src/lib/storage.ts"
      provides: "Storage utility for localSync"
  key_links:
    - from: "src/store/dayNightStore.ts"
      to: "src/hooks/useDayNight.ts"
      via: "Import and usage"
      pattern: "import { useDayNightStore } from '@/store/dayNightStore'"
    - from: "src/hooks/useDayNight.ts"
      to: "src/store/dayNightStore.ts"
      via: "Import and usage"
      pattern: "import dayNightStore from '@/store/dayNightStore'"

---
<objective>
Create Zustand store for day/night state with localStorage persistence and custom hook.

Purpose: Establish client-side state management for day/night mode that persists across sessions and tabs.
Output: Zustand store file, custom hook, and storage utility.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/01-foundation-basic-toggle/1-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create Zustand store with persist middleware</name>
  <files>src/store/dayNightStore.ts</files>
  <read_first>src/store/</read_first>
  <action>
    1. Install zustand if not already installed: npm install zustand
    2. Create src/store/dayNightStore.ts with:
       - Import create from 'zustand'
       - Import persist middleware from 'zustand/middleware'
       - Define store interface with: mode: 'day' | 'night'
       - Define actions: setMode(mode: 'day' | 'night'), toggleMode(): void
       - Configure persist middleware with:
         * name: 'day-night-storage'
         * getStorage: () => localStorage (for web)
       - Initialize state with mode: 'night' (default to night on first visit per 1-CONTEXT.md)
       - Export the store and the typed hooks
  </verify>
    - Check file exists and contains the expected code
    - Run: grep -n "create" src/store/dayNightStore.ts
    - Run: grep -n "persist" src/store/dayNightStore.ts
    - Run: grep -n "mode:" src/store/dayNightStore.ts
  </acceptance_criteria>
    - [ "src/store/dayNightStore.ts contains 'create<DayNightState>()'" ]
    - [ "src/store/dayNightStore.ts contains 'persist('" ]
    - [ "src/store/dayNightStore.ts contains 'mode: \"night\"' as initial state" ]
    - [ "src/store/dayNightStore.ts exports 'useDayNightStore' or similar" ]
  </done>
    Zustand store with persistence created and verified.
</task>

<task type="auto">
  <name>Task 2: Create useDayNight hook</name>
  <files>src/hooks/useDayNight.ts</files>
  <read_first>src/hooks/</read_first>
  <action>
    Create src/hooks/useDayNight.ts that:
    - Imports the store from '@/store/dayNightStore'
    - Exposes the state and actions through a custom hook
    - Returns an object with: mode, setMode, toggleMode
    - Follows the existing hook patterns in the codebase (see useT, useLang)
    - Is typed correctly
  </verify>
    - Check file exists and contains the expected code
    - Run: grep -n "useDayNightStore" src/hooks/useDayNight.ts
    - Run: grep -n "mode" src/hooks/useDayNight.ts
    - Run: grep -n "setMode" src/hooks/useDayNight.ts
  </acceptance_criteria>
    - [ "src/hooks/useDayNight.ts imports from '@/store/dayNightStore'" ]
    - [ "src/hooks/useDayNight.ts returns an object with mode, setMode, toggleMode properties" ]
    - [ "src/hooks/useDayNight.ts is a valid TypeScript file (.*)"src/hooks/useDayNight.ts
</acceptance_catch