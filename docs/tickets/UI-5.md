# UI-5

[Master scope and acceptance](../master-tickets.md#ui-5).

## Behavior

The media pool, inspector and timeline have keyboard-focusable drag separators on desktop. Pointer
movement changes CSS geometry directly; only release commits the changed size. Escape, pointer
cancel, lost capture, window blur, viewport changes and disabling a handle restore its prior size.
Arrow keys step 16px, Shift steps 64px, Home/End select the effective limits, and double-click
resets to the responsive default. Layout changes do not enter project history or persistent storage.

The controls immediately before the timecode hide the timeline and switch between responsive default
and remembered custom height. Hide transfers focus to the footer's restore control; restore returns
it to Hide. Custom height survives default, hidden and temporarily clamped states. The hidden
timeline stays mounted, inert and measurable, preserving playback, selection, scale and scroll
without modifying the timeline scale hook.

The native ruler slider now has a visible thumb, pressed feedback and focus outline. Its thumb
center and ruler/body markers share frame-over-duration geometry, including the last frame. Native
click, drag and keyboard seeking remain unchanged. No new track gesture or clip hit target is added.

## Source reuse

Adapted owner-authored Yaklabs captured-pointer/direct-CSS resizing, keyboard steps and reset from
`apps/web/src/shell/sidebar-resize.tsx` at revision `1ccdae55a5f26e96c042a322f980db9e226b3c41`. The
exact public source was inspected before adaptation. The author's explicit reuse request permits
this adaptation. No repository license was found; this does not assert an open-source license or
copy a third-party splitter wrapper. No dependency added.

## Joint bounds

- Media minimum 170px; inspector minimum 210px. Each maximum is 480px or 35% of workspace width,
  reduced by the other visible pane to reserve at least 480px for editing.
- Timeline minimum 320px, leaving at least 160px of track scrolling after transport, toolbar, scale
  control and footer. Maximum reserves 240px for the upper row. Both upper side panes and editing
  area scroll independently when their contents exceed that row.
- Below 560px available workspace height, desktop uses a 240px upper row and 320px timeline in page
  flow. Its footer is non-sticky so it cannot cover the ruler. Desktop dividers are hidden at
  viewport widths up to 960px, retaining the existing stacked layout and media drawer behavior.
- Desired sizes remain distinct from effective bounds, so temporary clamping never rewrites them.

## Verification

The first timeline test failed on the missing separator. Further browser reds caught playback
overwriting a provisional drag, hidden layout resetting maximum zoom, the invisible native slider,
and the sticky footer covering the short-window ruler. Each has a corresponding behavior check.

`tests/workspace-layout.spec.ts` covers captured pointer release and rollback, all three axes,
keyboard steps and bounds, default/custom/hide/restore retention, hidden playback continuity,
scroll/zoom retention, joint extremes and responsive fallback. `tests/controls.spec.ts` covers
visible native seeking, frame alignment at multiple scales, scrolling, resizing and endpoints.
`src/PanelResizeHandle.stories.tsx` exposes the same shared control on both axes.

A later full run exposed a test-only viewport race. At 961px, the assertion captured the old 448px
maximum before resize delivery updated it to 271px. The extremes test now waits for layout frames
after viewport emulation before sending keys. Ten repeated runs passed without changing bounds,
assertions, retries or application code. The failed trace remains in `verification/all-oyDAj4`.

The original transferred patch reproduced tree `64cb8102012b18e644eb60d8bbb045e345853457` on
accepted `07db762`. Source review found two defects, both reproduced through real browser input on
that unchanged tree. A sideways-only drag manufactured a custom height from the fractional default.
Export followed by Cancel at 1440x730 left the short-window fallback active. The correction rounds
the responsive default and observes the editor container with the existing ResizeObserver.

The correction patch SHA-256 is `3adfb4867dad073cde7b4897681f6a371aff0c29c94b952267b29fb9bc78f99a`.
It reproduces tree `609e790fb8e2628e332746b4a24ee0cb624c0326`. Both existing independent reviewers,
[Sol](https://ampcode.com/threads/T-8d28222c-4b4e-4430-b695-72888a11014b) and
[Fable](https://ampcode.com/threads/T-2d1e888a-23ff-4bf4-b2d1-551553f2ef0a), returned LAND for the
exact correction. Their verdicts are static source review, not independent browser acceptance.

The coordinator's first full run also exposed a fit-scale observation race. Separate reads combined
an old minimum of 20.5 with a new maximum of 2890.6666666666665. Atomic snapshots contained valid
pairs of 20.5/656 and 90.33333333333333/2890.6666666666665. The test now waits for viewport layout
and reads both bounds together. Assertions, tolerances, retries and the scale hook are unchanged.
The failing receipt remains in `ui5-coordinator/all-DoW86i`.

Corrected coordinator results on accepted `07db762`, before this evidence-only prose update:

- Strict formatting, both lint modes, both typecheckers, ticket checks, dead-code and shrink-only
  Fallow passed. `npm test` passed 9 files and 132 tests. Seven verification-helper tests passed.
  Baseline and dependency files are unchanged. The worker's separate 399-test count is not the
  coordinator's acceptance count.
- `verify.mjs all` passed 84 tests with zero skipped, unexpected or flaky results. Production and
  Storybook builds passed in that run. Evidence is in
  `.amp/in/orb-backup/ui5-coordinator/all-Pnd4tk/` in the coordinator workspace.
- Sequential isolated `verify.mjs performance` passed 20 checks across five repetitions with zero
  skipped, unexpected or flaky results. Evidence is in `ui5-coordinator/performance-1CbYS2/`. This
  proves the existing responsiveness thresholds, not a speedup or real-recording compatibility.
- The worker retained both original browser reds and ten green repetitions of each regression, plus
  ten fit-scale repetitions, for 30 focused passes without retries.
- Shared stories on both axes and corrected default, expanded, reduced, hidden, restored, narrow and
  short-window renders were inspected. Real-pointer recordings cover resizing, visible native
  scrubbing and custom/default/custom followed by hide/restore. DOM read-back confirmed a 509px
  default, 549px restored custom height and focus returned to Hide.
- At 1440x730, both upper panes measured 240px tall. Real Source In/Out edits to 1/2 seconds and
  insertion after scrolling the editing area to 65px changed duration from 12 to 13 seconds. A real
  inspector bottom-action click after scrolling to 481px created one zoom. Overflow measurements
  alone were not treated as proof of those interactions.

Original and correction patches, browser-red traces, strict logs and final captures remain preserved
in the coordinator workspace. Delivery state and exact-main CI belong only in the master ticket
list. These local receipts do not assert deployment or private-recording qualification.
