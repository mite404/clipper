# VERIFY-6

Authoritative state: [master ticket](../master-tickets.md#verify-6). This brief holds scope and
evidence, not live status.

## Contract

REF-31 delivered `tests/transport-lifecycle.spec.ts`, but the named `editor` journey did not select
it and its native Chromium launch ignored `CHROME_PATH`, unlike `doctor` and the Playwright config.
Both gaps are test-tooling only. REF-31's product behavior, strict assertions, sixty-second test
budget and thirty-second DevTools-port wait are unchanged, as is its trace and video exception that
keeps a background tab truly hidden.

## Scope

Granted paths: `.agents/skills/verify-clipper/scripts/verify.mjs`, `verify.test.mjs`, `SKILL.md`,
`features/README.md`, `features/timeline-transport.md`, `tests/transport-lifecycle.spec.ts` and this
brief. No product source, package, config, CI, performance workload or baseline, master, or
managing-tickets edits.

## Change

- `verify.mjs` lists `transport-lifecycle.spec.ts` under `editor`. `all` already discovers it.
- The spec launches `process.env.CHROME_PATH || chromium.executablePath()`. Its local child-process
  variable is renamed from `process` to `chrome`; otherwise `process.env` would read the shadowing
  `const` before it is initialized and throw.
- `SKILL.md`, `features/README.md` and `features/timeline-transport.md` list the spec under
  `editor`, document the `CHROME_PATH` scope and the Chromium-only limit, and drop the stale
  statement that held-Space toggles and hidden-tab rewind have no coverage.

## Proof

Both helper tests drive real programs, not source strings. Full logs are in
`.amp/in/orb-backup/verify6/`.

1. `editor journey runs the transport lifecycle spec and no unrelated spec` runs the actual
   `verify.mjs editor` in an isolated temp workspace with five trivial specs, one of them a decoy
   (`controls.spec.ts`), and requires Playwright's `results.json` to list exactly `editor`,
   `refinements`, `transport-end` and `transport-lifecycle`.
2. `native tab test launches the CHROME_PATH executable` runs the real `transport-lifecycle.spec.ts`
   native test with `CHROME_PATH` set to a recording wrapper script that logs its arguments and then
   execs the real Chromium. The app URL is a closed loopback port, so the test must fail at
   navigation with `ERR_CONNECTION_REFUSED`, proving the wrapped browser started and connected over
   CDP. The log must contain `--remote-debugging-port=0` and the spec's `clipper-visibility-`
   profile.

Red on `b44e7c9` (`red.log`): test 1 fails because the actual list is `editor`, `refinements`,
`transport-end`; test 2 fails with `ENOENT` opening the wrapper's log, because the original spec
never ran the wrapper. Each test fails alone when only its own change is reverted
(`mutant-verify-original.log`, `mutant-spec-original.log`). Green with both changes:
`green-targeted-restored.log`. With `CHROME_PATH` unset or empty the spec still reaches navigation
through Playwright's Chromium.

Static gates on the candidate (`static.log`): format, lint, typed lint, Oxc typecheck, `tsc`, ticket
audit, dead-code, shrink-only health against `origin/main`, `git diff --check` and Oxlint on the
helpers all exit 0.

A mistaken test-name pattern also ran all nine helper tests, including the interruption test, which
builds the real editor before killing it. It passed 9/9
(`green-helper-all-nine-incl-interruption.log`) but ran before the serialized slot, so the
coordinator should rerun it there.

## Limits

These checks use only synthetic or public media and run Chromium only. They do not qualify other
browsers, devices or speakers. The real `editor` journey with the override, the full helper test
file and any full or performance gate run in the coordinator's serialized acceptance slot and are
reported separately from this brief.
