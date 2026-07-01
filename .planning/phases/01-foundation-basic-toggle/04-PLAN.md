---
phase: 01-foundation-basic-toggle
plan: 04
type: execute
wave: 1
depends_on: []
files_modified:
  - src/app/globals.css
  - src/lib/theme.ts
autonomous: true

# Goal-backward verification (derived during planning, verified after execution)
must_haves:
  truths:
    - "CSS variables for day and night themes are defined"
    - "Theme switching mechanism updates CSS classes or variables on the root element"
    - "Light theme applied when mode = 'day', dark theme when mode = 'night'"
    - "Smooth transition between themes using CSS transitions"
  artifacts:
    - path: "src/app/globals.css"
      provides: "CSS variables for day and night themes"
    - path: "src/lib/theme.ts"
      provides: "Theme utility functions to apply mode"
  key_links:
    - from: "src/lib/theme.ts"
      to: "src/app/globals.css"
      via: "CSS variable usage"
      pattern: "var(--*)"
    - from: "src/layout.tsx" (if exists) or "src/app/layout.tsx"
      to: "src/lib/theme.ts"
      via: "Import and useEffect"
      pattern: "import { useEffect } from 'react'; import { useDayNight } from '@/hooks/useDayNight'; import { setTheme } from '@/lib/theme'"

---
<objective>
Implement CSS variables for day/night themes and a mechanism to switch between them.

Purpose: Enable dynamic theme switching without full page reload.
Output: Updated globals.css with theme variables and a theme.ts utility to apply the mode.
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
@.planning/phases/01-foundation-basic-toggle/02-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Define CSS variables for day and night themes</name>
  <files>src/app/globals.css</files>
  <read_first>src/app/globals.css</read_first>
  <action>
    Modify src/app/globals.css to:
    - Define CSS variables for colors used in both day and night modes under :root or a suitable selector.
    - Use CSS variables to define two sets of colors: one for day, one for night.
    - Alternatively, define :root variables and then override them when a .day or .night class is applied to the html or body element.
    - Based on 1-CONTEXT.md decision to use CSS Variables approach.
    - Example approach:
      :root {
        --color-background: #080808;
        --color-surface: #0e0e0e;
        --color-text: #E8E4DC;
        --color-muted: #7a7a74;
        --color-accent: #c8a97e;
        --color-border: rgba(255,255,255,0.07);
      }
      .day {
        --color-background: #fafafa;
        --color-surface: #f5f5f5;
        --color-text: #1a1a1a;
        --color-muted: #666666;
        --color-accent: #c8a97e;
        --color-border: rgba(0,0,0,0.07);
      }
    - Then in the CSS, use var(--color-background) etc.
    - Ensure existing colors are replaced with variables.
    - Add transition for background and color changes: transition: background-color 0.3s, color 0.3s;
  </verify>
    - Check file exists and contains the expected CSS variables.
    - Run: grep -n "--color-background" src/app/globals.css
    - Run: grep -n "\.day" src/app/globals.css
  </acceptance_criteria>
    - [ "src/app/globals.css defines CSS variables for colors" ]
    - [ "src/app/globals.css defines a .day class that overrides the variables for day mode" ]
    - [ "OR defines a .night class and keeps :root as night, or vice versa" ]
    - [ "The CSS uses var(--color-*) for colors" ]
    - [ "Transition property is set for smooth color changes" ]
  </done>
    CSS variables for day and night themes defined.
</task>

<task type="auto">
  <name>Task 2: Create theme utility to apply mode</name>
  <files>src/lib/theme.ts</files>
  <read_first>src/lib/</read_first>
  <action>
    Create src/lib/theme.ts that:
    - Exposes a function setMode(mode: 'day' | 'night') that:
      * If mode === 'day', adds 'day' class to document.documentElement (or document.body) and removes 'night'
      * If mode === 'night', adds 'night' class and removes 'day'
      * Alternatively, sets a CSS variable on the root to indicate mode, but the class approach is simpler.
    - Optionally, can also set a data-theme attribute.
    - Ensures the class is applied early enough to prevent flash of incorrect theme.
    - Is called from a useEffect in the root layout component (see next task).
  </verify>
    - Check file exists and contains the expected code.
    - Run: grep -n "setMode" src/lib/theme.ts
    - Run: grep -n "document.documentElement" src/lib/theme.ts
  </acceptance_criteria>
    - [ "src/lib/theme.ts exports a setMode function" ]
    - [ "setMode adds the appropriate class (day or night) to the document element" ]
    - [ "setMode removes the opposite class" ]
  </done>
    Theme utility created to apply mode via class toggling.
</task>

<task type="auto">
  <name>Task 3: Integrate theme switching with dayNight store</name>
  <files>src/app/layout.tsx (or root layout component)
  <read_first>src/app/layout.tsx, src/hooks/useDayNight.ts, src/lib/theme.ts</read_first>
  <action>
    Update the root layout component (src/app/layout.tsx) to:
    - Import useDayNight from '@/hooks/useDayNight'
    - Import { setMode } from '@/lib/theme'
    - Use useEffect to watch the mode from the hook and call setMode when it changes.
    - Also call setMode on initial mount to set the correct theme based on stored state.
    - This ensures the theme updates whenever the mode changes.
  </verify>
    - Check file exists and contains the expected code.
    - Run: grep -n "useDayNight" src/app/layout.tsx
    - Run: grep -n "setMode" src/app/layout.tsx
  </acceptance_criteria>
    - [ "src/app/layout.tsx imports useDayNight and setMode" ]
    - [ "A useEffect watches the mode and calls setMode(mode)" ]
    - [ "The effect runs on mount and when mode changes" ]
  </done>
    Theme switching integrated with dayNight store.
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] CSS variables are defined and used in styles
- [ ] Toggling mode updates the class on the document element
- [ ] The correct colors are applied for day and night modes
- [ ] Transition is smooth
- [ ] No flash of incorrect theme on page load
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- No errors or warnings introduced
- Theme switches correctly between day and night modes
- CSS variables are used throughout the app for colors
- Transition between themes is smooth
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-basic-toggle/04-SUMMARY.md`
</output>