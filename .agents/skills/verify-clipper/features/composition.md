# Composition

Compose a landscape clip on the left and portrait talking head on the right with matching rounded
masks and screen-only zoom animations.

## Sub-features

- Matching 22px masks by default; adjustable shared radius and independent X/Y crops.
- Add, select, edit, and remove timed zooms with scale and focus controls.
- Ease in, hold, and ease out, driven by the same composition frame as video.
- The Inspector's composition preview swaps frame sides without changing the mask dimensions.
- Mark mouse position pauses and shows the unzoomed screen for manual focus selection.

## How to get to it (user POV)

Use Inspector's crop and radius controls. Add zoom at playhead in Inspector or Add zoom in the
timeline toolbar. Select the purple zoom segment to edit it. Choose Mark mouse position, then click
the cursor location on the screen frame or use arrows and Enter. Escape cancels marking. Click the
miniature composition preview in Inspector to swap sides. Enter and Space activate the same button.
The composer window title is not an action. Undo restores the previous layout.

## Driving it with Playwright

Preconditions: demo media loaded; seek to frame 90 before adding a zoom.

Run `npm run test:ui -- tests/editor.spec.ts -g 'splice, scrub'`. Set Zoom level to 2, require a 2x
screen transform at frame 135 and identity at frame 270. Require both mask radii to be 22px. Read
the actual downloaded JSON and require the split voice clips, radius, and zoom scale. Inspect
screenshots at default and zoomed states. Confirm the talking-head transform stays at 1x. Run
`tests/refinements.spec.ts` to mark 25%,65%, verify a 2× transform, swap sides and reopen the
portable project. The `mouse-centered-zoom` Storybook story opens marking mode automatically.

## Gotchas

The composition uses cover crops, so wide screen imports can lose edge content at this side-by-side
ratio. Crop controls choose the visible portion. Zooms cannot overlap. Ordinary media has no cursor
metadata; focus is one manually authored point per zoom, not tracking. Exact centering near an edge
can reveal background. Reload discards unsaved edits.
