# Frame copy

Copy the composed output frame the preview holds to the clipboard as a PNG. This is CLIP-25,
delivered at `6fa99af`.

## Sub-features

- Copy frame button in the header, beside Export video. A click pauses playback and captures the
  edit, assets, output width and held frame together.
- The PNG comes from the export renderer's `drawFrame`, framing and cursor path, with no encoder:
  source offsets, repeated cuts, crop, side swap, zoom, follow and the rotated cursor all apply.
- Size follows Export resolution: 1920 × 1080, 3840 × 2160 or square 1080 × 1080.
- Status reads `Frame N copied as W × H PNG. Rendered locally.` A denied or unsupported clipboard,
  or unreadable media, reads `Could not copy frame.` plus the reason, never a `blob:` URL. The edit
  is untouched and the button is enabled again.

## How to get to it (user POV)

Pause on a frame, optionally pick Export resolution, then choose Copy frame. Paste into any image
editor. Nothing is uploaded and no permission prompt appears before the click.

## Driving it with Playwright

`.agents/skills/verify-clipper/scripts/verify.mjs all` is the only journey that runs
`tests/frame-image.spec.ts`; no narrower name selects it. It grants clipboard read and write, then:

- renders frames across offsets, repeated cuts and reverse seeks and requires the decoded pixel to
  match the source frame derived by hand, plus backdrop and empty-camera fills;
- requires crop position, a 2× zoom and the 3840 × 2160 width to move the probed pixels;
- requires the rotated cursor to cover its probes and nothing to cover them with rotation off;
- reopens a project, steps to output frame 11, presses Enter on the focused button, reads
  `image/png` back from the real clipboard and requires 1920 × 1080 with source frame 8's pixel;
- rejects the write with `NotAllowedError`, removes `ClipboardItem`, and fails the media read, each
  time requiring a visible error, an enabled button and an unchanged timecode;
- stalls the media read, moves the playhead and deletes the clip being rendered, then requires the
  copied image to still show the frame and edit held at activation.

Read the PNG back from the clipboard, not from a DOM screenshot. A status message alone is not
proof.

## Gotchas

The held-preview and copied-PNG comparison at WebM boundaries is asserted for a synthetic 18-frame
VP9 file written at exact `i / 30` seconds with no frame-rate hint. Requests use stored timestamps.
This is not a claim of VFR or general WebM compatibility; REF-28 tracks missing and early-ended
frames. Real clipboard behavior in Safari or Firefox is untested; the spec runs in Chromium with
granted permissions, so a permission prompt in a real browser is not observed. No private recording
is used.
