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

Run `npm ci` if dependencies are absent. In an Amp orb, launch an isolated verification server:

```bash
.agents/skills/verify-clipper/scripts/control-clipper.sh launch
```

The helper uses a supervised Amp service, refuses a busy port, and checks page identity and all four
demo assets. Default verification port is 4317. Concurrent runs must set distinct `VERIFY_PORT` and
`VERIFY_RUN_ID` for launch, doctor, stop, and browser commands.

For the user-facing editor and Storybook, `amp orb services ensure` starts the declared services. Do
not stop those shared preview services during isolated verification cleanup.

## Doctor

```bash
.agents/skills/verify-clipper/scripts/control-clipper.sh doctor
agent-browser --session verify-clipper open http://127.0.0.1:4317
agent-browser --session verify-clipper set viewport 1440 1000 2
agent-browser --session verify-clipper wait --text '4 assets ready'
```

Require `Clipper doctor OK` and `4 assets ready`. An HTTP 200 alone does not prove media decoded.
Before screenshots, also wait for visible video elements to reach readyState 4. Use the official
using-agent-browser skill for captures and interaction recordings.

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
```

`build` runs strict TypeScript then Vite. Unit tests prove frame splits, ripple isolation, and zoom
envelopes. They do not prove codecs, playback, DOM layout, import privacy, or audio synchronization.
Vite currently reports a large-bundle advisory; that is not a failed build or a performance proof.

## Drive

The browser journeys live in `tests/*.spec.ts`. They use real H.264, WAV, blob imports, Remotion
playback, and Mediabunny decoding. No media APIs are mocked.

```bash
export CHROME_PATH=$(ls -d "$HOME"/.agent-browser/browsers/chrome-*/chrome | tail -1)
BASE_URL=http://127.0.0.1:4317 PERF_URL=http://127.0.0.1:5173 npm run test:ui -- \
  --trace on --output .amp/in/artifacts/verification
```

Storybook must be running on its declared port 6006. `STORYBOOK_URL` overrides it. `CHROME_PATH` may
name an installed Chrome binary; otherwise Playwright uses its installed Chromium. Export fixture
tests import Vite modules and require the isolated development server on `BASE_URL`. The performance
test requires a production build on `PERF_URL`; never use development React as the responsiveness
acceptance target. Run five repetitions without a CPU profiler. Its 4× CPU-throttled gate measures
actual video advancement within one second and rAF p95 below 100ms over five seconds. For an
authenticated Amp portal, supply a fresh login URL as `PERF_URL` from `amp portal login-url`. The
default suite does not invoke Amp or need authentication. Never print the signed URL. For focused
changes use `-g` with the exact test title listed in the matching feature file.

## Evidence

Capture actions and outcomes through UI controls, not React state setters. Assert media currentTime
after scrubs on both sides of the screen splice, and verify actual Audio elements advance during
playback. Remotion recycles audio tags, so DOM order is not track identity.

Import checks observe non-GET requests and require zero uploads. Save checks read the actual JSON
download and reopen it after reload. Export checks use ffprobe and FFmpeg to inspect the actual
HD/4K files, decoded pixels and audio mix. Both tools must be installed. A status message alone does
not prove those side effects. Audio element timing proves the browser transport, not what a human
hears from physical speakers. Rewind is deliberately silent.

Retain Playwright traces in `.amp/in/artifacts/verification`. Save reviewed screenshots and clips
under `.amp/in/artifacts/`, inspect them, and report the viewport and state. A capture without
inspection is not visual verification. Report every mapped feature as verified, failed, or skipped.

## Cleanup

```bash
agent-browser --session verify-clipper close
.agents/skills/verify-clipper/scripts/control-clipper.sh stop
test -d .amp/in/artifacts/verification
```

This stops only the verification service owned by this run. Evidence remains. Do not delete user
media, stop the shared editor/Storybook previews, or use process-name kills.

## Helpers and maintenance

Run `scripts/control-clipper.sh` as shown above. It requires Amp orb services. Outside an orb, use
`npm run dev -- --port 4317 --strictPort` in a dedicated terminal and stop that process yourself.
Use `/maintain-verification-skill` when features or selectors change.
