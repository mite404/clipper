# Local media

Import video, audio and still images from the user's computer, preview them, set in/out points or a
still duration, and insert them onto the selected track without uploading source files.

## Sub-features

- Import H.264 video and WAV audio, and decode metadata, thumbnail and waveform. MP4 and MOV
  containers with H.264, with or without AAC audio, play, insert, export and reopen (CLIP-20b,
  delivered at `6156fb4` with exact-SHA CI 44022990182).
- Import PNG and JPEG stills. A file with an uppercase extension or no MIME type is accepted when
  its bytes decode. A still has no source in/out; it has a duration, five seconds by default.
- A still inserts onto the screen or camera track only. Its duration is editable before insertion
  (Still duration seconds) and after (Selected still duration seconds), from one frame to 24 hours.
  A value outside that range, or one that would overlap the next clip on the track, is refused with
  a message and leaves the timeline unchanged. A still splits, trims, deletes and undoes like video,
  and keeps its transparency.
- Preview source; set Source in seconds and Source out seconds for video and audio.
- Target V1, V2, A1, or A2 and insert at the current playhead.
- Reject a corrupt file, and an MP4/MOV whose video codec the browser cannot decode (ProRes), while
  keeping existing edits usable. A multi-file import names every file it could not read.
- The demo download gives up after 15 s and frees what it loaded.

## How to get to it (user POV)

Choose Import media in Project media, then select a source card. Use the source monitor fields,
Insert onto track selector, and plus button named Insert source at playhead. A still shows Still
duration seconds in place of the in/out fields.

## Driving it with Playwright

Run `.agents/skills/verify-clipper/scripts/verify.mjs media`. It starts a fresh production editor,
waits for four loaded demo assets, and runs the four `editor.spec.ts` tests whose titles contain
`imports`. Each sets the file chooser using `getByLabel('Import local media')`.

- `imports still images with editable clip duration, alpha and portable reopen` imports
  `overlay.PNG` (no MIME type), `portrait.JPG` and a corrupt `broken.png`. It requires six assets, a
  status naming `broken.png`, and zero non-GET requests. The Still duration seconds field must
  refuse zero and 86400.1 s and accept 86400 s. The Selected still duration seconds field must
  refuse zero and a 6 s growth that would overlap the next clip, and accept 2 s. It also requires
  split, trim, delete and undo, and a still on the camera track. It saves a version 3 project whose
  embedded bytes equal the PNG, then reopens it after a reload. A project with a corrupt embedded
  still leaves the current edit and its blob URLs unchanged.
- `imports qualified H264 and AAC MP4/MOV, rejects ProRes and reopens exported sources` builds four
  H.264 MP4/MOV files and a ProRes MOV with FFmpeg and checks them with ffprobe. It requires four
  assets and an unsupported-codec status for the ProRes file, plays and inserts each file, saves a
  version 2 project, reopens it, exports it, and requires 120 H.264 frames and AAC audio.
- `imports local video and audio without uploading them` inserts `landscape.mp4` and `music.wav`
  with source in/out set and requires zero non-GET requests. Require six assets after the two valid
  imports, three screen clips, and two music clips.
- `keeps all tracks on screen and survives realistic difficult imports` imports a corrupt `.mp4` and
  a very long filename, then requires no horizontal overflow at 320 px.

The `media` journey needs FFmpeg and ffprobe for the MP4/MOV test, although its doctor does not
check them. It does not select the mixed-import naming or stalled-download checks; `editor` or `all`
runs them. Require the status to name every unreadable file, and a stalled demo download to give up
and free its blobs. The decoded results of stills live elsewhere. `all` alone runs
`frame-image.spec.ts` (PNG and JPEG still pixels, cover fit and split offsets in the copied frame at
both resolutions). `export` and `all` run `export.spec.ts` (PNG and JPEG stills decoded from MP4,
MOV and WebM at HD and 4K, and bitmap release after success, cancellation and a partial decode
failure).

## Gotchas

The file input accepts `video/*`, `audio/*`, `.mov`, `.mp4`, `.png`, `.jpg`, `.jpeg`, `image/png`
and `image/jpeg`. Composition backgrounds, still motion and dynamic tracks are separate tickets and
are not verified here. These fixtures are synthetic. Nothing here qualifies a real screen recording,
HEVC or any codec other than the H.264 and AAC fixtures and the rejected ProRes one, a JPEG with
EXIF orientation, or other image types. The 240 × 120 MP4/MOV fixtures do not prove large or long
file handling.

Media never leaves this browser. Unsupported codecs report an import error. Large recordings are
decoded in full for waveform generation and may consume substantial time/memory. Imports retain
object URLs until tab close or project replacement. Portable projects embed source bytes, so
reopening needs no relinking. There is no resumable import.
