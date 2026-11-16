# Project delivery

Save a portable local project, reopen it after reload, and render a real video without uploading
media.

## Drive

Run `.agents/skills/verify-clipper/scripts/verify.mjs delivery` for the save/reopen round-trip. The
downloaded version-2 JSON must contain embedded source data, not transient blob URLs. Reopen it
through Open project, verify restored zoom, sides and mute settings, and require actual video
playback. Malformed projects must leave the current edit usable. Run
`.agents/skills/verify-clipper/scripts/verify.mjs export` for cancellation, all-muted output and
one-second HD/4K render checks. Files are decoded and inspected with FFmpeg and ffprobe, including
pixel parity, source offsets, audio timing and music gain. UI export tests drive Export resolution
and Export video and inspect the downloaded file, not just progress text. Use
`.agents/skills/verify-clipper/scripts/verify.mjs editor` for those UI export journeys too. Each
command starts and cleans up its own Vite development server.

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

## Limits

MP4 AVC/AAC is preferred; unsupported MP4 encoders fall back to WebM VP9/Opus. Report the actual
negotiated container. Only WebM is proven: REF-27 (AVC and AAC qualification) is blocked on an
encoding-capable browser, so no run here shows a playable MP4. There is no format choice and no MOV
export; the download is named `developer-walkthrough-1080p` or `-4k` with the negotiated extension.
The `export` journey also runs the exact-source-frame check for every frame of both video tracks and
the long compressed-audio mix timing check (REF-17, REF-15). Project JSON uses in-memory base64, and
export buffers the audio mix and final container. Long recordings can exhaust memory. Cancellation
waits for the current native operation. No server rendering, automatic persistence or external-media
relinking exists.
