# CLIP-11

## Status

- Authoritative state: [master ticket](../master-tickets.md#clip-11).
- Goal: finish cursor appearance and behavior without altering raw telemetry.
- Priority: feature lane first, after correctness and unblocking work.
- Effort: medium. Risk: preview and export must sample the same source-time behavior.
- Dependencies: delivered CLIP-7, CLIP-8 and CLIP-10; synthetic fixtures suffice for implementation.
- Planned at: `7b23be80ff417e061d5c74ac127759b20a5b80ef`, 2026-11-16.
- Local path: `docs/tickets/CLIP-11.md`.

## Why this matters

Users need deliberate cursor motion, including hiding distracting segments, without manual click
keyframes. Real recording compatibility remains a separate D-7 gate.

## Current state

Commit `7b23be8` delivers recorded, fixed-first and Touch styles, idle hide, shake removal and stop
or return endings. Its CI passed; 127 units and 39 browser checks passed locally. Endings apply per
trimmed clip, not once per whole video. Commit `bea0526` adds source-time segment hiding with
[green CI](https://github.com/mite404/clipper/actions/runs/43794298710). Its half-open ranges apply
before ending effects and are independent of telemetry offset. Commit `a6f0448` adds optional 100 ms
recorded-shape stabilization with
[green CI](https://github.com/mite404/clipper/actions/runs/43797731005). Interactions remain
immediate; missing/disconnected tracking resets the shape candidate. Commit `e3428ee` adds
default-off movement rotation with
[green CI](https://github.com/mite404/clipper/actions/runs/43800623105). Its source-time 100 ms
lookback and ±12° cap around the scaled hotspot are explicit Clipper choices. The worker verified
133 units, 43 browser checks and ten isolated performance checks with rotation and stabilization
enabled. Speed styles are delivered at `bd6120fa070f1386fa92324e7459cea459918178` with
[green CI](https://github.com/mite404/clipper/actions/runs/43805205300), independently verified by
the queue owner. Smooth retains existing arithmetic; Medium and Rapid traverse the final 75% and 50%
of each sample interval; None steps at sample times and Raw bypasses styling. These fractions are
Clipper choices, not upstream parity. Local gates passed 135 units, seven helper tests, 44 browser
cases and ten isolated performance cases. The selected implementation unit is complete; full CLIP-11
retains video-wide ending and real-Mac qualification limits. See the
[source requirements](../reference-features.md#motion-acceptance).

The expanded cursor-control layout is not accepted UX. Following the recorded-metadata comparison,
the owner approved the Screen Studio-inspired inspector workflow on 2026-11-16.
[Sol owner](https://ampcode.com/threads/T-c7f554cb-b157-4f8c-b515-6b07a23b4214) reorganizes existing
controls into the selected-screen-clip inspector, with explicit recording-wide semantics and no new
effects or clip-local overrides. An explicit library selection may clear clip selection to reach
that recording's settings. Final integration follows UI-1 and REF-20; the later UI-2 drawer/layout
unit integrates the inspector before its own combined gates. The master records shared-path
reservations and disclosure-only test exceptions.

## Approach

Extend the existing deterministic cursor sampler and validated optional settings. Preserve the raw
event stream, per-source clock and common preview/export projection.

## Scope

In: the remaining speed-style control, persistence, shared controls, synthetic stress states. Out:
native capture, new cursor inference from video pixels, and an implicit video-wide ending claim.
Decide any video-wide ending change explicitly rather than relabeling the current unit.

## Steps

1. **Pin remaining behavior**. Define each control's source-time result on asymmetric telemetry.
2. **Sample and persist**. Add settings and pure sampling, preserving cuts and arbitrary seeks.
3. **Expose shared controls**. Reuse CursorControls and its Storybook states.
4. **Verify rendered parity**. Compare preview and decoded exports through cuts and offsets.

## Test plan

Red first for each new contract. Cover raw mode, missing shapes, empty tracks, rapid reversals,
fractional hotspots, hidden segments straddling trims and save/reopen. Run full browser and isolated
throttled performance gates; inspect screenshots and an actual pointer recording.

## Why this approach

One sampler already supplies preview and export. A second motion clock would make arbitrary seeks
and the downloaded file disagree.

## Files You'll Touch

| Path                                                | Role                                                     | Edit or Read |
| --------------------------------------------------- | -------------------------------------------------------- | ------------ |
| `src/cursor*.ts`                                    | Input validation, deterministic motion, render and tests | Edit         |
| `src/CursorControls.tsx`, `src/styles.css`          | Shared controls and layout                               | Edit         |
| `src/Editor.stories.tsx`, `tests/cursor*.spec.ts`   | Stress and browser evidence                              | Edit         |
| `src/project.ts`, `src/framing.ts`, `src/export.ts` | Existing persistence and sampler consumers               | Read         |

## Initial state and preflight

Use [the dispatch commands](../ticket-workflow.md#initial-state-and-preflight). The actual 13-file
handoff was integrated three-way from `8095a273`; do not copy the frozen worker's old tree over
current main. Account for drift in cursor modules before writing.

## Done when

The remaining behavior has red-to-green tests, portable settings and matching rendered
preview/export evidence. Full gates and exact-SHA CI pass. The master explicitly retains any
video-wide ending and real-Mac limits rather than claiming reference parity without evidence.

## Notes

No new reviewer is required. Sol medium is the implementation owner; the former cursor thread is
preservation-only. Use synthetic fixtures, not capture-derived images.
