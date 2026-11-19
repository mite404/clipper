# UI-8

Authoritative state: [master ticket](../master-tickets.md#ui-8). This is the view and scrubbing part
only; the track selector stays until [UI-9](../master-tickets.md#ui-9).

## Contract

Read from the owner's recording `Screen-Recording-2026-11-16-at-11.25.07-AM.mov` (inspected), not
invented:

- The mouse over the selected thumbnail seeks without a click, and a thin playhead line follows it.
  An unselected thumbnail neither seeks nor selects.
- Dragging the mini bar only seeks. The recording shows no in/out marking, so seeking and marking
  are separate gestures.
- Wheel up advances and wheel down goes back, on the selected thumbnail only (the owner's text; the
  recording does not show the direction). One second per notch. The panel scrolls when the wheel
  cannot seek, and for every other row.
- Rows show resolution and length only. Frame rate is not shown, never as the project's 30 fps; the
  source rate probe is a separate scope.

The numeric In/Out fields are replaced by Set in and Set out at the preview position, which is a
proposal approved by the coordinator. Out includes the frame it is set on, and one frame stays.

## Paths

`src/components.tsx` (`MediaLibrary`, `ScrubFace`), `src/App.tsx` (`SourceMonitor`, `SourceBar`, the
lifted preview position), scoped `src/styles.css`, `src/Editor.stories.tsx`,
`tests/source-scrub.spec.ts`, `tests/source-range.ts` and the specs that set a source range. No
`src/media.ts`, Timeline, model, schema, drawer or track-selector change.

## Limits

No physical touch, wheel hardware or audible playback proof. A drag that leaves a peeked drawer was
not exercised with a real capture; add a hold only if it closes.
