# Clipper feature map

Start each journey from a fresh tab and wait for `4 assets ready`. The UI shares files across
features, so a source-file diff cannot safely select a complete subset. Run the full browser suite
after shared editor, timeline, composition, or media changes.

- [Local media](local-media.md) covers import of video, audio, PNG/JPEG stills and MP4/MOV, source
  in/out, errors, and privacy.
- [Timeline and transport](timeline-transport.md) covers splices, seeking, audio, and J/K/L.
- [Composition](composition.md) covers masks, crops, manual mouse zooms, zoom fields, and undo.
- [Cursor and zoom creation](cursor.md) covers pointer sidecars, the drawn cursor, playhead zoom
  creation, legacy source anchors, camera follow, and hidden ranges.
- [Project delivery](project-delivery.md) covers portable save/reopen, unsaved-edit guards, the
  export format dialog and real rendered MP4, MOV and WebM export.
- [Workspace layout](workspace-layout.md) covers the media pane, pane and timeline resizing,
  timeline scale and scrolling, and the Inspector's cursor data.
- [Frame copy](frame-copy.md) covers Copy frame, the held output frame as a clipboard PNG.
- [Icon button tooltips](tooltips.md) covers the shared IconButton tooltip and its Storybook
  records.
- [Shared library](shared-library.md) covers Storybook and worst-case layouts.

## Delivered and pending

This map covers what is on `main`, checked against `docs/master-tickets.md` and the specs listed
below. Re-read both before adding a claim. A feature below has no entry here, no spec and no
verification, and nothing in this skill may report it as verified:

- UI tickets that `docs/master-tickets.md` still lists as open. The shared IconButton tooltip (UI-1)
  and the layout work on the workspace-layout page (UI-2, UI-5, UI-7 and the Inspector cursor move)
  are delivered.
- Full zoom ramp controls and resizing a zoom with timeline edge handles (CLIP-9b). Playhead
  creation and B are delivered at `ad40248` with exact-main CI 43934129560; this does not complete
  the ramp scope.
- Moving clips on the timeline other than the existing trim, split and ripple edits.
- Still-image backgrounds, still motion, dynamic tracks and source-audio association, which stay
  with their own open tickets. Importing PNG and JPEG stills as timeline clips is delivered
  (CLIP-20b at `6156fb4`, exact-SHA CI 44022990182).
- MP4 and MOV playback in other players or editing software, encoding in browsers other than
  Chromium, every codec those containers can hold, EXIF-rotated JPEGs and real screen recordings.
  MP4/MOV import with H.264 and AAC fixtures is delivered (CLIP-20b at `6156fb4`, exact-SHA CI
  44022990182). MP4, MOV and WebM export and the export format choice are delivered (REF-27 at
  `27099dc`, exact-SHA CI 44001648378; REF-27b at `631f0bc`, exact-SHA CI 44012171159).
- The wider responsiveness work in REF-37, including scrubbing with very large telemetry.
- Real OpenScreen recordings, Retina scale, window capture and multi-display (CLIP-11 stays
  Partial), plus click sounds, motion blur and keystroke overlays.

REF-20 adds rewind held-frame parity, bounded readout changes and export progress/cancel/retry
checks. See the transport and delivery pages for their limits. The executable checks do not measure
App commits or encoding speed. Require the exact delivered commit and green CI before reporting
REF-20 as delivered.

Move an item up only after reconciling the exact `main` commit, its green CI run, the code and a
spec. Ticket rows can lag the code: at `b9596c6` the UI-1 row in `docs/master-tickets.md` still
reads In progress and unpushed, although `eb55a36` is on `main` with green CI and a passing
`icon-button.spec.ts`, so the tooltip is mapped as delivered. When rows, code and CI disagree, trust
the exact commit, CI and spec, and report the stale row instead of editing the queue. A branch,
candidate or In progress row with no commit on `main` is not delivered.

For a full sweep run all Playwright tests and inspect representative rendered states. A failed or
skipped journey is not covered by a passing neighboring journey. The editor is desktop-first; 320px
checks prove horizontal overflow handling, not a physical phone or touch interaction.

## Executable journeys

Run `.agents/skills/verify-clipper/scripts/verify.mjs <journey>` from the repository root. This
launches and cleans up isolated servers automatically. Feature files use this CLI so focused
journeys cannot accidentally target a stale shared preview.

- `media` runs the four `editor.spec.ts` titles containing `imports`: still-image import with
  editable duration and reopen, H.264 and AAC MP4/MOV import with a ProRes rejection and export, and
  the upload-free and difficult import checks. The MP4/MOV test needs FFmpeg and ffprobe.
- `composition` runs splice/scrub/zoom, swap/trim/scroll, and mouse-focus/save/reopen checks.
- `delivery` runs the mouse-focus save/reopen check and the malformed-project check only.
- `export` runs every `export.spec.ts` check: cancellation, muted audio, decoded HD/4K fixtures,
  exact source frames and long-audio mix timing.
- `editor` runs every `editor.spec.ts`, `transport-end.spec.ts`, `transport-lifecycle.spec.ts` and
  `refinements.spec.ts` check, including undo, keys, held pause, eight forward endings, held-Space
  and hidden-tab transport lifecycle, mixed and stalled imports, still-image and MP4/MOV import,
  unsaved-edit guards, save recovery and UI-driven HD/4K export in MP4, MOV and WebM.
- `storybook` builds and tests the shared library and its stress states (`storybook.spec.ts` only).
- `performance` builds production code and repeats the responsiveness assertions five times.
- `all` builds both previews and discovers the entire existing suite, including new spec files. It
  is the only command that runs these specs: `controls.spec.ts`, `cursor.spec.ts`,
  `cursor-render.spec.ts`, `cursor-shapes.spec.ts`, `cursor-rotation.spec.ts`,
  `cursor-speeds.spec.ts`, `auto-zoom.spec.ts`, `framing.spec.ts`, `frame-image.spec.ts`,
  `icon-button.spec.ts`, `workspace-layout.spec.ts`, `cursor-inspector.spec.ts`,
  `focused-controls.spec.ts` and `zoom-creation.spec.ts`. There are deliberately no narrower names
  for them; run `all` and read the results by spec file.

The feature map defines coverage, not the command name. A named journey can run fewer checks than
its feature file lists: `media` skips the mixed-import and stalled-download checks, `delivery` skips
the guards and recovery checks, and `export` alone does not run the UI-driven project export in
`refinements.spec.ts`. Use `editor` or `all` for those, then read the feature file for what each
check proves and what stays unproven. After adding a spec, confirm `all` lists it and add it to this
list. Listing starts no server:

```bash
VERIFY_JOURNEY=all VERIFY_PRODUCTION=1 VERIFY_BUILD_DIR=/tmp/none \
BASE_URL=http://127.0.0.1:41001 PERF_URL=http://127.0.0.1:41002 STORYBOOK_URL=http://127.0.0.1:41003 \
node node_modules/@playwright/test/cli.js test --list \
--config .agents/skills/verify-clipper/scripts/playwright.config.mjs
```
