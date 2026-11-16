# REF-20

## Status

- Authoritative state: [master ticket](../master-tickets.md#ref-20).
- Goal: avoid rendering all of App on every rewind step or encoded frame.
- Priority: performance before dependent heavier editor features.
- Effort: medium. Risk: transport readouts must still show the final held frame.
- Dependencies: preserve REF-9 pause synchronization and REF-16 history behavior.
- Planned at: `7b23be80ff417e061d5c74ac127759b20a5b80ef`, 2026-11-16.
- Local path: `docs/tickets/REF-20.md`.

## Why this matters

Rewind must seek promptly while clip count grows. Export progress does not need a React render for
every encoded frame when the displayed progress has not changed.

## Current state

Rewind keeps `frameRef` and media seeks current on every step, but paints its readout at 100 ms
intervals. Delayed player events cannot overwrite the rewind clock. Stopping or changing rewind
speed flushes the held frame before paint. Forward playback retains its throttle and REF-9 pause
sync.

Export stores whole-percentage fractions only when the displayed percentage changes. The initial
zero, final completion, cancellation, and failure cleanup remain part of the existing export action.

## Approach

Keep media seeks and `frameRef` current on every step. Throttle rendered readouts to 100 ms and
flush the final frame on stop. Update export progress only when its displayed value changes.

## Scope

In: rewind readout and export progress updates, their real transport evidence. Out: video seek
throttling, audio reverse playback, threshold relaxation, or history refactoring.

## Steps

1. **Measure the current paths**. Reproduce per-tick App renders with actual rewind and export.
2. **Throttle only readouts**. Preserve continuous seeks and final paused state.
3. **Verify responsiveness**. Check multiple speeds, final frame, progress, cancel and retry.

## Test plan

Use real media and representative clip counts. Verify backward movement, exact final timecode and
correct subsequent frame stepping. Check progress remains monotonic and clears on completion and
cancellation. Run isolated performance repetitions and full browser gates.

## Why this approach

The media clock stays accurate while React avoids repainting readouts users cannot distinguish.

## Files You'll Touch

| Path                                                | Role                                          | Edit or Read           |
| --------------------------------------------------- | --------------------------------------------- | ---------------------- |
| `src/App.tsx`                                       | Player listener, rewind effect, export action | Edit                   |
| `tests/performance.spec.ts`, `tests/editor.spec.ts` | Responsiveness and held-frame evidence        | Edit                   |
| `tests/refinements.spec.ts`                         | Existing UI export journeys                   | Read, extend if needed |
| `src/export.ts`, `src/history.ts`                   | Progress callback and undo contracts          | Read                   |

## Initial state and preflight

Run [dispatch preflight](../ticket-workflow.md#initial-state-and-preflight). Inspect App listener
and history drift rather than restoring the baseline file. Do not run builds during measurements.

## Done when

Readouts update at most every 100 ms during rewind plus the final flush, media remains responsive,
export avoids unchanged progress renders, and full gates plus exact-SHA CI pass.

## Notes

The separate hidden-tab and held-key risks are REF-31, not implicit acceptance of this refactor.

## Implementation evidence

The final integration base is VERIFY-4 `6abc9df3099272385d265bc2a022190d804bb411`, whose exact-SHA
CI run `43816920677` passed. The accepted correction was rebased onto that successor without
changing its runtime or test bytes. Earlier measurements started on REF-14
`afe4c605f551c979083297b0e0d5d24f4a32a484`; initial and corrected full gates used UI-1
`b9596c6061dbe9933436b21295d7d1a1827b48ad`.

A temporary React DevTools commit hook measured actual App commits during real production rewind and
a downloaded 360-frame export. No instrumentation remains in runtime code or permanent tests. These
are workload observations, not an encoding-time speedup claim.

| Production sample                        | Before                              | After                              |
| ---------------------------------------- | ----------------------------------- | ---------------------------------- |
| 1× rewind, about 1.5 seconds, five clips | 39 App commits                      | 15 App commits                     |
| 2× rewind, about 1.5 seconds, five clips | 55 App commits                      | 15 App commits                     |
| 4× rewind, about 1.5 seconds, five clips | 63 App commits                      | 14 App commits                     |
| 360-frame export                         | 358 App commits, 87 progress labels | 88 App commits, 87 progress labels |

The thirteen-clip production probe passed the same commit bound at all three rewind speeds. The
before-and-after exports were each 9,555,950 bytes, with no page errors. The runnable
`check-measurement.mjs` assertion failed against the baseline and passed against the candidate. Its
full JSON samples and command logs are in `.amp/in/orb-backup/ref20/`.

Permanent browser checks use observable transport and progress, not React internals. They compare
the paused camera media time with the readout at 1×, 2×, and 4×, check subsequent frame stepping and
the zero boundary, and exercise real export progress, cancellation, and a successful retry without
uploads. The progress bar has at most 101 distinct values for the displayed 0 through 100 percent.

All four deliberate mutations failed their checks before restoration:

- Removing the final rewind flush left the readout at frame 134 while video held frame 132.
- Suppressing progress updates left the real export bar at zero.
- Painting every rewind tick produced 21 changes where the observation window allowed at most 17.
- Restoring raw fractional export updates produced 354 progress values where at most 101 were
  allowed.

The production recording in `.amp/in/artifacts/ref20/transport.mp4` shows the pointer crossing
neighboring frame buttons, 2× rewind, pause, and frame stepping. It was inspected along with its
five-frames-per-second contact sheet. Only public demo media and synthetic projects were used.

## Initial local verification

On the UI-1 base, format, static lint, typed lint, typecheck, shrink-only Fallow against
`origin/main`, production and Storybook builds, ticket audit, and diff checks passed. Units passed
135 tests in 9 files. The Node CLI suite passed 7 tests. Dependency audit found 0 vulnerabilities.

The isolated `all` gate passed 58 tests in 10.4 minutes. The separate isolated `performance` gate
passed 15 tests across five repeats in 2.2 minutes. Both reported 0 skipped, unexpected, or flaky
tests. Existing thresholds, retries, and Fallow baselines were unchanged.

At 4× CPU throttling, ten forward-playback samples had first advance 114.8 to 191.6 ms, rAF p95 16.8
to 33.4 ms, and longest tasks 0 to 76 ms. Fifteen rewind windows had 12 to 15 readout changes over
1509.6 to 1618.4 ms. Each speed held the frame independently checked through camera media time.
These Chromium orb measurements do not establish performance on every physical device.

Full receipts are under `.amp/in/orb-backup/ref20/final-gate-*.log`, `final-all/all-kXZCd1/`, and
`final-performance/performance-tV3yga/` within the same directory. Exact-SHA CI remains a delivery
requirement after an explicitly authorized serialized push.

## Acceptance correction

Independent production acceptance rejected the initial candidate
`5c82e70e235f392e05dceabe70fc88946499e1c6`. The exact held-frame assertion sampled readout 117 after
transport reported Paused, while the camera held 116. The coordinator's final trace snapshot showed
the slider had subsequently corrected to 116. A local unchanged production repetition reproduced 6
failures in 15 runs, so the earlier full green gates did not establish acceptance.

A temporary commit/event/media-seek probe reproduced readout 125 at the first paused commit,
followed by a final readout and camera frame of 123. The passive rewind cleanup did not flush the
readout until a later commit. This is an observable pause/readout ordering bug, not evidence of load
or a reason to weaken the exact-frame check.

The rewind effect now uses layout cleanup to cancel its clock and flush the held readout before the
paused or changed-speed state can paint. The exact-frame assertion and its polling timeout are
unchanged. No diagnostic instrumentation is part of runtime code or permanent tests.

The unchanged held-frame production test passed 30 repetitions after correction. The temporary event
probe also passed 40 pause sequences. Fresh strict format/lint/typed-lint/typecheck, shrink-only
Fallow, production and Storybook builds, ticket/diff checks, 135 unit tests in 9 files, 7 CLI tests,
and dependency audit all passed. The audit found 0 vulnerabilities.

Corrected isolated `all` passed 58 tests in 6.2 minutes, and the separate five-repeat `performance`
gate passed 15 tests in 2.2 minutes. Both reported 0 skipped, unexpected, or flaky tests. At 4× CPU,
ten forward samples had first advance 87.2 to 177.6 ms, rAF p95 33.3 to 33.4 ms, and longest tasks 0
to 91 ms. Fifteen rewind windows had 11 to 15 readout changes over 1502.6 to 1603.5 ms.

Corrected receipts are in `.amp/in/orb-backup/ref20/acceptance-gate-*.log`,
`acceptance-all/all-XxyzhJ/`, and `acceptance-performance/performance-2vscer/`. Focused red/green
logs are `acceptance-repro.log` and `acceptance-fix-repeat.log`; event evidence is
`held-frame-diagnosis.json` and `held-frame-fixed-diagnosis.log` in the same backup directory. The
inspected corrected recording is `.amp/in/artifacts/ref20/transport-fixed.mp4`, with held-frame
capture `held-frame-fixed.png`. Its paused timecode `00:05:14` matched camera frame 164 in a real
DOM/media check. Initial receipts remain preserved; exact-candidate acceptance and CI remain
pending.

The coordinator independently accepted corrected candidate
`bd222030e81f0d5784e68e4b68034cecffda54a4` after 10 unchanged production repetitions, five each of
the held-rewind and export-progress checks. The final integration updates only REF-20-specific skill
claims to those executable checks and their limits. Hidden-tab behavior, physical speaker output,
broad cold-playback diagnosis and encoding-speed claims remain outside this evidence.

## VERIFY-4 integration verification

On exact base `6abc9df3099272385d265bc2a022190d804bb411`, format, static and typed lint, typecheck,
shrink-only Fallow against `origin/main`, production and Storybook builds, ticket/diff and case-only
filename checks passed. Units passed 135 tests in 9 files, the CLI passed 7 tests, and dependency
audit found 0 vulnerabilities. Skill frontmatter, local Markdown links and prose wrapping passed.
The accepted runtime and test bytes still match `bd222030` exactly.

Fresh isolated `all` passed 58 tests in 7.3 minutes. The separately run five-repeat production
`performance` gate passed 15 tests in 2.3 minutes. Both reported 0 skipped, unexpected or flaky
tests. At 4× CPU, ten forward samples advanced within 115.1 to 249.2 ms, rAF p95 was 33.3 to 33.4
ms, and longest tasks were 0 to 91 ms. Fifteen rewind windows had 11 to 15 readout changes over
1506.7 to 1628.3 ms, with held camera/readout parity. No thresholds or assertions changed.

Full integration logs are under `.amp/in/orb-backup/ref20/integration/`, with browser receipts in
`all/all-mXZUK2/` and `performance/performance-JAwpeB/`. The preserved measurement checker still
rejects the baseline JSON and accepts the candidate JSON. This recheck validates stored samples, not
a new before-and-after measurement. Successor acceptance and explicitly authorized delivery remain
pending; no push or main-queue update is part of this local verification.
