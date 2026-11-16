# Clipper master ticket list

This is the only operational queue for Clipper. Workers, the Space and the owner read status here
and nowhere else. Other documents are records, not queues:

- [docs/refactor/refactor01.md](refactor/refactor01.md) is the one-time review of baseline
  `5a9bc1f`. Its finding numbers (`#1` to `#38`) are cited below.
- The
  [reference backlog](https://ampcode.com/artifacts/clipper-reference-backlog-e067faa7-a848-4b3f-864b-01c8ea952ac0)
  (revision 4) is the source-linked feature inventory.
- The
  [refinement tickets](https://ampcode.com/artifacts/clipper-refinement-tickets-9f40b94d-40bf-4ca2-9641-78208057b5a2)
  and the
  [steel thread verification](https://ampcode.com/artifacts/clipper-steel-thread-verification-72434030-61d6-453a-a53c-982d2ce52e29)
  are the acceptance and evidence records for CLIP-1 to CLIP-6.

## Rules

- The queue thread edits this file. Everyone else sends it status and it updates the list.
- The repository is `https://github.com/mite404/clipper.git`. The Amp project has used it as its
  primary repository since 2026-11-16; the Amp-hosted scaffold is gone.
- Pushes to `main` are serialized. Ask the queue thread for a slot with the ticket ID, files and
  checks run. On the grant: fetch, rebase onto `origin/main`, re-verify, then
  `git push origin HEAD:main`. One ticket per push, no force-push. A push may carry several commits
  since REF-13: CI compares the baseline with the commit `main` held before the push. Subscribe to
  CI for the pushed commit. The slot is released when that run is green.
- `.fallow-health-baseline.json` only shrinks. Put new logic in new modules with small functions.
- A push gate audits the working tree as well as the commit. Push from a clean tree: stash or commit
  work in progress first.
- Author and committer are `Ethan Anderson <150651098+mite404@users.noreply.github.com>` and nothing
  else. Check both with `git log --format='%ae %ce' -1` before every push. A rebase takes the
  committer from `git config`, so set `user.email` in every checkout.
- Correctness, performance and unblocking refactors go before the features that depend on them.
  Unrelated cleanup never delays CLIP-7 to CLIP-10.
- No production deploy is authorized. Do not transfer the owner's recording, its sidecar, frames or
  crops anywhere; `view_media` on a local file uploads it as a hosted attachment, so do not use it
  on capture material. Fixtures are synthetic. See [Known limits](#known-limits) for what is already
  hosted.
- New implementation workers load `poteto-mode` and `emil-design-eng`, and run on GPT-6.1 Sol medium
  or lower unless the owner authorizes otherwise.

## Owners

| Lane                     | Thread                                                                           | Owns                                                 |
| ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Queue, review, refactors | [T-2d1e888a](https://ampcode.com/threads/T-2d1e888a-23ff-4bf4-b2d1-551553f2ef0a) | This file, `docs/refactor/`, REF tickets, push slots |
| Reference features       | [T-930219f2](https://ampcode.com/threads/T-930219f2-6c3a-4543-a9e0-9a1073cc4d94) | CLIP-7 onwards                                       |
| Editor and bootstrap     | [T-01a1ddd7](https://ampcode.com/threads/T-01a1ddd7-317f-7312-a2ce-db23a9d866da) | `.agents/setup`, `.agents/resume`                    |
| Verification tools       | [T-282b9f84](https://ampcode.com/threads/T-282b9f84-b86a-4498-b4cf-b8fb963a33cc) | `.agents/skills/verify-clipper/**`                   |

Evidence-only threads:
[capture research](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) (source
reading, complete) and the Mac capture check, a thread on the owner's Mac that he has since deleted
(three real OpenScreen recordings; the videos and sidecars were not transferred, but eight derived
images were hosted, see [Known limits](#known-limits)).

### Files while CLIP-11 is in flight

| Owner                    | Paths                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Reference features       | `src/cursor*.ts`, `src/CursorControls.tsx`, `tests/cursor*.spec.ts`, their stories and styles; additions to `parseProject` for new cursor settings                                                                       |
| Queue thread             | `change` and `undo` in `src/App.tsx` (REF-16); `serializeProject` in `src/project.ts` (REF-21); `src/stage.ts`, `src/export.ts`, `src/media.ts`, `src/Timeline.tsx`, `tests/export.spec.ts`, `tests/performance.spec.ts` |
| Shared, keep edits small | `src/App.tsx`, other `tests/**`, `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `README.md`                                                                                                         |

### Preservation branches

Made on 2026-11-15 before the Amp project's switch to GitHub. They are not for merging and are
deleted only on the owner's word.

| Branch                          | Holds                                                                    |
| ------------------------------- | ------------------------------------------------------------------------ |
| `wip/clip-10-smooth-follow`     | CLIP-10 before it landed; redundant now                                  |
| `wip/queue-thread-resume-files` | The queue thread's helper scripts and raw review output, ignored on main |

The checkpoint found nothing only on the Amp-hosted repository: its one ref, `main` at `0b11477`,
was two empty commits that GitHub `main` contains. The owner confirmed the switch on 2026-11-16 and
the project now maps to GitHub. `wip/ref-17-19-export-gate-edit-keys` was deleted with his consent
after both of its commits were on `main`.

## Status key

- **Delivered**: on GitHub `main` with a green CI run for that commit.
- **In progress**: an owner is implementing it now.
- **Ready**: nothing blocks it; waiting for its owner or a push slot.
- **Blocked**: waits on the tickets named in "Needs".
- **Decision**: waits on the owner; see [Decisions](#decisions-for-the-owner).
- **Proposal**: inventoried from the reference material, not yet designed or accepted.

## Delivered on main

| Ticket    | What                                                                                                                                                                                               | Commit                                                                                          | Evidence                                                                                                                                                                                                                                                                |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLIP-1    | Play responds without freezing the editor                                                                                                                                                          | [`5a9bc1f`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c) | [CI 43733454487](https://github.com/mite404/clipper/actions/runs/43733454487), steel thread record                                                                                                                                                                      |
| CLIP-2    | Swap sides, edge trims, scalable timeline                                                                                                                                                          | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                    |
| CLIP-3    | Manual fixed-point zoom ("mark mouse position")                                                                                                                                                    | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                    |
| CLIP-4    | Portable version-2 project save and reopen                                                                                                                                                         | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                    |
| CLIP-5    | Local HD and 4K export                                                                                                                                                                             | `5a9bc1f`                                                                                       | same; WebM VP9/Opus only, see [Known limits](#known-limits)                                                                                                                                                                                                             |
| CLIP-6    | Shared records, tests, verification skill, CI gate                                                                                                                                                 | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                    |
| BOOT-1    | Orb bootstrap `.agents/setup`                                                                                                                                                                      | [`1a5a572`](https://github.com/mite404/clipper/commit/1a5a572a32f68106930c69806bbb4465f2d30da0) | [CI 43735176014](https://github.com/mite404/clipper/actions/runs/43735176014)                                                                                                                                                                                           |
| VERIFY-1  | Isolated verification CLI `verify.mjs`                                                                                                                                                             | [`2bb8263`](https://github.com/mite404/clipper/commit/2bb8263ce692770f62d0ae37ca3bcb162424cadf) | [CI 43736808192](https://github.com/mite404/clipper/actions/runs/43736808192); its 4 CLI tests are local-only                                                                                                                                                           |
| DOC-1     | Baseline review record and this list                                                                                                                                                               | [`f702568`](https://github.com/mite404/clipper/commit/f7025680e6144abc216097009f99d5e5ce363028) | [CI 43761407681](https://github.com/mite404/clipper/actions/runs/43761407681), [refactor01.md](refactor/refactor01.md)                                                                                                                                                  |
| REF-5     | Split never mints a duplicate clip ID (#13)                                                                                                                                                        | [`42324e3`](https://github.com/mite404/clipper/commit/42324e3623a56c6421b99bc9106b088fd28add4f) | [CI 43762022693](https://github.com/mite404/clipper/actions/runs/43762022693)                                                                                                                                                                                           |
| REF-2     | `covers` and `sourceFrame` helpers for timeline-to-source time (#22)                                                                                                                               | [`e2ad4b8`](https://github.com/mite404/clipper/commit/e2ad4b8b3380a73fac2e269c820c9e6381655759) | [CI 43762301972](https://github.com/mite404/clipper/actions/runs/43762301972)                                                                                                                                                                                           |
| CLIP-7    | Import, validate and persist OpenScreen pointer sidecars per source asset                                                                                                                          | [`e9f99fc`](https://github.com/mite404/clipper/commit/e9f99fce4a02be914b6f6d8cb387c152326d737b) | [CI 43762946342](https://github.com/mite404/clipper/actions/runs/43762946342); proven on synthetic fixtures only, see [Known limits](#known-limits)                                                                                                                     |
| REF-1     | One `src/stage.ts` for mask rects, cover crop and zoom projection; preview pan pinned (#1, #17)                                                                                                    | [`4cc0761`](https://github.com/mite404/clipper/commit/4cc07610fb7f027324aab54287f2c1f1c7bc72a0) | [CI 43763390689](https://github.com/mite404/clipper/actions/runs/43763390689); preview screenshots byte-identical before and after                                                                                                                                      |
| REF-3     | `drawFrame` seam in the exporter, pooled decode canvases (#26, #25)                                                                                                                                | [`64e5578`](https://github.com/mite404/clipper/commit/64e5578c79f0195a3170538048efe6ce99c4b983) | [CI 43763669090](https://github.com/mite404/clipper/actions/runs/43763669090); pooled and unpooled decode matched on 180 frames                                                                                                                                         |
| VERIFY-2  | Retired `control-clipper.sh`; feature files use `verify.mjs`; story tally removed                                                                                                                  | [`de27f06`](https://github.com/mite404/clipper/commit/de27f06c96166824c174dc82a9a8f8c214ca2029) | [CI 43764263393](https://github.com/mite404/clipper/actions/runs/43764263393); the three helper defects were reproduced first                                                                                                                                           |
| REF-4     | Zoom limits and overlap rule in `src/timeline-model.ts`, enforced by the project parser; ramp and pan pinned (#8, #10, #12)                                                                        | [`43cb368`](https://github.com/mite404/clipper/commit/43cb368907755de265ea2a830761754965cb267d) | [CI 43764564172](https://github.com/mite404/clipper/actions/runs/43764564172)                                                                                                                                                                                           |
| REF-6     | Playback gate fails on a stall: worst frame and worst long task bounded at 500 ms (#16)                                                                                                            | [`7fa2e43`](https://github.com/mite404/clipper/commit/7fa2e4379593254a8d77c9d54512a8d2b7d1d003) | [CI 43765213526](https://github.com/mite404/clipper/actions/runs/43765213526); an injected 2-second freeze failed all five repetitions                                                                                                                                  |
| REF-7     | Ctrl, Cmd and Alt chords no longer split, delete, seek or drive the transport (#7)                                                                                                                 | [`de0d059`](https://github.com/mite404/clipper/commit/de0d0591b58bd3e6fa6e5245beeb5388c5601896) | [CI 43765744937](https://github.com/mite404/clipper/actions/runs/43765744937)                                                                                                                                                                                           |
| CLIP-8    | Smooth, trim-aware cursor in preview and export, with raw mode, size and visibility                                                                                                                | [`1195cda`](https://github.com/mite404/clipper/commit/1195cdaea0d94d99b9181c896a6b2264473216c0) | [CI 43766525052](https://github.com/mite404/clipper/actions/runs/43766525052); decoded cursor pixels checked across a cut, source offset, crop, swap and zoom; synthetic fixtures only                                                                                  |
| CLIP-9    | Editable zooms generated from recorded left clicks; each keeps a source anchor, so it stays with its footage through splits and ripple edits; manual zooms win collisions and survive regeneration | [`f3b3021`](https://github.com/mite404/clipper/commit/f3b30213dad8ee8d3a367d537b8cd507a6be7513) | [CI 43771222108](https://github.com/mite404/clipper/actions/runs/43771222108); 107 unit tests, preview and decoded-export focus agree, generated zooms survive save and reopen; synthetic fixtures only                                                                 |
| CLIP-10   | Smooth follow framing: a zoom can follow the recorded cursor with a dead zone, the same in preview and export; generated zooms default to Focused                                                  | [`c2a6be0`](https://github.com/mite404/clipper/commit/c2a6be013164ba289944551f1eaf704c155a9fb1) | [CI 43778344010](https://github.com/mite404/clipper/actions/runs/43778344010); the worker reports 112 unit tests, 35 browser checks including decoded-frame follow cases, and 10 of 10 throttled playback runs; synthetic fixtures only                                 |
| REF-8     | Mouse-marking mode ends when its zoom is removed, undone or deselected (#6)                                                                                                                        | [`fd16d0f`](https://github.com/mite404/clipper/commit/fd16d0fe0e3f8330464266b22d88bff226cb8cb7) | [CI 43766869839](https://github.com/mite404/clipper/actions/runs/43766869839)                                                                                                                                                                                           |
| REF-9     | Timecode, playhead and frame buttons match the frame the player holds after a pause (#21)                                                                                                          | [`7661750`](https://github.com/mite404/clipper/commit/7661750f49e4283266311365ad93238bfc079584) | [CI 43767536538](https://github.com/mite404/clipper/actions/runs/43767536538); reproduced first: readout showed frame 6 while the player held frame 9                                                                                                                   |
| REF-10    | Trim grip: a click commits nothing; a release trims the clip as it is then (#15, #38)                                                                                                              | [`6eef40b`](https://github.com/mite404/clipper/commit/6eef40b5cd1690d56efec9322ab5a820408e1e85) | [CI 43768432875](https://github.com/mite404/clipper/actions/runs/43768432875); both defects reproduced first                                                                                                                                                            |
| REF-15    | Export audio mix cost follows clip count, not decoded packet count (#2)                                                                                                                            | [`f9ef3c3`](https://github.com/mite404/clipper/commit/f9ef3c3e2397a09f0ba9ce668127de99f47affd4) | [CI 43769770918](https://github.com/mite404/clipper/actions/runs/43769770918); 40 s of Opus mixes in 0.3 s, was 13 s; audio matches the old build and an ffmpeg render equally                                                                                          |
| REF-11    | A multi-file import names every file it could not read; the demo download gives up after 15 s and frees what it loaded (#9, #37)                                                                   | [`30e4254`](https://github.com/mite404/clipper/commit/30e4254f2e66b820264b9b3486096b4623bcc0ab) | [CI 43771794337](https://github.com/mite404/clipper/actions/runs/43771794337); both defects reproduced first                                                                                                                                                            |
| REF-12    | The logo no longer reloads the page; the browser is asked to confirm a reload or tab close with unsaved edits or a running export; Open project asks before replacing unsaved edits (#23)          | [`4115ac6`](https://github.com/mite404/clipper/commit/4115ac644972ca0fe8e74731ff5845d229746863) | [CI 43772612477](https://github.com/mite404/clipper/actions/runs/43772612477); the handler is tested through a `beforeunload` event, the browser's own prompt was not observed (headless Chromium shows none)                                                           |
| REF-13    | CI compares the fallow baseline with the commit `main` held before the push, and no run is cancelled by a later push (#4)                                                                          | [`5ba3392`](https://github.com/mite404/clipper/commit/5ba3392f1017aee08e49d075d9ae6f8b79b0c052) | [CI 43772931127](https://github.com/mite404/clipper/actions/runs/43772931127); in a throwaway clone the old base passed a two-commit push that grew the baseline, the new base failed it                                                                                |
| REF-17    | Export pixel gate scores the camera and screen panels separately, and a new test checks the exact source frame of every exported frame on both tracks (#31)                                        | [`4ed307d`](https://github.com/mite404/clipper/commit/4ed307dccc0b753a676612d8e09d47cb43ef73af) | [CI 43776617847](https://github.com/mite404/clipper/actions/runs/43776617847); five deliberately broken exporters fail it, two of which the old gate passed                                                                                                             |
| REF-19    | One browser journey for Delete, Backspace, the undo chord, Space, seek clamping at both ends and the overlapping-zoom refusal (#20)                                                                | [`d4174be`](https://github.com/mite404/clipper/commit/d4174beacc53d133c4fdc99e444a5635f7f2de68) | [CI 43777308249](https://github.com/mite404/clipper/actions/runs/43777308249); eight deliberately broken editors fail it; the 50-step undo limit is left for REF-16                                                                                                     |
| CAPTURE-1 | Manual OpenScreen sidecar checks under `tests/openscreen/`, not part of CI                                                                                                                         | [`d72d33c`](https://github.com/mite404/clipper/commit/d72d33c05d1a2213f6d0b6e662fb6907c6a425c1) | [CI 43776958967](https://github.com/mite404/clipper/actions/runs/43776958967); pushed by the Mac capture thread at the owner's request, outside the push slot and with the pre-commit hook skipped (see REF-25); inspected afterwards: four text files, no capture data |
| REF-25    | `src/timeline.ts` is now `src/timeline-model.ts`, so no two files differ only by case; CI refuses such names                                                                                       | [`90cf4b4`](https://github.com/mite404/clipper/commit/90cf4b43de90d18092803fa9e7a947cc739c9723) | [CI 43779257417](https://github.com/mite404/clipper/actions/runs/43779257417); with imports resolved as a case-insensitive disk resolves them, the old tree gives the Mac's TS2305 and TS1149 errors and the new tree gives none; not yet rerun on the Mac itself       |

CLIP-3 is manual fixed-point zoom. It does not satisfy CLIP-7 to CLIP-10. BOOT-1 is on `main`.
Whether it runs for new orbs now that they clone GitHub has not been checked.

## Queue

Top to bottom is the order of work. The two lanes run in parallel; pushes are serialized.

### Mouse tracking and automatic zoom

| Order | Ticket  | What                                                                         | Risk   | Status      | Owner              | Needs   |
| ----- | ------- | ---------------------------------------------------------------------------- | ------ | ----------- | ------------------ | ------- |
| 1     | CLIP-11 | Cursor appearance and behavior: style, idle hide, loop return, shake removal | Medium | In progress | Reference features | nothing |
| -     | CLIP-7b | Screen Studio `mousemoves`/`mouseclicks` metadata import                     | Medium | Decision    | Reference features | D-4     |

### Acceptance added by the real capture

One OpenScreen 2.2.2 recording was checked on the owner's Mac. These points are binding on CLIP-7
and CLIP-8 in addition to the reference backlog.

- CLIP-7 accepts version 2 `native` sidecars and keeps unknown fields. The real file carries
  `visible` on samples and `id` and `platform` on cursor images.
- Timestamps may repeat: the first three samples are all 0 ms. Samples arrive at about 23 Hz.
- Clicks and mouseups need not pair: the capture has five clicks, four mouseups, one duplicate
  mouseup and two trailing clicks.
- Hotspots are fractional (4.5, 11.5) and must not be rounded.
- Samples are stored in source time per asset. A user-adjustable time offset defaults to 0, because
  the clock offset between video and sidecar was not measured.
- Malformed input is rejected without replacing existing data. A video with no sidecar shows a clear
  no-tracking state.
- Saving must not drop pointer data: `serializeProject` writes only what `parseProject` returns
  (#29), so CLIP-7 ships a round-trip test for every pointer field.
- CLIP-8 picks the cursor image by `assetId`, never `cursorType`: all 28 `pointer` labels in the
  capture sit on the arrow image. It interpolates between samples and looks them up by binary
  search, not a per-frame scan.
- Engineering rules in CLIP-9 as shipped, not owner decisions: a click pairs with the next mouseup,
  and repeated downs collapse into one until a release arrives. An unpaired click in the last 250 ms
  is left out of zoom generation as a heuristic, on the unverified guess that it is the click on
  Stop; an unpaired click elsewhere still counts. Raw samples are never altered.
- Engineering choices in CLIP-10 as shipped, not owner decisions: follow half-lives of 100 and 300
  ms, a dead zone of 20% of the viewport half extent, and Focused as the default for generated
  zooms.
- CLIP-9 applies no automatic clock or drift correction between video and sidecar. The Mac capture
  thread measured no drift over a 139 s take and a median offset of 7 ms, with about one frame of
  jitter; its method and result are in `tests/openscreen/README.md`. The queue thread has read that
  record, not the recording.
- Cursor bitmaps are drawn at their pixel size. Whether size and hotspot should be divided by
  `scaleFactor` is unknown: OpenScreen 2.2.2 (`d7adf05`) declares the field in
  `src/native/contracts.ts` without drawing semantics, and its macOS renderer draws its own theme
  sprites, not captured bitmaps. The real capture has scale 1 only, so no rule was added.
- Compatibility claim: OpenScreen 2.2.2, macOS, full display, scale 1. Scale 1 was inferred, not
  measured. Retina, window capture, multi-display and non-left buttons are untested.

### Not blocking mouse work

Take these when a push slot is free and the files do not overlap an in-flight ticket. Owner is the
queue thread unless stated.

| Ticket | What                                                                                 | Risk   | Status                                   | Findings      |
| ------ | ------------------------------------------------------------------------------------ | ------ | ---------------------------------------- | ------------- |
| REF-14 | One constant each for music gain and peak rate; blob-URL test asserts no fetch       | Small  | Ready                                    | #32, #33, #34 |
| REF-16 | Undo takes one step per gesture and skips no-op edits                                | Medium | Ready                                    | #5            |
| REF-18 | Editor journeys also run against the production bundle                               | Medium | Ready                                    | #18           |
| REF-20 | Rewind and export progress re-render at 10 Hz                                        | Medium | Ready                                    | #36           |
| REF-21 | Save: size precheck with a clear message; unreadable or unused media cannot block it | Medium | Ready                                    | #3, #28       |
| REF-22 | Project container without one giant JSON string (format version 3, reads version 2)  | Large  | Proposal                                 | #3            |
| REF-23 | Zooms anchored to source time and source coordinates                                 | Large  | Decision D-1                             | #14, #24      |
| REF-24 | Edit operations in a tested reducer outside `App.tsx`                                | Large  | Proposal; only if REF-19 proves too thin | #20           |

REF-22 and REF-23 change saved data, so each needs the owner's go-ahead before code.

## Feature backlog after CLIP-11

Every row is a proposal from the reference backlog, which holds the source links. The default order
is numeric, skipping rows with a gate. Nothing here is delivered.

| Ticket  | Capability                                                   | Gate                                                                  |
| ------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| CLIP-12 | Click sounds with volume                                     | CLIP-7; needs a licensed or original sound                            |
| CLIP-13 | Motion blur for cursor, zoom and pan                         | CLIP-10                                                               |
| CLIP-14 | Keystroke overlays                                           | No key-event source: OpenScreen sidecars carry pointer data only      |
| CLIP-15 | Audio scrub and reference hotkey parity                      | none                                                                  |
| CLIP-16 | Clip retiming and typing-segment speed-up                    | typing suggestions need key events                                    |
| CLIP-17 | Per-clip and whole-recording gain                            | REF-14                                                                |
| CLIP-18 | Command menu and custom shortcuts                            | REF-7                                                                 |
| CLIP-19 | Padding, proportions and arbitrary crop bounds               | REF-1                                                                 |
| CLIP-20 | Background wallpaper, gradient, color, image, inset, shadow  | REF-1                                                                 |
| CLIP-21 | Output aspect ratios and responsive composition              | REF-1                                                                 |
| CLIP-22 | Camera hide, position, mirror, size, roundness               | REF-1                                                                 |
| CLIP-23 | Timed camera layouts                                         | CLIP-22                                                               |
| CLIP-24 | Blur and redaction masks, highlights                         | REF-1                                                                 |
| CLIP-25 | Copy the current frame as an image                           | REF-3                                                                 |
| CLIP-26 | Multicam angles and per-speaker mixes                        | none                                                                  |
| CLIP-27 | Derived social clips from a timeline range                   | none                                                                  |
| CLIP-28 | Teaser, title sequence and program assembly                  | CLIP-27                                                               |
| CLIP-29 | Chapter markers                                              | none                                                                  |
| CLIP-30 | Interactive player bundle with separate synchronized outputs | none                                                                  |
| CLIP-31 | Final Cut and After Effects interchange                      | none                                                                  |
| CLIP-32 | Local transcription                                          | new dependency and model download need approval                       |
| CLIP-33 | Caption editor, SRT and VTT export                           | CLIP-32                                                               |
| CLIP-34 | Transcript-suggested edits                                   | CLIP-32                                                               |
| CLIP-35 | Editable Remotion graphics sequences                         | Remotion license check (D-5)                                          |
| CLIP-36 | Caption reconstruction from a flat video pair                | CLIP-33                                                               |
| CLIP-37 | Batch rendering and reusable graphics library                | CLIP-35                                                               |
| CLIP-38 | Save-as, recent projects, unsaved-close warning              | REF-12, REF-22                                                        |
| CLIP-39 | Styling presets                                              | CLIP-19, CLIP-20                                                      |
| CLIP-40 | GIF, quality and frame-rate options, clipboard export        | REF-3                                                                 |
| CLIP-41 | Preview quality and power-saving modes                       | none                                                                  |
| CLIP-42 | Extract original screen, camera and audio tracks             | none                                                                  |
| CLIP-43 | Native Screen Studio package ingestion                       | needs a real package fixture (D-4)                                    |
| CLIP-44 | Hosted sharing links and timestamped comments                | needs hosting and a product decision; conflicts with local-only today |
| CLIP-45 | Quick share, save and copy actions                           | CLIP-40                                                               |
| CLIP-46 | Browser recording of display, window, camera and audio       | product decision: OpenScreen covers recording today                   |
| CLIP-47 | Speaker-note teleprompter                                    | CLIP-46                                                               |
| CLIP-48 | iPhone and iPad capture, device frames                       | native capture; not possible in a browser orb                         |

Native-only Screen Studio settings (camera effects, notifications, Dock, licensing, diagnostics) are
inventoried in the reference backlog and are not Clipper tickets.

## Decisions for the owner

Work continues on the stated default until the owner says otherwise.

| ID  | Question                                                                                                                                                                                                                               | Default in force                                                                                                                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Should zooms follow their footage (source time, source coordinates) instead of fixed timeline frames and mask percent? (#14, #24)                                                                                                      | CLIP-9 stores generated zooms with a source anchor; manual version-2 zooms keep today's behavior until REF-23 is approved                                                                                             |
| D-2 | Should CI also run on pull requests, and unit tests in the pre-commit hook? (#35)                                                                                                                                                      | No change: direct pushes to `main` with post-push CI                                                                                                                                                                  |
| D-4 | Provide a real Screen Studio project to build CLIP-7b and CLIP-43 against                                                                                                                                                              | Both stay parked; nothing is inferred from screenshots of file names                                                                                                                                                  |
| D-5 | Check the Remotion license before commercial or team use                                                                                                                                                                               | Not checked                                                                                                                                                                                                           |
| D-7 | CLIP-7 to CLIP-10 are on `main`: import a real OpenScreen recording into Clipper on the Mac, generate zooms, and check that the cursor, the zooms and the follow framing line up with the video                                        | Compatibility with real recordings stays unclaimed; work continues on synthetic fixtures                                                                                                                              |
| D-8 | Three commits on public `main` carry a personal email address instead of the noreply address: `2bb8263` and `de27f06` (author and committer) and `e9f99fc` (committer). Rewrite `main` from `2bb8263` with a force-push to replace it? | Not rewritten: a force-push changes every later commit ID and needs the owner's approval. The old commits would stay fetchable on GitHub by ID until GitHub Support purges them. Both workers have fixed their config |

Settled by the owner:

- Left clicks first: get OpenScreen's left-click flow working before right clicks, which are later
  "extra credit". The owner wrote this in the
  [capture research thread](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) on
  2026-11-15 at 22:06:51 UTC. He has not decided anything about sample rate, click pairing or cursor
  scaling; those are engineering defaults, listed under the capture acceptance.
- OpenScreen is the first capture route (was D-3). The owner wrote "1. confirmed openscreen first"
  in the
  [capture research thread](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) on
  2026-11-15 at 16:03:54 UTC.
- The Amp project's primary repository is GitHub. The owner wrote "confirmed" in the queue thread on
  2026-11-16, and `amp projects get` shows the project mapped to `mite404/clipper`.
- D-6, the eight hosted capture images: the owner deleted the Mac capture thread on 2026-11-16. The
  queue thread confirmed that the thread can no longer be read. It cannot check whether Amp's
  storage still holds the eight attachment files.

## Verification for every ticket

- A public-behavior test fails before the change and passes after it.
- `npm run format:check`, `lint`, `lint:typed`, `typecheck`, `check:code`, `npm test`, `build` and
  `build-storybook` pass, then the affected journeys from
  `.agents/skills/verify-clipper/scripts/verify.mjs` (`all` after shared editor changes).
- UI changes reuse the shared Storybook components, cover absent, invalid and stress data, and are
  inspected in screenshots; interaction changes also in a recording.
- Changes to rendered video are checked in decoded export frames at seeks, cuts and source offsets,
  with audio checks where audio changes.
- `performance` runs alone, never beside an encode or build.
- The pushed commit's CI run is green before the ticket is marked delivered.

## Known limits

- Import, project save and reopen, and export are fully buffered. Long recordings can exhaust
  memory, and Save fails outright near 400 MB of media (#3; REF-21, REF-22).
- Export is exercised as WebM VP9/Opus only. The MP4 AVC/AAC branch has never run in CI or locally.
  No ticket yet: it needs a runner with branded Chrome, and macOS for AAC.
- Reverse shuttle is silent. Filmstrips repeat the first thumbnail. Edge handles only shorten.
- Unsaved edits vanish on reload. The browser asks first (REF-12); CLIP-38 adds persistence. Mute
  changes and imported media do not count as unsaved, and after more than 50 edits, undoing all 50
  kept steps reads as saved.
- Verification ran in Chromium on Linux. Safari, Firefox, physical devices and speaker output are
  unverified.
- CLIP-7 to CLIP-10 are proven on synthetic sidecars shaped like the real capture, not on the
  capture itself.
- No real cursor recording has been imported into Clipper yet. The capture contract above comes from
  one recording inspected outside Clipper.
- Cursor-free pixels are supported by 48 sampled positions in that recording, not by every frame.
  Retina scale, window capture, cropping and multiple displays are unmeasured.
- Privacy state of the recordings: the videos and `.cursor.json` sidecars were read only on the Mac
  and were not uploaded or transferred. Eight derived images did become hosted Amp attachments when
  the Mac capture thread viewed them: three 200x200 crops at click times and one sheet of the three
  cursor bitmaps from the first recording, one full 3440x1440 frame and one half-size frame from the
  second, and two half-size frames from the third. That thread's transcript also holds text
  describing the crops and nine click and mouseup samples. This contradicts the thread's own
  "nothing was uploaded" statements. The owner has since deleted that thread (D-6, settled below),
  so its transcript is gone; this file and `tests/openscreen/README.md` keep the findings.
