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

## Limits

MP4 AVC/AAC is preferred; unsupported MP4 encoders fall back to WebM VP9/Opus. Report the actual
negotiated container. Project JSON uses in-memory base64, and export buffers the audio mix and final
container. Long recordings can exhaust memory. Cancellation waits for the current native operation.
No server rendering, automatic persistence or external-media relinking exists.
