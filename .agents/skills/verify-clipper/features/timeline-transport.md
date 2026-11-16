# Timeline and transport

Splice video and speech, seek synchronized media, and shuttle with keyboard controls.

## Sub-features

- Two video tracks, two audio tracks, ruler, selected clip, and frame playhead.
- Split, delete, undo, and track-local ripple insertion.
- Previous frame and Next frame buttons and the arrow keys step exactly one frame and stop at the
  first and last frame.
- Play/pause via transport and Space; J rewind, K pause, L play, repeated J/L for faster speeds.
- Audio mute, decoded waveform progress, and silent reverse playback.
- Left/right edge sliders shorten clips by pointer drag or arrows; Shift adjusts ten frames.
- Timeline scale and native horizontal scrolling expose the entire sequence.
- After a pause the arrow key and the frame buttons step from the frame the timecode shows, so Next
  frame then Previous frame returns to it (REF-9 delivered).
- Delete or Backspace removes the selection, seeking clamps at both ends, and Ctrl, Cmd and Alt
  chords never split, delete, seek or drive the transport (REF-7, REF-19).
- A slider drag or held key is one undo step and an edit that changes nothing is none. Undo keeps
  the last 50 edits (REF-16).

## How to get to it (user POV)

Use the timeline below Composition. Select a clip and choose Split or press S. Delete removes the
selection; Undo or Ctrl/Cmd+Z restores it. Scrub the ruler or double-click a track to seek.
Shortcuts shows the keyboard guide and pauses playback.

## Driving it with Playwright

Run `.agents/skills/verify-clipper/scripts/verify.mjs editor`. It starts an isolated editor and runs
all editor and refinement journeys. Keyboard actions use a fresh demo with focus outside an input.
At timeline 7.5 seconds require screen source 8.5 seconds, camera source 7.5 seconds, and speech 7.5
seconds after splitting speech. Use `getByRole('slider', {name: 'Timeline playhead'})` to seek.
Require actual audio playback after L and zero voice volume after Mute Voiceover. The same command
tests shortcuts-dialog focus and keyboard isolation, pointer trimming, undo, and scrolling to the
end. `all` also runs `tests/controls.spec.ts`: from frame 29 Next frame must read 00:01:00 with the
playhead at 30 and the camera video at 1.0 s, Previous frame must return to 00:00:29, and three Next
clicks must read 00:01:02. Previous at frame 0 and Next at frame 359 must not move. `editor` also
runs the held-pause journey (five pauses after 430 to 590 ms of playback; each requires the
displayed timecode to rise by one on the arrow key and to return on Previous frame), the
modified-key and delete/undo/clamp journeys, the one-step slider undo and the 50-edit limit. Run
`.agents/skills/verify-clipper/scripts/verify.mjs performance` separately for five production
playback responsiveness checks without trace/video overhead.

## Gotchas

Rewind and export-progress re-rendering (REF-20) are not delivered. The held-pause journey proves
stepping is consistent with the displayed timecode after a pause; it never reads the player's own
frame, media time or pixels, so it is not independent readout parity, and it does not prove the
readout rate during rewind, and `performance.spec.ts` has no rewind or readout test. Hidden-tab
rewind jumps, held-Space toggles (REF-31), mute of one track at a time (REF-36) and per-clip
retiming (CLIP-16) have no coverage.

J is silent frame-by-frame seeking because browsers do not decode reverse audio. Click a source
preview to play it independently; it is not the composition clock. Filmstrips repeat the decoded
first-frame thumbnail rather than pretending to provide per-time thumbnails. Trimming shortens
without rippling neighboring clips. Left trim advances the source offset and start together.
