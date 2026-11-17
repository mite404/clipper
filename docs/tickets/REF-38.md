# REF-38

Authoritative state: [master ticket](../master-tickets.md#ref-38).

## User story

As an editor, I want unmodified Space to play or pause the timeline while Clipper has focus, even
when a control has keyboard or Tab focus, so a focus ring does not silently disable transport.

## Reproduction and ownership

The [scoping owner](https://ampcode.com/threads/T-ddaeb91f-8aef-46e1-864d-45326437aea3) inspected
the owner's recording and probed the production build at `cd9500d`. The recording shows the Timeline
scale slider focused while transport remains paused, followed by playback after focus leaves it. The
recording alone does not establish every keypress or a failure on the Media button.

The live probe reproduced the gap on native ranges, selects, number/file inputs and checkboxes.
Buttons, custom trim sliders, panel resize separators and the scrollable timeline already route
Space to transport. The window keydown handler in `src/App.tsx` returns for every INPUT, TEXTAREA
and SELECT before reaching Space handling. Do not describe this as all focused controls failing.

This generalizes UI-7's focused-Media Space behavior. It does not duplicate delivered REF-31's
held-Space repeat fix. REF-31's current test deliberately expects a focused native playhead to stay
paused; implementing this request must deliberately replace that expectation. Coordinate CLIP-2e's
shortcut guard with this contract rather than introducing contradictory predicates.

## Input boundaries

- The owner decided that checkbox Space plays/pauses and Enter toggles the checkbox. Native Enter
  does not toggle it, so implement and test that explicit accessible replacement before taking
  Space.
- The owner keeps number inputs and other text-entry fields outside transport Space handling.
  Preserve text entry rather than silently exempting every INPUT element again.
- The owner confirmed that Enter opens a focused closed select via `showPicker()`, while Space
  plays/pauses without changing its value. If `showPicker()` is unavailable or throws, preserve
  arrow-key access. Native Enter alone did not open the closed select in the Chromium probe.
- Preserve help-dialog, busy, export, markingMouse, modifier-chord and held-key repeat safeguards.

## Acceptance

1. A real focused-control browser journey proves one play/pause transition per unmodified press on
   native ranges, including timeline scale/playhead, source position and inspector sliders. The
   focused control's value and native action remain unchanged by transport Space.
2. Buttons, custom trim sliders and resize separators retain working transport behavior. Cover
   Tab-acquired and pointer-acquired focus, and preserve REF-31's held-key rule.
3. Checkbox Enter toggles without playing; checkbox Space plays without toggling. Text/number entry
   does not operate transport. Select Space toggles transport without changing the selection; Enter
   opens its native picker when supported, with arrow keys remaining usable otherwise. Preserve
   keyboard access to every affected control and prevent unintended native activation.
4. Update the contradictory REF-31 playhead expectation and relevant UI-7 comments intentionally.
   Keep shortcut help accurate without changing C/V/cut scope or opening a source-lifecycle rewrite.
5. Retain a browser red, corrected green and mutation check, inspected pointer/keyboard evidence,
   strict shrink-only gates, full integrated acceptance, exact-candidate independent review,
   serialized main delivery and exact-SHA green CI.

## Source

The Space relayed Mite's request from `M-034yrCdljjk3AmKs7rNeRr`. The scoping owner returned the
final checkbox, text-entry and dropdown decisions. This brief grants no source implementation; the
master owns any subsequent exact-path grant. REF-32 is accepted independently.
