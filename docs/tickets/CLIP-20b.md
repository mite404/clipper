# CLIP-20b

Authoritative scope, state and ownership live in the [master ticket](../master-tickets.md#clip-20b).
This brief records the still-image contract and acceptance checks, not another queue.

## Outcome

Import PNG/JPEG as real still media on screen/camera tracks. Use a five-second editable default,
preserve transparency/aspect through preview, copied frames, video export and embedded save/reopen.
Qualify actual H.264 and H.264/AAC MP4/MOV inputs without promising every codec those containers
hold. Composition backgrounds, dynamic tracks, movement and source-audio associations are separate
tickets.

## Data and compatibility

- Model image as a distinct Asset variant without a fictitious decoded video duration. Duration
  belongs to each Clip. Image pixels do not seek when an existing split/trim changes source offset.
- Default still duration is 150 frames at current 30 fps. Allow editing before and after insertion.
  Require at least one integer frame and preserve the existing 24-hour project ceiling.
- Duration growth that would collide with a following same-track clip fails visibly and atomically.
  It never ripples, overwrites or moves unrelated clips. An accepted duration edit is undoable.
- Read legacy v2 video/audio projects. Save video/audio-only envelopes as v2; use v3 when embedded
  image media is present so older readers reject incompatible still data explicitly. Do not reserve
  a future dynamic-track version. Validate image kind/MIME consistently and embed original bytes.
- Decode validated PNG/JPEG bytes even with uppercase extensions or missing MIME. Extension alone is
  not proof. Keep an alpha-preserving thumbnail and close temporary image resources.
- Decode each used image once per export asset, reuse its pixels, and release owned bitmaps on
  success, failure and cancellation. No long-lived decoded bitmap belongs in Asset.

## Bounded paths

- `src/media.ts`: Asset image variant and readMedia image boundary/cleanup; preserve container
  decode.
- `src/components.tsx`: picker accept and image media-row thumbnail/icon/metadata only; no drag
  work.
- `src/App.tsx`: SourceMonitor still preview/duration/visual targets, insertion validation and
  selected-still duration control through existing Inspector children and undoable edit callback.
- `src/styles.css`: image equivalents of source-preview sizing and necessary duration-control style.
- `src/Composition.tsx`: Img inside the existing visual Sequence and cover/mask geometry.
- `src/export.ts`: image layer acquisition, one-time decode/frame sampling and cleanup only.
- `src/project.ts`: envelope versions, image MIME/kind, source rules and original-byte
  serialization.
- Extend `src/project.test.ts`, `tests/editor.spec.ts`, `tests/frame-image.spec.ts` and
  `tests/export.spec.ts`. Use locally generated synthetic fixtures and existing tools.

Preserve REF-27 geometry, explicit profiles, capability checks, AAC initialization and all format,
blocked-worker and exact-frame assertions. Do not change SourceMonitor transport/busy lifecycle,
pane sizing, zoom/cursor controls, export selector, import/open transaction orchestration, Timeline,
timeline-model, stage, framing, track registry, dependencies, config or Fallow baseline. If a new
Asset variant exposes another required consumer, ask for the exact additional path before editing.

## Acceptance

- Red/green production reproduction of current PNG/JPEG rejection, then picker/import/preview and
  insertion on both visual roles, never audio roles. Cover uppercase/missing MIME and corrupt bytes.
- Default/edit duration, both sides of the one-frame/project/collision boundaries, split, trim,
  delete and undo retain correct pixels and leave unrelated clips unchanged.
- Asymmetric non-square JPEG and transparent PNG agree across source/composition/copied PNG and
  decoded HD/4K MP4/MOV/WebM at start, after trim/split and both sides of clip boundaries.
- Embedded save/reopen retains original bytes, transparency, aspect and durations. Legacy v2 opens;
  mixed-image v3 round-trips. Malformed kind/MIME/envelope and partial-open failures are
  transactional.
- Independent ffprobe confirms moving H.264 and H.264/AAC MP4/MOV fixtures. Exercise import, source
  playback, timeline insertion, export and embedded reopen. Unsupported codecs fail actionably.
- Mixed valid/corrupt batches preserve successful imports and existing edits, release failed URLs,
  bitmaps and decoder inputs, reset busy state, and issue no non-GET media request or upload.
- Existing strict gates, full verify-clipper browser journey and isolated performance journey pass.
  Inspect representative rendered states and real pointer/keyboard interaction. Obtain exact-tree
  independent review and exact delivered-main CI before acceptance.
