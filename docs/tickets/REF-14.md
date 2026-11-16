# REF-14

## Status

- Authoritative state: [master ticket](../master-tickets.md#ref-14).
- Goal: centralize audio gain and peak rate, and prove Save refuses network fetches.
- Priority: unblock CLIP-17 before dependent gain features.
- Effort: small. Risk: changing a gain in only one consumer changes the exported mix.
- Dependencies: none; coordinate shared timeline, media and export ownership.
- Planned at: `7b23be80ff417e061d5c74ac127759b20a5b80ef`, 2026-11-16.
- Local path: `docs/tickets/REF-14.md`.

## Why this matters

Preview, export and the meter must agree. The existing network-refusal assertion can pass on a
fallback error after making a real request, so it does not establish the privacy boundary.

## Initial state

The delta from `5a9bc1f` retains literal music gain `0.22` and waveform rate `30`. The network-URL
test in `src/project.test.ts` still matches `/local|blob/i` without asserting zero fetches.
Historical findings #32, #33 and #34 remain open.

## Approach

Use one existing model-level gain constant shared by consumers and the existing FPS constant for
peak binning. Strengthen the public serialization rejection test, not a private-helper assertion.

## Scope

In: gain and peak-rate duplication, tests and fixtures needed for the contract. Out: editable gain
UI, new audio pipeline or changing the current audible level.

## Steps

1. **Pin gain and privacy**. Use asymmetric audio and prove refusal without fetching.
2. **Share constants**. Replace each live consumer, including the meter and Storybook frame rate.
3. **Verify parity**. Run units, export audio and full gates.

## Test plan

Spy below serialization's network boundary, require the specific local-blob rejection and zero fetch
calls, restoring the spy. Check peak indexing and preview/export audio preserve current gain. Do not
let an example.com request run as part of the refusal case.

## Why this approach

Shared constants remove drift without adding a configurable audio abstraction.

## Files You'll Touch

| Path                                                                  | Role                                       | Edit or Read           |
| --------------------------------------------------------------------- | ------------------------------------------ | ---------------------- |
| `src/timeline-model.ts`                                               | Existing shared track and FPS definitions  | Edit                   |
| `src/media.ts`, `src/Composition.tsx`, `src/export.ts`, `src/App.tsx` | Peak, playback, export and meter consumers | Edit                   |
| `src/project.test.ts`, `src/Editor.stories.tsx`                       | Privacy regression and FPS consumer        | Edit                   |
| `tests/export.spec.ts`                                                | Existing audio verification                | Read, extend if needed |

## Initial state and preflight

Run [dispatch preflight](../ticket-workflow.md#initial-state-and-preflight), then compare the
planning SHA's narrow gain, peak and serialization-test hunks with current HEAD.

## Done when

No duplicate live gain or peak-rate constants remain, sound is unchanged, the refusal test fails
when its guard is removed, and full gates plus exact-SHA CI pass.

## Notes

Use `timeline-model.ts`, not the case-colliding former `timeline.ts` name.

## Implementation and evidence

`MUSIC_GAIN` now supplies the same linear amplitude to preview audio, export mixing and the meter.
Peak allocation and binning reuse `FPS`; Storybook players also use it. No audible level, timeline
rate or saved-data shape changed. The network-refusal test requires the specific local-blob error
and observes zero calls at the fetch boundary. Its fetch stub prevents an actual network request if
the guard regresses.

The unchanged implementation passes the strengthened privacy check. Temporarily removing the
serializer's local-blob guard fails it with the fallback unreadable-media error, proving the old
broad error match could hide a request. Restoring the guard passes all 60 project tests and all 133
units on `7373115`. The temporary mutation was removed. After integration onto `bd6120f`, format,
static and typed lint, typecheck, 135 units, strict shrink-only Fallow, both builds, audit and all
seven helper tests pass. The isolated `all` journey passes all 44 browser cases with no skips or
flakes, including the existing independently mixed decoded-audio reference at both output widths. No
physical-speaker claim follows. Logs are retained under `.amp/in/orb-backup/ref14/`; delivery is
recorded in the master.
