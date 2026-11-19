---
name: verify-clipper
description: >-
  Drives Clipper's browser editor and Storybook. Use after timeline, media, playback, crop, zoom,
  cursor, frame copy, tooltip, project save/reopen, video export, or editor UI changes.
---

# Verify Clipper

Use the feature map in [features/README.md](features/README.md) as the coverage set. It separates
what is delivered on `main` from what is pending; never report a pending feature as verified. The
app has no backend, account, or database. Reload discards unsaved edits. Save project embeds all
source bytes; Open project restores them without relinking. Export video renders locally, not on a
server.

## Launch

Run `npm ci` if dependencies are absent. Install the lockfile's browser with
`npx playwright install chromium` if doctor requests it. FFmpeg and ffprobe must be on PATH for
export inspection and the MP4/MOV import test in `media` and `editor`. Orb bootstrap supplies these
dependencies.

Use the executable CLI from any working directory. From the repository root:

```bash
.agents/skills/verify-clipper/scripts/verify.mjs --help
.agents/skills/verify-clipper/scripts/verify.mjs doctor
.agents/skills/verify-clipper/scripts/verify.mjs editor
```

Each journey starts fresh test-owned Playwright web servers on automatically selected loopback
ports. It never reuses shared previews. Browser contexts, build directories, and evidence paths are
unique per invocation. Port races fail through Vite's strict-port check rather than attaching to
another worker's server. No Amp session, portal authentication, or existing server is required.

The production and Storybook builds are created only for journeys that need them, in temporary
directories. Vite development serves export fixtures; a separate production preview serves the
responsiveness test. `BASE_URL`, `PERF_URL`, and `STORYBOOK_URL` from the caller are deliberately
replaced with isolated URLs. Use the existing `npm run test:ui` for an explicitly external target.

## Doctor

```bash
.agents/skills/verify-clipper/scripts/verify.mjs doctor
```

Require `Clipper CLI doctor OK`. Doctor checks bundled media files, launches the installed Chromium,
opens a video-recording-capable context, closes it, and checks FFmpeg/ffprobe. It does not install
anything, start a server, or prove playback. Journeys then require `4 assets ready` through the
actual UI and assert the feature's observable result. `CHROME_PATH` optionally overrides the browser
binary for doctor and for the native hidden-tab launch in `tests/transport-lifecycle.spec.ts`; it is
not required with Playwright Chromium installed.

## Gate

Three places run mechanical checks. Verify the actual GitHub run before claiming remote CI passed.

Pre-commit (Lefthook, nothing on push): staged-file `oxlint --deny-warnings`, whole-project
`npm run check:deadcode` and `npm run typecheck`. The latter runs type-aware Oxlint lint and
experimental Oxc compiler diagnostics. Nothing formats or tests at commit time.

GitHub CI (`.github/workflows/ci.yml`) runs on pushes to `main` and manual dispatch, not on pull
requests. In order:

```bash
npm run format:check
npm run lint
npm run lint:typed
npm run typecheck
npm run typecheck:tsc
node scripts/check-tickets.mjs
npm run check:code -- --fail-on-baseline-growth --baseline-base "<commit main held before the push>"
npm test
npm run build
npm run build-storybook
npm run test:ui -- --workers=1
```

CI also refuses file names that differ only by case, using the `git ls-files` check in its YAML. The
Fallow health baseline retains existing complexity debt and may shrink, not grow. Local
`npm run check:code` without the two flags does not prove that; give the base ref a commit such as
`HEAD^`, or the pre-push `origin/main`, when you run it.

Local only, not in CI or a hook:

```bash
npm audit
node --test .agents/skills/verify-clipper/scripts/verify.test.mjs
```

The helper's Node tests guard the CLI and the production/dev project split. They do not run in CI.
Oxfmt covers the project skill and feature map; the staged JavaScript lint hook also covers the
helpers. `npm run test:ui` outside CI expects servers already running, so use `verify.mjs`.

`build` runs the same Oxc checks as the hook, then Vite. Neither invokes standalone `tsc`; CI
additionally runs `typecheck:tsc`. Unit tests prove frame splits, ripple isolation, and zoom
envelopes. They do not prove codecs, playback, DOM layout, import privacy, or audio synchronization.
Vite currently reports a large-bundle advisory; that is not a failed build or a performance proof.

## Drive

The browser journeys live in `tests/*.spec.ts`. They use real H.264, WAV, blob imports, Remotion
playback, and Mediabunny decoding. No media APIs are mocked.

```bash
.agents/skills/verify-clipper/scripts/verify.mjs media
.agents/skills/verify-clipper/scripts/verify.mjs composition
.agents/skills/verify-clipper/scripts/verify.mjs delivery
.agents/skills/verify-clipper/scripts/verify.mjs export
.agents/skills/verify-clipper/scripts/verify.mjs storybook
.agents/skills/verify-clipper/scripts/verify.mjs performance
.agents/skills/verify-clipper/scripts/verify.mjs all
```

`editor` runs editor, transport-end, transport-lifecycle and refinement specs. The other names
select feature specs or titles in `scripts/verify.mjs`. `all` discovers every spec, preserving the
root configuration's separate editor/4K projects. These specs run only under `all`: `controls`,
`cursor`, `cursor-render`, `cursor-rotation`, `cursor-shapes`, `cursor-speeds`, `auto-zoom`,
`framing`, `frame-image`, `icon-button`, `workspace-layout`, `cursor-inspector`, `zoom-creation`,
`focused-controls`, `chapters`, `clip-keys`, `preview-quality`, `clip-gain`, `scrub`, `source-scrub`
and `split-tools`. There are no narrower journeys for them on purpose; features/README.md lists what
each named journey selects. All runs use one worker, no retries, and fail on skipped, flaky, or zero
tests. New journeys belong in the same table, not a second browser implementation.

`performance` runs five repetitions against a fresh production build with tracing and video disabled
and the original 1x device scale. Do not run other browser/build jobs alongside that measurement.
Its existing 4× CPU-throttled assertions require actual video advancement within one second and rAF
p75 below 42ms over five seconds (a steady 30 fps; p95 is logged but not asserted, as it flips on
one burst of host contention), and neither the worst frame nor the worst long task may reach 250 ms.
These bounds and the first-advance check apply to the first, cold play. If its cadence slips, the
play is replayed from frame 0 up to three times and passes when one replay holds, annotated
`cadence replay` in the results. The cursor-follow variant also turns on shape stabilization,
rotation, the Rapid animation style and a focused automatic zoom. `all` includes one uninstrumented
run of each variant; it does not replace the uninstrumented five-run gate. No command checks
physical speaker output, rewind or export App commit counts, scrubbing with very large telemetry
(REF-37), or any real OpenScreen recording. REF-20 checks bound observable rewind readout changes at
1×, 2× and 4× and compare the paused readout with camera media time. `editor` also checks held-frame
stepping and the zero boundary, then real export progress, cancellation and download on retry. These
DOM checks do not measure React render counts or encoding speed.

## Evidence

Capture actions and outcomes through UI controls, not React state setters. Assert media currentTime
after scrubs on both sides of the screen splice, and verify actual Audio elements advance during
playback. Remotion recycles audio tags, so DOM order is not track identity.

Copy frame checks read `image/png` back from the real clipboard and decode its pixels; a status
message or a DOM screenshot does not count. Tooltip checks move a real pointer and wait out the 400
ms delay.

The eight-ending transport check retains DOM/action/network traces and final screenshots, but
disables trace screencast frames and video. Continuous raster recording competes with media decoding
on two-core runners. This file-level exception leaves all other editor capture settings unchanged.
`transport-lifecycle.spec.ts` makes the same exception for a stronger reason: raster capture keeps a
background tab visible, so its native hidden-tab test launches Chromium itself and connects over
CDP.

Import checks observe non-GET requests and require zero uploads. Save checks read the actual JSON
download and reopen it after reload. Export checks use ffprobe and FFmpeg to inspect the actual
HD/4K files, decoded pixels and audio mix. Both tools must be installed. A status message alone does
not prove those side effects. Audio element timing proves the browser transport, not what a human
hears from physical speakers. Rewind is deliberately silent.

Every run prints a unique directory under `.amp/in/artifacts/verification/<journey>-<id>/`.
`VERIFY_EVIDENCE` overrides the parent directory. Read `summary.json` for the verdict and allocated
ports, `results.json` for each test and assertion failure, and `run.log` for build/server output.
Browser subdirectories contain traces, final screenshots, and failure videos. Performance omits
traces/videos to avoid measurement overhead. Editor captures use 2x; the performance project uses
1x. Open a trace with `npx playwright show-trace <path-to-trace.zip>`.

Inspect screenshots and clips before reporting visual quality. A capture without inspection is not
visual verification. Report every mapped feature as verified, failed, or skipped. Exit 0 means the
selected assertions passed, not that the entire feature map was swept. Unknown journeys exit 2;
failed checks, build failures, and interrupts exit nonzero and retain diagnostics.

## Cleanup

The CLI automatically closes its test-owned browsers and servers through Playwright and removes only
its temporary build directory. SIGINT/SIGTERM is forwarded to the active command for normal
teardown. Evidence remains on success, failure, and interruption. SIGKILL or an orb crash cannot run
cleanup; inspect recorded ports and process ownership before stopping any leftover process. Never
kill by process name or stop the shared editor/Storybook previews.

## Manual browser inspection

Use `amp orb services ensure` for persistent shared previews and load the official
using-agent-browser skill for captures and recordings. Restart the shared editor service after
source changes to rebuild its production preview. These previews are for manual inspection, not the
target of focused verification commands. Use `verify.mjs` for fresh test-owned instances, readiness
assertions, evidence, and automatic cleanup. It replaces the retired manual lifecycle helper and
needs no ownership marker, fixed port, or separate stop command.

## Helpers and maintenance

Use `/maintain-verification-skill` when features or selectors change.
