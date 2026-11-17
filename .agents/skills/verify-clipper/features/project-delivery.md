# Project delivery

Save a portable local project, reopen it after reload, and render a real video without uploading
media.

## Drive

Run `.agents/skills/verify-clipper/scripts/verify.mjs delivery` for the save/reopen round-trip. The
downloaded JSON must contain embedded source data, not transient blob URLs. It is version 2 for
video and audio projects, which `refinements.spec.ts` and the MP4/MOV test in `editor.spec.ts`
check, and version 3 once a still is embedded (the still test in `editor.spec.ts`). Reopen it
through Open project, verify restored zoom, sides and mute settings, and require actual video
playback. Malformed projects must leave the current edit usable. Run
`.agents/skills/verify-clipper/scripts/verify.mjs export` for cancellation, all-muted output and
one-second HD/4K render checks in automatic, WebM, MOV and MP4 formats. Files are decoded and
inspected with FFmpeg and ffprobe, including pixel parity, source offsets, audio timing and music
gain. UI export tests drive Export resolution and Export video and inspect the downloaded file, not
just progress text. Use `.agents/skills/verify-clipper/scripts/verify.mjs editor` for those UI
export journeys too. Each command starts and cleans up its own Vite development server.

`editor` also runs REF-20's real export progress/cancel/retry check. Cancel after progress exceeds
10 percent and require no download, no progress bar and an enabled Export video button. Retry must
start at zero, publish increasing values in [0, 1] with at most 101 distinct values, and download
one nonempty HD video without uploads or page errors. This check bounds accessible progress updates,
not React commits, encoding speed or codec fidelity. The decoded fixture checks above remain the
export-content evidence.

## Guards and recovery

`editor` runs the delivery guards in `refinements.spec.ts`; `delivery` does not. The `beforeunload`
handler asks before a reload or tab close with unsaved edits or a running export. Open project asks
before replacing unsaved edits. A source that a clip uses and that can no longer be read (for
example its file changed on disk) makes Save and Export fail with a message naming the file, and no
download starts. Importing a compatible file with the same name repairs that source in place; an
incompatible same-name file is refused. Media no clip uses is embedded while it fits and can be
read; otherwise Save omits it and names it. Save refuses at once, reading none of the media, when
clips on the timeline use more than 375 MB. The spec uses a sparse 400 MB file. Headless Chromium
shows no native `beforeunload` prompt, so the handler is tested through the event, not the browser's
dialog.

## Export formats

Export opens a dialog with a Format selector. It starts on MP4 and shows the exact download name,
`developer-walkthrough-1080p` or `-4k` plus the extension, and a note that the save dialog may hide
the extension. A chosen format is kept when the dialog is reopened in the same session. Each format
is a real container with its own codecs: MP4 is H.264 with AAC, MOV is H.264 with uncompressed
16-bit PCM audio, and WebM is VP9 with Opus. When a browser cannot encode MP4 AAC, the export
function throws an error that names MOV and WebM and never substitutes another container; a retry
works. With no format passed, the export function picks MP4 when the browser can encode it and WebM
otherwise. Delivered by REF-27 at `27099dc` (exact-SHA CI 44001648378) and the filename dialog by
REF-27b at `631f0bc` (exact-SHA CI 44012171159).

Specs that prove it. `refinements.spec.ts` opens the dialog and checks the default, the filename and
the narrow-width layout, then exports a spliced project at 1920 and 3840 px in MP4, MOV and WebM
through the real controls; the download name equals the displayed one, and ffprobe requires the
codecs above, the container brand, 30 frames and about one second (`editor` and `all` run these).
`export.spec.ts` decodes one-second HD and 4K files in automatic, WebM, MOV and MP4 for pixels and
audio, and covers blocked AAC, MP4 load, H.264 and cancel failures (`export` and `all`).

## Limits

Only Chromium with FFmpeg decoding is exercised: MP4 and MOV playback in other players or editing
software, and encoder availability in other browsers, are unqualified, as is a real screen
recording. The `export` journey also runs the exact-source-frame check for every frame of both video
tracks and the long compressed-audio mix timing check (REF-17, REF-15). Project JSON uses in-memory
base64, and export buffers the audio mix and final container. Long recordings can exhaust memory.
Cancellation waits for the current native operation. No server rendering, automatic persistence or
external-media relinking exists.
