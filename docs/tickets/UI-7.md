# UI-7

Authoritative state: [master ticket](../master-tickets.md#ui-7).

## Drawer contract

This change extends UI-2's mounted `#media-drawer` on accepted source `acb62f7`, rebased onto
accepted queue-only `9733390`. It does not replace the media library or change insertion.

Media is the first header control, immediately before Save project. Click and Enter pin or hide the
pool. Space on focused Media prevents native button activation and reaches the existing timeline
play/pause shortcut. Hiding keeps the library mounted, with selection, playback and timeline scale
intact. Closed content is inert and absent from the accessibility tree.

`useMediaDrawer` owns pinned, closed and transient peek states, pointer intent and timer cleanup.
Fine-hover pointers can preview from Media or a six-pixel workspace-left strip. The strip starts
below the workspace bar, leaving header padding at `(4, 4)` neutral. Peek overlays the expanded
workspace without resizing its editing area or timeline. Activation pins it into the normal grid.

Pointer entry waits 80 ms. Exit waits 250 ms and keeps the preview open while keyboard focus remains
inside. Mouse selection does not pin the preview; leaving returns row focus to Media before hiding.
Focus exit resumes dismissal. Escape dismisses transient peek and returns panel focus to Media.
Pointer cancellation, window blur and input-query changes close transient content immediately.
Persistent toggles and keyboard dismissal are immediate. Reduced motion removes the slide. Touch
uses the persistent button rather than hover. Narrow previews retain the existing horizontal media
carousel with content-height sizing and a viewport-bounded width.

## Yaklabs reference

The inspected reference is `mite404/yaklabs` at `1ccdae55a5f26e96c042a322f980db9e226b3c41`. Research
covered actual `sidebar-peek.tsx`, `peek.ts`, `peek-page.ts`, `sidebar.tsx`, `rail.tsx`, related
CSS, history and the supplied hover screenshot. The implementation reuses its dwell, leave grace,
reversible 220 ms slide and fine-hover policy. It does not copy its routing or menu framework. CSS
transitions animate only the drawer transform, with delayed visibility on exit and no library width
animation.

## Product red and green checks

The original production UI reproduced focused-Media Space hiding the pool while transport remained
paused. The new product tests then failed on that behavior, missing hover and obsolete header order.
Receipts are under `.amp/in/orb-backup/ui7/red.log` and `red-browser/`.

Visual inspection found a stretched narrow preview with a 247.5 px blank gap above the thumbnails.
The new layout assertion failed before the content-height fix and passed afterward. Its receipt is
`.amp/in/orb-backup/ui7/narrow-red.log`. All 19 workspace-layout and refinement tests pass in
`final-affected.log`. These tests cover Space while pinned and closed, playback continuity, scale,
selection, overlay geometry, neutral header padding, hover return, pinning, focus hold, Escape,
closed Tab order, reduced motion at 960/617/390/320 px and coarse-touch persistent activation. The
Save test retains actual pointer and keyboard download checks at 617 by 1295.

The scratch `cleanup-check.mjs` additionally passes focus exit, pointer cancellation, window blur
and fine-to-coarse input-query cleanup. Cancellation events are dispatched DOM events; the
input-query transition uses Chromium touch emulation. Its passing receipt is `cleanup2.log`.

Removing the fine-hover query guard makes the coarse-touch case fail on a visible preview. Restoring
the original hook restores the passing behavior. `touch-mutation.log` retains that failure. The
restored hook is byte-identical to the source used for the full and isolated performance journeys.

## Full local journeys

`node .agents/skills/verify-clipper/scripts/verify.mjs all` passes all 77 cases with zero skips,
unexpected results or flaky cases. Its production and static Storybook builds pass. Evidence is
`.amp/in/orb-backup/ui7/verification/all-T5ZBjs/summary.json`, with the full log in `all.log`. The
captured workspace test source matches the final test file, including the coarse-input check.

The separate `performance` journey runs alone after the full journey closes its browsers and
servers. All 20 cases pass across five repetitions, without tracing or video. Startup, actual video
advancement, rAF gaps, long tasks and rewind readouts retain their existing assertions. Evidence is
`.amp/in/orb-backup/ui7/verification/performance-dOxF1b/summary.json` and `performance.log`. This is
a threshold check, not a measured speedup claim.

Formatting, strict lint, typed lint, Oxc checking, standalone TypeScript, ticket audit, dead-code
checks and shrink-only Fallow pass against `9733390`. All 132 unit tests and seven verification
helper tests pass. Production builds and `git diff --check` pass. `final-gates.log` retains these
receipts. The restored production build passes all 19 affected tests again in `restored-green.log`.
Neither the Fallow baseline nor any threshold changed.

## Inspected captures

Public bundled demo media is the only capture material. Desktop default, hidden and peek captures
are under `.amp/in/artifacts/ui7/`. The final narrow captures are `narrow-pinned-final.jpg`,
`narrow-hidden-final.jpg` and `narrow-peek-final.jpg`. `reduced-320-final.jpg` shows the compact
reduced-motion preview. `touch-390.jpg` and `touch-hidden-390.jpg` use Chromium touch emulation with
a verified coarse pointer, not physical-device testing.

`interaction.mp4` records a real moving pointer across neighboring header controls, persistent
close, edge preview, card hover, retreat and pinning. `keyboard.mp4` records focused-Media Space
playback while pinned and closed, and Enter toggling. Both clips and the pointer contact sheets were
inspected. Temporary peek does not resize the workspace. Pinning intentionally does.

## Boundaries and limits

No performance workload, sampling, thresholds, repetitions or focus coordinates changed. No
Timeline, renderer, model, insertion, source monitor, zoom, export, baseline or verification-tool
files changed. UI-8 retains ownership of later thumbnail seeking. A captured seek must retain a
transient drawer until capture ends if its runtime reproduction needs that hold. No speculative
gesture state was added before that interaction exists. The source selector remains for UI-9's
coordinated transition.

These browser checks do not prove physical touch, Safari, Firefox, a physical screen reader or
private-recording compatibility. Delivery remains with the sole coordinator and the existing
exact-candidate review and exact-main CI gates.

## Review correction

The exact-candidate review found that clicking a media row held transient peek open after pointer
exit. The coordinator reproduced it against the production build with the existing workspace test
extended to click a row and leave. The hidden-drawer assertion failed before the hook correction.
The leave timer now holds only keyboard-visible focus and returns mouse-focused rows to Media before
hiding. The test checks focus return and traverses Tab/Shift+Tab for the keyboard-hold case. All 19
affected cases pass against the corrected production build. Red and green receipts are retained in
the coordinator's `.amp/in/orb-backup/ui7-focus-{red,green}.log`.

The coordinator's fresh corrected `all` journey passes 77 cases in
`.amp/in/orb-backup/ui7-coordinator/all-dt7KQ7/summary.json`; isolated `performance` passes all 20
cases in `performance-yBGSAB/summary.json` under the same parent. Strict checks, shrink-only Fallow,
132 units and seven helpers pass. Both reviewers return LAND for the exact corrected source/test
tree `e5119412a525e69cd99657bf670a0c99f1ff110a`; later acceptance prose changes no source or tests.
The inspected corrected pointer recording exercises row selection, exit and focus return against the
production build. The first coordinator full invocation was OOM-killed, not a product assertion
failure. Its subsequent original-candidate and corrected-candidate full runs pass separately.
