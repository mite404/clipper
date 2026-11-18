# Workspace layout

Show or hide the media pool, resize the three panes, size and scale the timeline, and edit cursor
data in the Inspector without moving the rest of the editor.

Delivered by UI-2 at `ceb40bb` (exact-SHA CI 43871531117), the Inspector cursor move at `27bae5a`
(CI 43862475576), UI-7 at `b9c2e83` (CI 43953490741) and UI-5 at `601ba78` (CI 43978647729). Every
spec on this page runs only under `all`: no named journey selects them.

## Sub-features

- Media pool pane toggle, named Hide media pool pane and Show media pool pane. It keeps the selected
  clip, timeline scale and running playback, and returns focus to the toggle.
- A temporary left-edge preview of the media pool for a fine pointer. A touch device has only the
  persistent toggle.
- Three pane separators, Resize media pool, Resize inspector and Resize timeline, that drag with a
  captured pointer or move with keys, and cancel with Escape.
- A timeline Hide and Show button, a custom height that the default-height button and its restore
  button swap between, and a Timeline scale slider with bounds that follow the sequence.
- Two-axis timeline scrolling that reaches every video and audio lane.
- Preview quality in the footer: Full, Half or Quarter lays the preview out at that fraction of 1920
  wide, remembered on the device and never saved in a project. A 4K export still previews at 1920;
  Copy frame and export always render the full output. `all` runs `tests/preview-quality.spec.ts`,
  including one real 3840 WebM render. Playback already pauses when the tab is hidden.
- The Inspector's Source cursor data region, which scrolls inside the Inspector and edits a
  recording once for every use of it (see [Cursor and zoom creation](cursor.md) for the data
  itself).

## How to get to it (user POV)

Use the Media button in the header row, the thin separators between panes, the timeline's own Hide
timeline and Use default timeline height buttons, and the Timeline scale slider. Select a screen
clip to see its cursor data in the Inspector.

## Driving it with Playwright

Run `.agents/skills/verify-clipper/scripts/verify.mjs all` and read the results by spec file. These
specs use production unless noted. Each starts from a fresh tab at `4 assets ready`.

`workspace-layout.spec.ts` runs with a fine-pointer browser, and the touch test opens its own touch
context.

- `media pool pane toggles without resetting selection, zoom or playback` hides and shows the pane
  from the keyboard. Space on the focused toggle still plays and pauses; Enter activates it. It
  requires the selected clip, the chosen scale and the playing state to survive.
- `media edge preview` has three tests. A fine pointer at the left edge previews the pool without
  moving the editing area or timeline, leaving retreats it and a click on the toggle pins it. Focus
  stays inside an open preview, Escape returns it to the toggle, and closed rows leave the Tab
  order. At 960, 617, 390 and 320 px the preview stays inside the viewport, and with reduced motion
  it runs no animation.
- `touch uses the persistent Media toggle without a hover preview` at 390 × 844 with touch: a hover
  does not open the pool and a tap does.
- `long sequences scroll in both axes with every video and audio lane reachable` at the maximum
  scale. Arrow keys on the focused scroll area scroll it without moving the playhead. At 960 and 390
  px the wheel reaches the first and last lanes with no page overflow.
- `scale bounds follow duration, retaining valid scale and clamping only outside the range` and
  `fit scale follows the viewport and stays finite for empty and one-frame sequences`.
- `timeline resizing remembers custom height across default, hide and viewport clamps` resizes with
  the keyboard, swaps default and custom height, hides and shows the timeline during playback, and
  requires scale and scroll to survive. A short window clamps the height and a taller one restores
  it.
- `pane drags follow captured pointers during playback and cancel without keeping a size`,
  `all pane bounds fit jointly and preserve desired widths through responsive clamping`,
  `cancel, lost capture and blur roll back a default-height drag without inventing custom height`,
  `sideways timeline drag leaves responsive default height selected` and
  `export cancellation restores short-window timeline resizing without viewport changes`. The
  preview keeps at least 479 × 239 px with every pane at its maximum, and no separator is offered at
  960 px or narrower.

`cursor-inspector.spec.ts`
(`screen selection edits its recording in a scrolling inspector without displacing the sequence`)
attaches a synthetic cursor sidecar at 1440 × 1000, opens Cleanup, Advanced cursor and Source data,
and sets a 50 ms offset. It requires the Inspector to scroll while the transport and timeline
toolbar stay in view at the same position. It then selects another clip and requires that clip's own
status, and the offset and Rapid animation style to apply to every use of the first recording. Raw
motion disables the animation style, and playback still starts.

## Gotchas

These checks use Chromium with a pointer or touch emulated by the browser. They do not qualify a
physical touch device, a real mobile browser, other browsers or a Retina display. A hover preview
and its delays are timing-based; the preview specs use fixed 100, 350 and 600 ms waits. The tests
assert layout geometry and state, not pixel appearance; inspect screenshots before reporting visual
quality. The cursor behavior itself is mapped in [cursor.md](cursor.md). No spec here proves a
still-image backdrop, dynamic tracks or Inspector controls other than the cursor region.
