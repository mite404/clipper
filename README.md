# Clipper

A local-first developer-video editor steel thread. React, Remotion Player, and Mediabunny run in the
browser. No source media is uploaded and no account is required.

## Run

```bash
npm ci
npm run fetch:whisper
npm run dev
```

`npm run fetch:whisper` downloads the pinned Whisper `tiny.en` files (about 42 MB) into the
git-ignored `public/models/` and checks each one's SHA-256. Clipper serves them itself, so
transcription never downloads anything at runtime.

`npm run dev` serves on port 5173 and exits with a port-in-use error if it is taken, rather than
moving to another port. In an Amp orb, run `amp orb services ensure` for supervised editor and
Storybook previews. Use the portal URLs it prints rather than sharing localhost URLs. The editor
service holds 5173, so beside it run `npm run dev -- --port <free port>`.

## What works

- Source preview, local video/audio, PNG/JPEG still and MP4/MOV import, in/out points or a still
  duration, and target-track ripple insertion.
- Two video tracks, two audio tracks, waveform display, timeline scrubbing, split/delete/undo.
- Remotion-synchronized video/audio, J/K/L shuttle, Space play/pause, and track mute.
- Landscape-left and portrait-right cover crops with shared 22px masks by default.
- Click the Inspector's composition preview to swap sides, drag either clip edge to shorten, and
  scroll/scale the timeline, with `-` and `=` zooming it out and in.
- `X` selects the clip under the playhead; `[` and `]` trim the selected clip's start or end to it.
- Chapter markers: `M` marks one at the playhead, shown as ruler flags you can click, rename in the
  Inspector, delete, save with the project and copy as a YouTube-style list.
- Timed screen zooms with editable scale, manually marked mouse focus, and smooth in/hold/out.
- Portable project save/reopen with embedded original media and no relinking requirement.
- Local rendered video export at 1920×1080 or 3840×2160 as MP4, MOV or WebM, chosen in the export
  dialog, with the exact filename shown, progress and cancellation.
- English transcription of a video or audio source with Whisper `tiny.en`, run in a worker on this
  device, with progress and Cancel; the transcript is saved with the project.
- Shared Storybook records, including mouse-marking mode, and realistic stress-data toggles.

The layout follows the supplied desktop-plus-talking-head example and the source/compose workflow in
Amp time capsules [5](https://ampcode.com/time-capsules/5) and
[4](https://ampcode.com/time-capsules/4). Zoom behavior is informed by
[Screen Studio's guide](https://screen.studio/guide). It does not reproduce their proprietary code.
Selection, filmstrip/ruler, blob lifecycle, and masking patterns were considered from the
owner-authorized private prototype `mite404/sequence-spear-fish`; this is a new React timing engine,
not a claim that the still-image prototype already had video editing.

## Verify

```bash
npm run format:check
npm run lint
npm run lint:typed
npm run typecheck
npm run typecheck:tsc
npm run check:code
npm test
npm run build
npm run build-storybook
CHROME_PATH=/path/to/chrome npm run test:ui
```

`npm run typecheck` uses Oxlint's experimental compiler diagnostics through `oxlint-tsgolint`. CI
also runs `typecheck:tsc` to retain the standalone TypeScript compiler gate. `npm run format` writes
Oxfmt formatting across the whole repository by default. `npm run format -- path/to/file` limits
rewriting to selected files. `npm run format:check` checks every Oxfmt-supported file Git does not
ignore, subject to Oxfmt's ignore rules, without rewriting files. Passing a path with
`npm run format:check -- path/to/file` does not scope Oxfmt. Oxfmt ignores the generated Fallow
health baseline so formatting does not rewrite or reject Fallow's output. Because Oxfmt skips lock
files, a read-only Node check retains the npm lock's generated two-space JSON layout and final
newline. That check does not enforce property ordering or dependency validity.

Node and npm versions are pinned in `.node-version` and `package.json`. Lefthook checks staged
JavaScript/TypeScript without modifying or restaging files, then runs whole-project dead-code and
type-aware Oxlint lint plus experimental Oxc compiler diagnostics. The build uses the same Oxc
checks before Vite; neither it nor the hook runs standalone `tsc`. CI additionally runs
`typecheck:tsc`. GitHub CI runs on pushes to `main`, using the locked dependencies and Chromium
installed by Playwright. It builds both previews and runs all browser tests, including real HD/4K
export inspection with FFmpeg. CI does not need Amp, personal credentials, or global node tools.

The approved Fallow health baseline records existing complexity debt, not resolved findings. Strict
CI rejects new findings, stale baseline entries, and baseline growth compared with the commit `main`
held before the push (the previous commit for a manually started run). Every push gets its own full
run; a later push does not cancel it. Reduce the baseline when fixing its findings; do not
regenerate it to accept new debt. Defaults for other Fallow rules and complexity thresholds remain
unchanged.

Playwright separates production UI journeys from browser source-import fixtures. The `editor` and
`4k` projects exercise import, editing, transport, save/reopen, failure recovery, and video
downloads against production. The `fixtures` and `fixtures-4k` projects retain development-module
codec, decoded-pixel, audio, framing, auto-zoom, and cursor checks. Node-side fixture imports do not
require a development browser target. New specs default to production unless explicitly classified
as source-import fixtures. Storybook and uninstrumented performance have separate projects.

Outside CI, `npm run test:ui` needs a dev server on `BASE_URL` (default :5173) and a production
preview on `PERF_URL` (default :4173). The orb editor service on :5173 is a production preview, so
use `verify.mjs`, or set `BASE_URL` and `PERF_URL` to ports you started yourself. `BASE_URL` selects
development Vite (default `http://localhost:5173`), `PERF_URL` selects the production editor
(default `http://127.0.0.1:4173`), and `STORYBOOK_URL` selects Storybook (default
`http://127.0.0.1:6006`). CI starts all three servers and requires a successful fresh production
build before preview starts, even if `dist` already exists. A failed build cannot fall back to an
old bundle.

Run browser checks through `verify.mjs`, which owns fresh servers and loopback ports:

```bash
node --test .agents/skills/verify-clipper/scripts/verify.test.mjs
node .agents/skills/verify-clipper/scripts/verify.mjs all
```

The `editor`, `media`, `composition`, and `delivery` CLI journeys now build and serve production, as
do `performance` and `all`. `export` retains its dev fixtures. `all` includes both target classes
and Storybook. Each invocation replaces caller URLs with unique loopback ports, refuses server
reuse, and builds into a fresh temporary directory. Missing or stale shared builds cannot satisfy
this gate. Failed builds, zero tests, skipped tests, flakes, and interruption remain failures.
Performance runs use one worker without trace/video overhead or concurrent browser workloads. The
project skill documents doctor, feature coverage, evidence, and cleanup. Use
`/maintain-verification-skill` to keep it aligned with future features.

The public editor service builds and serves production code. Development React is deliberately not
the user-facing preview. Restart the editor service after source changes to rebuild that preview.

## Deliberate limits

- Unsaved edits still disappear on reload. The browser asks before a reload or tab close discards
  them, and Open project asks before it replaces them. Save project downloads media and edits in one
  JSON file; Open project restores them locally. There is no automatic disk persistence or agent
  motion cards.
- Reverse shuttle is silent. Forward playback uses the browser's supported audio/video codecs.
- MP4 is H.264 with AAC, MOV is H.264 with uncompressed PCM audio and WebM is VP9 with Opus. A
  browser that cannot encode the chosen format shows an error rather than downloading a mislabeled
  file. Only H.264 and AAC MP4/MOV imports are qualified; other codecs, EXIF-rotated JPEGs and real
  screen recordings are not.
- Stills are PNG and JPEG only, placed on a visual track with a duration. There are no still
  backgrounds or motion.
- Ordinary recordings contain no reliable cursor-position track. The mouse focus is marked by hand,
  by pressing and dragging on the screen video, one fixed focus point per zoom, not automatic cursor
  tracking. Edge focus can reveal background.
- Imported video audio is available for explicit insertion onto an audio track, not auto-linked.
- Waveforms are decoded peaks with realtime playback highlighting, not live recording inputs.
- Filmstrips repeat the first decoded thumbnail. Edge handles shorten only; source in/out plus
  insertion is available when a different source range is needed.
- Large recordings are decoded in full for waveform generation; there is no streaming/chunked index.
- Project JSON embeds base64 media (~33% size overhead). Saving/reopening and export buffer data in
  memory. Long or large 4K projects can exceed browser memory; there is no streaming export yet.
- Side-by-side cover crops can hide wide-screen edges. Crop X/Y selects the visible region.
- Remotion licensing must be checked before commercial/team use; see https://remotion.dev/license.

Demo footage credits and transformation details live in
[ATTRIBUTION.md](public/media/ATTRIBUTION.md). The landscape demo is CC0 flower footage, not an
actual desktop recording. Replace it through Import media with your own screen capture.
