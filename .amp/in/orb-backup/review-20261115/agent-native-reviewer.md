## Agent-Native Architecture Review

### Summary
Clipper has no in-app agent, so its agent surface is the `verify-clipper` skill, `AGENTS.md`, the README and the Playwright/service config. Every core editing action is reachable through labelled controls and all selectors, test titles, story IDs, ports and script paths in the skill exist. The surface is not accurate enough to rely on yet: every focused command in `features/*.md` fails as written in an orb, and can silently test a stale build once the shared editor service is up.

I reviewed HEAD `5a9bc1f` and started no servers, so no browser journey was run end to end. The working tree is clean and my probe output is deleted.

### Capability Map

| UI Action | Location | Agent Tool | In Prompt? | Priority | Status |
|---|---|---|---|---|---|
| Import media, source in/out, insert | `components.tsx:89`, `App.tsx:138-193` | `editor.spec.ts` `-g 'imports local'` / `'difficult imports'` | local-media.md | Must | OK |
| Split / delete / undo | `App.tsx:620-624,1068-1086` | `-g 'splice, scrub'` | timeline-transport.md | Must | OK |
| Edge trim | `Timeline.tsx:201-217` | `refinements.spec.ts` | timeline-transport.md | Must | OK |
| J/K/L, Space, mute | `App.tsx:611-617`, `Timeline.tsx:127` | `-g 'splice, scrub'`, `-g 'shortcuts dialog'` | timeline-transport.md | Must | OK |
| Zoom add/edit, mark mouse position | `App.tsx:320-402,936` | `refinements.spec.ts`, story `mouse-centered-zoom` | composition.md | Must | OK |
| Crop, radius, swap sides | `App.tsx:249-291` | `editor.spec.ts`, `refinements.spec.ts`, `storybook.spec.ts` | composition.md | Must | OK |
| Save / open project | `App.tsx:849` | `refinements.spec.ts` | project-delivery.md | Must | OK |
| Export HD/4K | `App.tsx:869` | `export.spec.ts`, `refinements.spec.ts` | project-delivery.md | Must | OK, but dev-server only and no command given |
| Frame step (←/→, Previous/Next frame, Go to start) | `App.tsx:618-619,1020-1040` | none | Not mentioned | Low | Unmapped |
| Zoom start/duration fields, remove zoom | `App.tsx:344,367` | none | Named in composition.md, no journey | Should | Untested |

### Findings

#### Critical (Must Fix)

1. **Focused feature commands test the wrong target or cannot launch** — [playwright.config.ts L3-L4](file:///home/user/workspace/repo/playwright.config.ts#L3-L4): `process.env.BASE_URL || (process.env.CI ? 'http://127.0.0.1:4317' : 'http://localhost:5173')`.
   - **Where it bites:** `npm run test:ui -- tests/editor.spec.ts -g '…'` at [local-media.md L22-L24](file:///home/user/workspace/repo/.agents/skills/verify-clipper/features/local-media.md#L22-L24), [timeline-transport.md L24](file:///home/user/workspace/repo/.agents/skills/verify-clipper/features/timeline-transport.md#L24), [composition.md L26](file:///home/user/workspace/repo/.agents/skills/verify-clipper/features/composition.md#L26) and [shared-library.md L22](file:///home/user/workspace/repo/.agents/skills/verify-clipper/features/shared-library.md#L22). None carries the `CHROME_PATH`, `BASE_URL` or `PERF_URL` that [SKILL.md L71-L73](file:///home/user/workspace/repo/.agents/skills/verify-clipper/SKILL.md#L71-L73) sets for the full run only, and agent shells do not keep an `export` between calls.
   - **Verified in this orb:** without `CHROME_PATH` the run fails with `browserType.launch: Executable doesn't exist at ~/.cache/ms-playwright/chromium_headless_shell-1255/…`, because no Playwright browser is installed. With `CHROME_PATH` it fails with `net::ERR_CONNECTION_REFUSED at http://localhost:5173/`; it never touches the isolated server on 4317.
   - **Worse case:** once `amp orb services ensure` has run, 5173 is the production preview from [.amp/services.yaml L3-L4](file:///home/user/workspace/repo/.amp/services.yaml#L3-L4), built once at service start ([README.md L68-L69](file:///home/user/workspace/repo/README.md#L68-L69)). Focused journeys then pass against the old build, not the agent's edited source. `tests/export.spec.ts` fails there instead, because it imports `/src/media.ts` from the server.
   - **Fix (S):** make 4317 the default `baseURL` in every mode, and make `performance.spec.ts` L7 default to `http://127.0.0.1:5173` rather than `/`. Add a `test` subcommand to `control-clipper.sh` that resolves `CHROME_PATH`, sets `BASE_URL=$URL` and runs `npm run test:ui -- "$@"`; use it in every feature file and in the README's verify block.

#### Warnings (Should Fix)

1. **Full run's prerequisites are stated but not actionable** — [SKILL.md L76-L79](file:///home/user/workspace/repo/.agents/skills/verify-clipper/SKILL.md#L76-L79): "Storybook must be running on its declared port 6006 … The performance test requires a production build on `PERF_URL`".
   - Following Launch, Doctor, Drive in order starts only 4317, so 3 of 17 tests (performance and both Storybook) get connection refused.
   - If the editor service is already up, the performance gate measures the pre-change build.
   - Recommendation: before the Drive command, add `amp orb services ensure` and `amp orb service restart editor` (the restart rebuilds), and say why.

2. **CI never runs for a feature-branch push or a PR** — [.github/workflows/ci.yml L3-L6](file:///home/user/workspace/repo/.github/workflows/ci.yml#L3-L6) triggers only on `push: branches: [main]` and `workflow_dispatch`.
   - [AGENTS.md L8-L9](file:///home/user/workspace/repo/AGENTS.md#L8-L9) says "After every push, subscribe the working Amp thread to CI results for the exact pushed commit and branch". The subscription parameters match the real tool, but on any other branch no result ever arrives.
   - [SKILL.md L44-L46](file:///home/user/workspace/repo/.agents/skills/verify-clipper/SKILL.md#L44-L46) "Verify the actual GitHub run" has nothing to verify in that case.
   - Recommendation: add `pull_request:` to the workflow, or state in `AGENTS.md` that CI runs only on `main` and other branches need `gh workflow run ci.yml --ref <branch>`.

3. **The local gate is weaker than CI while claiming to be the same** — [SKILL.md L44-L45](file:///home/user/workspace/repo/.agents/skills/verify-clipper/SKILL.md#L44-L45): "GitHub CI runs the stricter checks below".
   - CI runs `npm run check:code -- --fail-on-baseline-growth --baseline-base HEAD^` and `npm run test:ui -- --workers=1` ([ci.yml L36](file:///home/user/workspace/repo/.github/workflows/ci.yml#L36), [L45](file:///home/user/workspace/repo/.github/workflows/ci.yml#L45)); the skill lists neither flag set.
   - An agent that adds a baseline entry passes the local `npm run check:code` and fails CI.
   - CI does not run `npm audit`, which the skill lists.
   - Recommendation: list the exact CI commands and mark `npm audit` as local-only.

4. **"Run five repetitions" has no command** — [SKILL.md L80](file:///home/user/workspace/repo/.agents/skills/verify-clipper/SKILL.md#L80): "Run five repetitions without a CPU profiler."
   - Nothing in the test or config repeats, so each agent will improvise.
   - Recommendation: give `PERF_URL=http://127.0.0.1:5173 npm run test:ui -- tests/performance.spec.ts --repeat-each 5 --workers=1`.

#### Observations

1. **Story count is wrong.** [shared-library.md L8](file:///home/user/workspace/repo/.agents/skills/verify-clipper/features/shared-library.md#L8) "Thirteen stories" and [README.md L27](file:///home/user/workspace/repo/README.md#L27) "Thirteen Storybook records"; `src/Editor.stories.tsx` L207-L227 exports twelve. Change both to twelve.
2. **Doctor's media check cannot fail on the dev server.** [control-clipper.sh L13-L15](file:///home/user/workspace/repo/.agents/skills/verify-clipper/scripts/control-clipper.sh#L13-L15) uses `curl -fsSI "$URL/media/$file"`, and Vite 7.3.8 rewrites unknown paths to `/index.html` for `Accept: */*` (read in the Vite source, not run). The skill does also require `4 assets ready`. Fix: assert the content type is `video/*` or `audio/*`.
3. **`stop` can strand the state file.** [control-clipper.sh L36-L39](file:///home/user/workspace/repo/.agents/skills/verify-clipper/scripts/control-clipper.sh#L36-L39): `amp orb service stop` exits 1 for a service that is not running (verified), so under `set -e` the `rm "$STATE"` never runs and `launch` keeps answering "Instance already owned". Fix: `amp orb service stop "$SERVICE" || true; rm -f "$STATE"`. Separately, `doctor` ignores the port saved in the state file and uses the current `VERIFY_PORT`.
4. **"Exact test title listed in the matching feature file" is not true.** [SKILL.md L83-L84](file:///home/user/workspace/repo/.agents/skills/verify-clipper/SKILL.md#L83-L84): the files give four substrings (each matches exactly one test) and no titles for the refinements, export, performance or Storybook tests. Add them from `npx playwright test --list`.
5. **Cleanup check fails after focused runs.** [SKILL.md L107](file:///home/user/workspace/repo/.agents/skills/verify-clipper/SKILL.md#L107) `test -d .amp/in/artifacts/verification` exits 1 unless a run passed `--output`. Playwright also empties that directory at the start of each run, so a second run erases the first run's traces.
6. **Frame stepping is not in the feature map** (←/→ keys, Previous/Next frame, Go to start), although the controls are labelled.

### What's Working Well
- Every selector, test ID, story ID, test title substring and port the skill names exists in the code; `--list` shows the 17 tests in the `editor` and `4k` projects.
- `control-clipper.sh` passes `bash -n`, resolves the repo root correctly, and uses `amp orb service start` flags that exist; `agent-browser wait --text` is valid.
- The listed gate commands I ran pass at HEAD: `format:check`, `lint`, `check:code`, `npm test` (54 passed) and `npm audit` (0 vulnerabilities). I did not run `lint:typed`, `typecheck`, `build` or `build-storybook`.
- The saved project JSON gives an agent the full edit state without reaching into React.

### Score
- **12/12 high-priority capabilities are agent-accessible** through labelled controls with a mapped journey.
- **Verdict:** NEEDS WORK — the capabilities are there, but the instructions for exercising them fail or mislead until Critical 1 and Warnings 1-2 are fixed.

**Assumptions:** I treated the orb as the main place agents run this skill. The stale-build claim comes from reading `.amp/services.yaml` and the README, not from watching a run.
