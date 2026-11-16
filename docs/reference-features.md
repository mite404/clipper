# Reference features and capture evidence

This is a requirements and source record, not an operational backlog. Status and ownership live only
in [master-tickets.md](master-tickets.md). Preserved from the
[reference artifact](https://ampcode.com/artifacts/clipper-reference-backlog-e067faa7-a848-4b3f-864b-01c8ea952ac0),
revision 8, read 2026-11-16. Its historical delivery paragraphs are superseded by the master.
Sources describe desired behavior, not proof Clipper implements it. No external tickets were filed.
The owner approved deleting only the reference artifact after preservation; its owning thread
confirmed deletion on 2026-11-16. The link above records provenance, not a live operational queue.

The artifact's
[CLIP-10 verification and limits](https://ampcode.com/artifacts/clip-10-verification-acbfed26-8443-4d2e-98f4-c31a34450fd7)
record its 112 unit and 35 browser checks after rebase. The
[preserved CLIP-10 branch](https://github.com/mite404/clipper/tree/wip/clip-10-smooth-follow) at
[`b2eca61`](https://github.com/mite404/clipper/commit/b2eca61edaf16f5afa657f84c6b4a6b3ec870626) is
provenance only, not a newer implementation or another queue. Do not delete it without approval. Its
granted integration base was
[`e45942c`](https://github.com/mite404/clipper/commit/e45942ce0fc609923b3b6fb4388df8029859a971).

The existing
[refinement acceptance](https://ampcode.com/artifacts/clipper-refinement-tickets-9f40b94d-40bf-4ca2-9641-78208057b5a2)
and
[steel-thread verification](https://ampcode.com/artifacts/clipper-steel-thread-verification-72434030-61d6-453a-a53c-982d2ce52e29)
remain the original CLIP-1 through CLIP-6 evidence. They are distinct from the reference artifact
deleted after preservation here. CLIP-3 is manual fixed-point zoom, not recorded tracking.

## Motion acceptance

| Ticket ID                            | Required behavior                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CLIP-7](master-tickets.md#clip-7)   | Associate timestamped moves, clicks, shapes and bounds with a source; independently import recording metadata without Screen Studio; preserve raw source timestamps through trims, splits, repeated source uses and portable save/reopen; validate before replacement; provide a useful no-data state. Normalized import is not native package compatibility. |
| [CLIP-8](master-tickets.md#clip-8)   | Deterministic interpolation on arbitrary seeks; one coordinate system through crop, side swap and zoom; raw and smooth modes, click preservation, no smoothing across cuts or disconnected intervals; size, visibility and shape changes in preview and export. Test asymmetric positions, edge crops, source offsets and rapid reversals.                    |
| [CLIP-9](master-tickets.md#clip-9)   | Generate editable shots and focus from recorded clicks; merge nearby activity without pumping; preserve manual zooms; deliberate undoable regeneration; automatic/manual choice, disable/remove, amount and duration; no invented auto zooms without clicks; retain manual authoring. Check trims, splits and preview/export focus.                           |
| [CLIP-10](master-tickets.md#clip-10) | Smooth pan between activity targets with stable reading holds; automatic easing; talking head independent of screen zoom; avoid empty source edges where possible; deterministic seeking and fast changes; focused/smooth and instant choices without keyframes. Test moving sequences, cropped edges, cuts, CPU throttle and decoded exports.                |
| [CLIP-11](master-tickets.md#clip-11) | macOS/Touch and default-cursor override; global and source-segment hiding; idle hide, end-stop, video-wide return loop, movement rotation, shake removal and cursor-type optimization; cursor speed styles. The shipped per-trimmed-clip ending is not video-wide loop parity.                                                                                |
| [CLIP-12](master-tickets.md#clip-12) | Click sound choice and volume.                                                                                                                                                                                                                                                                                                                                |
| [CLIP-13](master-tickets.md#clip-13) | Independent cursor, zoom and pan motion-blur controls.                                                                                                                                                                                                                                                                                                        |
| [CLIP-14](master-tickets.md#clip-14) | Keystroke labels, size, single-key filtering and per-event or all-matching disable. Requires an actual key-event source.                                                                                                                                                                                                                                      |

Motion sources:

- [CLIP-9b](master-tickets.md#clip-9b) retains reference timeline-edge edits for manual zoom start
  and duration. The current timeline provides selection buttons, not zoom edge handles.
- [Raw cursor handoff](https://ampcode.com/time-capsules/4?t=489),
  [event preservation](https://ampcode.com/time-capsules/4?t=523),
  [cursor reconstruction](https://ampcode.com/time-capsules/4?t=791).
- [Existing-video limits](https://screen.studio/guide/creating-project-from-existing-video),
  [cursor settings](https://screen.studio/guide/cursor),
  [raw-motion override](https://screen.studio/guide/disable-smooth-mouse-movement),
  [animations](https://screen.studio/guide/animations).
- [Auto zoom](https://screen.studio/guide/auto-zoom),
  [zoom creation and editing](https://screen.studio/guide/adding-editing-zooms),
  [disable auto creation](https://screen.studio/guide/disable-automatic-zooms-),
  [instant zoom](https://screen.studio/guide/instant-zoom),
  [cursor-follow crop](https://screen.studio/guide/aspect-ratio).
- [Segment hiding](https://screen.studio/guide/hiding-the-cursor-in-specific-sections),
  [click sounds](https://screen.studio/guide/mouse-click-sound),
  [key overlays](https://screen.studio/guide/shortcuts).

## Editing and layout requirements

Preserve local screen, webcam and microphone import with synchronized tracks, independent source
playback and source in/out, split/delete/undo and waveforms. Edge trims and scalable/scrollable
timeline do not imply waveform-audition scrubbing. Reverse shuttle is silent. Fixed masks and side
swap do not imply arbitrary layouts or redaction.

| Ticket ID                            | Reference scope beyond the steel thread                                                                                                             |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CLIP-15](master-tickets.md#clip-15) | Audio scrub; reconcile J/K/L, frame stepping, up/down clip navigation, X current-clip selection and bracket in/out trims against reference hotkeys. |
| [CLIP-16](master-tickets.md#clip-16) | Whole and segment edit speed, not shuttle speed; automatic typing-segment acceleration requires key events.                                         |
| [CLIP-17](master-tickets.md#clip-17) | Per-clip and whole-recording gain, not just mute and fixed music gain.                                                                              |
| [CLIP-18](master-tickets.md#clip-18) | Command menu and customizable shortcuts, beyond shortcut help.                                                                                      |
| [CLIP-19](master-tickets.md#clip-19) | Padding, screen/camera proportions, arbitrary crop bounds and crop-ratio tool.                                                                      |
| [CLIP-20](master-tickets.md#clip-20) | Wallpaper, gradient, solid color, local image, inset and shadow. Detailed still-image acceptance stays in the master.                               |
| [CLIP-21](master-tickets.md#clip-21) | Wide, vertical, square, classic, tall and source aspect ratios with responsive composition.                                                         |
| [CLIP-22](master-tickets.md#clip-22) | Camera hide, position, mirror, size, roundness and zoom-time size.                                                                                  |
| [CLIP-23](master-tickets.md#clip-23) | Timed default/fullscreen/hidden camera layouts and position changes.                                                                                |
| [CLIP-24](master-tickets.md#clip-24) | Interval, size and opacity for privacy masks, redaction and highlights.                                                                             |
| [CLIP-25](master-tickets.md#clip-25) | Copy the current rendered frame as an image.                                                                                                        |

Editing sources:

- [Editing example](https://ampcode.com/time-capsules/4?t=226),
  [hotkeys](https://ampcode.com/time-capsules/5?t=184),
  [trimming](https://screen.studio/guide/trimming),
  [scrubber](https://screen.studio/guide/scrubber).
- [Speed](https://screen.studio/guide/speeding-up-the-video),
  [typing acceleration](https://screen.studio/guide/speed-up-typing-segments),
  [volume](https://screen.studio/guide/set-volume),
  [command menu](https://screen.studio/guide/command-menu).
- [Crop](https://screen.studio/guide/cropping-the-recording),
  [background](https://screen.studio/guide/background),
  [aspect ratio](https://screen.studio/guide/aspect-ratio),
  [camera](https://screen.studio/guide/camera),
  [dynamic layouts](https://screen.studio/guide/dynamic-camera-layouts-),
  [masks and highlights](https://screen.studio/guide/adding-a-mask-and-highlight),
  [frame image](https://screen.studio/guide/copy-current-frame-as-an-image).

## Programs, captions and graphics

| Ticket ID                            | Reference scope                                                                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CLIP-26](master-tickets.md#clip-26) | Source angles, automatic split angle, centered speakers and number-key cuts; independent speaker waveforms and per-speaker mute. Two video/audio tracks do not establish multicam switching.          |
| [CLIP-27](master-tickets.md#clip-27) | Save a timeline range as an independently editable social sequence, beyond source in/out.                                                                                                             |
| [CLIP-28](master-tickets.md#clip-28) | Add range to intro teaser; editable participant-name title; loop theme audio and fade in; assemble teaser, title and episode as a full program.                                                       |
| [CLIP-29](master-tickets.md#clip-29) | Chapter markers and navigable feature sections, including recording flags as input.                                                                                                                   |
| [CLIP-30](master-tickets.md#clip-30) | Separate synchronized screen/camera outputs plus interactive responsive player bundle, not just a rendered composite.                                                                                 |
| [CLIP-31](master-tickets.md#clip-31) | Portable edit metadata and Final Cut/After Effects optionality. Later Premiere proposals and the settled FCP7 XML choice are in the master; this source does not establish any NLE/DAW compatibility. |
| [CLIP-32](master-tickets.md#clip-32) | Local transcription with language, model and prompt selection and editable transcript.                                                                                                                |
| [CLIP-33](master-tickets.md#clip-33) | Word timing, speaker labels, edit/add/disable words and text size; SRT/VTT and transcript export; aspect-aware positions and vertical/side-by-side reflow with CLIP-21.                               |
| [CLIP-34](master-tickets.md#clip-34) | Transcript-suggested highlights, in/out edits and speaker-angle choices.                                                                                                                              |
| [CLIP-35](master-tickets.md#clip-35) | Editable Remotion graphics, presenter picture-in-picture and full-visual takeover. Having Remotion installed is not a graphics track.                                                                 |
| [CLIP-36](master-tickets.md#clip-36) | Reconstruct editable captions from captioned/uncaptioned flat video pairs.                                                                                                                            |
| [CLIP-37](master-tickets.md#clip-37) | Batch clips and a reusable product-design graphics library, beyond shared editor components.                                                                                                          |

Program sources:

- [Multicam](https://ampcode.com/time-capsules/5?t=102),
  [speaker waveforms](https://ampcode.com/time-capsules/5?t=148),
  [derived clips](https://ampcode.com/time-capsules/5?t=234),
  [title and teaser](https://ampcode.com/time-capsules/5?t=262),
  [assembly](https://ampcode.com/time-capsules/5?t=280).
- [Transcription](https://ampcode.com/time-capsules/5?t=362),
  [caption edits](https://ampcode.com/time-capsules/5?t=397),
  [aspect reflow](https://ampcode.com/time-capsules/5?t=428),
  [suggested edits](https://ampcode.com/time-capsules/5?t=450).
- [Graphics](https://ampcode.com/time-capsules/5?t=498),
  [caption reconstruction](https://ampcode.com/time-capsules/5?t=631),
  [presenter/takeover](https://ampcode.com/time-capsules/5?t=773),
  [batch](https://ampcode.com/time-capsules/5?t=791),
  [product visual library](https://ampcode.com/time-capsules/5?t=840).
- [Interactive player](https://ampcode.com/time-capsules/4?t=374),
  [chapters](https://ampcode.com/time-capsules/4?t=687),
  [NLE optionality](https://ampcode.com/time-capsules/4?t=632),
  [local captions](https://screen.studio/guide/captions).

## Projects, export and collaboration

Preserve private portable media save/reopen, local HD/4K rendering, progress, cancellation and the
correct downloaded extension. WebM evidence does not establish MP4 AVC/AAC compatibility (REF-27).

| Ticket ID                            | Reference scope                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [CLIP-38](master-tickets.md#clip-38) | Save-as, recent projects, default folder and unsaved-close warning. A warning alone is not project persistence.                                                       |
| [CLIP-39](master-tickets.md#clip-39) | Create, apply and share named styling presets.                                                                                                                        |
| [CLIP-40](master-tickets.md#clip-40) | GIF, adjustable quality/frame rate and clipboard video export.                                                                                                        |
| [CLIP-41](master-tickets.md#clip-41) | Selectable preview quality/performance and power-saving modes.                                                                                                        |
| [CLIP-42](master-tickets.md#clip-42) | Extract original separate screen, camera and audio tracks.                                                                                                            |
| [CLIP-43](master-tickets.md#clip-43) | Recover native Screen Studio package and separate media; actual package fixture required.                                                                             |
| [CLIP-44](master-tickets.md#clip-44) | Opt-in hosted streaming links, link management, timestamped comments and viewer identity. Infrastructure/product decision required; local processing remains default. |
| [CLIP-45](master-tickets.md#clip-45) | Quick share/save/copy/edit widget and export defaults.                                                                                                                |

Project sources:

- [Save](https://screen.studio/guide/saving-your-project),
  [portable sharing](https://screen.studio/guide/sharing-your-project),
  [preset creation](https://screen.studio/guide/creating-preset),
  [application](https://screen.studio/guide/applying-preset),
  [sharing](https://screen.studio/guide/sharing-preset).
- [Export](https://screen.studio/guide/exporting-the-video),
  [export settings](https://screen.studio/guide/explanation-of-export-settings),
  [preview](https://screen.studio/guide/performance-settings),
  [raw files](https://screen.studio/guide/extracting-raw-recording-files),
  [package recovery](https://ampcode.com/time-capsules/4?t=87).
- [Links](https://screen.studio/guide/shareable-links),
  [comments](https://screen.studio/guide/shareable-links-comments),
  [quick widget](https://screen.studio/guide/quick-share-widget-).

## Capture and native exclusions

CLIP-46 includes display/window/area capture, webcam, mic, system audio, start/finish/pause/restart/
delete, elapsed-time widget and hiding it, flags and custom recording shortcuts, inherited or reset
project defaults. Selected-app audio routing may need native APIs. CLIP-47 covers private speaker
notes with speed, opacity and font size. CLIP-48 covers USB iPhone/iPad, Mirroring and device
frames; native capture cannot run in a Linux orb.

Native macOS camera background/portrait/studio-light/reaction toggles, notifications and Dock
settings are not browser-editor tickets. Installation, hardware/permission documentation, Screen
Studio account/license/email/preset-permission support are not Clipper parity features. Diagnostics
remain a product support proposal only after Clipper diagnostics are defined.

Capture sources:

- [Display](https://screen.studio/guide/recording-entire-display),
  [window](https://screen.studio/guide/recording-single-window),
  [area](https://screen.studio/guide/recording-area),
  [webcam/mic](https://screen.studio/guide/webcam-microphone),
  [system audio](https://screen.studio/guide/recording-system-audio).
- [Recording controls](https://screen.studio/guide/managing-recording-in-progress),
  [flags](https://screen.studio/guide/recording-flag),
  [shortcuts](https://screen.studio/guide/screen-studio-shortcuts),
  [defaults](https://screen.studio/guide/managing-project-settings-for-new-recordings),
  [notes](https://screen.studio/guide/speaker-notes-).
- [iOS capture](https://screen.studio/guide/recording-iphone-ipad),
  [Mirroring](https://screen.studio/guide/iphone-mirroring),
  [camera settings](https://screen.studio/guide/camera-settings),
  [reactions](https://screen.studio/guide/reactions-),
  [notifications](https://screen.studio/guide/capturing-notifications),
  [Dock](https://screen.studio/guide/hiding-dock-icon),
  [requirements](https://screen.studio/guide/system-requirements),
  [license](https://screen.studio/guide/managing-license),
  [diagnostics](https://screen.studio/guide/diagnostic-info).

## Capture contract and evidence limits

Time Capsule 4 at 9:08 identifies `mousemoves-0.json` and `mouseclicks-0.json`. Its report describes
222,749 move/drag samples, shape changes and 152 click pairs, converting full-display pixels with 30
logical points cropped at the top. At 13:30 its editor shows a Screen Studio pointer track,
visibility and size controls. These are example observations, not universal format constants.
Ordinary imported video lacks recording-time events. The iOS guide notes no automatic zooms without
captured taps/clicks. Pixel-based cursor detection is a separate unrequested feature.

The owner requested video with the native cursor excluded plus timestamped positions, clicks and
types. CSS cursor hiding or page pointer events cannot establish screen-wide capture. Reuse
[OpenScreen](https://github.com/getopenscreen/openscreen) first, not a custom native recorder unless
real validation disproves that route. The source-level
[capture research](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) is complete,
but did not itself execute macOS APIs. No Screen Studio process is required to edit or render.

The
[OpenScreen contract](https://github.com/getopenscreen/openscreen/blob/main/src/native/contracts.ts)
has versioned provider, samples and assets. Samples carry timeMs, cx/cy, optional visible,
cursorType, assetId and interactionType. The schema allows move, click, double/right/middle click
and mouseup. Images have dimensions, hotspots and scaleFactor. The inspected macOS producer
subscribes only to left-button events; schema variants are not capture evidence. Editable-overlay
mode reportedly excludes native cursor pixels and writes a sibling `.cursor.json` file.

Alternatives are references, not default dependencies:
[Capture Studio](https://github.com/wadjakorn/capture-studio) reportedly bundles `screen.mp4`,
`events.jsonl` and `meta.json`; [Cap](https://github.com/CapSoftware/Cap) needs a separate
code-license review before copying. A custom ScreenCaptureKit helper would use
[`showsCursor`](https://developer.apple.com/documentation/screencapturekit/scstreamconfiguration/showscursor),
global pointer events and one recording-clock anchor. Browser exclusion needs actual implementation
evidence. Apple's
[`NSCursor.currentSystem`](https://developer.apple.com/documentation/appkit/nscursor/currentsystem)
deprecation in macOS 27 is a risk, not proof capture is broken. Preserve positions/clicks with a
default-arrow fallback when shape capture fails.

The deleted Mac capture thread reported OpenScreen 2.2.2 on macOS 27.2, full display 3440×1440,
scale 1 (inferred), one 34.585-second native v2 sidecar:

- 801 sorted samples, duplicates allowed, first three at 0 ms. Median gap 43 ms, maximum 152 ms,
  about 23 Hz overall.
- Five clicks and four mouseups, with duplicate releases and unmatched trailing clicks. Preserve
  events independently rather than reject unbalanced pairs.
- Three PNGs for arrow, I-beam and hand; preserve fractional hotspots (including 4.5 and 11.5). Most
  samples lack cursorType; all 28 pointer hints use the arrow, while I-beam/hand lack hints. Select
  the image by assetId, not cursorType. PNG capture worked despite the deprecated API.
- Full-display coordinates use display bounds in points. Retina scale-2, window capture, cropping
  and multi-display remain unverified. The final sample precedes video end by 78 ms, which does not
  establish clock offset or input-response delay.
- A corrected script found no burned-in cursor at 48 sampled positions, including click/release
  events; synthetic composited controls passed. This is sampled evidence, not all-frame proof.

The separate relayed 139.5-second take matched 25 clicks and reported no measured drift, median 7 ms
offset with roughly one frame of jitter. The queue did not independently reproduce that measurement.
No automatic clock/drift correction is applied. Current implementation engineering rules pair the
next release, collapse repeated downs and suppress a terminal unpaired click in the last 250 ms;
only OpenScreen-first and left-click-first were owner decisions. Raw data stays intact. No
scaleFactor correction was established; scale 1 cannot determine the Retina rule.

The recording must stay on the Mac. Do not transfer or inspect its video, original sidecar, frames
or crops here. There is no shareable real-media fixture. Eight derived images were previously
hosted; deleting the source thread did not independently verify hosted-file deletion. Text evidence
remains in [tests/openscreen/README.md](../tests/openscreen/README.md) and the master. D-7 retains
the real in-Clipper Mac validation gate. Synthetic contract-shaped tests do not prove real-recording
parity.

## Verification and retirement boundary

Use red-to-green public behavior checks, shared Storybook states including absent/invalid/stress
data, real Playwright media, decoded exports across seeks/cuts/source offsets, audio where changed,
inspected screenshots and interaction recordings, zero uploads and isolated performance gates. The
master owns exact-SHA delivery receipts. This document does not repeat stale artifact statuses.

Revision 8's feature details, source links, capture alternatives, observations, limits and owner/
engineering distinction are preserved here or in linked master scope. Migration commit `a8078ff`
passed CI before the owner approved retirement. The owning thread confirmed deletion of only the
reference artifact; the separate acceptance and verification artifacts were retained.
