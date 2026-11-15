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
- The authoritative repository is `https://github.com/mite404/clipper.git`. The Amp-hosted project
  repository is still the empty scaffold by the owner's choice, so every new worker must fetch
  GitHub explicitly.
- Pushes to `main` are serialized. Ask the queue thread for a slot with the ticket ID, files and
  checks run. On the grant: fetch, rebase onto `origin/main`, re-verify, then
  `git push origin HEAD:main`. One ticket per push, one commit, no force-push. Subscribe to CI for
  the pushed commit. The slot is released when that run is green.
- `.fallow-health-baseline.json` only shrinks. Put new logic in new modules with small functions.
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
reading, complete) and the
[Mac capture check](https://ampcode.com/threads/T-01a1dff4-ed93-7367-826e-b99beda09a43) (one real
OpenScreen recording; the video and sidecar were not transferred, but four derived images are
hosted, see [Known limits](#known-limits)).

### Files while CLIP-7 is in flight

| Owner                    | Paths                                                                                                                                                                                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reference features       | new `src/cursor.ts`, `src/cursor.test.ts`, `tests/cursor.spec.ts`; `src/media.ts`, `src/project.ts`, `src/project.test.ts`; new standalone `CursorControls` component; additions to `src/Editor.stories.tsx` and `src/components.tsx`; one `SourceMonitor` reset condition in `src/App.tsx` |
| Queue thread             | `src/timeline.ts`, `src/timeline.test.ts`, new `src/stage.ts`, `src/export.ts`, `src/Composition.tsx`, `tests/export.spec.ts`                                                                                                                                                               |
| Shared, keep edits small | `src/App.tsx` (features: import, open, save and asset state; refactors: geometry constants and transport), `tests/**`, `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `README.md`                                                                                      |

## Status key

- **Delivered**: on GitHub `main` with a green CI run for that commit.
- **In progress**: an owner is implementing it now.
- **Ready**: nothing blocks it; waiting for its owner or a push slot.
- **Blocked**: waits on the tickets named in "Needs".
- **Decision**: waits on the owner; see [Decisions](#decisions-for-the-owner).
- **Proposal**: inventoried from the reference material, not yet designed or accepted.

## Delivered on main

| Ticket   | What                                               | Commit                                                                                          | Evidence                                                                                                               |
| -------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| CLIP-1   | Play responds without freezing the editor          | [`5a9bc1f`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c) | [CI 43733454487](https://github.com/mite404/clipper/actions/runs/43733454487), steel thread record                     |
| CLIP-2   | Swap sides, edge trims, scalable timeline          | `5a9bc1f`                                                                                       | same                                                                                                                   |
| CLIP-3   | Manual fixed-point zoom ("mark mouse position")    | `5a9bc1f`                                                                                       | same                                                                                                                   |
| CLIP-4   | Portable version-2 project save and reopen         | `5a9bc1f`                                                                                       | same                                                                                                                   |
| CLIP-5   | Local HD and 4K export                             | `5a9bc1f`                                                                                       | same; WebM VP9/Opus only, see [Known limits](#known-limits)                                                            |
| CLIP-6   | Shared records, tests, verification skill, CI gate | `5a9bc1f`                                                                                       | same                                                                                                                   |
| BOOT-1   | Orb bootstrap `.agents/setup`                      | [`1a5a572`](https://github.com/mite404/clipper/commit/1a5a572a32f68106930c69806bbb4465f2d30da0) | [CI 43735176014](https://github.com/mite404/clipper/actions/runs/43735176014)                                          |
| VERIFY-1 | Isolated verification CLI `verify.mjs`             | [`2bb8263`](https://github.com/mite404/clipper/commit/2bb8263ce692770f62d0ae37ca3bcb162424cadf) | [CI 43736808192](https://github.com/mite404/clipper/actions/runs/43736808192); its 4 CLI tests are local-only          |
| DOC-1    | Baseline review record and this list               | [`f702568`](https://github.com/mite404/clipper/commit/f7025680e6144abc216097009f99d5e5ce363028) | [CI 43761407681](https://github.com/mite404/clipper/actions/runs/43761407681), [refactor01.md](refactor/refactor01.md) |

CLIP-3 is manual fixed-point zoom. It does not satisfy CLIP-7 to CLIP-10. BOOT-1 is on `main` but
does not run for new orbs, because new orbs clone the Amp-hosted scaffold.

## Queue

Top to bottom is the order of work. The two lanes run in parallel; pushes are serialized.

### Mouse tracking and automatic zoom

| Order | Ticket  | What                                                                                                              | Risk   | Status      | Owner              | Needs                            |
| ----- | ------- | ----------------------------------------------------------------------------------------------------------------- | ------ | ----------- | ------------------ | -------------------------------- |
| 1     | CLIP-7  | Import, validate and persist OpenScreen pointer sidecars per source asset                                         | Medium | In progress | Reference features | nothing                          |
| 2     | REF-5   | Split never mints a duplicate clip ID (#13)                                                                       | Small  | Ready       | Queue thread       | nothing                          |
| 3     | REF-2   | `covers` and `sourceFrame` helpers for timeline-to-source time (#22)                                              | Small  | Ready       | Queue thread       | nothing                          |
| 4     | REF-1   | One `src/stage.ts` for mask rects, cover crop and zoom projection; pin the preview transform first (#1, #17)      | Medium | Ready       | Queue thread       | REF-2                            |
| 5     | REF-3   | `drawFrame` seam in the exporter, canvas pool (#26, #25)                                                          | Medium | Ready       | Queue thread       | REF-1                            |
| 6     | CLIP-8  | Smooth, trim-aware cursor in preview and export                                                                   | Medium | Blocked     | Reference features | CLIP-7, REF-1, REF-2, REF-3      |
| 7     | REF-4   | Zoom placement rules in `src/timeline.ts`, enforced by the project parser; ramp and pan assertions (#8, #10, #12) | Small  | Blocked     | Queue thread       | CLIP-7 (shares `src/project.ts`) |
| 8     | CLIP-9  | Editable zooms generated from recorded clicks                                                                     | Medium | Blocked     | Reference features | CLIP-7, REF-4, D-1               |
| 9     | REF-6   | Performance gate fails on stalls, not only p95 (#16)                                                              | Medium | Ready       | Queue thread       | nothing                          |
| 10    | CLIP-10 | Smooth follow framing                                                                                             | Large  | Blocked     | Reference features | CLIP-8, CLIP-9, REF-6            |
| -     | CLIP-7b | Screen Studio `mousemoves`/`mouseclicks` metadata import                                                          | Medium | Decision    | Reference features | D-4                              |

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
- Compatibility claim: OpenScreen 2.2.2, macOS, full display, scale 1. Scale 1 was inferred, not
  measured. Retina, window capture, multi-display and non-left buttons are untested.

### Not blocking mouse work

Take these when a push slot is free and the files do not overlap an in-flight ticket. Owner is the
queue thread unless stated.

| Ticket   | What                                                                                                         | Risk   | Status                                   | Findings                      |
| -------- | ------------------------------------------------------------------------------------------------------------ | ------ | ---------------------------------------- | ----------------------------- |
| REF-7    | Modified keys such as Cmd/Ctrl+S no longer split, delete or seek                                             | Small  | Ready                                    | #7                            |
| REF-8    | Mouse-marking mode ends when its zoom is removed, undone or deselected                                       | Small  | Ready                                    | #6                            |
| REF-9    | Timecode and frame-step buttons match the held frame after pause                                             | Small  | Ready                                    | #21                           |
| REF-10   | Trim grip: a click commits nothing; a drag never writes a stale clip                                         | Small  | Ready                                    | #15, #38                      |
| REF-11   | Multi-file import names its failures; demo fetch has a deadline                                              | Small  | Ready                                    | #9, #37                       |
| REF-12   | Logo no longer reloads the page; warn before unloading unsaved work                                          | Small  | Ready                                    | #23                           |
| REF-13   | CI compares the fallow baseline with the pre-push commit                                                     | Small  | Ready                                    | #4                            |
| REF-14   | One constant each for music gain and peak rate; blob-URL test asserts no fetch                               | Small  | Ready                                    | #32, #33, #34                 |
| REF-15   | Export audio mix cost follows clip count, not decoded buffer count                                           | Medium | Ready                                    | #2                            |
| REF-16   | Undo takes one step per gesture and skips no-op edits                                                        | Medium | Ready                                    | #5                            |
| REF-17   | Export pixel gate checks each panel and more than one frame                                                  | Medium | Ready                                    | #31                           |
| REF-18   | Editor journeys also run against the production bundle                                                       | Medium | Ready                                    | #18                           |
| REF-19   | Browser tests for delete, keyboard undo and seek clamping                                                    | Medium | Ready                                    | #20                           |
| REF-20   | Rewind and export progress re-render at 10 Hz                                                                | Medium | Ready                                    | #36                           |
| REF-21   | Save: size precheck with a clear message; unreadable or unused media cannot block it                         | Medium | Blocked on CLIP-7                        | #3, #28                       |
| REF-22   | Project container without one giant JSON string (format version 3, reads version 2)                          | Large  | Proposal                                 | #3                            |
| REF-23   | Zooms anchored to source time and source coordinates                                                         | Large  | Decision D-1                             | #14, #24                      |
| REF-24   | Edit operations in a tested reducer outside `App.tsx`                                                        | Large  | Proposal; only if REF-19 proves too thin | #20                           |
| VERIFY-2 | Retire or repair `control-clipper.sh` and the direct-command prose in the feature files; fix the story count | Small  | Ready, verification tools                | refactor01 agent-facing notes |

REF-13 lifts the one-commit-per-push rule once it is green. REF-22 and REF-23 change saved data, so
each needs the owner's go-ahead before code.

## Feature backlog after CLIP-10

Every row is a proposal from the reference backlog, which holds the source links. The default order
is numeric, skipping rows with a gate. Nothing here is delivered.

| Ticket  | Capability                                                                            | Gate                                                                  |
| ------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| CLIP-11 | Cursor appearance and advanced behavior: style, idle hide, loop return, shake removal | CLIP-8                                                                |
| CLIP-12 | Click sounds with volume                                                              | CLIP-7; needs a licensed or original sound                            |
| CLIP-13 | Motion blur for cursor, zoom and pan                                                  | CLIP-10                                                               |
| CLIP-14 | Keystroke overlays                                                                    | No key-event source: OpenScreen sidecars carry pointer data only      |
| CLIP-15 | Audio scrub and reference hotkey parity                                               | none                                                                  |
| CLIP-16 | Clip retiming and typing-segment speed-up                                             | typing suggestions need key events                                    |
| CLIP-17 | Per-clip and whole-recording gain                                                     | REF-14                                                                |
| CLIP-18 | Command menu and custom shortcuts                                                     | REF-7                                                                 |
| CLIP-19 | Padding, proportions and arbitrary crop bounds                                        | REF-1                                                                 |
| CLIP-20 | Background wallpaper, gradient, color, image, inset, shadow                           | REF-1                                                                 |
| CLIP-21 | Output aspect ratios and responsive composition                                       | REF-1                                                                 |
| CLIP-22 | Camera hide, position, mirror, size, roundness                                        | REF-1                                                                 |
| CLIP-23 | Timed camera layouts                                                                  | CLIP-22                                                               |
| CLIP-24 | Blur and redaction masks, highlights                                                  | REF-1                                                                 |
| CLIP-25 | Copy the current frame as an image                                                    | REF-3                                                                 |
| CLIP-26 | Multicam angles and per-speaker mixes                                                 | none                                                                  |
| CLIP-27 | Derived social clips from a timeline range                                            | none                                                                  |
| CLIP-28 | Teaser, title sequence and program assembly                                           | CLIP-27                                                               |
| CLIP-29 | Chapter markers                                                                       | none                                                                  |
| CLIP-30 | Interactive player bundle with separate synchronized outputs                          | none                                                                  |
| CLIP-31 | Final Cut and After Effects interchange                                               | none                                                                  |
| CLIP-32 | Local transcription                                                                   | new dependency and model download need approval                       |
| CLIP-33 | Caption editor, SRT and VTT export                                                    | CLIP-32                                                               |
| CLIP-34 | Transcript-suggested edits                                                            | CLIP-32                                                               |
| CLIP-35 | Editable Remotion graphics sequences                                                  | Remotion license check (D-5)                                          |
| CLIP-36 | Caption reconstruction from a flat video pair                                         | CLIP-33                                                               |
| CLIP-37 | Batch rendering and reusable graphics library                                         | CLIP-35                                                               |
| CLIP-38 | Save-as, recent projects, unsaved-close warning                                       | REF-12, REF-22                                                        |
| CLIP-39 | Styling presets                                                                       | CLIP-19, CLIP-20                                                      |
| CLIP-40 | GIF, quality and frame-rate options, clipboard export                                 | REF-3                                                                 |
| CLIP-41 | Preview quality and power-saving modes                                                | none                                                                  |
| CLIP-42 | Extract original screen, camera and audio tracks                                      | none                                                                  |
| CLIP-43 | Native Screen Studio package ingestion                                                | needs a real package fixture (D-4)                                    |
| CLIP-44 | Hosted sharing links and timestamped comments                                         | needs hosting and a product decision; conflicts with local-only today |
| CLIP-45 | Quick share, save and copy actions                                                    | CLIP-40                                                               |
| CLIP-46 | Browser recording of display, window, camera and audio                                | product decision: OpenScreen covers recording today                   |
| CLIP-47 | Speaker-note teleprompter                                                             | CLIP-46                                                               |
| CLIP-48 | iPhone and iPad capture, device frames                                                | native capture; not possible in a browser orb                         |

Native-only Screen Studio settings (camera effects, notifications, Dock, licensing, diagnostics) are
inventoried in the reference backlog and are not Clipper tickets.

## Decisions for the owner

Work continues on the stated default until the owner says otherwise.

| ID  | Question                                                                                                                          | Default in force                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Should zooms follow their footage (source time, source coordinates) instead of fixed timeline frames and mask percent? (#14, #24) | CLIP-9 stores generated zooms with a source anchor; manual version-2 zooms keep today's behavior until REF-23 is approved |
| D-2 | Should CI also run on pull requests, and unit tests in the pre-commit hook? (#35)                                                 | No change: direct pushes to `main` with post-push CI                                                                      |
| D-4 | Provide a real Screen Studio project to build CLIP-7b and CLIP-43 against                                                         | Both stay parked; nothing is inferred from screenshots of file names                                                      |
| D-5 | Check the Remotion license before commercial or team use                                                                          | Not checked                                                                                                               |
| D-6 | Four images derived from the real capture are hosted as Amp attachments in the Mac capture thread; keep or delete them            | Left untouched. No deletion is authorized                                                                                 |

Settled by the owner:

- OpenScreen is the first capture route (was D-3). The owner wrote "1. confirmed openscreen first"
  in the
  [capture research thread](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) on
  2026-11-15 at 16:03:54 UTC.
- The Amp project keeps its Amp-hosted primary repository for now, so new workers fetch GitHub
  explicitly.

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
- Unsaved edits vanish on reload (REF-12 adds a warning; CLIP-38 adds persistence).
- Verification ran in Chromium on Linux. Safari, Firefox, physical devices and speaker output are
  unverified.
- No real cursor recording has been imported into Clipper yet. The capture contract above comes from
  one recording inspected outside Clipper.
- Cursor-free pixels are supported by 48 sampled positions in that recording, not by every frame.
  The clock offset between video and sidecar, Retina scale, window capture, cropping and multiple
  displays are unmeasured.
- Privacy state of that recording: the video and the `.cursor.json` sidecar were read only on the
  Mac and were not uploaded or transferred. Four derived images did become hosted Amp attachments
  when the Mac capture thread viewed them: three 200x200 crops of real screen frames at click times
  and one composite of the three cursor bitmaps. That thread's transcript also holds text describing
  the crops and nine click and mouseup samples. This contradicts the thread's own "nothing was
  uploaded" statements. Nothing has been deleted (D-6).
