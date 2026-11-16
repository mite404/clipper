# VERIFY-3

## Status

- Authoritative state: [master ticket](../master-tickets.md#verify-3). This brief holds scope and
  evidence, not live status.
- Goal: bring the verify-clipper feature map in line with delivered cursor and zoom work, and prove
  frame stepping and the zoom start, length and focus fields through the controls a user touches.
- Effort: small. Risk: documentation can promise coverage a command does not run.
- Dependencies: none.
- Planned at: `bea052601a0181080956f6ad08b93bf1df419311`, 2026-11-16. This is observed GitHub
  `main`, CI green per the queue owner.
- Local path: `docs/tickets/VERIFY-3.md`.

## Why this matters

The feature map still said cursor sidecars, trim-aware rendering, click-generated zoom and follow
were future tickets. All four are delivered, so a reader could skip the specs that cover them. The
review also found that the frame buttons and the Zoom start, Zoom duration and Zoom focus fields had
no exact-value journey (finding A11).

## Current state

- Existing frame coverage is relative or keyboard only. `tests/editor.spec.ts` steps from wherever
  playback paused, and clamps with the arrow keys. No test used Next frame from a known frame, and
  none crossed a second boundary or clamped through the buttons.
- Zoom level and focus were set in `tests/editor.spec.ts` and `tests/refinements.spec.ts`, but only
  asserted as `matrix(2,`. No test touched Zoom start seconds or Zoom duration seconds. Typed focus
  X and Y never had their pan checked.
- `scripts/verify.mjs` selects `controls.spec.ts` only under `all`, as it does the cursor,
  click-zoom and follow specs. Changing the selector table is outside this ticket.

## Approach

Add one spec, `tests/controls.spec.ts`, that drives the real Previous frame, Next frame, playhead,
and zoom fields, and reads the rendered result. Document the delivered cursor features in a new
`features/cursor.md`, link it from the map, and correct the stale sentences.

## Scope

In: `.agents/skills/verify-clipper/features/*.md`, `tests/controls.spec.ts`, this brief. Out:
`SKILL.md`, `verify.mjs`, configs, `tests/refinements.spec.ts`, cursor sources, tests and stories,
styles, App, timeline, export, timing and persistence, `docs/master-tickets.md`.

## Steps

1. **Map delivered work.** `cursor.md` maps sidecar import, drawn cursor, click-generated zoom,
   follow and hidden ranges to the specs that prove them, and keeps the partial CLIP-11 status and
   the synthetic-only limits.
2. **Pin frame stepping.** From frame 29, Next frame reads `00:01:00`, the playhead reads 30 and the
   camera video sits at 1.0 s. Previous frame returns to `00:00:29`. Three Next clicks read
   `00:01:02`. Previous at frame 0 and Next at frame 359 do not move.
3. **Pin zoom fields.** Start 4 s and length 2.5 s must leave frames 90, 119 and 195 unzoomed and
   frame 150 at 2×. Focus X 20 and Y 80 must put that point of the screen at the mask centre. Start
   99 clamps to 9.5, length 0.1 to 0.2 and length 5 to 2.5.
4. **Control.** Break each behavior and require the spec to fail.

## Test plan

Real Playwright through `verify.mjs all`, the strict static gates, and eleven mutation controls
applied to the unchanged spec. No media API is mocked.

## Files You'll Touch

| Path                                                           | Role                                | Edit or Read |
| -------------------------------------------------------------- | ----------------------------------- | ------------ |
| `tests/controls.spec.ts`                                       | Frame-step and zoom-field journeys  | New          |
| `.agents/skills/verify-clipper/features/cursor.md`             | Delivered cursor and click-zoom map | New          |
| `.agents/skills/verify-clipper/features/README.md`             | Link, `all`-only specs, stale prose | Edit         |
| `.agents/skills/verify-clipper/features/composition.md`        | Zoom fields and journey             | Edit         |
| `.agents/skills/verify-clipper/features/timeline-transport.md` | Frame buttons and journey           | Edit         |
| `docs/tickets/VERIFY-3.md`                                     | This brief                          | New          |

## Initial state and preflight

Run at `bea0526`, tree clean, empty stash list. First-pass results, before any edit: format, lint,
typed lint, typecheck, 129 unit tests, the Fallow `--fail-on-baseline-growth` comparison against
`origin/main`, and `git diff --check` all exited 0.

## Done when

Both new tests pass and fail under the mutations below, the map names every delivered cursor feature
without dropping the partial CLIP-11 or synthetic-only limits, all gates pass, and exact-SHA CI is
green.

## Evidence

Verification, local. Every gate and `verify.mjs all` ran three times: on `bea0526`, after rebasing
onto `4535665` (the REF-26 footer fix), and finally after rebasing onto `a6f0448` (cursor shape
stabilization, CI 43797731005 green), with these results each time:

- Gates: `format:check`, `lint`, `lint:typed`, `typecheck`, `npm test`,
  `check:code --fail-on-baseline-growth --baseline-base origin/main`, `git diff --check` and the
  `verify.mjs` tooling tests all exited 0. No threshold, baseline or suppression changed. Unit
  tests: 129 passed on the first two bases and 131 on `a6f0448`.
- `verify.mjs all`: 41 passed (5.1 min) on `bea0526`, 41 passed (5.0 min) on `4535665`, and 42
  passed (4.9 min) on `a6f0448`. The 42 are the 39 existing, the 2 new and `cursor-shapes.spec.ts`.
  Evidence directories `all-rLJj75`, `all-eTUHdB` and `all-dhyhdH` under
  `.amp/in/artifacts/verification/`, not committed.
- First pass: both new tests passed on their first run against the unchanged product.

Mutation controls, each applied to `src/` for one run of `controls.spec.ts` and then reverted with
`git checkout`. All eleven failed the spec:

| Mutation                                | Test that failed | First failing assertion                         |
| --------------------------------------- | ---------------- | ----------------------------------------------- |
| Next frame advances 2                   | frame buttons    | `00:01:00` expected, `00:01:01` received        |
| Previous frame goes back 2              | frame buttons    | `00:00:29` expected, `00:00:28` received        |
| seek loses its lower clamp              | frame buttons    | `00:00:00` expected, `-1:-1:-1` received        |
| seek loses its upper clamp              | frame buttons    | `00:11:29` expected, `00:12:00` received        |
| Zoom start field ignored                | zoom fields      | frame 119 zoomed (`matrix(2, ..., -440, -350)`) |
| Zoom length field ignored               | zoom fields      | frame 195 zoomed                                |
| Zoom start loses its upper clamp        | zoom fields      | `9.5` expected, `99` received                   |
| Zoom length loses its six-frame minimum | zoom fields      | `0.2` expected, `0.1` received                  |
| Zoom length loses its upper clamp       | zoom fields      | `2.5` expected, `5` received                    |
| Focus Y field writes X                  | zoom fields      | centre 0.50 expected, -0.70 received            |
| `zoomCamera` swaps the X and Y axes     | zoom fields      | centre 0.50 expected, -0.70 received            |

Repair effort, as observed:

- Test repairs: none. Neither new test needed a second attempt.
- One harness repair: the length-minimum mutation was first written with `$10` in a Perl
  replacement, which produced a syntax error in `App.tsx` and a meaningless failure. It was
  rewritten as `${1}0` and rerun, and the table above uses that rerun.
- One formatting repair: `prettier --write` rewrapped `cursor.md`, `composition.md` and
  `timeline-transport.md`.
- One tool mishap: a `pkill -f` pattern matched its own shell and killed that command. No repository
  effect; the gate run was restarted from a clean tree.
- The first proposed ticket, REF-14, was replaced by the queue owner before any edit.

## Limits

- `controls.spec.ts` runs only under `verify.mjs all`, like the cursor specs. Adding it to the
  `editor` or `composition` selectors needs an edit to `verify.mjs`, which this ticket may not make.
- Camera video position is read from the decoded `currentTime` of the camera clip, which starts at
  frame 0 with no source offset. The screen track's offsets are not asserted here.
- The mutation runs are local controls, not committed tests.
- Nothing here changes the cursor compatibility claim: synthetic fixtures only.

## Notes

Use `timeline-model.ts`, not the case-colliding former `timeline.ts` name.
