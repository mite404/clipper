# Timeline and transport

Splice video and speech, seek synchronized media, and shuttle with keyboard controls.

## Sub-features

- Two video tracks, two audio tracks, ruler, selected clip, and frame playhead.
- Split, delete, undo, and track-local ripple insertion.
- Play/pause via transport and Space; J rewind, K pause, L play, repeated J/L for faster speeds.
- Audio mute, decoded waveform progress, and silent reverse playback.
- Left/right edge sliders shorten clips by pointer drag or arrows; Shift adjusts ten frames.
- Timeline scale and native horizontal scrolling expose the entire sequence.

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
end. Run `.agents/skills/verify-clipper/scripts/verify.mjs performance` separately for five
production playback responsiveness checks without trace/video overhead.

## Gotchas

J is silent frame-by-frame seeking because browsers do not decode reverse audio. Click a source
preview to play it independently; it is not the composition clock. Filmstrips repeat the decoded
first-frame thumbnail rather than pretending to provide per-time thumbnails. Trimming shortens
without rippling neighboring clips. Left trim advances the source offset and start together.
