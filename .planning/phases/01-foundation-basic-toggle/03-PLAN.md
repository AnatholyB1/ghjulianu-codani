---
phase: 01-foundation-basic-toggle
plan: 03
type: execute
wave: 2
depends_on: ["02"]
files_modified:
  - src/lib/broadcastChannel.ts
  - src/store/dayNightStore.ts
autonomous: true

# Goal-backward verification (derived during planning, verified after execution)
must_haves:
  truths:
    - "BroadcastChannel API is used for cross-tab communication"
    - "Storage event listener is implemented as fallback"
    - "State updates from other tabs/windows are received and applied"
    - "No infinite update loops occur"
  artifacts:
    - path: "src/lib/broadcastChannel.ts"
      provides: "BroadcastChannel wrapper with fallback"
    - path: "src/store/dayNightStore.ts"
      provides: "Updated store with subscription to broadcast events"
  key_links:
    - from: "src/lib/broadcastChannel.ts"
      to: "src/store/dayNightStore.ts"
      via: "Import and usage"
      pattern: "import { createBroadcastChannel } from '@/lib/broadcastChannel'"
    - from: "src/store/dayNightStore.ts"
      to: "src/lib/broadcastChannel.ts"
      via: "Import and usage"
      pattern: "import { broadcastChannel } from '@/lib/broadcastChannel'"

---
<objective>
Implement cross-tab state synchronization using BroadcastChannel API with storage event fallback.

Purpose: Ensure day/night state remains consistent across all browser tabs and windows.
Output: BroadcastChannel utility and store integration.
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
  <name>Task 1: Create BroadcastChannel utility with fallback</name>
  <files>src/lib/broadcastChannel.ts</files>
  <read_first>src/lib/</read_first>
  <action>
    Create src/lib/broadcastChannel.ts that:
    - Detects if BroadcastChannel API is available (window.BroadcastChannel)
    - If available, creates a BroadcastChannel with name 'day-night-channel'
    - If not available, falls back to storage event listener on localStorage
    - Provides a subscribe(callback) method to listen for messages
    - Provides a send(message) method to broadcast messages
    - Handles cleanup to prevent memory leaks
    - Prevents echo messages (ignoring messages sent by the same window/tab)
    - Follows the pattern from 1-CONTEXT.md decision
  </verify>
    - Check file exists and contains the expected code
    - Run: grep -n "BroadcastChannel" src/lib/broadcastChannel.ts
    - Run: grep -n "day-night-channel" src/lib/broadcastChannel.ts
    - Run: grep -n "subscribe" src/lib/broadcastChannel.ts
  </acceptance_criteria>
    - [ "src/lib/broadcastChannel.ts handles Broadcast API availability check" ]
    - [ "src/lib/broadcastChannel.ts implements fallback to storage events" ]
    - [ "src/lib/broadcastChannel.ts provides send and subscribe methods" ]
    - [ "src/lib/broadcastChannel.ts prevents echo messages" ]
  </done>
    BroadcastChannel utility with fallback created and verified.
</task>

<task type="auto">
  <name>Task 2: Integrate BroadcastChannel with dayNight store</name>
  <files>src/store/dayNightStore.ts</files>
  <read_first>src/store/dayNightStore.ts, src/lib/broadcastChannel.ts</read_first>
  <action>
    Update src/store/dayNightStore.ts to:
    - Import the broadcastChannel from '@/lib/broadcastChannel'
    - On store initialization, subscribe to the broadcast channel
    - When a message is received (with type 'DAY_NIGHT_UPDATE' and payload { mode }), update the store state if different
    - When the store state changes (via setMode or toggleMode), broadcast a message to other tabs
    - Ensure the broadcast does not trigger an update in the originating tab (ignore own messages)
    - Clean up subscriptions on store destruction (if applicable)
  </verify>
    - Check file exists and contains the expected code
    - Run: grep -n "broadcastChannel" src/store/dayNightStore.ts
    - Run: grep -n "subscribe" src/store/dayNightStore.ts
    -store.ts
    - Run: grep -n "send" src/store/dayNightStore.ts
  </acceptance_criteria>
    - [ "src/store/dayNightStore.ts imports broadcastChannel from '@/lib/broadcastChannel'" ]
    - [ "src/store/dayNightStore.ts subscribes to broadcast channel on initialization" ]
    - [ "src/store/dayNightStore.ts broadcasts state changes to other tabs" ]
    - [ "src/store/dayNightStore.ts ignores own broadcasts to prevent loops" ]
  </done>
    DayNight store integrated with BroadcastChannel for cross-tab sync.
</task>

</tasks>

<verification>
Before declaring plan complete:
- [ ] BroadcastChannel utility exists with proper fallback
- [ ] DayNight store subscribes to and broadcasts via BroadcastChannel
- [ ] No infinite loops in communication
- [ ] Implementation follows 1-CONTEXT.md decision for BroadcastChannel API
</verification>

<success_criteria>

- All tasks completed
- All verification checks pass
- No errors or warnings introduced
- Cross-tab synchronization works: changing mode in one tab updates others
- Storage event fallback works for browsers without BroadcastChannel
- No duplicate updates or loops
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation-basic-toggle/03-SUMMARY.md`
</output>