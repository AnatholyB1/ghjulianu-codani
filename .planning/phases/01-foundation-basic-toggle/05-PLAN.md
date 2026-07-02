---
phase: 01-foundation-basic-toggle
plan: 05
type: execute
wave: 2
depends_on: ["02", "04"]
files_modified:
  - src/components/DayNightToggle.tsx
  - src/components/Navbar.tsx
  - src/lib/icons.ts (if needed)
autonomous: true

# Goal-backward verification (derived during planning, verified after execution)
must_haves:
  truths:
    - "DayNightToggle component exists and is functional"
    - "Component displays appropriate sun/moon icon based on state"
    - "Component is accessible (ARIA labels, keyboard operable)"
    - "Component is positioned at Nav Left End as per 1-CONTEXT.md"
    - "Clicking the toggle changes the day/night mode"
  artifacts:
    - path: "src/components/DayNightToggle.tsx"
      provides: "Accessible day/night toggle component"
    - path: "src/components/Navbar.tsx"
      provides: "Navbar with integrated toggle"
  key_links:
    - from: "src/components/DayNightToggle.tsx"
      to: "src/store/dayNightStore.ts"
      via: "useDayNight hook"
      pattern: "import { useDayNight } from '@/hooks/useDayNight'"
    - from: "src/components/DayNightToggle.tsx"
      to: "src/lib/theme.ts"
      via: "setTheme function"
      pattern: "import { setTheme } from '@/lib/theme'"
    - from: "src/components/Navbar.tsx"
      to: "src/components/DayNightToggle.tsx"
      via: "Component import and usage"
      pattern: "<DayNightToggle />"

---
<objective>
Create an accessible day/night toggle button and integrate it into the navbar.

Purpose: Provide users with a clear way to switch between day and night modes.
Output: DayNightToggle component used in Navbar.
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
@.planning/phases/01-foundation-basic-toggle/04-PLAN.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create DayNightToggle component</name>
  <files>src/components/DayNightToggle.tsx</files>
  <read_first>src/components/, src/hooks/useDayNight.ts, src/lib/theme.ts</read_first>
  <action>
    Create src/components/DayNightToggle.tsx that:
    - Uses lucide-react icons (already installed per package.json) for sun and moon
    - Based on 1-CONTEXT.md decision to use Icon Library (Lucide or Heroicons)
    - Shows moon icon for night mode, sun icon for day mode
    - Is an accessible button with:
      * aria-label="Toggle day/night mode"
      * role="button"
      * keyboard operable (Space and Enter keys)
      * focus visible
    - Has tooltip explaining functionality (use title attribute or tooltip library if available)
    - When clicked:
      * Toggles the mode via useDayNight hook's toggleMode function
      * Optionally provides visual feedback (active state)
    - Is styled appropriately (size, colors, hover effects)
    - Follows the existing code style in the project
  </verify>
    - Check file exists and contains the expected code
    - Run: grep -n "LucideIcon\|Moon\|Sun" src/components/DayNightToggle.tsx
    - Run: grep -n "aria-label" src/components/DayNightToggle.tsx
    - Run: grep -n "onClick\|toggleMode" src/components/DayNightToggle.tsx
  </acceptance_criteria>
    - [ "src/components/DayNightToggle.tsx uses lucide-react for icons" ]
    - [ "Component displays moon icon when mode is 'night'" ]
    - [ "Component displays sun icon when mode is 'day'" ]
    - [ "Component has aria-label='Toggle day/night mode'" ]
    - [ "Component is button element or has role='button'" ]
    - [ "Component responds to click by calling toggleMode" ]
    - [ "Component is keyboard operable (Space/Enter)" ]
  </done>
    DayNightToggle component created with proper icons and accessibility.
</task>

<task type="auto">
  <name>Task 2: Integrate toggle into Navbar component</name>
  <files>src/components/Navbar.tsx</files>
  <read_first>src/components/Navbar.tsx, src/components/DayNightToggle.tsx</read_first>
  <action>
    Update src/components/Navbar.tsx to:
    - Import the DayNightToggle component
    - Place it at Nav Left End (before the logo) as per 1-CONTEXT.md decision
    - Position it appropriately in the flex layout
    - Ensure it doesn't break existing layout
    - Add any necessary styling adjustments
  </verify>
    - Check file exists and contains the expected code
    - Run: grep -n "DayNightToggle" src/components/Navbar.tsx
    - Look for the component placement before the logo link
  </acceptance_criteria>
    - [ "src/components/Navbar.tsx imports DayNightToggle from '@/components/DayNightToggle'" ]
    - [ "DayNightToggle appears before the logo/link in the JSX" ]
    - [ "Component is positioned at Nav Left End" ]
  </done>
    DayNightToggle integrated into Navbar at Nav Left End.
</task>

<task type="auto">
  <name>Task 3: Add tooltip and visual feedback</name>
  <files>src/components/DayNightToggle.tsx</files>
  <read_first>src/components/DayNightToggle.tsx</read_first>
  <action>
    Enhance the DayNightToggle component:
    - Add a tooltip on hover that explains the function (e.g., "Switch to day mode" or "Switch to night mode")
    - Implement visual feedback for hover and active states (e.g., subtle background color change)
    - Ensure the tooltip text updates based on current mode
    - Use CSS for hover/active states (no additional libraries needed)
  </verify>
    - Check file exists and contains the expected code
    - Run: grep -n "title\|tooltip" src/components/DayNightToggle.tsx
    - Run: grep -n "hover\|hover:" src/components/DayNightToggle.tsx
  </acceptance_criteria>
    - [ "Component has a title attribute that changes based on mode" ]
    - [ "OR implements a custom tooltip on hover" ]
    - [ "Component shows visual feedback on hover (background color change, etc.)" ]
    - [ "Component shows visual feedback when active (pressed)" ]
  </done>
    Tooltip and visual feedback added to DayNightToggle.
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] DayNightToggle component is accessible (ARIA, keyboard)
- [ ] Icon correctly reflects current state
- [ ] Toggling updates the mode and triggers theme change
- [ ] Component is placed at Nav Left End in Navbar
- [ ] Tooltip and visual feedback present
- [ ] Implementation follows 1-CONTEXT.md decisions for icon source and placement
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- No errors or warnings introduced
- Toggle correctly switches between day and night modes
- Icons update immediately when toggled
- Component is fully accessible (WCAG AA compliant for contrast, keyboard, screen reader)
- Tooltip provides clear feedback on hover
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-basic-toggle/05-SUMMARY.md`
</output>