# Timeline and transport

Splice video and speech, seek synchronized media, and shuttle with keyboard controls.

## Sub-features

- Two video tracks, two audio tracks, ruler, selected clip, and frame playhead.
- Split, delete, undo, and track-local ripple insertion.
- Selection (V) and Razor (C) tools; a Razor click cuts at the clicked frame, snapping to the
  playhead and clip edges. Per-track Select and Lock toggles save with the project; a locked track
  refuses new clip edits but undo still restores (CLIP-2e).
- Previous frame and Next frame buttons and the arrow keys step exactly one frame and stop at the
  first and last frame.
- Play/pause via transport and Space; J rewind, K pause, L play, repeated J/L for faster speeds.
- Audio mute, decoded waveform progress, and silent reverse playback.
- Left/right edge sliders shorten clips by pointer drag or arrows; Shift adjusts ten frames.
- Timeline scale and native horizontal scrolling expose the entire sequence.
- After a pause the arrow key and the frame buttons step from the frame the timecode shows, so Next
  frame then Previous frame returns to it (REF-9 delivered).
- Delete or Backspace removes the selection, seeking clamps at both ends, and Ctrl, Cmd and Alt
  chords never delete, seek or drive the transport (REF-7, REF-19). The one chord that splits is
  Cmd+K on Mac or Alt+K elsewhere, which cuts every unlocked track.
- A slider drag or held key is one undo step and an edit that changes nothing is none. Undo keeps
  the last 50 edits (REF-16).

## How to get to it (user POV)

Use the timeline below Composition. Select a clip or check track headers and choose Split, which
cuts the selected clip and selected unlocked tracks; there is no S binding. Press C for Razor and
click a clip to cut it, V to return to Selection. Delete removes the selection; Undo or Ctrl/Cmd+Z
restores it. Scrub the ruler or double-click a track to seek. Shortcuts shows the keyboard guide and
pauses playback.

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
modified-key and delete/undo/clamp journeys, the one-step slider undo and the 50-edit limit. `all`
also runs `tests/split-tools.spec.ts` for Split targets, Cmd+K and Alt+K, Razor snapping, and locks
refusing split, delete, trim and insert while toggles save, dirty and reopen. Run
`.agents/skills/verify-clipper/scripts/verify.mjs performance` separately for five production
playback responsiveness checks without trace/video overhead.

REF-31 adds `tests/transport-lifecycle.spec.ts` to `editor`: a held Space toggles once until it is
released and pressed again; hiding a real second tab pauses rewind at 1× and 4× and returning holds
the frame, timecode and both videos for twenty paints, with a fresh rewind afterwards; and a focused
playhead slider, modifier chords, the shortcuts dialog, J/K/L and repeated arrow stepping keep
working. The hidden-tab test spawns Chromium, so it launches `CHROME_PATH` when set and the
installed Chromium otherwise. Its test budget is sixty seconds, including a thirty-second wait for
the DevTools port.

REF-38 makes a focused playhead give Space to transport. Only `all` runs
`tests/focused-controls.spec.ts`. It proves one play/pause per Space from Tab- and pointer-focused
sliders, buttons, trim sliders and the resize separator without changing their values. It checks
that a focused checkbox toggles once on Enter, even when Enter is held, and never on Ctrl+Enter or
Space. It checks that a focused select opens its picker on Enter, keeps arrow keys when `showPicker`
throws, and plays on Space. It also checks that number entry never drives transport.

REF-40 and REF-41 refine that rule, and `split-tools.spec.ts` and `focused-controls.spec.ts` check
it. A focused slider keeps arrows, Home, End and the Page keys, ignores Delete and Backspace, and
passes every other key to the shortcuts. After a real mouse scrub of the ruler, K/L, C/V and the cut
chord still work and arrows only step the playhead. A focused file input, Import media or Open
project, gives Space to transport without opening its chooser, while Enter still opens it. Tab
reaches the Open project input (REF-42) and a visible focus ring marks its label.

REF-44 limits Delete and Backspace to the timeline. They remove the selected clip or zoom only when
focus is inside the Main sequence panel, including a clip a pointer just selected and a trim grip.
With focus in the media pool, source monitor, inspector, header or page body they do nothing and the
browser keeps the key (`focused-controls.spec.ts`, run by `all`).

REF-20 adds an independent held-rewind check in `editor`. At 1×, 2× and 4× it pauses between readout
paints, compares the held playhead with camera media time, steps forward once and returns with
Previous frame. It also rewinds to zero and steps to frame 1. `performance` observes readout
mutations for about 1.5 seconds at each speed under 4× CPU throttling. It requires backward travel,
more than five changes, at most one change per 100 ms plus one straddling paint, and camera media
time matching the held playhead after pause.

## Gotchas

The older held-pause journey proves stepping is consistent with the displayed timecode, not
independent player parity. REF-20 compares camera media time, not decoded pixels or the player's
internal frame, and bounds DOM changes rather than React commits. Mute of one track at a time
(REF-36) and per-clip retiming (CLIP-16) have no coverage. The REF-31 checks use Chromium only; they
do not cover Safari, Firefox, a physical device or speaker output.

J is silent frame-by-frame seeking because browsers do not decode reverse audio. Click a source
preview to play it independently; it is not the composition clock. Filmstrips repeat the decoded
first-frame thumbnail rather than pretending to provide per-time thumbnails. Trimming shortens
without rippling neighboring clips. Left trim advances the source offset and start together.
