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

The relevant App delta retains `setFrame(target)` in each rewind step and passes `setExportProgress`
directly to `renderVideo`. Finding #36 remains open. Forward playback already throttles its frame
readout; pause synchronizes the actual held frame under REF-9.

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
