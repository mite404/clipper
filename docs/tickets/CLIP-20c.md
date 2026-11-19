# CLIP-20c

Authoritative state: [master ticket](../master-tickets.md#clip-20). This is the solid colour,
gradient and panel shadow part of CLIP-20. Wallpaper presets, WebP backgrounds and a
choose/replace/remove background image control are not part of it (CLIP-20d).

## Contract

Four optional fields on the layout, none of which is written unless set, so a project that never
touches them is byte-identical and renders as today (a solid `#172324`, no shadow):

- `fill`: the stage colour, `#rrggbb`; with `fillTo`, the gradient's start.
- `fillTo`: the gradient's end. It needs `fill`.
- `fillAngle`: 0 to 360, CSS's meaning (0 up, 90 right); 135 when absent. It needs `fillTo`.
- `shadow`: 0 to 100, one strength. Absent or 0 draws none.

The fields are flat, not an object, so the history's 800 ms fold treats a slider drag as one step.
There is no envelope version bump. An older build drops the fields on open.

The shadow is a soft black drop under the screen and camera panels, outside their rounded boxes: a
blur of 0.6 x strength and a drop of 0.2 x strength in stage pixels at 50 percent black, scaled to
the render size. The preview uses CSS `linear-gradient` and `box-shadow`. Copy frame and export draw
the same on the canvas with `gradientLine`, which gives CSS's corner-to-corner line.

## Inspector

In Composition, after Corner radius: Background style (Solid colour or Gradient), a native colour
input with its hex beside it for each colour, Gradient angle and Panel shadow sliders. A colour
commits once when the picker applies it or the field loses focus, so one pick is one undo step. The
experimental ui-sdk ColorPicker is left until it is stable.

## Paths

`src/stage.ts`, `src/project.ts`, `src/Composition.tsx`, `src/export.ts`,
`src/BackdropControls.tsx`, the Composition subsection of `src/App.tsx`, scoped `.backdrop-*` rules
in `src/styles.css`, and `src/stage.test.ts`, `src/project.test.ts`, `tests/backdrop.spec.ts`,
`tests/export.spec.ts`.

## Limits

The shadow's canvas and CSS blurs are matched by pixel probes, not proven identical at every radius.
A very large shadow near a panel edge is not probed. The colour input's own picker popup is the
browser's and is not driven by the specs; they set its value and fire its events.
