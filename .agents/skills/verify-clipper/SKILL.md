---
name: verify-clipper
description: >-
  Drives Clipper's browser editor and Storybook. Use after timeline, media, playback, crop, zoom,
  project save/reopen, video export, or editor UI changes.
---

# Verify Clipper

Use the feature map in [features/README.md](features/README.md) as the coverage set. The app has no
backend, account, or database. Reload discards unsaved edits. Save project embeds all source bytes;
Open project restores them without relinking. Export video renders locally, not on a server.

## Launch

Run `npm ci` if dependencies are absent. Install the lockfile's browser with
`npx playwright install chromium` if doctor requests it. FFmpeg and ffprobe must be on PATH for
export inspection. Orb bootstrap supplies these dependencies.

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
binary; it is not required with Playwright Chromium installed.

## Gate

Lefthook runs staged-file lint, dead-code analysis, and whole-project TypeScript checks. GitHub CI
runs the stricter checks below and all browser journeys. Verify the actual GitHub run before
claiming remote CI passed. The approved health baseline retains existing complexity debt and may
shrink, not grow.

```bash
npm run format:check
npm run lint
npm run lint:typed
npm run typecheck
npm run check:code
npm test
npm run build
npm run build-storybook
npm audit
node --test .agents/skills/verify-clipper/scripts/verify.test.mjs
```

The helper's Node tests are a local tooling gate, not currently wired into CI. Existing `npm test`,
Playwright, Storybook, lint, typecheck, Fallow, and hook commands remain unchanged. Prettier covers
the project skill; the staged JavaScript lint hook also covers its helpers.

`build` runs strict TypeScript then Vite. Unit tests prove frame splits, ripple isolation, and zoom
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

`editor` runs editor and refinement specs. The other names select the existing feature specs or
titles in `scripts/verify.mjs`. `all` discovers every spec, preserving the root configuration's
separate editor/4K projects. All runs use one worker, no retries, and fail on skipped, flaky, or
zero tests. New journeys belong in the same table, not a second browser implementation.

`performance` runs five repetitions against a fresh production build with tracing and video disabled
and the original 1x device scale. Do not run other browser/build jobs alongside that measurement.
Its existing 4× CPU-throttled assertions require actual video advancement within one second and rAF
p95 below 100ms over five seconds. `all` includes one uninstrumented performance smoke test; it does
not replace the uninstrumented five-run gate. No command checks physical speaker output or claims
that not-yet-implemented cursor sidecar/follow features work.

## Evidence

Capture actions and outcomes through UI controls, not React state setters. Assert media currentTime
after scrubs on both sides of the screen splice, and verify actual Audio elements advance during
playback. Remotion recycles audio tags, so DOM order is not track identity.

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
