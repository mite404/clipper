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

## Fable rejection and transport corrections

Fable rejected `480bd875db256a212e26125c2c858336971ae2e8` and its source-identical docs successor
`1414179b4838338f2164a575f74c8e149b59edf3`. Both commits and their original evidence remain
preserved. Their earlier full and performance receipts do not verify the revised executable inputs.

Production regressions now cover eight fast-forward endings from frame 200 and undo during rewind
from frame 719 after insertion extends the timeline to 780 frames. Restoring speed-dependent Player
subscriptions produced seven stale endings in eight attempts, with readout 356 through 358 against
camera frame 359. Removing the duration correction failed all three undo repetitions at frame 359
instead of continuing backwards. The initial rejected-production run also failed both journeys.

Player subscriptions now remain attached across speed changes. A ref marks rewind ownership from
layout setup through cleanup, rather than making subscriptions depend on a speed closure. A duration
change restarts the rewind clock after clamping it to the new last frame. The first queued rAF can
carry a timestamp earlier than layout setup; negative elapsed time previously floored to minus one
step and sought frame 360 after clamping to 359, dispatching `ended`. Nonnegative elapsed time
prevents that forward seek. Restoring negative elapsed time failed three of five undo repetitions.
This mutation is timing-sensitive, not deterministically covered; the independent review caught it
in one of six runs. Do not describe these repetitions as a deterministic guard regression.

The held-frame check arms an in-page rAF sampler before K. Every one of the first three paused paint
samples must show the independently held camera frame, which must be positive. No settling delay
precedes this assertion. The corrected held-frame and undo checks passed ten repetitions each. The
passive-effect mutation failed all ten repetitions on the first-paint parity assertion.

The existing 4× CPU rewind observation and its bound are unchanged. The same workload additionally
runs without CPU throttling. Per-tick painting failed all five unthrottled repetitions, producing 44
through 46 changes against the bound of 17. This demonstrates mutation discrimination, not a
device-wide speedup. The new eight-ending test allows real media to reach `ended` before checking
exact frame parity; no pre-existing timeout, retry, assertion or performance threshold was relaxed.

Focused build, red/green, mutation and diagnostic logs are in
`.amp/in/orb-backup/ref20/review-corrections/`. No diagnostic instrumentation remains in runtime
code or permanent tests. These corrections use the frozen toolchain on base
`af649b8b279f6374a761a5763cae22de0c48a679`; accepted successor and VERIFY-5 toolchain integration
still require exact-input gates before delivery. No main push is authorized.

### Fresh correction gates

On the frozen toolchain, format, static and typed lint, typecheck, shrink-only Fallow against
`origin/main`, production and Storybook builds, ticket audit and diff checks passed. Units passed
135 tests in 9 files, the CLI passed 7 tests, and dependency audit found 0 vulnerabilities.

Fresh isolated `all` passed 61 tests in 8.1 minutes. The separate five-repeat `performance` gate
passed 20 tests in 2.6 minutes, including the added unthrottled observation. Both reported 0
skipped, unexpected or flaky tests. Each run owned three unique ports with no server reuse. Their
receipts are `review-corrections/all/all-36QDzK/` and
`review-corrections/performance/performance-pHN49A/` under the backup directory above.

The separate performance gate observed 13 through 15 readout changes in each of 15 throttled and 15
unthrottled windows. Throttled windows lasted 1500.7 through 1584.9 ms; unthrottled windows lasted
1500.1 through 1509.1 ms. Ten forward samples advanced within 107.0 through 189.9 ms, with rAF p95
16.8 through 33.4 ms and longest tasks 0 through 86 ms. These are Chromium orb observations with
public demo media, not physical-device or encoding-speed guarantees.

The inspected `transport-review.mp4` recording under `.amp/in/artifacts/ref20/` shows the pointer
crossing neighboring frame controls, rewind on the extended timeline, undo to 12 seconds, pause and
single-frame stepping. Its final DOM/media check reported frame 355 for both the readout and camera;
the inspected `held-review.png` shows `00:11:25 / 00:12:00`. Five-frame-per-second contact sheets
remain in the backup directory. Full tests, not the recording, establish the frame-719 regression.

### Reviewed successor integration

The existing reviewer returned LAND for exact `0def2ba` on the frozen toolchain, with no P0 to P2
findings. Rejected `480bd875` and `1414179b` remain preserved and are not landing inputs. Runtime
and performance-test bytes are unchanged during integration onto docs-only main `4f2ce3a`.

The undo regression now samples the visible timecode on the first 20 animation frames after the
timeline shrinks. A range input clamps its value to its new maximum, so its value alone could hide a
stale readout. Deleting only the immediate readout update after the clamp made this stronger
assertion fail three of three production runs with frame 709 against the new maximum of 359. The
temporary mutation was restored. The eight-ending test's diagnostic console log was removed. These
tests-and-docs-only changes are permitted by the review verdict without another review.

An edit landing between the Player's end-of-playback pause and the speed-state render might restart
playback through the duration dependency. Neither reviewer reproduced that advisory hypothesis; no
runtime change or claim of coverage is made for it. Combined local acceptance and exact-main CI
remain required before this successor is delivered. VERIFY-5 is a separate tooling ticket and will
require its own integration gates; this verdict does not qualify that toolchain.

### Capture overhead qualification on accepted tooling

Integration onto delivered VERIFY-5 main `7cddaea` preserves the reviewed App and performance-test
blobs. The production bundle also retains SHA-256
`f1223c7b89036d127f69a9941391fadee316a281b983cb57b597617f5f0618ca`.

Five interleaved runs per capture mode used the unchanged eight-ending test, identical observation
hooks, DPR 2 and original budgets. Trace screencast plus video took a median 92.171 seconds, range
84.912 to 108.281. DOM-only traces without video took a median 26.705 seconds, range 22.000 to
33.491. Median buffering was 55.533 versus 6.359 seconds. All ten tests and 80 endings passed, with
zero retries, skipped or flaky results, media errors or visibility changes. These are recording
configuration measurements, not an application speedup. The original failed trace still lacks the
buffering observations needed to attribute its exact timeout.

The existing ending test moves unchanged into `transport-end.spec.ts`. Playwright requires trace and
video options at file scope, not inside a describe group. Only this file disables continuous trace
screencast frames and video. DOM/action/network traces and final screenshots remain. Every other
editor test retains its capture settings. The `editor` CLI journey includes the new file; `all` and
CI discover it normally. No timeout, repeat, media workload or assertion changed.

Restoring the old speed-dependent listener in an isolated production bundle makes the moved test
fail all three runs on readouts 356 to 358 while camera time remains 359. The temporary mutation was
restored before testing; the reviewed App blob is unchanged. Combined gates and exact-main CI are
still required before delivery.

### Accepted-toolchain integration gates

On delivered `7cddaea`, fresh formatting, static and typed lint, both compiler gates, ticket audit,
dead-code and shrink-only Fallow checks passed. Units passed 135 tests and CLI helpers passed seven.
The fresh isolated `all` gate passed 61 tests with zero skipped, unexpected or flaky results, in
10.7 minutes. Receipts are under `.amp/in/orb-backup/ref20-resumed/all/all-XdQV2b/`.

The separate performance gate passed 19 of 20 tests. Its first plain-forward sample reached rAF p95
100 ms against the strict bound below 100 ms. Five interleaved pairs then ran the same forward
checks against delivered main and the reviewed candidate. Published main failed one of ten samples;
the candidate failed three of ten. This establishes that the symptom is not exclusive to REF-20, not
that its cause is known or that the candidate has passed acceptance. A separately profiled base run
recorded React's scheduler as the largest `FunctionCall` total, with rendering and paint also
present. That does not isolate the slow operation inside the scheduler. Profiling overhead excludes
that run from reported performance samples. Full-Chromium launch also reproduced the baseline
failure, so switching from headless shell is not a demonstrated fix.

A fresh two-vCPU orb passed the unchanged published-main performance gate, ten tests across five
repetitions per variant. Its plain-forward rAF p95 was 33.4 ms in all five samples, versus 49.9 to
100 ms in this orb's interleaved baseline. This supports host or environment sensitivity but does
not isolate its mechanism, prove distinct physical hardware or qualify the candidate. The exact
uncommitted patch was transferred for one unchanged candidate run on that same fresh orb. Original
failed receipts remain under `.amp/in/orb-backup/ref20-resumed/performance/performance-ZKY59X/` and
`ref20-perf-contrast/`; no source, threshold, timeout or retry change followed the failures.

The inspected public-demo `ref20-final/rewind-undo.mp4` under `.amp/in/artifacts/` shows a real
pointer crossing neighboring frame controls, rewind, undo, pause and frame stepping. The final
DOM/media read reported camera and readout frame 339, with visible `00:11:09 / 00:12:00`. The
recording illustrates the interaction, not the eight-ending or frame-719 assertions. Existing bottom
timeline clipping remains under UI-2 ownership.

The fresh orb's first and only candidate performance invocation passed 20 tests in 139.777 seconds,
with zero skipped, unexpected or flaky results and no retries. Its published base passed ten tests
before the exact patch was applied. The candidate's plain-forward rAF p95 was 33.4 ms across five
samples, with first advance 110.3 to 124.5 ms. The cursor-follow samples had rAF p95 16.7 to 16.8
ms. All thirty rewind windows satisfied their original travel, readout-bound and camera-parity
checks.

The coordinator downloaded both actual archives and verified their SHA-256 hashes, the exact patch
hash, and unchanged App and performance-test blobs. Candidate receipts are in
`.amp/in/orb-backup/ref20-fresh-receipts/ref20-candidate-performance/performance-M94ZgO/`. This
qualifies that exact candidate on the fresh environment; it neither erases the original-host
failures nor identifies their mechanism. The runtime, assertions, thresholds and repeats remain
unchanged. The existing reviewer's narrow recording-policy verdict and exact-main CI are still
required before delivery.

The existing reviewer subsequently returned LAND for the recording-policy and CLI-selector delta
with no blockers. Coordinator `cmp` and SHA-256 confirm the landing delta matches the reviewed patch
`0d230bf25463cffe9c5ce81a9a45c86eee81771537b97404d3e2a5b66cfdc2be` exactly. That review
independently checked body identity, no-screencast policy, root/CLI discovery, stale-listener and
clamp mutations, and applicable reconstructed static gates. It did not qualify the coordinator's
full suite or performance gate, which have separate receipts above. Its documentation advisories are
already reflected in the editor selector map and host-dependent timing description. The root
configuration retains a passing trace for this one test; CI uploads artifacts only on failure.
Exact-main CI remains the final delivery gate.
