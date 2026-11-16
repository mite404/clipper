# Clipper master ticket list

This is the only operational queue for Clipper. Workers, the Space and the owner read status here
and nowhere else. Other documents are records, not queues:

- [docs/refactor/refactor01.md](refactor/refactor01.md) is the one-time review of baseline
  `5a9bc1f`. Its finding numbers (`#1` to `#38`) are cited below.
- [Reference features and capture evidence](reference-features.md) preserves the current reference
  artifact's revision 8, including source links and acceptance details. The owner approved deleting
  only that artifact; its owning thread confirmed deletion on 2026-11-16.
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
  unless the owner authorizes otherwise. Opus and Fable are reserved for sparing research or review.

## Owners

| Lane                     | Thread                                                                           | Owns                                                       |
| ------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Queue and implementation | [T-6706048a](https://ampcode.com/threads/T-6706048a-c051-4e23-9ec6-68afd669b492) | This file, REF and CLIP tickets, exclusive main push slot  |
| Cursor implementation    | [T-77c027fc](https://ampcode.com/threads/T-77c027fc-1240-4757-bef9-fcac238ea35a) | Speed-style unit delivered; no active implementation grant |
| Cursor preservation      | [T-930219f2](https://ampcode.com/threads/T-930219f2-6c3a-4543-a9e0-9a1073cc4d94) | Frozen original CLIP-11 work, no implementation or push    |
| Editor and bootstrap     | [T-01a1ddd7](https://ampcode.com/threads/T-01a1ddd7-317f-7312-a2ce-db23a9d866da) | `.agents/setup`, `.agents/resume`                          |
| Verification tools       | [T-282b9f84](https://ampcode.com/threads/T-282b9f84-b86a-4498-b4cf-b8fb963a33cc) | `.agents/skills/verify-clipper/**`                         |

The owner's one-ticket Sonnet 5.5 trial for VERIFY-3 in
[T-24b3f0ad](https://ampcode.com/threads/T-24b3f0ad-9a83-4b3b-b297-6f86319b8e81) concluded with
delivery at `f76a702` and green exact-SHA CI. Its feature-map and control-journey ownership is
released. Any further Sonnet implementation needs a new explicit one-ticket approval; the default
remains Sol medium.

The owner separately approved one Sonnet 5.5 medium feature trial for CLIP-25 in
[T-bfa34ef0](https://ampcode.com/threads/T-bfa34ef0-3d3f-4007-99c7-58c097d8dc58). It owns the
one-frame render seam in `src/export.ts`, a narrow copy/status/busy action in `src/App.tsx`, new
`tests/frame-image.spec.ts` and its ticket brief. Sol retains diff/acceptance review and exclusive
push authority. No generic component, stylesheet, package, persistence or cursor edits are granted.
The exception ends after CLIP-25. Cursor speed-style, REF-18, and REF-14 path reservations are
released after their green deliveries. UI-1 retains its separate component/style/dependency
reservation. REF-20 is assigned to Sol medium in
[T-0f030227](https://ampcode.com/threads/T-0f030227-5357-4bc3-baf5-7974b220dd59). It owns App's
rewind/readout listener and export-progress hunks, focused editor/performance tests, and its brief.
The CLIP-25 copy action and render seam remain outside REF-20's reservation.

CLIP-25 copies the held composed output frame to the clipboard as PNG on explicit user action, using
shared render math and the existing output-resolution choice. No DOM screenshot or video-wide encode
is acceptable. Independent decoded-pixel checks cover source offsets, repeated cuts, seeks,
crop/swap/zoom/follow and cursor rotation. Denied/unsupported clipboard and unreadable media must
leave the edit intact, free resources and clear busy state with a useful visible error. Full strict
gates, inspected UI states/interaction and green exact-SHA CI remain delivery gates.

CLIP-25 exposed a nominal-index versus stored-time mismatch in a synthetic 30 fps WebM without a
frame-rate hint. An independent unchanged-main reproduction confirms indices 2, 5, 8, 11, 14 and 17
select the preceding marker when requested at index/30; requesting stored packet timestamps selects
all 18 markers correctly. Mediabunny documents last-frame-at-or-before selection, so this alone is
not a proven exporter bug. Track the sampling-contract investigation under [REF-28](#ref-28),
separately from missing/early-end cases. The worker's actual Remotion-video versus PNG receipt has
24 matching logged marker pairs across forward/reverse holds, including all six affected indices.
This is inspected diagnostic output, not a parity assertion in that uploaded test. It demonstrates
no preview/copy mismatch for those holds, so the investigation no longer blocks CLIP-25. Keep
stored-time sampling unchanged and add an asserted affected-boundary preview/PNG regression to the
feature's browser tests. No nominal-ordinal or complete WebM/VFR compatibility claim follows.

The former queue thread
[T-2d1e888a](https://ampcode.com/threads/T-2d1e888a-23ff-4bf4-b2d1-551553f2ef0a) has stopped
implementation and coordination. Its baseline review is complete and is not repeated. The successor
received the actual 13 CLIP-11 changed files, including `src/cursor-touch.png`, through
`download_thread_changes` before editing. Integration uses a three-way merge from `8095a273`, not an
overlay of stale files. Server-side usage confirms GPT-6.1 Sol routing for the successor, created
with medium effort. Implementation workers have disjoint paths and one main push-slot owner.

Evidence-only threads:
[reuse research](https://ampcode.com/threads/T-01a1ddd8-535c-7129-a7d7-9a0c28f41449) (what the
owner's `sequence-spear-fish` prototype can lend),
[Premiere XML design](https://ampcode.com/threads/T-52bd93c4-0eb5-46f3-ae30-0d2ff60a23ff) (proposals
CLIP-31a to CLIP-31c),
[capture research](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) (source
reading, complete) and the Mac capture check, a thread on the owner's Mac that he has since deleted
(three real OpenScreen recordings; the videos and sidecars were not transferred, but eight derived
images were hosted, see [Known limits](#known-limits)).

### Current path reservations

| Owner                    | Paths                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Cursor implementation    | No active reservation after the speed-style delivery; further work requires a new scoped grant                   |
| Queue implementation     | Queue/docs only; CLIP-25, UI-1, and REF-20 reservations above remain exclusive                                      |
| Shared, keep edits small | `src/App.tsx`, other `tests/**`, `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `README.md` |

### Preservation branches

Made on 2026-11-15 before the Amp project's switch to GitHub. They are not for merging and are
deleted only on the owner's word.

| Branch                          | Holds                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `wip/clip-10-smooth-follow`     | CLIP-10 before it landed; redundant now                                                               |
| `wip/queue-thread-resume-files` | The queue thread's helper scripts and raw review output, ignored on main                              |
| `wip/queue-handoff-master-list` | Preserved queue draft at `31e5e725`, integrated by the successor                                      |
| `wip/clip-11-original-handoff`  | Exact 13-file cursor capture at `6939b52`, parent `8095a273`; integrated core is on main at `7b23be8` |

The checkpoint found nothing only on the Amp-hosted repository: its one ref, `main` at `0b11477`,
was two empty commits that GitHub `main` contains. The owner confirmed the switch on 2026-11-16 and
the project now maps to GitHub. `wip/ref-17-19-export-gate-edit-keys` was deleted with his consent
after both of its commits were on `main`.

## Status key

- **Delivered**: on GitHub `main` with a green CI run for that commit.
- **In progress**: an owner is implementing it now.
- **Partial**: a tested unit is delivered, but named acceptance remains open.
- **Local only**: preserved work has not been pushed or passed its delivery gate.
- **Ready**: nothing blocks it; waiting for its owner or a push slot.
- **Blocked**: waits on the tickets named in "Needs".
- **Decision**: waits on the owner; see [Decisions](#decisions-for-the-owner).
- **Proposal**: inventoried from the reference material, not yet designed or accepted.

## Delivered on main

| Ticket ID                                     | Title                                                                                                                                                                                                                                                                                                                                                                                 | Commit                                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="clip-1"></a>[CLIP-1](#clip-1)          | Play responds without freezing the editor                                                                                                                                                                                                                                                                                                                                             | [`5a9bc1f`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c) | [CI 43733454487](https://github.com/mite404/clipper/actions/runs/43733454487), steel thread record                                                                                                                                                                                                                                                      |
| <a id="clip-2"></a>[CLIP-2](#clip-2)          | Swap sides, edge trims, scalable timeline                                                                                                                                                                                                                                                                                                                                             | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="clip-3"></a>[CLIP-3](#clip-3)          | Manual fixed-point zoom ("mark mouse position")                                                                                                                                                                                                                                                                                                                                       | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="clip-4"></a>[CLIP-4](#clip-4)          | Portable version-2 project save and reopen                                                                                                                                                                                                                                                                                                                                            | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="clip-5"></a>[CLIP-5](#clip-5)          | Local HD and 4K export                                                                                                                                                                                                                                                                                                                                                                | `5a9bc1f`                                                                                       | same; WebM VP9/Opus only, see [Known limits](#known-limits)                                                                                                                                                                                                                                                                                             |
| <a id="clip-6"></a>[CLIP-6](#clip-6)          | Shared records, tests, verification skill, CI gate                                                                                                                                                                                                                                                                                                                                    | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="boot-1"></a>[BOOT-1](#boot-1)          | Orb bootstrap `.agents/setup`                                                                                                                                                                                                                                                                                                                                                         | [`1a5a572`](https://github.com/mite404/clipper/commit/1a5a572a32f68106930c69806bbb4465f2d30da0) | [CI 43735176014](https://github.com/mite404/clipper/actions/runs/43735176014)                                                                                                                                                                                                                                                                           |
| <a id="verify-1"></a>[VERIFY-1](#verify-1)    | Isolated verification CLI `verify.mjs`                                                                                                                                                                                                                                                                                                                                                | [`2bb8263`](https://github.com/mite404/clipper/commit/2bb8263ce692770f62d0ae37ca3bcb162424cadf) | [CI 43736808192](https://github.com/mite404/clipper/actions/runs/43736808192); its 4 CLI tests are local-only                                                                                                                                                                                                                                           |
| <a id="doc-1"></a>[DOC-1](#doc-1)             | Baseline review record and this list                                                                                                                                                                                                                                                                                                                                                  | [`f702568`](https://github.com/mite404/clipper/commit/f7025680e6144abc216097009f99d5e5ce363028) | [CI 43761407681](https://github.com/mite404/clipper/actions/runs/43761407681), [refactor01.md](refactor/refactor01.md)                                                                                                                                                                                                                                  |
| <a id="ref-5"></a>[REF-5](#ref-5)             | Split never mints a duplicate clip ID (#13)                                                                                                                                                                                                                                                                                                                                           | [`42324e3`](https://github.com/mite404/clipper/commit/42324e3623a56c6421b99bc9106b088fd28add4f) | [CI 43762022693](https://github.com/mite404/clipper/actions/runs/43762022693)                                                                                                                                                                                                                                                                           |
| <a id="ref-2"></a>[REF-2](#ref-2)             | `covers` and `sourceFrame` helpers for timeline-to-source time (#22)                                                                                                                                                                                                                                                                                                                  | [`e2ad4b8`](https://github.com/mite404/clipper/commit/e2ad4b8b3380a73fac2e269c820c9e6381655759) | [CI 43762301972](https://github.com/mite404/clipper/actions/runs/43762301972)                                                                                                                                                                                                                                                                           |
| <a id="clip-7"></a>[CLIP-7](#clip-7)          | Import, validate and persist OpenScreen pointer sidecars per source asset                                                                                                                                                                                                                                                                                                             | [`e9f99fc`](https://github.com/mite404/clipper/commit/e9f99fce4a02be914b6f6d8cb387c152326d737b) | [CI 43762946342](https://github.com/mite404/clipper/actions/runs/43762946342); proven on synthetic fixtures only, see [Known limits](#known-limits)                                                                                                                                                                                                     |
| <a id="ref-1"></a>[REF-1](#ref-1)             | One `src/stage.ts` for mask rects, cover crop and zoom projection; preview pan pinned (#1, #17)                                                                                                                                                                                                                                                                                       | [`4cc0761`](https://github.com/mite404/clipper/commit/4cc07610fb7f027324aab54287f2c1f1c7bc72a0) | [CI 43763390689](https://github.com/mite404/clipper/actions/runs/43763390689); preview screenshots byte-identical before and after                                                                                                                                                                                                                      |
| <a id="ref-3"></a>[REF-3](#ref-3)             | `drawFrame` seam in the exporter, pooled decode canvases (#26, #25)                                                                                                                                                                                                                                                                                                                   | [`64e5578`](https://github.com/mite404/clipper/commit/64e5578c79f0195a3170538048efe6ce99c4b983) | [CI 43763669090](https://github.com/mite404/clipper/actions/runs/43763669090); pooled and unpooled decode matched on 180 frames                                                                                                                                                                                                                         |
| <a id="verify-2"></a>[VERIFY-2](#verify-2)    | Retired `control-clipper.sh`; feature files use `verify.mjs`; story tally removed                                                                                                                                                                                                                                                                                                     | [`de27f06`](https://github.com/mite404/clipper/commit/de27f06c96166824c174dc82a9a8f8c214ca2029) | [CI 43764263393](https://github.com/mite404/clipper/actions/runs/43764263393); the three helper defects were reproduced first                                                                                                                                                                                                                           |
| <a id="ref-4"></a>[REF-4](#ref-4)             | Zoom limits and overlap rule in `src/timeline-model.ts`, enforced by the project parser; ramp and pan pinned (#8, #10, #12)                                                                                                                                                                                                                                                           | [`43cb368`](https://github.com/mite404/clipper/commit/43cb368907755de265ea2a830761754965cb267d) | [CI 43764564172](https://github.com/mite404/clipper/actions/runs/43764564172)                                                                                                                                                                                                                                                                           |
| <a id="ref-6"></a>[REF-6](#ref-6)             | Playback gate fails on a stall: worst frame and worst long task bounded at 500 ms (#16)                                                                                                                                                                                                                                                                                               | [`7fa2e43`](https://github.com/mite404/clipper/commit/7fa2e4379593254a8d77c9d54512a8d2b7d1d003) | [CI 43765213526](https://github.com/mite404/clipper/actions/runs/43765213526); an injected 2-second freeze failed all five repetitions                                                                                                                                                                                                                  |
| <a id="ref-7"></a>[REF-7](#ref-7)             | Ctrl, Cmd and Alt chords no longer split, delete, seek or drive the transport (#7)                                                                                                                                                                                                                                                                                                    | [`de0d059`](https://github.com/mite404/clipper/commit/de0d0591b58bd3e6fa6e5245beeb5388c5601896) | [CI 43765744937](https://github.com/mite404/clipper/actions/runs/43765744937)                                                                                                                                                                                                                                                                           |
| <a id="clip-8"></a>[CLIP-8](#clip-8)          | Smooth, trim-aware cursor in preview and export, with raw mode, size and visibility                                                                                                                                                                                                                                                                                                   | [`1195cda`](https://github.com/mite404/clipper/commit/1195cdaea0d94d99b9181c896a6b2264473216c0) | [CI 43766525052](https://github.com/mite404/clipper/actions/runs/43766525052); decoded cursor pixels checked across a cut, source offset, crop, swap and zoom; synthetic fixtures only                                                                                                                                                                  |
| <a id="clip-9"></a>[CLIP-9](#clip-9)          | Editable zooms generated from recorded left clicks; each keeps a source anchor, so it stays with its footage through splits and ripple edits; manual zooms win collisions and survive regeneration                                                                                                                                                                                    | [`f3b3021`](https://github.com/mite404/clipper/commit/f3b30213dad8ee8d3a367d537b8cd507a6be7513) | [CI 43771222108](https://github.com/mite404/clipper/actions/runs/43771222108); 107 unit tests, preview and decoded-export focus agree, generated zooms survive save and reopen; synthetic fixtures only                                                                                                                                                 |
| <a id="clip-10"></a>[CLIP-10](#clip-10)       | Smooth follow framing: a zoom can follow the recorded cursor with a dead zone, the same in preview and export; generated zooms default to Focused                                                                                                                                                                                                                                     | [`c2a6be0`](https://github.com/mite404/clipper/commit/c2a6be013164ba289944551f1eaf704c155a9fb1) | [CI 43778344010](https://github.com/mite404/clipper/actions/runs/43778344010); the worker reports 112 unit tests, 35 browser checks including decoded-frame follow cases, and 10 of 10 throttled playback runs; synthetic fixtures only                                                                                                                 |
| <a id="ref-8"></a>[REF-8](#ref-8)             | Mouse-marking mode ends when its zoom is removed, undone or deselected (#6)                                                                                                                                                                                                                                                                                                           | [`fd16d0f`](https://github.com/mite404/clipper/commit/fd16d0fe0e3f8330464266b22d88bff226cb8cb7) | [CI 43766869839](https://github.com/mite404/clipper/actions/runs/43766869839)                                                                                                                                                                                                                                                                           |
| <a id="ref-9"></a>[REF-9](#ref-9)             | Timecode, playhead and frame buttons match the frame the player holds after a pause (#21)                                                                                                                                                                                                                                                                                             | [`7661750`](https://github.com/mite404/clipper/commit/7661750f49e4283266311365ad93238bfc079584) | [CI 43767536538](https://github.com/mite404/clipper/actions/runs/43767536538); reproduced first: readout showed frame 6 while the player held frame 9                                                                                                                                                                                                   |
| <a id="ref-10"></a>[REF-10](#ref-10)          | Trim grip: a click commits nothing; a release trims the clip as it is then (#15, #38)                                                                                                                                                                                                                                                                                                 | [`6eef40b`](https://github.com/mite404/clipper/commit/6eef40b5cd1690d56efec9322ab5a820408e1e85) | [CI 43768432875](https://github.com/mite404/clipper/actions/runs/43768432875); both defects reproduced first                                                                                                                                                                                                                                            |
| <a id="ref-15"></a>[REF-15](#ref-15)          | Export audio mix cost follows clip count, not decoded packet count (#2)                                                                                                                                                                                                                                                                                                               | [`f9ef3c3`](https://github.com/mite404/clipper/commit/f9ef3c3e2397a09f0ba9ce668127de99f47affd4) | [CI 43769770918](https://github.com/mite404/clipper/actions/runs/43769770918); 40 s of Opus mixes in 0.3 s, was 13 s; audio matches the old build and an ffmpeg render equally                                                                                                                                                                          |
| <a id="ref-11"></a>[REF-11](#ref-11)          | A multi-file import names every file it could not read; the demo download gives up after 15 s and frees what it loaded (#9, #37)                                                                                                                                                                                                                                                      | [`30e4254`](https://github.com/mite404/clipper/commit/30e4254f2e66b820264b9b3486096b4623bcc0ab) | [CI 43771794337](https://github.com/mite404/clipper/actions/runs/43771794337); both defects reproduced first                                                                                                                                                                                                                                            |
| <a id="ref-12"></a>[REF-12](#ref-12)          | The logo no longer reloads the page; the browser is asked to confirm a reload or tab close with unsaved edits or a running export; Open project asks before replacing unsaved edits (#23)                                                                                                                                                                                             | [`4115ac6`](https://github.com/mite404/clipper/commit/4115ac644972ca0fe8e74731ff5845d229746863) | [CI 43772612477](https://github.com/mite404/clipper/actions/runs/43772612477); the handler is tested through a `beforeunload` event, the browser's own prompt was not observed (headless Chromium shows none)                                                                                                                                           |
| <a id="ref-13"></a>[REF-13](#ref-13)          | CI compares the fallow baseline with the commit `main` held before the push, and no run is cancelled by a later push (#4)                                                                                                                                                                                                                                                             | [`5ba3392`](https://github.com/mite404/clipper/commit/5ba3392f1017aee08e49d075d9ae6f8b79b0c052) | [CI 43772931127](https://github.com/mite404/clipper/actions/runs/43772931127); in a throwaway clone the old base passed a two-commit push that grew the baseline, the new base failed it                                                                                                                                                                |
| <a id="ref-17"></a>[REF-17](#ref-17)          | Export pixel gate scores the camera and screen panels separately, and a new test checks the exact source frame of every exported frame on both tracks (#31)                                                                                                                                                                                                                           | [`4ed307d`](https://github.com/mite404/clipper/commit/4ed307dccc0b753a676612d8e09d47cb43ef73af) | [CI 43776617847](https://github.com/mite404/clipper/actions/runs/43776617847); five deliberately broken exporters fail it, two of which the old gate passed                                                                                                                                                                                             |
| <a id="ref-19"></a>[REF-19](#ref-19)          | One browser journey for Delete, Backspace, the undo chord, Space, seek clamping at both ends and the overlapping-zoom refusal (#20)                                                                                                                                                                                                                                                   | [`d4174be`](https://github.com/mite404/clipper/commit/d4174beacc53d133c4fdc99e444a5635f7f2de68) | [CI 43777308249](https://github.com/mite404/clipper/actions/runs/43777308249); eight deliberately broken editors fail it; the 50-step undo limit is left for REF-16                                                                                                                                                                                     |
| <a id="ref-16"></a>[REF-16](#ref-16)          | A slider drag or a held key is one undo step, and an edit that changes nothing is not a step, so one drag no longer pushes earlier edits out of the 50-step history (#5)                                                                                                                                                                                                              | [`8fd4ae6`](https://github.com/mite404/clipper/commit/8fd4ae6ef9f92fa0e02609cdf7eaf052e1a23c58) | [CI 43780934384](https://github.com/mite404/clipper/actions/runs/43780934384); 119 unit tests and 37 browser checks; nine of ten deliberately broken versions failed the tests, the tenth led to one more test case; the 50-step limit now has a browser test                                                                                           |
| <a id="ref-21"></a>[REF-21](#ref-21)          | Save refuses a project its file cannot hold (375 MB of media on the timeline) before reading any media, and import warns when the library passes that size; media no clip uses is left out and named when it cannot be read or does not fit; importing a file named like a source that can no longer be read repairs that source in place; export names the unreadable file (#3, #28) | [`319cf38`](https://github.com/mite404/clipper/commit/319cf386c451d7b1e7fdc05ebde8c410add86703) | [CI 43783622890](https://github.com/mite404/clipper/actions/runs/43783622890); #28 was reproduced in Chromium for the first time: changing an imported file's modification time made Save fail although no clip used it; 122 unit tests and 39 browser checks, one with a 400 MB sparse file; seventeen deliberately broken versions all fail the tests |
| <a id="capture-1"></a>[CAPTURE-1](#capture-1) | Manual OpenScreen sidecar checks under `tests/openscreen/`, not part of CI                                                                                                                                                                                                                                                                                                            | [`d72d33c`](https://github.com/mite404/clipper/commit/d72d33c05d1a2213f6d0b6e662fb6907c6a425c1) | [CI 43776958967](https://github.com/mite404/clipper/actions/runs/43776958967); pushed by the Mac capture thread at the owner's request, outside the push slot and with the pre-commit hook skipped (see REF-25); inspected afterwards: four text files, no capture data                                                                                 |
| <a id="ref-25"></a>[REF-25](#ref-25)          | `src/timeline.ts` is now `src/timeline-model.ts`, so no two files differ only by case; CI refuses such names                                                                                                                                                                                                                                                                          | [`90cf4b4`](https://github.com/mite404/clipper/commit/90cf4b43de90d18092803fa9e7a947cc739c9723) | [CI 43779257417](https://github.com/mite404/clipper/actions/runs/43779257417); with imports resolved as a case-insensitive disk resolves them, the old tree gives the Mac's TS2305 and TS1149 errors and the new tree gives none; not yet rerun on the Mac itself                                                                                       |

CLIP-3 is manual fixed-point zoom. It does not satisfy CLIP-7 to CLIP-10. BOOT-1 is on `main`.
Whether it runs for new orbs now that they clone GitHub has not been checked.

## Queue

Top to bottom is the order of work. Correctness and unblocking work precede dependent features. One
queue owner coordinates disjoint implementation lanes; pushes are serialized and await exact-SHA CI.

### Mouse tracking and automatic zoom

| Ticket ID                                         | Title                                                                        | Risk   | Status   | Owner                 | Needs   |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ------ | -------- | --------------------- | ------- |
| <a id="clip-11"></a>[CLIP-11](tickets/CLIP-11.md) | Cursor appearance and behavior: style, idle hide, loop return, shake removal | Medium | Partial  | Cursor implementation | nothing |
| <a id="clip-7b"></a>[CLIP-7b](#clip-7b)           | Screen Studio `mousemoves`/`mouseclicks` metadata import                     | Medium | Decision | Queue implementation  | D-4     |

CLIP-11's preserved first unit covers recorded, fixed and Touch styles, idle hiding, shake removal,
and stop or return endings. Its three-way integration onto `9b64f563` passes 127 unit and all 39
browser checks, including decoded cursor exports and local save/reopen. Six new behavior assertions
failed on the unchanged implementation first. This core unit is delivered at
[`7b23be8`](https://github.com/mite404/clipper/commit/7b23be80ff417e061d5c74ac127759b20a5b80ef),
with [green CI](https://github.com/mite404/clipper/actions/runs/43786045477). Source-time segment
hiding is delivered at
[`bea0526`](https://github.com/mite404/clipper/commit/bea052601a0181080956f6ad08b93bf1df419311),
with [green CI](https://github.com/mite404/clipper/actions/runs/43794298710). Its half-open ranges
apply to every use of a source, independently of telemetry offset. The worker verified 129 units, 39
browser checks and 10 isolated performance checks. Shape stabilization is delivered at
[`a6f0448`](https://github.com/mite404/clipper/commit/a6f0448fbd93f749187f3a40e6a0bc45d8d74103),
with [green CI](https://github.com/mite404/clipper/actions/runs/43797731005). Its optional 100 ms
shape debounce preserves interaction shapes and resets across missing/disconnected tracking. The
worker verified 131 units, 40 browser checks and ten isolated performance checks with stabilization
enabled. Movement rotation is delivered at
[`e3428ee`](https://github.com/mite404/clipper/commit/e3428eeb4b88fb44bf23dcafc1dcf16a08167353),
with [green CI](https://github.com/mite404/clipper/actions/runs/43800623105). Default-off rotation
uses a deterministic 100 ms horizontal lookback, capped at ±12°, around the scaled recorded hotspot.
The worker verified 133 units, 43 browser checks and ten isolated performance checks with rotation
and stabilization enabled. Speed styles are delivered at
[`bd6120f`](https://github.com/mite404/clipper/commit/bd6120fa070f1386fa92324e7459cea459918178),
with [green CI](https://github.com/mite404/clipper/actions/runs/43805205300), independently checked
by the queue owner. Smooth retains the existing sampler; Medium and Rapid traverse the final 75% and
50% of each sample interval; None steps and Raw bypasses styling. The worker verified 135 units,
seven helper checks, 44 browser checks and ten isolated performance checks. Its cursor paths are
released. Full CLIP-11 remains partial for video-wide ending parity and real-Mac qualification.
Endings apply per trimmed clip, not per whole video. The 1 s idle delay, 0.5% shake radius, 0.5 s
ending duration, 100 ms shape threshold and speed-style fractions are engineering defaults.

The expanded cursor-control layout is not accepted UX. On 2026-11-16, the owner said: "this UI makes
no sense. options for the cursor animation probably need to live in the inspector to still allow
room for the sequence timeline." Delivered behavior and passing gates do not constitute layout
acceptance.
[Research](https://ampcode.com/threads/T-0ddac938-5168-453a-a1f3-ec16bba82ba9)
owns identifying recorded-metadata options and recommending inspector placement before cursor UI
implementation is assigned. This feedback grants no new implementation scope and does not block
disjoint work.

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
- Engineering choices in REF-16 and REF-21 as shipped, not owner decisions. REF-16: changes to the
  same numeric values less than 800 ms apart are one undo step. REF-21: a re-import repairs an
  unreadable source by file name (the other remedy in #28, copying every file into memory at import,
  was not taken); Save still embeds unused library media whenever it fits and can be read, so what a
  reopened library contains is unchanged in the normal case; the limit is 375 MB of source bytes,
  which leaves an unmeasured 36 million characters for the edit and cursor sidecars.
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

### Approved tooltip pilot after CLIP-11

| Ticket ID                      | Title                                | Status                                          | Owner                                                                            | Needs   |
| ------------------------------ | ------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| <a id="ui-1"></a>[UI-1](tickets/UI-1.md) | Shared IconButton tooltip via ui-sdk | In progress; resumed after green speed-style CI | [Sol medium](https://ampcode.com/threads/T-66876f27-839b-4898-be45-5614e480a7cd) | nothing |

The owner approved this one-component pilot after CLIP-11. It replaces shared `IconButton`'s native
`title`, not all native controls. Reserve `src/components.tsx`'s IconButton/import hunk, a scoped
tooltip block and initial `@layer ui-sdk;` in `src/styles.css`, `package.json`, `package-lock.json`,
new `src/IconButton.stories.tsx`, `tests/icon-button.spec.ts` and `docs/tickets/UI-1.md`. No App,
Timeline, cursor, Remotion, `Editor.stories.tsx`, README or test-config edits are granted. REF-18
owns configuration/CLI/README paths, which do not overlap.

Pin `@ui-sdk/react` and `@ui-sdk/core` to exactly `0.1.0-beta.5` with npm `--save-exact`. Do not
import `web.css`. Preserve native button semantics, disabled behavior and accessible names without a
duplicate tooltip announcement. Use owned dark styling, transform origin `var(--transform-origin)`,
125 ms opacity/scale transitions with `cubic-bezier(0.23,1,0.32,1)` from scale 0.97, no transition
for `[data-instant]`, and fade only under reduced motion.

Gate on all strict checks, actual same-base main-chunk gzip delta ≤35 KB, and inspected hover,
focus, group-instant and reduced-motion captures plus a pointer-sweep recording. Report total
production JS/CSS delta too. If release-age policy blocks installation, stop and ask the owner;
never weaken or bypass it. No dependency is installed or push authorized by this queue entry. The
initial path grant preceded the ordering clarification: the worker reports two exact packages
installed without a policy refusal or bypass, with only package/lock edits preserved locally.
Source/CSS/story/test implementation resumed after `bd6120f` passed exact-SHA CI. Nothing from UI-1
is pushed. [Approval research](https://ampcode.com/threads/T-85e2e0a7-9485-4657-9f22-48ae0622da7b)
and
[recommendation](https://ampcode.com/artifacts/ui-sdk-emil-design-guidance-for-clipper-research-recommendat-2cddfaeb-7327-41d5-8037-d4d685b2a035)
remain linked evidence, not another operational queue.

### Not blocking mouse work

Take these when a push slot is free and the files do not overlap an in-flight ticket. Owner is the
queue thread unless stated.

| Ticket ID                                      | Title                                                                               | Risk   | Status                                                                                                                                                                              | Findings            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| <a id="ref-14"></a>[REF-14](tickets/REF-14.md) | One constant each for music gain and peak rate; blob-URL test asserts no fetch      | Small  | Delivered at [afe4c60](https://github.com/mite404/clipper/commit/afe4c605f551c979083297b0e0d5d24f4a32a484); [green CI](https://github.com/mite404/clipper/actions/runs/43806193468) | #32, #33, #34       |
| <a id="ref-18"></a>[REF-18](tickets/REF-18.md) | Editor journeys also run against the production bundle                              | Medium | Delivered at [7373115](https://github.com/mite404/clipper/commit/7373115e9a501312bea5a4192a101094dce5d08f); [green CI](https://github.com/mite404/clipper/actions/runs/43803496212) | #18                 |
| <a id="ref-20"></a>[REF-20](tickets/REF-20.md) | Rewind and export progress re-render at 10 Hz                                       | Medium | In progress in T-0f030227; baseline measurement first, no push grant                                                                                                                  | #36                 |
| <a id="ref-26"></a>[REF-26](tickets/REF-26.md) | Keep footer errors and warnings visible without scrolling                           | Small  | Delivered at [4535665](https://github.com/mite404/clipper/commit/45356659c892b3607230778270c5d4eb16786c3c)                                                                          | found during REF-21 |
| <a id="ref-22"></a>[REF-22](#ref-22)           | Project container without one giant JSON string (format version 3, reads version 2) | Large  | Proposal                                                                                                                                                                            | #3                  |
| <a id="ref-23"></a>[REF-23](#ref-23)           | Zooms anchored to source time and source coordinates                                | Large  | Decision D-1                                                                                                                                                                        | #14, #24            |
| <a id="ref-24"></a>[REF-24](#ref-24)           | Edit operations in a tested reducer outside `App.tsx`                               | Large  | Proposal; only if REF-19 proves too thin                                                                                                                                            | #20                 |

REF-22 and REF-23 change saved data, so each needs the owner's go-ahead before code.

### Review follow-ups without a delivery claim

These rows make the review's informational recommendations explicit. They are proposals, not new
confirmed defects. Optional cleanup does not delay features. The coverage table below identifies the
original note for every row.

| Ticket ID                                            | Title                                                            | Risk   | Status                                                                                                                                                                              | Needs                                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| <a id="doc-2"></a>[DOC-2](#doc-2)                    | Audit ticket coverage, IDs and delivery evidence                 | Small  | Delivered at [a8078ff](https://github.com/mite404/clipper/commit/a8078ffb4d737bf028bd0b864f31125dbd510263), [green CI](https://github.com/mite404/clipper/actions/runs/43789649834) | nothing                                                                                                 |
| <a id="ref-27"></a>[REF-27](#ref-27)                 | Qualify MP4 AVC and AAC export                                   | Medium | Blocked                                                                                                                                                                             | an encoding-capable browser or runner                                                                   |
| <a id="ref-28"></a>[REF-28](#ref-28)                 | Define missing decoded-frame behavior                            | Medium | Proposal                                                                                                                                                                            | reproduce null and early-end decoder cases                                                              |
| <a id="ref-29"></a>[REF-29](#ref-29)                 | Assess complexity-score baseline blind spots                     | Small  | Deferred proposal                                                                                                                                                                   | only if count-only baseline permits real growth                                                         |
| <a id="ref-30"></a>[REF-30](#ref-30)                 | Progress and cancellation for import, Open and Save              | Large  | Proposal                                                                                                                                                                            | define bounded-memory and cancellation behavior with REF-22                                             |
| <a id="ref-31"></a>[REF-31](#ref-31)                 | Prevent hidden-tab rewind jumps and held-Space toggles           | Small  | Ready                                                                                                                                                                               | reproduce through actual transport                                                                      |
| <a id="ref-32"></a>[REF-32](#ref-32)                 | Correct source-preview playback error and busy lifecycle         | Medium | Ready                                                                                                                                                                               | reproduce pause, switch and export races                                                                |
| <a id="ref-33"></a>[REF-33](#ref-33)                 | Qualify download URL lifetime outside Chromium                   | Medium | Blocked                                                                                                                                                                             | another supported WebCodecs browser                                                                     |
| <a id="ref-34"></a>[REF-34](#ref-34)                 | Remove Player listener lifetime assumptions                      | Small  | Deferred proposal                                                                                                                                                                   | reproduce a listener lifecycle defect first                                                             |
| <a id="ref-35"></a>[REF-35](#ref-35)                 | Close edit and project-boundary test gaps                        | Medium | Ready                                                                                                                                                                               | asymmetric ripple, fractional trim, parser bounds, source-track rules, save snapshot and chunking cases |
| <a id="ref-36"></a>[REF-36](#ref-36)                 | Prove delivery recovery and individual audio mute                | Medium | Ready                                                                                                                                                                               | UI cancel and retry; failed export and partial-open recovery; one muted track at a time                 |
| <a id="ref-37"></a>[REF-37](#ref-37)                 | Measure video cadence, rewind and scrub with large telemetry     | Medium | Ready                                                                                                                                                                               | extend the existing performance gate, not its thresholds                                                |
| <a id="verify-3"></a>[VERIFY-3](tickets/VERIFY-3.md) | Bring the feature map in line with delivered motion and controls | Small  | Delivered at [f76a702](https://github.com/mite404/clipper/commit/f76a702f85a0bcdf64f7c8bc2b0726823c447003); [green CI](https://github.com/mite404/clipper/actions/runs/43798560663) | frame-step and zoom-field journeys; current cursor and follow coverage                                  |
| <a id="clip-9b"></a>[CLIP-9b](#clip-9b)              | Resize zoom intervals with timeline edge handles                 | Small  | Proposal                                                                                                                                                                            | CLIP-9 core; preserve inspector controls and source anchors                                             |

CLIP-9b retains the reference inventory's remaining zoom-edge interaction. `Timeline.tsx` renders
zoom intervals as selection buttons only; inspector start/duration fields do not supply timeline
edge dragging. CLIP-9's delivered row describes generation, not completion of this reference extra.

## Delta audit, 2026-11-16

Planning and audited GitHub main:
[`7b23be8`](https://github.com/mite404/clipper/commit/7b23be80ff417e061d5c74ac127759b20a5b80ef).
Compared with reviewed baseline
[`5a9bc1f`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c). The
audit used `git log`, ticket commit diffs, aggregate name-status and narrow test hunks. GitHub's 40
main CI runs from the baseline through this head all report success, including each delivered row's
SHA. The latest [CI run](https://github.com/mite404/clipper/actions/runs/43786045477) is green. No
new whole-codebase review or expensive reviewer was run.

All **34 retained findings** have ticket or owner-decision mappings in the historical
[ranked table](refactor/refactor01.md#ranked-findings): 31 actionable and three decision findings.
Those mappings resolve to this list. That did not previously mean every informational recommendation
had a queued disposition. The following **33 notes** now do too. R, T and A are source-note labels
in original order, not ticket IDs or new queues.

The planning audit confirmed 19 delivered REF tickets. REF-18 is now delivered at `7373115`, with
green exact-SHA CI, 133 units, seven CLI checks, repeated 43/43 isolated browser runs and a 43/43
CI-mode run reported by its worker. Production UI journeys and dev-only fixture checks remain
separate. REF-14 is delivered at `afe4c60` with green exact-SHA CI; REF-20 is in progress. REF-22
remains a container proposal, REF-23 a decision, and REF-24 conditional cleanup. REF-19 already
provides public behavior coverage, so REF-24 is not a feature prerequisite. CLIP-11's core is on
main, as are segment hiding, shape stabilization, rotation, and speed styles. Full CLIP-11 remains
partial as described above. CLIP-38 is also partial: REF-12 supplies only its unsaved-close warning,
not recent projects or Save-as.

REF-26's three-line sticky-footer fix passes 129 units and all 39 browser checks in
`verification/all-2DvU6O`. Unchanged main and the fixed build each passed ten isolated performance
checks, including five cursor-follow repetitions, with the strict below-100-ms gate unchanged. The
earlier single p95 failure at exactly 100 ms remains unexplained; these controlled runs show no
reproduced regression, not a claimed performance fix. Default, error, narrow and scrolled states
were inspected, including real-pointer access to the bottom track controls. Exact-SHA
[CI 43796470502](https://github.com/mite404/clipper/actions/runs/43796470502) passed for
[`4535665`](https://github.com/mite404/clipper/commit/45356659c892b3607230778270c5d4eb16786c3c).

### Informational recommendation coverage

Dispositions use commit diffs and existing receipts, not a fresh mutation or browser audit. "Open"
means the exact recommended edge case is not established by those receipts. Related work does not
imply the entire recommendation is done. The full source wording stays in the historical
[Coverage](refactor/refactor01.md#coverage) and
[Agent-Native Gaps](refactor/refactor01.md#agent-native-gaps) sections.

| Ticket mapping                                          | Source | Recommendation                                       | Disposition and delta evidence                                                            |
| ------------------------------------------------------- | ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [CLIP-8](#clip-8), [REF-37](#ref-37)                    | R1     | Indexed pointer lookup and large-fixture time budget | Binary lookup delivered in `1195cda`; explicit 200k-sample budget still open              |
| [REF-27](#ref-27)                                       | R2     | MP4 AVC and AAC qualification                        | Open; only WebM is proven                                                                 |
| [REF-25](#ref-25)                                       | R3     | Case-insensitive timeline filenames                  | Delivered `90cf4b4`; actual Mac rerun still unverified                                    |
| [REF-19](#ref-19), [REF-35](#ref-35), [REF-23](#ref-23) | R4     | Playhead and zoom bounds after shortening            | Explicit seek clamps delivered; edit-induced clamp and stranded zoom cases remain open    |
| [REF-28](#ref-28)                                       | R5     | Missing or early-ended decoded frames                | Open; exporter still omits missing samples                                                |
| [REF-29](#ref-29)                                       | R6     | Count-only Fallow baseline blind spots               | Deferred; REF-13 fixed comparison base, not score tracking                                |
| [REF-30](#ref-30)                                       | R7     | Import, Open and Save progress and cancel            | Open; REF-21 limits size but does not add cancellation                                    |
| [REF-31](#ref-31)                                       | R8     | Hidden-tab rewind and held Space                     | Open; no visibility or repeat guard in relevant delta                                     |
| [REF-32](#ref-32)                                       | R9     | SourceMonitor play rejection and busy lifecycle      | Open; no corresponding repair in delta                                                    |
| [REF-33](#ref-33)                                       | R10    | Download lifetime outside Chromium                   | Open; Chromium downloads alone are proven                                                 |
| [REF-34](#ref-34)                                       | R11    | Player listener attachment assumptions               | Deferred; effect still depends on `hasAssets`                                             |
| [REF-35](#ref-35)                                       | T1     | Cross-track ripple mutation survivors                | Open; existing voice fixture begins before insertion                                      |
| [REF-35](#ref-35)                                       | T2     | Fractional trim rounding                             | Open; current trim assertions use integer deltas                                          |
| [REF-4](#ref-4), [REF-35](#ref-35)                      | T3     | Parser zoom and layout bounds                        | Partial; overlap and short duration added in `43cb368`; remaining boundary rows open      |
| [REF-35](#ref-35)                                       | T4     | Camera and music source-track validation             | Open; no new assertions for these arms in delta                                           |
| [REF-21](#ref-21), [REF-35](#ref-35)                    | T5     | Save snapshot, validation and chunk-size assertions  | Partial; REF-21 added size preflight, not all original mutation survivors                 |
| [REF-36](#ref-36)                                       | T6     | Exactly one audio track muted                        | Open; existing test mutes both                                                            |
| [REF-36](#ref-36)                                       | T7     | Cancel export from UI, cleanup, retry                | Open; existing cancellation test calls renderer directly                                  |
| [REF-1](#ref-1), [CLIP-8](#clip-8), [CLIP-10](#clip-10) | T8     | Preview and exported geometry agree                  | Delivered shared stage `4cc0761`, decoded cursor `1195cda` and follow `c2a6be0` cases     |
| [REF-21](#ref-21), [REF-36](#ref-36)                    | T9     | Unreadable Save and Export UI recovery               | Partial; REF-21 names bad sources and tests repair; exact failed-export state case open   |
| [REF-36](#ref-36)                                       | T10    | Partial decode failure while opening valid project   | Open; malformed-project test stops before media decode                                    |
| [CLIP-10](#clip-10), [REF-37](#ref-37)                  | T11    | Performance beyond forward demo, video cadence       | Partial; focused follow case delivered, dropped video frames, rewind and scrub still open |
| [VERIFY-1](#verify-1)                                   | A1     | Focused commands select a fresh target               | Delivered `2bb8263`; isolated CLI and servers                                             |
| [VERIFY-1](#verify-1)                                   | A2     | Executable full-run prerequisites                    | Delivered `2bb8263`; builds and servers selected per journey                              |
| [D-2](#d-2)                                             | A3     | Branch and PR CI policy                              | Owner decision; direct-main CI remains default                                            |
| [VERIFY-2](#verify-2), [VERIFY-3](#verify-3)            | A4     | Exact local and CI gate documentation                | Partial; old entry points removed, current skill still omits shrink-only comparison flags |
| [VERIFY-1](#verify-1)                                   | A5     | Five unprofiled performance repetitions              | Delivered `2bb8263`; performance journey selects repeats and disables tracing             |
| [VERIFY-2](#verify-2)                                   | A6     | Wrong story count                                    | Delivered `de27f06`; stale tally removed                                                  |
| [VERIFY-1](#verify-1), [VERIFY-2](#verify-2)            | A7     | Doctor accepts missing-media HTML                    | Delivered new doctor `2bb8263`; obsolete helper removed `de27f06`                         |
| [VERIFY-1](#verify-1), [VERIFY-2](#verify-2)            | A8     | Stop strands state and doctor ignores saved port     | Superseded by isolated lifecycle; old stateful helper removed                             |
| [VERIFY-2](#verify-2)                                   | A9     | Exact test-title instructions incomplete             | Superseded by named journey selectors `de27f06`                                           |
| [VERIFY-1](#verify-1)                                   | A10    | Evidence cleanup loses previous runs                 | Delivered unique evidence directories `2bb8263`                                           |
| [VERIFY-3](#verify-3)                                   | A11    | Frame-step and zoom-field map and journeys           | Delivered tests and current feature map at `f76a702`; exact-SHA CI green                  |

### Ticket identity and local details

The leftmost linked **Ticket ID** is the stable identity. A review finding number, rank and source
note are not ticket IDs. The historical table's ticket mapping can list several tickets for one
finding, or repeat one ticket for several findings. It is not a second queue or a "remaining" count.
Existing IDs are never renumbered. Settled decisions retain their IDs too.

Current detailed briefs are in `docs/tickets/`, with filename and H1 equal to the ID. Their Status
sections link back here rather than duplicating delivery state. Historical delivered rows retain
their commit and evidence links. Proposals retain their scope here until selected. No Linear or
GitHub issues were created. There are no completion fractions because the older backlog did not
define consistent step denominators.

[Local ticket workflow](ticket-workflow.md) supplies actual preflight and delivery commands. The
five selected briefs cover CLIP-11, REF-14, REF-18, REF-20 and REF-26. Additional Ready rows need
their brief before assignment, not bulk template files for every historical ticket.

The reference artifact had useful material absent from the title-only master rows. Its revision 8 is
now preserved in [reference-features.md](reference-features.md): detailed motion acceptance, hotkey
and layout subcontrols, multicam/caption/program subfeatures, project/export/recording details,
native exclusions, original source links, capture alternatives and contract caveats. No unique
operational state remained there. After migration CI passed, the owner approved deletion and the
owning thread confirmed `deleted: true` for only the reference artifact on 2026-11-16. The separate
steel-thread acceptance and verification artifacts remain intact.

Run `node scripts/check-tickets.mjs` to check unique definitions, leftmost IDs, local detail links,
orphan references and all 34 finding plus 33 informational mappings. The check validates document
structure and coverage, not the truth of implementation or CI claims.

## Feature backlog after CLIP-11

Rows are proposals unless explicitly approved below. They come from the reference backlog, which
holds the source links, unless a subsection below names another source. The default order is
numeric, skipping rows with a gate. CLIP-25 has a separately approved one-feature implementation
trial. No complete feature here is delivered. CLIP-38 has a delivered warning subpart only.

| Ticket ID                                  | Title                                                                                                                          | Gate                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| <a id="clip-12"></a>[CLIP-12](#clip-12)    | Click sounds with volume                                                                                                       | CLIP-7; needs a licensed or original sound                            |
| <a id="clip-13"></a>[CLIP-13](#clip-13)    | Motion blur for cursor, zoom and pan                                                                                           | CLIP-10                                                               |
| <a id="clip-14"></a>[CLIP-14](#clip-14)    | Keystroke overlays                                                                                                             | No key-event source: OpenScreen sidecars carry pointer data only      |
| <a id="clip-15"></a>[CLIP-15](#clip-15)    | Audio scrub and reference hotkey parity                                                                                        | none                                                                  |
| <a id="clip-16"></a>[CLIP-16](#clip-16)    | Clip retiming and typing-segment speed-up                                                                                      | typing suggestions need key events                                    |
| <a id="clip-17"></a>[CLIP-17](#clip-17)    | Per-clip and whole-recording gain                                                                                              | REF-14                                                                |
| <a id="clip-18"></a>[CLIP-18](#clip-18)    | Command menu and custom shortcuts                                                                                              | REF-7                                                                 |
| <a id="clip-19"></a>[CLIP-19](#clip-19)    | Padding, proportions and arbitrary crop bounds                                                                                 | REF-1                                                                 |
| <a id="clip-20"></a>[CLIP-20](#clip-20)    | Background wallpaper, gradient, color, image, inset, shadow; the image part is scoped [below](#clip-20-still-image-background) | REF-1                                                                 |
| <a id="clip-21"></a>[CLIP-21](#clip-21)    | Output aspect ratios and responsive composition                                                                                | REF-1                                                                 |
| <a id="clip-22"></a>[CLIP-22](#clip-22)    | Camera hide, position, mirror, size, roundness                                                                                 | REF-1                                                                 |
| <a id="clip-23"></a>[CLIP-23](#clip-23)    | Timed camera layouts                                                                                                           | CLIP-22                                                               |
| <a id="clip-24"></a>[CLIP-24](#clip-24)    | Blur and redaction masks, highlights                                                                                           | REF-1                                                                 |
| <a id="clip-25"></a>[CLIP-25](tickets/CLIP-25.md) | Copy the current frame as a PNG image | Delivered at [6fa99af](https://github.com/mite404/clipper/commit/6fa99afb10c8df35427a0ce0120d82b370a0b1e0); [green CI](https://github.com/mite404/clipper/actions/runs/43807235930) |
| <a id="clip-26"></a>[CLIP-26](#clip-26)    | Multicam angles and per-speaker mixes                                                                                          | none                                                                  |
| <a id="clip-27"></a>[CLIP-27](#clip-27)    | Derived social clips from a timeline range                                                                                     | none                                                                  |
| <a id="clip-28"></a>[CLIP-28](#clip-28)    | Teaser, title sequence and program assembly                                                                                    | CLIP-27                                                               |
| <a id="clip-29"></a>[CLIP-29](#clip-29)    | Chapter markers                                                                                                                | none                                                                  |
| <a id="clip-30"></a>[CLIP-30](#clip-30)    | Interactive player bundle with separate synchronized outputs                                                                   | none                                                                  |
| <a id="clip-31"></a>[CLIP-31](#clip-31)    | Final Cut and After Effects interchange                                                                                        | none                                                                  |
| <a id="clip-31a"></a>[CLIP-31a](#clip-31a) | Premiere: prove a synthetic FCP7 XML import contract in a real Premiere                                                        | a real Premiere installation (D-9)                                    |
| <a id="clip-31b"></a>[CLIP-31b](#clip-31b) | Premiere: export an editable XML sequence with reviewed source paths                                                           | CLIP-31a; a push slot for its `App.tsx` change                        |
| <a id="clip-31c"></a>[CLIP-31c](#clip-31c) | Premiere: qualify the file Clipper downloads in a named Premiere build                                                         | CLIP-31b; a real Premiere installation (D-9)                          |
| <a id="clip-32"></a>[CLIP-32](#clip-32)    | Local transcription                                                                                                            | new dependency and model download need approval                       |
| <a id="clip-33"></a>[CLIP-33](#clip-33)    | Caption editor, SRT and VTT export                                                                                             | CLIP-32                                                               |
| <a id="clip-34"></a>[CLIP-34](#clip-34)    | Transcript-suggested edits                                                                                                     | CLIP-32                                                               |
| <a id="clip-35"></a>[CLIP-35](#clip-35)    | Editable Remotion graphics sequences                                                                                           | Remotion license check (D-5)                                          |
| <a id="clip-36"></a>[CLIP-36](#clip-36)    | Caption reconstruction from a flat video pair                                                                                  | CLIP-33                                                               |
| <a id="clip-37"></a>[CLIP-37](#clip-37)    | Batch rendering and reusable graphics library                                                                                  | CLIP-35                                                               |
| <a id="clip-38"></a>[CLIP-38](#clip-38)    | Save-as and recent projects; unsaved-close warning already delivered by REF-12                                                 | REF-22; remaining scope is a proposal                                 |
| <a id="clip-39"></a>[CLIP-39](#clip-39)    | Styling presets                                                                                                                | CLIP-19, CLIP-20                                                      |
| <a id="clip-40"></a>[CLIP-40](#clip-40)    | GIF, quality and frame-rate options, clipboard export                                                                          | REF-3                                                                 |
| <a id="clip-41"></a>[CLIP-41](#clip-41)    | Preview quality and power-saving modes                                                                                         | none                                                                  |
| <a id="clip-42"></a>[CLIP-42](#clip-42)    | Extract original screen, camera and audio tracks                                                                               | none                                                                  |
| <a id="clip-43"></a>[CLIP-43](#clip-43)    | Native Screen Studio package ingestion                                                                                         | needs a real package fixture (D-4)                                    |
| <a id="clip-44"></a>[CLIP-44](#clip-44)    | Hosted sharing links and timestamped comments                                                                                  | needs hosting and a product decision; conflicts with local-only today |
| <a id="clip-45"></a>[CLIP-45](#clip-45)    | Quick share, save and copy actions                                                                                             | CLIP-40                                                               |
| <a id="clip-46"></a>[CLIP-46](#clip-46)    | Browser recording of display, window, camera and audio                                                                         | product decision: OpenScreen covers recording today                   |
| <a id="clip-47"></a>[CLIP-47](#clip-47)    | Speaker-note teleprompter                                                                                                      | CLIP-46                                                               |
| <a id="clip-48"></a>[CLIP-48](#clip-48)    | iPhone and iPad capture, device frames                                                                                         | native capture; not possible in a browser orb                         |

### CLIP-20: still-image background

Scope and acceptance for the image part of CLIP-20, added on 2026-11-16. The
[reuse research thread](https://ampcode.com/threads/T-01a1ddd8-535c-7129-a7d7-9a0c28f41449) relayed
it as the owner's explicit request; the queue thread did not see the owner's message itself. Ticket
maintenance only: CLIP-20 keeps its place, its REF-1 gate and its other parts (wallpaper, gradient,
color, inset, shadow). Not started.

Outcome: import a local still image as the composition background. The file stays in the browser.

Accepted when:

- A background image can be chosen, replaced and removed.
- It fills the stage behind the screen and camera panels with an aspect-preserving cover fit.
- Preview and exported video place it the same way.
- Project save and reopen keep the background together with the media.
- An unsupported or corrupt image fails with a visible message and leaves the previous background in
  place.
- A replaced or removed background releases its object URL and decoded image.
- Checked with landscape, portrait and alpha-bearing images, and with export and save round trips.

First formats: PNG, JPEG and WebP, decoded by the browser.

Outside this ticket: animated images, still images as timeline clips, remote image URLs, and any
change to the original visual direction.

Reuse: adapt the `Image.decode()` and object-URL lifecycle from the owner's prototype,
[`src/routes/+page.svelte` lines 46 to 75](https://github.com/mite404/sequence-spear-fish/blob/4f646d2ab3ef91dbfacb1f19ba37e670bd7f39c5/src/routes/+page.svelte#L46-L75)
(decode first, swap only on success, revoke the superseded or failed blob URL). The queue thread
read those lines. Do not port its Svelte page or its compositor, which stretches every source to the
frame. The prototype has no license file; reuse rests on it being the owner's own repository.
Details are in the
[reuse research](https://ampcode.com/artifacts/clipper-reuse-research-95b08ad7-f0ce-477e-acbd-9e9da46d4319).

Facts about `main` that bear on it, read by the queue thread: the stage background is one fixed
color today (`drawFrame` in `src/export.ts`), `Edit` has no background field, and `src/media.ts`
reads video and audio only. Saving the background therefore adds to the project format, which is a
decision for the implementer to raise before code.

### CLIP-31a to CLIP-31c: Premiere XML export

Proposals from the
[Premiere XML design](https://ampcode.com/artifacts/premiere-xml-export-design-6703a309-dcf9-45cc-bfd4-fd84d677159a),
written by its [research thread](https://ampcode.com/threads/T-52bd93c4-0eb5-46f3-ae30-0d2ff60a23ff)
on 2026-11-16 at the owner's request, relayed by the Space. They narrow CLIP-31 to Premiere; CLIP-31
itself stays a proposal. Nothing is implemented, and no file has been opened in Premiere. No
compatibility is claimed until CLIP-31c passes.

The design recommends Final Cut Pro 7 XML (`<xmeml version="5">`, a `.xml` file), which Adobe
documents as a direct import. It rejects modern `.fcpxml`, which Adobe documents as needing
conversion first.

The owner confirmed FCP7 XML (`.xml`) as the interchange format on 2026-11-16, in the Space, which
relayed it; the queue thread did not see his message. He named Premiere, Avid, Pro Tools, Logic,
Cubase and Resolve as the applications he intends it to work with. That list is an intention, not a
compatibility claim, and nothing has been tested in any of them. CLIP-31a to CLIP-31c stay scoped to
Premiere and to one exporter; AAF, OMF and dialect conversion are separate workflows outside these
tickets.

What each vendor's documentation says, as read by the design thread (the queue thread did not
recheck it). Missing documentation is not proof that an import fails.

| Application         | Documented for FCP7 XML                                                         | Source                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Premiere Pro        | Direct import; modern FCPXML needs conversion                                   | [Adobe](https://helpx.adobe.com/premiere-pro/using/importing-xml-project-files-final.html)                                                                                           |
| DaVinci Resolve     | Import, documented separately from FCPXML                                       | [Resolve 21.1 manual](https://documents.blackmagicdesign.com/UserManuals/DaVinci_Resolve_21.1_Reference_Manual.pdf)                                                                  |
| Avid Media Composer | Not found; the checked documentation covers AAF                                 | [Avid](https://kb.avid.com/pkb/articles/en_US/Knowledge/How-to-export-an-AAF)                                                                                                        |
| Pro Tools 2025.12   | Not found; documents AAF and OMF sequence import                                | [Reference guide](https://resources.avid.com/SupportFiles/PT/Pro_Tools_Reference_Guide_2025.12.pdf)                                                                                  |
| Cubase Pro 15       | Not found; documents AAF and OMF audio import                                   | [Steinberg](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/exchanging_files_with_other_applications/exchanging_files_with_other_applications_aaf_files_c.html) |
| Logic Pro           | Unclear: documents Final Cut XML audio exchange without naming the FCP7 dialect | [Apple](https://support.apple.com/guide/logicpro/final-cut-pro-xml-files-lgcp9b2d2456/mac)                                                                                           |

| Ticket ID             | Outcome                                                                                                                                                                                                                                        | Needs                                                                                                   | Files                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [CLIP-31a](#clip-31a) | A synthetic XML fixture and the exact import contract Premiere accepts: cut frames, gaps, independent mono and stereo audio, mute, music gain, file paths, relinking after a move, duplicate file names, and which frame rates must be refused | A real Premiere installation; the design targets Premiere Pro 26.x on macOS and records the exact build | New `tests/interchange/` and `docs/premiere-xml.md`                                                                                   |
| [CLIP-31b](#clip-31b) | One downloaded XML that keeps the proven cuts and audio, with a dialog where the user reviews the path of every used source and acknowledges what is left out                                                                                  | CLIP-31a; a push slot                                                                                   | New `src/premiere-xml.ts`, `src/XmlExportDialog.tsx`, their tests and story, `tests/xml-export.spec.ts`; a small `src/App.tsx` action |
| [CLIP-31c](#clip-31c) | The file Clipper really downloads imports with the right media, cuts, audio and relink behavior in a named Premiere build                                                                                                                      | CLIP-31b; a real Premiere installation                                                                  | Extends `tests/interchange/`, `tests/xml-export.spec.ts`, `docs/premiere-xml.md`                                                      |

Limits the design states, which the tickets keep:

- The browser never learns a source file's path, only its name. The user supplies a media root and
  per-source paths; the XML references the originals and does not carry them. Moved files are
  relinked in Premiere.
- The first release is cuts and audio only. Panel layout, rounded masks, crops, the cursor, zooms
  and follow framing are left out, and the dialog says so. The imported sequence will not look like
  Clipper's preview.
- Only 30 fps constant-rate video with mono or stereo audio at first. Other rates and variable-rate
  sources are refused with the reason, not relabeled as 30 fps.
- The prototype holds an EDL plan and no exporter code, so what carries over is its rules
  (integer-frame timing, stable source identity, validate before download), not code.
- CLIP-31b does not touch `serializeProject`, `src/media.ts`, `src/export.ts` or the cursor modules,
  and does not change the saved project format.

Native-only Screen Studio settings (camera effects, notifications, Dock, licensing, diagnostics) are
inventoried in the reference backlog and are not Clipper tickets.

## Decisions for the owner

Work continues on the stated default until the owner says otherwise.

| Ticket ID                   | Title                          | Outcome                                                         |
| --------------------------- | ------------------------------ | --------------------------------------------------------------- |
| <a id="d-3"></a>[D-3](#d-3) | First capture route            | OpenScreen first; settled 2026-11-15                            |
| <a id="d-6"></a>[D-6](#d-6) | Hosted capture image retention | Thread deleted; hosted-file deletion not independently verified |

| Ticket ID                   | Title                                                                                                                                                                                                                                  | Default in force                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="d-1"></a>[D-1](#d-1) | Should zooms follow their footage (source time, source coordinates) instead of fixed timeline frames and mask percent? (#14, #24)                                                                                                      | CLIP-9 stores generated zooms with a source anchor; manual version-2 zooms keep today's behavior until REF-23 is approved                                                                                             |
| <a id="d-2"></a>[D-2](#d-2) | Should CI also run on pull requests, and unit tests in the pre-commit hook? (#35)                                                                                                                                                      | No change: direct pushes to `main` with post-push CI                                                                                                                                                                  |
| <a id="d-4"></a>[D-4](#d-4) | Provide a real Screen Studio project to build CLIP-7b and CLIP-43 against                                                                                                                                                              | Both stay parked; nothing is inferred from screenshots of file names                                                                                                                                                  |
| <a id="d-5"></a>[D-5](#d-5) | Check the Remotion license before commercial or team use                                                                                                                                                                               | Not checked                                                                                                                                                                                                           |
| <a id="d-7"></a>[D-7](#d-7) | CLIP-7 to CLIP-10 are on `main`: import a real OpenScreen recording into Clipper on the Mac, generate zooms, and check that the cursor, the zooms and the follow framing line up with the video                                        | Compatibility with real recordings stays unclaimed; work continues on synthetic fixtures                                                                                                                              |
| <a id="d-8"></a>[D-8](#d-8) | Three commits on public `main` carry a personal email address instead of the noreply address: `2bb8263` and `de27f06` (author and committer) and `e9f99fc` (committer). Rewrite `main` from `2bb8263` with a force-push to replace it? | Not rewritten: a force-push changes every later commit ID and needs the owner's approval. The old commits would stay fetchable on GitHub by ID until GitHub Support purges them. Both workers have fixed their config |
| <a id="d-9"></a>[D-9](#d-9) | CLIP-31a and CLIP-31c need someone to import files into a real Premiere Pro and report what it shows. Is Premiere installed on the Mac, and which version?                                                                             | CLIP-31a to CLIP-31c stay proposals; no Premiere compatibility is claimed                                                                                                                                             |

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
- Interchange format: FCP7 XML (`.xml`). The owner confirmed it in the Space on 2026-11-16, relayed
  to the queue thread. Which applications can open it is not settled; see
  [CLIP-31a to CLIP-31c](#clip-31a-to-clip-31c-premiere-xml-export).
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
  memory. One project file holds 375 MB of media: Save refuses more with a message naming the limit,
  and Open has the same ceiling (#3; REF-22 removes it).
- Export is exercised as WebM VP9/Opus only. The MP4 AVC/AAC branch has never run in CI or locally.
  REF-27 needs an encoding-capable browser or runner; macOS AAC remains unqualified.
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
