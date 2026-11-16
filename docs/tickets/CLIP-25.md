# CLIP-25

## Status

- Authoritative state: [master ticket](../master-tickets.md#clip-25).
- Goal: copy the held composition frame to the clipboard as an `image/png`.
- Effort: small. Risk: the image must come from the same renderer as the exported video.
- Dependencies: none beyond the delivered export renderer.
- Planned at: `e3428eeb4b88fb44bf23dcafc1dcf16a08167353`, 2026-11-16.
- Local path: `docs/tickets/CLIP-25.md`.

## Why this matters

A user can share or annotate one exact output frame without exporting a video. The image must show
what the export would show, including masks, crops, side swap, zoom, follow and the rotated cursor.

## Current state

The header has a native **Copy frame** button next to Export video. A click pauses playback and
captures the edit, assets, output width and held frame together. It renders one frame through the
export renderer's `drawFrame`, framing and cursor path, with no encoder. The result is written with
`navigator.clipboard.write` and `ClipboardItem`. The write starts inside the click, with the PNG
supplied as a promise. Nothing is uploaded and no permission is requested before the click.

The image uses the Export resolution selection (1920 × 1080 or 3840 × 2160). The status line names
the frame and size. An unsupported or denied clipboard, or unreadable media, shows
`Could not copy frame.` plus the reason. The edit is untouched, the button is enabled again, and no
`blob:` URL appears in the message.

## Scope

In: `renderFrameImage` in `src/export.ts`, one action in `src/App.tsx`, `tests/frame-image.spec.ts`.
Out: video-wide encoding, formats or options, new dependencies, persistence, settings, and any
change to sampling.

## Sampling semantics and limits

A frame request is the nominal `sourceFrame(clip, frame) / FPS`. Mediabunny returns the last
presented frame whose stored start time is at or before the request. In the inspected synthetic
fixture, an 18-frame VP9 WebM written at exactly `i / 30` s with no frame-rate hint, the stored
times are whole milliseconds, so frames 2, 5, 8, 11, 14 and 17 are stored after `i / 30` and the
previous source frame is shown. Preview, copy and export agree on that fixture. Other timestamp
scales, start offsets and encoders need not share this pattern. The nominal frame index is not the
source presentation timestamp. This ticket retains stored-time sampling and does not claim complete
WebM or variable-frame-rate compatibility.

The diagnostic `webm-boundary.repro.spec.ts` was inspected, not kept. It logs 24 held positions (18
forward, 6 reverse) of an 18-frame fixture written without a frame-rate hint. It has no
preview-equals-PNG assertion. The kept regression in `tests/frame-image.spec.ts` asserts that the
Remotion player's `compose-monitor` video and the clipboard PNG both show the stored-time frame at
held positions 2, 5, 4, 5 and 2. Expected markers come from the millisecond-rounded stored times.

## Test plan

`tests/frame-image.spec.ts` needs the Vite development server because it imports `/src/export.ts`
and Mediabunny. It checks decoded PNG pixels with independent expectations for source offsets,
repeated cuts, reverse and direct seeks, crop position, 2× zoom, 4K width and the rotated cursor,
plus real clipboard readback through the button, and denied, unsupported and unreadable-media
recovery. Ordinal exact-frame coverage uses a floored-millisecond fixture and is not a complete WebM
or VFR claim.
