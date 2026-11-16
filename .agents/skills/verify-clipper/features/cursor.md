# Cursor and zoom creation

Attach an OpenScreen pointer sidecar to a source, draw its cursor in preview and export, create
playhead zooms without tracking, and let a zoom follow the cursor.

## Sub-features

- Attach and remove a version 2 `native` sidecar per source. The status line counts samples and
  cursor assets, or reads `No cursor sidecar`. A bad replacement is refused and keeps the current
  data.
- Cursor time offset in milliseconds, default 0.
- Cursor motion Smooth or Raw, Cursor size, Hide cursor, and Cursor style: Recorded shapes, First
  embedded shape or Touch.
- Under Advanced cursor: Hide when idle, Remove small shakes, Stabilize recorded shapes (a shape
  change is held until it lasts 100 ms), Rotate with movement (off by default; a horizontal lookback
  capped at 12 degrees, about the recorded hotspot), Animation (Smooth, Medium, Rapid or None;
  disabled while motion is Raw), Cursor ending (Recorded ending, Stop early, Return to start per
  trimmed clip), and hidden source-time ranges.
- Add zoom or plain B creates one focused four-second zoom at the playhead without a sidecar.
  Shorten the outpoint at the sequence end; refuse overlap or fewer than six remaining frames.
- Existing source-anchored zooms still reopen, resolve through clip edits, and export. Batch click
  generation and its amount, hold, regenerate and remove controls are no longer available.
- Camera follow on a selected zoom: Fixed focus, Focused or Smooth.

## How to get to it (user POV)

Select a source card in Project media and choose Attach sidecar. Select a purple zoom to reach
Camera follow.

## Driving it with Playwright

Run `.agents/skills/verify-clipper/scripts/verify.mjs all`; no narrower journey selects these specs.

- `cursor.spec.ts` attaches a synthetic sidecar, rejects bad replacements, sets every control above,
  saves, reopens after reload, and requires zero non-GET requests. A second test keeps the actions
  reachable at narrow widths with long filenames and large counts.
- `cursor-render.spec.ts` reads the cursor's position in the preview and in encoded frames through a
  cut, crop, side swap and zoom. It steps frames with Next frame and Previous frame across a hidden
  range, Touch style, Hide cursor and the loop ending.
- `cursor-rotation.spec.ts` rotates through a cut, offset and reverse seeks: preview angle reads +12
  at frame 2, -12 at frame 4 and 0 after, the transform origin is the scaled hotspot, and unchecking
  Rotate with movement returns 0. Encoded frames must carry the rotated bar.
- `cursor-speeds.spec.ts` requires each Animation choice to put the cursor at its own preview
  position after three Next frame clicks (Smooth, Medium, Rapid, None), Smooth to match the default
  pixels, and encoded probes to show the marker each style selects.
- `cursor-shapes.spec.ts` requires the cursor image shown with Stabilize recorded shapes to match
  the encoded frames' pixels through trimmed, repeated source cuts, to change when the option is
  cleared, and to hold the same image per frame in Raw and Smooth motion.
- `zoom-creation.spec.ts` creates through Add zoom and B without cursor metadata, verifies four
  seconds and focused follow, rejects overlap, undoes, saves and reopens. It covers six-versus-five
  remaining frames, outpoint shortening, repeat and text/modifier guards, and the shortcut hint.
- `auto-zoom.spec.ts` opens legacy source-anchored shots, undoes manual edits, saves, reopens, and
  checks the source anchor in the downloaded JSON. A second test requires a source-offset click to
  be centred identically in preview and decoded export; neither test invokes a removed generator.
- `framing.spec.ts` requires follow to place the same pixels in preview and export for two targets,
  to be stable across seeks, and to accept Fixed focus, Focused and Smooth.
- `frame-image.spec.ts` also reads the cursor, including the rotated one, from a copied frame; see
  [frame-copy.md](frame-copy.md).
- `performance.spec.ts` repeats its playback checks with cursor follow on.

## Gotchas

Every fixture is synthetic. No private OpenScreen recording is in the suite, so Retina scale, window
capture, multi-display and non-left buttons are untested; scale 1 on macOS OpenScreen 2.2.2 is an
inference. Check CLIP-11 in `docs/master-tickets.md` before claiming a cursor behavior. Delivered on
main: the core styles, idle hide, shake removal and endings, source-time hidden ranges, shape
stabilization, rotation and speed styles. CLIP-11 as a whole stays Partial: video-wide ending parity
and real-Mac qualification are open, so no run here proves them. The 1 s idle delay, 0.5% shake
radius and 0.5 s ending length are engineering defaults, not owner decisions. Click sounds, motion
blur and keystroke overlays (CLIP-12 to CLIP-14) are not delivered.
