# REF-31

Authoritative state: [master ticket](../master-tickets.md#ref-31).

## Approved small-ticket lane

The owner's direct REF-31 dispatch assigns implementation to GPT-6.1 Sol medium after accepting
REF-20, inspector, UI-2 and UI-3. This supersedes the planned Sonnet lane for this ticket. The
existing Fable reviewer owns the single pre-landing source verdict. The queue owner retains the only
main push slot.

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

## Reproduction and implementation evidence

Implementation started from fetched `ed37b201e1b62a24581766ec6dbf92540e5cd7a6` on the separate
`ref-31-transport-lifecycle` branch. The later fast-forward to
`57f58649f382de99fc55a57659331f3f419fc95f` changes only the owner's master queue. No prior REF-20
candidate, B shortcut draft, or private recording was imported.

Full logs and browser receipts are retained under `.amp/in/orb-backup/ref31/`.

- `red.log` reproduces repeated Space toggling from `Playing · 1×` back to `Paused` on the first
  repeat. `red-native-2.log` proves a real hidden tab but receives `Rewinding · 1×` instead of
  `Paused`. The earlier native tracing-start and describe-level option errors are retained as setup
  failures, not product reproductions.
- The rewind layout effect owns the visibility listener and removes it during its existing cleanup.
  Hiding sets speed to zero. The existing cleanup cancels rewind and flushes its held frame;
  restarting uses the existing fresh clock. Space ignores only repeated keydown events. All shortcut
  guards, J/K/L and arrow handling remain unchanged.
- The native-tab test launches installed Chromium and connects through CDP with `noDefaults`.
  Playwright's normal focus emulation and raster capture keep background tabs visible. This file
  disables trace screenshots and video. Normal-page tests retain DOM, action and network traces; the
  externally connected native context retains test actions and hidden-state JSON attachments, not
  DOM snapshots or network resources. It asserts `visibilityState === 'hidden'` and
  `hidden === true` after bringing a second real tab forward. It does not override document
  properties or synthesize visibility events.
- The native test checks 1× and 4× rewind, a one-second hidden interval, twenty held-frame rAF
  samples after returning, matching timecode and both videos, and a fresh-clock restart bound.
  Controls cover focused input, modifier chords, help, repeated J/K/L and exact arrow stepping.
- `mutant-space.log` rejects restored unconditional Space toggling in all three repetitions.
  `mutant-visibility.log` rejects removal of the visibility subscription in all three repetitions,
  after proving the tab hidden. Each mutation used a fresh production build with no retries.
- After restoring both fixes and rebuilding, `restored.log` passes all nine checks across three
  repetitions, with zero retries. `green-controls.log` retains the earlier three-test pass.

## Verification receipts

`full-strict.log` records passing formatting, static lint, typed lint, Oxc typecheck, standalone
TypeScript, ticket audit, case-collision check, shrink-only Fallow against `origin/main`, 135 unit
tests in nine files, seven Node CLI tests, production and Storybook builds, and `git diff --check`.
The final documentation checks run again before freezing the candidate.

The first isolated `all` run passes 70 tests, with zero unexpected, skipped or flaky results. Its
fresh production, dev-fixture and Storybook servers use distinct ports 43933, 40565 and 44711.
Receipts are in `isolated/all-Sn7KCo/{summary.json,results.json,run.log}`. This includes real
production transport, import, edit, save, reopen, recovery, download, HD/4K export and fixture
coverage. No assertions, skips, retries, capture settings in existing tests, or thresholds changed.

The separate isolated `performance` run passes all twenty checks across five repetitions of four
variants. It runs after `all`, with no concurrent browser or build jobs. Receipts are in
`isolated/performance-NUvJhs/{summary.json,results.json,run.log}`. All ten playback observations
show real media advancement in 99.5–151.4 ms. Their rAF p95 is 33.4–34.8 ms, maximum frame interval
is at most 83.3 ms, and maximum long task is 83 ms. Thirty rewind observations retain the existing
throttled and unthrottled readout bounds. These are gate results, not a comparative speedup claim.

The inspected 2× captures in `.amp/in/artifacts/ref31/` show the default paused state, held-Space
playback, the next paused state, and a nonzero frame held after rewind. `interaction.mp4` records a
real pointer crossing neighboring transport buttons, real held-Space keydowns, and J/J/J then K. The
full clip and 200 ms transport contact sheet were inspected; the final frame shows `Paused` at
`00:05:17`. Native hidden-tab behavior is proved by the browser assertions and JSON attachments, not
this visible-tab recording. An initial recording setup opened `about:blank` when adding restore
mode; that failed capture remains in the backup directory and was not used as evidence.

Only public bundled media is used. Chromium in an orb does not qualify physical audio, real mobile
devices, Safari or Firefox. No source fix, gate relaxation, queue edit, push or deployment outside
the granted scope is included. The exact frozen commit and verified bundle are reported separately
to the queue owner for the existing review and serialized delivery.

## Coordinator qualification

The first independent full invocation retained at
`.amp/in/orb-backup/ref31-coordinator/all/all-zozflb` passed 69 tests and failed only the external
Chromium startup poll: `DevToolsActivePort` was still absent at its default five-second deadline. It
failed before checking product visibility behavior. The existing Fable reviewer independently
reproduced that startup failure and cleared the unchanged runtime after one test-only correction: a
thirty-second port wait within the existing sixty-second test budget. That exact identity delta was
transferred to the reviewer. No product assertion, retry, performance threshold or App source
changed. Why startup exceeded five seconds is not established. Corrected qualification receipts are
recorded separately rather than overwriting the failed first run.

The corrected coordinator full journey passed 70/70 with zero skips, flakes or unexpected results at
`.amp/in/orb-backup/ref31-coordinator/corrected-all/all-RC784c`. The subsequent isolated performance
journey passed 20/20 at `.amp/in/orb-backup/ref31-coordinator/performance/performance-XKTeJg`.
Strict formatting, static and typed lint, Oxc/tsc, shrink-only health, ticket audit, 135 units and
seven CLI helpers also passed. These results satisfy local qualification and the review's test-only
condition, not remote CI or delivery acceptance. The sole queue retains the transport reservation
until exact-main green CI.
