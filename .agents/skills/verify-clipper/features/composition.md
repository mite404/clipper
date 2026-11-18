# Composition

Compose a landscape clip on the left and portrait talking head on the right with matching rounded
masks and screen-only zoom animations.

## Sub-features

- Matching 22px masks by default; adjustable shared radius and independent X/Y crops.
- Add, select, edit, and remove timed zooms with level, start, length, and focus X/Y fields. The
  fields stop at the timeline end and at a six-frame minimum length.
- Ease in, hold, and ease out, driven by the same composition frame as video.
- The Inspector's composition preview swaps frame sides without changing the mask dimensions.
- Pressing on the screen video pauses and shows the unzoomed screen while held; release sets the
  focus.

## How to get to it (user POV)

Use Inspector's crop and radius controls. Add zoom at playhead in Inspector or Add zoom in the
timeline toolbar. Select the purple zoom segment to edit it, or leave the playhead inside it. Press
and drag on the screen video to the cursor location and release; a plain click works too. Escape
during the drag cancels it. Zoom focus X and Y are the keyboard equivalent. Click the miniature
composition preview in Inspector to swap sides. Enter and Space activate the same button. The
composer window title is not an action. Undo restores the previous layout.

## Driving it with Playwright

Run `.agents/skills/verify-clipper/scripts/verify.mjs composition`. It starts a fresh editor and
runs splice/scrub/zoom, swap/trim/scroll, and mouse-focus/save/reopen journeys. The splice journey
loads demo media and seeks to frame 90 before adding a zoom. Set Zoom level to 2, require a 2x
screen transform at frame 135 and identity at frame 270. Require both mask radii to be 22px. Read
the actual downloaded JSON and require the split voice clips, radius, and zoom scale. Inspect
screenshots at default and zoomed states. Confirm the talking-head transform stays at 1x. The
refinement journeys mark 25%,65%, verify a 2× transform, swap sides and reopen the portable project.
`all` also runs `tests/controls.spec.ts`: it sets Zoom start seconds to 4 and Zoom duration seconds
to 2.5 (frames 120 to 194), requires the screen to be unzoomed at frames 90, 119 and 195 and 2× at
150, then sets Zoom focus X 20 and Y 80 and requires that point of the screen to sit at the mask
centre. Start 99 must clamp to 9.5, length 0.1 to 0.2 and length 5 to 2.5. The `mouse-centered-zoom`
Storybook story opens marking mode automatically.

## Gotchas

The composition uses cover crops, so wide screen imports can lose edge content at this side-by-side
ratio. Crop controls choose the visible portion. Zooms cannot overlap. Ordinary media has no cursor
metadata, so its zoom focus is one authored point; recorded clicks and follow are in
[cursor.md](cursor.md). Exact centering near an edge can reveal background. Reload discards unsaved
edits. The zoom ramp is fixed at 24 frames or half the zoom, whichever is shorter, with smoothstep
easing. There is no ramp control, no B shortcut and no timeline edge handle on a zoom (CLIP-9b is a
proposal); those are pending, so do not report them as verified. Padding, backgrounds, aspect ratios
and camera layout options (CLIP-19 to CLIP-23) are not delivered.
