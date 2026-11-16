# REF-31

Authoritative state: [master ticket](../master-tickets.md#ref-31).

## Approved small-ticket lane

The owner's standing workflow assigns small eligible tickets to Sonnet 5.5 medium, with actual
GPT-6.1 Sol medium code review and serialized delivery. Start only after REF-20 is delivered with
green exact-SHA CI and releases its rewind reservation. No Sonnet worker has been assigned yet.

## User-facing contract

Holding Space toggles playback once, not on every repeated keydown. Releasing and pressing Space
again toggles again. Preserve existing modifier, input, contenteditable, help, busy and export
guards. Do not change J/K/L or arrow-repeat behavior.

Pause rewind when the tab becomes hidden. Returning to the tab leaves playback paused at the held
frame, without rewinding through the elapsed hidden interval. The timecode, playhead and displayed
media must agree. Starting rewind again uses a fresh clock, not the previous hidden interval.

## Evidence before editing

The baseline review identified both paths by code reading. Current `src/App.tsx` directly toggles
speed on every Space keydown and accumulates elapsed wall-clock time in its rewind tick. These
observations are not new end-to-end reproductions. Reproduce both through real transport before
implementing fixes, on the delivered REF-20 base.

Use actual browser tab visibility changes for the hidden-tab case and assert that the page really
becomes hidden. An overridden `document.hidden`, synthetic visibility event alone, or an arbitrary
timeout without visibility evidence does not qualify this behavior.

## Scope and ownership

- `src/App.tsx`: only rewind visibility lifecycle and repeated-Space handling.
- New `tests/transport-lifecycle.spec.ts`: focused transport regression journeys.
- This brief: actual red/green, mutation, verification and delivery evidence.
- The queue owner retains `docs/master-tickets.md` and push authorization.

Do not edit cursor controls, inspector or drawer layout, styles, ui-sdk, media import, project
format, exporter, or test configuration. REF-20's editor/performance assertions remain intact. Avoid
generic transport refactoring and preserve playback responsiveness.

## Acceptance

1. Both original failures reproduce through actual browser/user-facing transport.
2. A held Space makes one transition; a separate press makes the next. Existing shortcut guards,
   J/K/L and repeated frame stepping still work.
3. Hiding during rewind pauses it. Returning does not jump by time spent hidden; held frame,
   timecode and playhead agree. A fresh rewind works normally.
4. Each defect has a red/green regression and a deliberate mutation that fails that regression.
5. Strict static, typed, formatting and shrink-only Fallow gates, unit/helper tests, production and
   Storybook builds, full isolated browser gate and separate five-repeat performance gate pass.
6. A real-pointer/keyboard interaction clip and representative states are inspected. No real-device,
   physical-audio or cross-browser qualification is implied by Chromium checks.
7. Sol accepts the actual transferred diff and exact head. The worker obtains the exclusive slot,
   verifies current main/identity/clean tree, pushes once and waits for exact-SHA CI before release.

## Initial state and preflight

Use [dispatch preflight](../ticket-workflow.md#initial-state-and-preflight). Fetch the latest main
after REF-20 delivery rather than using this planning base. Account for already delivered UI-1 and
any disjoint cursor/drawer work. Never replace App wholesale from a stale checkout.
