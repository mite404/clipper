# REF-18

## Status

- Authoritative state: [master ticket](../master-tickets.md#ref-18).
- Goal: exercise real editor journeys against the production bundle too.
- Priority: correctness gate before further shared editor changes.
- Effort: medium. Risk: export fixtures import source modules and cannot blindly use a static build.
- Dependencies: preserve VERIFY-1 isolation and existing export fixture coverage.
- Planned at: `7b23be80ff417e061d5c74ac127759b20a5b80ef`, 2026-11-16.
- Local path: `docs/tickets/REF-18.md`.

## Why this matters

A green dev-server test does not prove the built app can run its UI journeys. Performance alone does
not exercise all production editing behavior.

## Current state

At dispatch, `playwright.config.ts` started Vite dev for editor journeys in CI. The isolated CLI
also used dev for editor, plus production preview for performance. Finding #18 remains subject to
the queue owner's serialized push grant and exact-head CI acceptance.

## Approach

Classify actual UI journeys separately from source-import export fixtures. Point the former at an
isolated fresh production build while preserving fixture-only module imports and Storybook.

## Scope

In: browser target configuration, journey selection, readiness and CLI tests. Out: replacing browser
tests, new server lifecycle infrastructure, or claiming all tests are production tests while some
deliberately exercise module fixtures.

## Steps

1. **Identify targets**. Enumerate fixture imports and UI-only journeys using narrow searches.
2. **Add production journeys**. Prove a stale or missing build cannot silently pass.
3. **Verify both paths**. Run real UI, encoded-export and isolated CLI gates.

## Test plan

Exercise editor import, edit, transport, save/reopen, failure recovery and download through built
UI. Preserve source-import pixel/audio tests. Check unique ports, no shared preview reuse, no
skips/flakes, and full CI execution of the production target.

## Why this approach

It closes the production gap without discarding the lower-level real codec tests.

## Files You'll Touch

| Path                                     | Role                                             | Edit or Read |
| ---------------------------------------- | ------------------------------------------------ | ------------ |
| `playwright.config.ts`                   | CI projects and server targets                   | Edit         |
| `.agents/skills/verify-clipper/scripts/` | Isolated CLI targets and Node tests              | Edit         |
| `tests/*.spec.ts`                        | Separate UI journeys from source-import fixtures | Read only    |
| `.github/workflows/ci.yml`               | Actual CI invocation                             | Read only    |
| `README.md`, `docs/tickets/REF-18.md`    | Target contract and verification evidence        | Edit         |

## Initial state and preflight

Run [dispatch preflight](../ticket-workflow.md#initial-state-and-preflight). Inspect drift in both
Playwright configs and verify.mjs. Follow skill-authoring guidance before editing skill files.

## Done when

Production editor journeys execute in CI, fixture tests still verify decoded output, CLI isolation
tests pass, and the exact pushed SHA is green without weakening existing gates.

## Notes

This does not approve PR-trigger policy changes under D-2.

## Implementation evidence

The implementation starts at fetched `origin/main`, `e3428eeb4b88fb44bf23dcafc1dcf16a08167353`,
including rotation atop VERIFY-3. No local metadata, runtime source, browser specs, styles, master
queue, or historical review record was changed.

### Target classification

- Production `editor` and `4k` projects select `editor`, `refinements`, `controls`, and `cursor`.
  These cover local import/privacy, edit/undo, transport, save/reopen, failed imports/projects/media
  repair, and actual HD/4K video downloads. Node-side fixture imports remain valid.
- Dev `fixtures` and `fixtures-4k` select `export`, `framing`, `auto-zoom`, `cursor-render`,
  `cursor-shapes`, and `cursor-rotation`. Each contains browser-evaluated imports of `/src` or
  `/node_modules`. Encoded-pixel, audio, framing, shape, and rotation assertions are unchanged.
- Storybook and performance have separate projects. Specs that explicitly navigate to
  `STORYBOOK_URL`, including the mixed cursor spec, still use that built Storybook server.
- New specs default to production. The planned UI-1 `icon-button.spec.ts` needs no source-fixture
  exception. It did not exist during this verification and is not claimed as tested.
- CLIP-25's permanent `frame-image.spec.ts` is preclassified as dev after inspecting its recorded
  `page.evaluate` imports of `/src/export.ts` and the Mediabunny browser bundle. That spec is not
  present on this base and is not claimed as tested. Its temporary reproduction specs are not copied
  or added to this ticket.

CI's existing Playwright invocation selects every project. Production preview starts only after
`npm run build` succeeds, even when `dist` exists. The isolated CLI builds production for `editor`,
`media`, `composition`, `delivery`, `performance`, and `all` into its invocation-owned temporary
directory. Only `export` and `all` start dev. Caller URLs are replaced, all three allocated ports
are distinct, and every isolated server retains `reuseExistingServer: false` and strict-port checks.

### Red/green and local gates

The runnable regression command is:

```bash
node --test .agents/skills/verify-clipper/scripts/verify.test.mjs
```

Before implementation, two new checks failed. The discovered UI controls targeted dev instead of
production. An editor CLI fixture with an invalid fresh-build config and stale `dist` nevertheless
ran its selected test and exited 0 without building. After implementation, all seven Node tests
passed. They also execute CI's actual server command against missing and stale output with a failing
build, require its nonzero exit, and retain interruption/port-release checks.

Local verification receipts are under `.amp/in/orb-backup/ref18/`:

- `red.log` records the two expected pre-change failures.
- `node-green.log` records 7 passed, 0 failed/skipped Node tests.
- `full-gates.log` records format, static lint, typed lint, typecheck, helper-script lint, 133 unit
  tests across 9 files, shrink-only Fallow against `origin/main`, production/Storybook builds,
  ticket audit, and diff checks. Ticket audit found 106 unique IDs, 34 findings, and 33
  informational dispositions. All commands exited 0. No baseline or threshold changed.
- `all.log` and `all/all-JqjclD/` record the real isolated `all` gate. It built fresh production and
  Storybook, then passed 43 browser tests with 0 unexpected, skipped, or flaky results. Production
  traces fetched hashed `/assets/index-*.js` bundles. Dev fixture tests retained their real module
  imports and FFmpeg decoded-output assertions.
- `ci-browser.log` and `ci-results.json` record a separate real CI-mode root-config run on unique
  ports. It rebuilt production despite existing `dist` and passed 43 tests with 0 unexpected,
  skipped, or flaky results. The original 43 test identities are unchanged. Both runs selected 25
  production editor, 1 production 4K, 12 dev fixtures, 1 dev 4K, 2 Storybook, and 2 uninstrumented
  performance tests.
- After reserving CLIP-25's fixture match, `final-gates.log` repeats all static, unit, Fallow,
  build, ticket/diff, and Node checks successfully. `final-all.log` and `final-all/all-C6Bzpo/`
  repeat the isolated gate with 43 passed and 0 unexpected, skipped, or flaky results.

Performance smoke assertions run last, with one worker, 1x scale, and trace/video disabled. No other
browser or build workload ran alongside either performance case. This is not a claim of the separate
five-repetition performance gate or physical speaker verification. Only bundled public and synthetic
media was used. No private Mac capture material was accessed.

No push, deployment, or remote CI success is claimed by these local receipts. The master queue
remains owned by the dispatcher.
