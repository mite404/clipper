# Clipper architecture decision log

Decisions that shape Clipper's architecture, design and data flow, in date order. `D-n` IDs come
from the "Decisions for the owner" table in `docs/master-tickets.md`. Commit links point at
`mite404/clipper` on GitHub.

## ADR-1: Editing and rendering stay in the browser

- Date: 2026-11-15
- Decision: Source media is decoded, edited and exported in the browser, with no upload and no
  account.
- Why: AGENTS.md says to keep source media private and processing local. No source gives a further
  reason.
- Commit: [5a9bc1f](https://github.com/mite404/clipper/commit/5a9bc1f) (baseline, no ticket)

## ADR-2: Playback and decoding use Remotion Player and Mediabunny

- Date: 2026-11-15
- Decision: The preview plays through Remotion Player, and media is decoded and encoded with
  Mediabunny.
- Why: unknown. The baseline adds both packages and the README names them, but no source says why
  they were chosen. The Remotion licence is open as D-5.
- Commit: [5a9bc1f](https://github.com/mite404/clipper/commit/5a9bc1f) (baseline, no ticket)

## ADR-3: A project is one explicit JSON download with media embedded

- Date: 2026-11-15
- Decision: Save writes one version 2 JSON file that embeds all media as base64. Open restores it
  locally. Nothing is saved to disk automatically, and nothing is relinked.
- Why: unknown for the format itself. The README says the file carries its media, so reopening needs
  no relinking. It also records the cost: about 33% overhead, fully buffered in memory.
- Commit: [5a9bc1f](https://github.com/mite404/clipper/commit/5a9bc1f) (baseline, no ticket)

## ADR-4: Complexity debt sits in a shrink-only Fallow baseline

- Date: 2026-11-15
- Decision: CI rejects new findings, stale baseline entries and baseline growth. Growth is measured
  against the commit main held before the push.
- Why: The README says the baseline records existing debt, not resolved findings. No source states
  why the baseline may only shrink.
- Commit: [5a9bc1f](https://github.com/mite404/clipper/commit/5a9bc1f) (baseline, no ticket)
  Comparison base: [5ba3392](https://github.com/mite404/clipper/commit/5ba3392) (REF-13)

## ADR-5: Editor journeys run through an isolated CLI that owns its servers

- Date: 2026-11-15
- Decision: `verify.mjs` runs real editor journeys on its own loopback ports and keeps diagnostic
  evidence. Performance sampling is separate from tracing and video capture.
- Why: The commit names the aims but gives no problem statement. Later, REF-18 says a green dev
  server test does not prove the built app runs its UI journeys.
- Commit: [2bb8263](https://github.com/mite404/clipper/commit/2bb8263) (VERIFY-1)

## D-1: Zooms stay pinned to the timeline

- Date: 2026-11-15 (raised), 2026-11-18 (decided)
- Decision: No. Hand-made zooms keep timeline frames and mask percent. REF-23 is closed. Generated
  zooms, which follow their source since CLIP-9, will be pinned to the timeline too.
- Why: A ripple insert moved the footage but not a manual zoom. A focus stored as mask percent
  changes meaning when the crop changes (review findings #14 and #24).
- Commit: [f702568](https://github.com/mite404/clipper/commit/f702568) (DOC-1 records D-1) Generated
  anchors: [f3b3021](https://github.com/mite404/clipper/commit/f3b3021) (CLIP-9). Pinning generated
  zooms:
  [5d32e36](https://github.com/mite404/clipper/commit/5d32e364a6f6e0b36b2da810b447316f438f75f7)
  (REF-54).

## D-2: Should CI run on pull requests, and should unit tests run in the pre-commit hook?

- Date: 2026-11-15
- Decision: No change. CI runs on direct pushes to `main`, and the pre-commit hook does not run unit
  tests.
- Why: unknown. The record gives the answer only. README documents main-only CI as the design.
- Commit: [f702568](https://github.com/mite404/clipper/commit/f702568) (DOC-1 records D-2)

## D-3: Which capture route comes first?

- Date: 2026-11-15
- Decision: OpenScreen is the first capture route. A custom native recorder waits unless validation
  disproves OpenScreen.
- Why: The owner wants the native cursor left out, plus timestamped positions and clicks. CSS cursor
  hiding cannot capture screen-wide, so OpenScreen is reused. The owner's own message settled it on
  2026-11-15.
- Commit: [f702568](https://github.com/mite404/clipper/commit/f702568) (DOC-1 records D-3), settled
  in [bf14db5](https://github.com/mite404/clipper/commit/bf14db5) (no ticket)

## D-4: Is a real Screen Studio project needed for CLIP-7b and CLIP-43?

- Date: 2026-11-15
- Decision: Open. CLIP-7b and CLIP-43 stay parked, and nothing is inferred from screenshots or file
  names.
- Why: The record says the work needs a real package fixture. Synthetic OpenScreen fixtures do not
  satisfy it.
- Commit: [f702568](https://github.com/mite404/clipper/commit/f702568) (DOC-1 records D-4)

## D-5: The Remotion licence is acceptable

- Date: 2026-11-15 (raised), 2026-11-18 (decided)
- Decision: Clipper is for the owner's personal use, so the Remotion licence applies without a
  company licence. Remotion graphics (CLIP-35, then CLIP-37) are unblocked.
- Why: README says licensing must be checked before commercial or team use. Neither applies.
- Commit: [f702568](https://github.com/mite404/clipper/commit/f702568) (DOC-1 records D-5)

## ADR-6: Preview, Copy frame and export share one geometry and drawing path

- Date: 2026-11-15
- Decision: Timeline-to-source time, stage geometry and per-frame drawing live in shared modules
  that preview, Copy frame and export all use.
- Why: A trim-aware cursor needs preview and export to agree on source time. The preview, exporter
  and mouse target each kept a copy of the 1280x720 mask table.
- Commit: [e2ad4b8](https://github.com/mite404/clipper/commit/e2ad4b8) (REF-2), then
  [4cc0761](https://github.com/mite404/clipper/commit/4cc0761) (REF-1) and
  [64e5578](https://github.com/mite404/clipper/commit/64e5578) (REF-3)

## ADR-7: Cursor data is a per-source sidecar kept in source time

- Date: 2026-11-15
- Decision: OpenScreen sidecars attach to each source asset, in source time. No clock correction is
  applied, and the offset defaults to 0.
- Why: The clock offset between video and sidecar was not measured when CLIP-7 landed. A Mac capture
  thread later measured no drift on one take. The queue has not reproduced that.
- Commit: [e9f99fc](https://github.com/mite404/clipper/commit/e9f99fc) (CLIP-7)

## ADR-8: Zoom limits and overlap rules are enforced where projects are parsed

- Date: 2026-11-15
- Decision: The timeline model holds the six-frame minimum, the no-overlap rule, the clip-ID check
  and the 24-hour cap. The project parser rejects any file that breaks them.
- Why: The review found the zoom invariants enforced only in UI handlers, so a saved file could
  break them.
- Commit: [43cb368](https://github.com/mite404/clipper/commit/43cb368) (REF-4)

## D-7: Do CLIP-7 to CLIP-10 hold on a real OpenScreen recording?

- Date: 2026-11-15
- Decision: Open. The work is proven on synthetic sidecars. A real recording must be imported on the
  owner's Mac.
- Why: One real recording was inspected outside Clipper, and Clipper has not imported it. Real
  recording compatibility is unclaimed.
- Commit: [adc43d0](https://github.com/mite404/clipper/commit/adc43d0) (DOC-1 records D-7)

## ADR-9: Verification gates fail on any stall and score each panel

- Date: 2026-11-15
- Decision: The playback gate fails when one frame or task exceeds 500 ms, not only at the 95th
  percentile. The export gate scores camera and screen panels separately.
- Why: A 95th-percentile check hid a two-second freeze. A combined score let a camera with the wrong
  crop pass.
- Commit: [7fa2e43](https://github.com/mite404/clipper/commit/7fa2e43) (REF-6),
  [4ed307d](https://github.com/mite404/clipper/commit/4ed307d) (REF-17)

## ADR-10: Shortcuts yield to modifier chords, focused controls and text entry

- Date: 2026-11-15
- Decision: Ctrl, Cmd and Alt chords belong to the browser. Delete acts only inside the timeline.
  Space plays from focused sliders, checkboxes and selects.
- Why: The browser keeps modifier chords (REF-7). The focus rules follow the owner's answers,
  recorded on 2026-11-17.
- Commit: [de0d059](https://github.com/mite404/clipper/commit/de0d059) (REF-7), then
  [fa66c35](https://github.com/mite404/clipper/commit/fa66c35) (REF-38) and
  [aa77af1](https://github.com/mite404/clipper/commit/aa77af1) (REF-44)

## ADR-11: The player owns the current frame, and readouts follow it on pause

- Date: 2026-11-15
- Decision: On pause, the timecode, playhead and frame buttons copy the player's frame. Frame steps
  start from that frame.
- Why: Painting is throttled during playback, so the readouts could trail the picture by several
  frames.
- Commit: [7661750](https://github.com/mite404/clipper/commit/7661750) (REF-9)

## ADR-12: Export audio mixes one node per clip

- Date: 2026-11-15
- Decision: Each clip's decoded packets join into one buffer and one audio node, not one node per
  packet.
- Why: One node per packet made the mix time quadratic in timeline length. 40 s of Opus now mixes in
  0.3 s, not 13 s.
- Commit: [f9ef3c3](https://github.com/mite404/clipper/commit/f9ef3c3) (REF-15)

## ADR-13: Unsaved state is measured against the last save

- Date: 2026-11-15
- Decision: An edit counts as saved only once Save project writes it. Reload, tab close and Open ask
  first while edits are unsaved.
- Why: The logo link reloaded the page and dropped the edits, their history and any running export.
- Commit: [4115ac6](https://github.com/mite404/clipper/commit/4115ac6) (REF-12)

## ADR-14: Follow framing comes from source-time data, the same in preview and export

- Date: 2026-11-16
- Decision: A zoom can follow the recorded cursor. Paths are prepared once per edit, with half-lives
  of 100 and 300 ms and a 20% dead zone.
- Why: Preview and export must match at any seek, cut or offset. The constants are engineering
  defaults, not owner decisions.
- Commit: [c2a6be0](https://github.com/mite404/clipper/commit/c2a6be0) (CLIP-10)

## ADR-15: File names that differ only by case fail CI

- Date: 2026-11-16
- Decision: `src/timeline.ts` became `src/timeline-model.ts`. CI refuses names that collide when
  case is ignored.
- Why: On the owner's case-insensitive macOS disk, two import paths resolved to one file and
  typecheck failed. Linux CI could not see the clash.
- Commit: [90cf4b4](https://github.com/mite404/clipper/commit/90cf4b4) (REF-25)

## ADR-16: The repository and CI live on GitHub

- Date: 2026-11-16
- Decision: The Amp project maps to `github.com/mite404/clipper`, which is now its primary
  repository. The Amp-hosted scaffold is gone.
- Why: unknown. The owner confirmed the switch on 2026-11-16, and no source gives the reason.
- Commit: [8095a27](https://github.com/mite404/clipper/commit/8095a27) (no ticket)

## ADR-17: Undo steps merge per gesture and skip no-op edits

- Date: 2026-11-16
- Decision: Changes to the same numeric values less than 800 ms apart form one step. Value-equal
  edits are not recorded. Save closes the open step.
- Why: One slider drag pushed earlier edits out of the 50-step history. The 800 ms window is an
  engineering choice, not an owner decision.
- Commit: [8fd4ae6](https://github.com/mite404/clipper/commit/8fd4ae6) (REF-16)

## D-9: Who can test an import in a real Premiere Pro?

- Date: 2026-11-16
- Decision: Open until the owner imports files. CLIP-31a to CLIP-31c stay proposals. Premiere Pro
  2026 is installed on the owner's Mac, as answered on 2026-11-18.
- Why: Premiere compatibility needs a real import, and none has happened.
- Commit: [5f74067](https://github.com/mite404/clipper/commit/5f74067) (D-9 recorded), answered in
  [ee1bcd5](https://github.com/mite404/clipper/commit/ee1bcd5) (no ticket)

## ADR-18: Save refuses a project over 375 MB of source media

- Date: 2026-11-16
- Decision: Save totals the clips' media bytes before it reads any media, and refuses above 375 MB.
  Import warns once the library passes that size.
- Why: The project is one JSON string with base64 media, about 33% overhead. The sources do not give
  the basis for 375 MB beyond leaving room for the edit and sidecars.
- Commit: [319cf38](https://github.com/mite404/clipper/commit/319cf38) (REF-21), recorded in
  [31e5e72](https://github.com/mite404/clipper/commit/31e5e72)

## ADR-19: FCP7 XML is the interchange format for Premiere

- Date: 2026-11-16
- Decision: Timeline interchange targets FCP7 XML (`.xml`). Nothing is exported or tested yet.
- Why: The owner chose it. No source gives the reason, and which applications open it is not
  settled.
- Commit: [31e5e72](https://github.com/mite404/clipper/commit/31e5e72) (CLIP-31 proposals)

## ADR-20: Editor journeys run against a fresh production build

- Date: 2026-11-16
- Decision: UI journeys run against a fresh production build. Dev servers serve only the
  source-import fixtures.
- Why: A green dev-server test does not prove the built app can run its UI journeys. Performance
  alone does not exercise all production editing behavior.
- Commit: [7373115](https://github.com/mite404/clipper/commit/7373115) (REF-18)

## ADR-21: Typecheck and formatting use the Oxc tools

- Date: 2026-11-16
- Decision: Typecheck runs `oxlint` type-aware, and formatting runs Oxfmt. The `tsc` compiler check
  stays as a separate CI step.
- Why: The owner asked for oxlint-tsgolint in place of tsc and for Oxfmt. The `tsc` step is kept as
  a compiler-safety check.
- Commit: [7cddaea](https://github.com/mite404/clipper/commit/7cddaea) (VERIFY-5)

## ADR-22: Export offers MP4, MOV and WebM at the selected resolution

- Date: 2026-11-17
- Decision: MP4 (H.264/AAC) is the default. MOV and WebM are options. Output is 1920x1080 or
  3840x2160. A container and its MIME type must agree, and an unsupported format fails visibly.
- Why: The owner required MP4 as the default at the selected resolution, superseding a WebM default.
  The reason for the lazily loaded AAC encoder fallback is not stated.
- Commit: [27099dc](https://github.com/mite404/clipper/commit/27099dc) (REF-27)

## ADR-23: Still images are timeline media in version 3 project files

- Date: 2026-11-17
- Decision: PNG and JPEG stills sit on screen or camera tracks with an editable duration (5 s
  default). Saves that embed stills write version 3. Saves without them stay version 2.
- Why: unknown for adding stills at all. The scope is CLIP-20b. Version 2 is kept for video and
  audio-only saves, so older files still open.
- Commit: [6156fb4](https://github.com/mite404/clipper/commit/6156fb4) (CLIP-20b)

## ADR-24: Track locks and selected tracks persist in the project

- Date: 2026-11-17
- Decision: Locked tracks refuse new clip edits. Locks and selected tracks save and reopen. Razor
  (C) cuts at the clicked frame, and Selection (V) returns to normal editing.
- Why: The owner's answers require locks and track selection to be saved. Undo ignores locks, and
  locks guard only new edits.
- Commit: [266f88b](https://github.com/mite404/clipper/commit/266f88b) (CLIP-2e), delivered at
  [a26c7e7](https://github.com/mite404/clipper/commit/a26c7e7)

## ADR-25: Tracks are an ordered registry with stable IDs

- Date: 2026-11-17
- Decision: Every consumer resolves track kind, role and gain through one registry. Version 4 files
  store a non-default registry. Versions 2 and 3 open with the defaults.
- Why: CLIP-2c authorised dynamic track creation, not a fixed four-lane workaround. Track identity
  and legacy conversion had to be defined first.
- Commit: [24c4849](https://github.com/mite404/clipper/commit/24c4849) (CLIP-2c), delivered at
  [1de89b5](https://github.com/mite404/clipper/commit/1de89b5)

## ADR-26: Stage masks have no drop shadow in preview, Copy frame or export

- Date: 2026-11-17
- Decision: The preview's CSS mask shadow is removed, so all three paths draw an unshaded stage.
- Why: The owner wrote "there shouldn't be a drop shadow". The shadow had appeared only in the
  preview, not in Copy frame or export.
- Commit: [8a931d4](https://github.com/mite404/clipper/commit/8a931d4) (CLIP-2c), decision recorded
  in [0a3fd3d](https://github.com/mite404/clipper/commit/0a3fd3d)

## ADR-27: The frontmost screen-role clip owns the cursor

- Date: 2026-11-18
- Decision: The clip covering the frontmost painted screen track draws the cursor. Preview, Copy
  frame and export all read that owner from one `cursorFrame`.
- Why: unknown beyond the rule. On overlap the front track wins, with no fallback.
- Commit: [aae6f84](https://github.com/mite404/clipper/commit/aae6f84) (REF-47)

## ADR-28: Clip edges can extend as well as shorten

- Date: 2026-11-18
- Decision: `trimClip` moves an edge either way within `trimBounds`: the nearest neighbour, the
  source head and tail, frame 0 and the 24-hour cap.
- Why: The owner's recording showed an outward drag did nothing. The cause was that `trimClip`
  clamped to zero or more, so only Undo could restore a shortened clip.
- Commit: [063bc31](https://github.com/mite404/clipper/commit/063bc31) (REF-49)

## ADR-29: Zoom pan clamps to the source cover in one shared function

- Date: 2026-11-18
- Decision: `framingAt` clamps each zoom's pan to the owning clip's cover rect. Preview, Copy frame
  and export all use it, so no empty mask shows.
- Why: At 1.4x with focus near the edge, about 26% of the mask was empty. The owner's recording
  showed it.
- Commit: [4bc0f24](https://github.com/mite404/clipper/commit/4bc0f24) (REF-50)

## ADR-30: Razor hover seeks the real playhead to the cut frame

- Date: 2026-11-18
- Decision: With Razor active, hovering a cuttable frame seeks the playhead and preview there. The
  playhead stays until something moves it. Hover adds no undo step.
- Why: Owner decision, option A: "They would stay there until the playhead is moved again." Snapping
  to the playhead became circular, so Razor snaps to clip edges only.
- Commit: [cc12bb5](https://github.com/mite404/clipper/commit/cc12bb5) (REF-51)

## ADR-31: Transcription runs Whisper tiny.en in the browser

- Date: 2026-11-18
- Decision: CLIP-32 transcribes with Whisper `tiny.en` through transformers.js, English only. The
  model files ship with Clipper, pinned to one version, and the model name lives in one place.
- Why: Audio must stay local (ADR-1), and the owner chose to try the smallest English model first.
  Serving the files with the app avoids a runtime download from a third-party host.
- Commit: pending CLIP-32

## ADR-32: No hosted share links, and voice-over is the only recording feature

- Date: 2026-11-18
- Decision: CLIP-44 (hosted share links) is dropped. CLIP-46 is narrowed to voice-over audio
  recording and parked with CLIP-47.
- Why: Hosting would upload media, against ADR-1. The owner wants only voice-over recording, and not
  yet.
- Commit: pending the master update that records it

## ADR-33: Fonts are served from Clipper's own origin

- Date: 2026-11-18
- Decision: REF-57 self-hosts DM Sans and IBM Plex Mono as latin and latin-ext woff2 files with
  their OFL licences. IBM Plex's latin-ext range is shortened, so 23 rare glyphs fall back.
- Why: Loading the editor must not contact another origin (ADR-1, local-first).
- Commit:
  [ced85b0](https://github.com/mite404/clipper/commit/ced85b0117934fce311c829931011f43fb9ec2bb)

## ADR-34: A public post preview carries its text in the URL fragment

- Date: 2026-11-18
- Decision: PUB-2 is one static HTML page on Netlify (D-10). The post text rides in the URL
  `#fragment`, nothing is uploaded, and the recipient posts from their own account through
  `x.com/intent/post`. Deploying needs the owner's go-ahead.
- Why: A fragment never reaches the server, so sharing a preview stays upload-free (ADR-1, ADR-32).
- Commit: pending PUB-2
