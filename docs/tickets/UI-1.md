# UI-1

Authoritative state: [master ticket](../master-tickets.md#ui-1).

## Approved scope

One shared `IconButton` tooltip pilot after CLIP-11 speed-style delivery. Both `@ui-sdk/react` and
`@ui-sdk/core` are pinned to `0.1.0-beta.5`. Installation succeeded without a release-age policy
refusal or bypass. No default `web.css`, app-wide resets, agent bridge, or control migration.

`IconButton` retains its native button, accessible name, disabled behavior, event props and default
`type="button"`. The tooltip repeats the label, not a screen-reader description. Native `title` is
removed. Disabled buttons remain disabled and do not expose a tooltip.

Pointer entry waits 400 ms. Neighbor tooltips open instantly. Entry and exit use opacity and scale
at 125 ms with `cubic-bezier(0.23, 1, 0.32, 1)`, scale 0.97 and the supplied transform origin.
Instant handoff and keyboard focus skip transitions. Reduced motion removes scale and retains fade.

## Production payload measurement

Base: `6fa99afb10c8df35427a0ce0120d82b370a0b1e0`, after CLIP-25. Before and after use Node 26.13.1,
npm 10.9.10, the same installed toolchain and `npm run build`. Before builds the clean base in a
detached worktree with the same `node_modules`. It has no ui-sdk imports. Gzip sizes use `gzipSync`
with default compression, matching Vite's gzip report. Each emitted JS and CSS file is compressed
separately, then summed, including the lazy exporter.

| Shipped payload  | Before gzip bytes | After gzip bytes | Delta bytes |
| ---------------- | ----------------: | ---------------: | ----------: |
| Main JS          |            333622 |           364193 |      +30571 |
| Lazy export JS   |             40058 |            40058 |           0 |
| CSS              |              6958 |             7175 |        +217 |
| Total JS and CSS |            380638 |           411426 |      +30788 |

The main-chunk increase passes the approved 35000-byte limit. The total is informational, not
another acceptance condition. The exporter is byte-identical after normalizing its main-chunk import
filename. These are emitted production bytes, not the research tarball estimate. Vite's existing
large-chunk advisory remains.

## Browser contract

`src/IconButton.stories.tsx` supplies Normal and Stress records with enabled neighbors, a native
disabled button, a press counter and a form-submission counter. Stress uses a long multilingual,
unbroken label in a 240px container. The browser spec also uses a 320px viewport.

`tests/icon-button.spec.ts` checks keyboard focus, Escape with retained focus, Enter and Space
activation without form submission, no duplicate accessible description or native title, disabled
semantics, initial hover delay and cancellation, neighbor handoff, hoverable tooltip content,
reduced-motion wrapping and production transport activation. All four tests failed on the original
native-title component before implementation, then passed with the tooltip.

Reduced-motion exit is sampled over real animation frames. This assertion failed when the state
selector's specificity kept scale 0.97 during exit, then passed with the matching media-query rule.
Rendered tooltip text contrast is 11.25:1. Normal focus, long-label narrow reduced-motion and
production hover captures are inspected, as is the real-pointer transport sweep and frame click.

The spec's first three cases visit `STORYBOOK_URL` explicitly. The fourth visits the production
editor through the editor project's base URL. No source-module imports are needed.

## Final local gates

On the measured base, strict formatting, lint, typed lint, TypeScript, dead-code and shrink-only
Fallow checks pass unchanged. All 135 unit tests, seven verification-helper tests and the 107-ID
ticket audit pass; npm audit reports zero vulnerabilities. Production and Storybook builds pass.

The isolated `all` journey passes 55/55 cases with no skips, retries or flaky results. Evidence:
`.amp/in/artifacts/verification/all-ttsXOo/summary.json`. The separate five-repeat performance gate
passes 10/10 cases, including cursor follow, with the existing thresholds unchanged. Evidence:
`.amp/in/artifacts/verification/performance-ahLCC3/summary.json`.

## Limits

This pilot uses Chromium accessibility-name and description checks, not a physical screen reader or
a physical touch device. No claim about Safari or Firefox is made. Exact-SHA CI and serialized
queue-owner delivery remain required. The Fallow baseline and all existing quality gates remain
unchanged.
