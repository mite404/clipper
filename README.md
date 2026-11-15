# Clipper

A local-first developer-video editor steel thread. React, Remotion Player, and Mediabunny run in the
browser. No source media is uploaded and no account is required.

## Run

```bash
npm ci
npm run dev
```

In an Amp orb, run `amp orb services ensure` for supervised editor and Storybook previews. Use the
portal URLs it prints rather than sharing localhost URLs.

## What works

- Source preview, local video/audio import, in/out points, and target-track ripple insertion.
- Two video tracks, two audio tracks, waveform display, timeline scrubbing, split/delete/undo.
- Remotion-synchronized video/audio, J/K/L shuttle, Space play/pause, and track mute.
- Landscape-left and portrait-right cover crops with shared 22px masks by default.
- Click the Inspector's composition preview to swap sides, drag either clip edge to shorten, and
  scroll/scale the timeline.
- Timed screen zooms with editable scale, manually marked mouse focus, and smooth in/hold/out.
- Portable project save/reopen with embedded original media and no relinking requirement.
- Local rendered video export at 1920×1080 or 3840×2160, with progress and cancellation.
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
npm run check:code
npm test
npm run build
npm run build-storybook
CHROME_PATH=/path/to/chrome npm run test:ui
```

Node and npm versions are pinned in `.node-version` and `package.json`. Lefthook checks staged
JavaScript/TypeScript without modifying or restaging files, then runs whole-project dead-code and
TypeScript checks. GitHub CI runs on pushes to `main`, using the locked dependencies and Chromium
installed by Playwright. It builds both previews and runs all browser tests, including real HD/4K
export inspection with FFmpeg. CI does not need Amp, personal credentials, or global node tools.

The approved Fallow health baseline records existing complexity debt, not resolved findings. Strict
CI rejects new findings, stale baseline entries, and baseline growth compared with the commit `main`
held before the push (the previous commit for a manually started run). Every push gets its own full
run; a later push does not cancel it. Reduce the baseline when fixing its findings; do not
regenerate it to accept new debt. Defaults for other Fallow rules and complexity thresholds remain
unchanged.

The Playwright suite expects both editor and Storybook running. `BASE_URL` and `STORYBOOK_URL`
override their default ports. Export fixtures require a Vite development server; point `BASE_URL`
there and `PERF_URL` at the production editor when running the full suite. The project skill
documents an isolated launch, doctor, feature map, evidence, and cleanup. Use
`/maintain-verification-skill` to keep it aligned with future features.

The public editor service builds and serves production code. Development React is deliberately not
the user-facing preview. Restart the editor service after source changes to rebuild that preview.

## Deliberate limits

- Unsaved edits still disappear on reload. The browser asks before a reload or tab close discards
  them, and Open project asks before it replaces them. Save project downloads media and edits in one
  JSON file; Open project restores them locally. There is no automatic disk persistence or agent
  motion cards.
- Reverse shuttle is silent. Forward playback uses the browser's supported audio/video codecs.
- MP4 AVC/AAC is preferred when the browser can encode it; otherwise export uses WebM VP9/Opus.
  Unsupported encoders show an error rather than downloading a mislabeled file.
- Ordinary recordings contain no reliable cursor-position track. Mark mouse position is manual and
  uses one fixed focus point per zoom, not automatic cursor tracking. Edge focus can reveal
  background.
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
