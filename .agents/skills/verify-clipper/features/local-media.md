# Local media

Import video and audio from the user's computer, preview it, set in/out points, and insert it onto
the selected track without uploading source files.

## Sub-features

- Import H.264 video and WAV audio; decode metadata, thumbnail, and waveform.
- Preview source; set Source in seconds and Source out seconds.
- Target V1, V2, A1, or A2 and insert at the current playhead.
- Reject a corrupt file while keeping existing edits usable.

## How to get to it (user POV)

Choose Import media in Project media, then select a source card. Use the source monitor fields,
Insert onto track selector, and plus button named Insert source at playhead.

## Driving it with Playwright

Preconditions: a fresh editor with four loaded demo assets.

Run `npm run test:ui -- tests/editor.spec.ts -g 'imports local'`. It sets the file chooser using
`getByLabel('Import local media')`, inserts video and audio, and requires zero non-GET requests. Run
`npm run test:ui -- tests/editor.spec.ts -g 'difficult imports'` for corrupt and long filenames.
Require six assets after the two valid imports, three screen clips, and two music clips.

## Gotchas

Media never leaves this browser. Unsupported codecs report an import error. Large recordings are
decoded in full for waveform generation and may consume substantial time/memory. Imports retain
object URLs until tab close or project replacement. Portable projects embed source bytes, so
reopening needs no relinking. There is no resumable import.
