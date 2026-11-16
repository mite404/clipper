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

`playwright.config.ts` still starts a Vite dev server for editor journeys in CI. The isolated CLI
also uses dev for editor, plus a production preview for performance. Export tests dynamically import
`/src/` modules, so retaining that fixture target is necessary. Finding #18 is not delivered.

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

| Path                                     | Role                                             | Edit or Read                        |
| ---------------------------------------- | ------------------------------------------------ | ----------------------------------- |
| `playwright.config.ts`                   | CI projects and server targets                   | Edit                                |
| `.agents/skills/verify-clipper/scripts/` | Isolated CLI targets and Node tests              | Edit                                |
| `tests/*.spec.ts`                        | Separate UI journeys from source-import fixtures | Read, edit selectors only if needed |
| `.github/workflows/ci.yml`, `README.md`  | Actual gate contract                             | Read, update if commands change     |

## Initial state and preflight

Run [dispatch preflight](../ticket-workflow.md#initial-state-and-preflight). Inspect drift in both
Playwright configs and verify.mjs. Follow skill-authoring guidance before editing skill files.

## Done when

Production editor journeys execute in CI, fixture tests still verify decoded output, CLI isolation
tests pass, and the exact pushed SHA is green without weakening existing gates.

## Notes

This does not approve PR-trigger policy changes under D-2.
