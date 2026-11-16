# Local ticket workflow

`master-tickets.md` is the only operational queue and status source. Selected tickets get a
`tickets/<ID>.md` brief whose H1 is the ID. The brief holds scope and evidence, not another live
status field. Proposals can retain inline scope in the master until selected. No external issue
creation is part of this workflow.

## Initial state and preflight

The five initial briefs were planned on 2026-11-16 at `7b23be80ff417e061d5c74ac127759b20a5b80ef`,
the observed GitHub main. Its exact-head
[CI](https://github.com/mite404/clipper/actions/runs/43786045477) passed. These are commands to run
at dispatch, not claims that every future preflight passed:

```bash
git fetch origin main
git rev-parse HEAD
git status --short
git diff --stat 7b23be80ff417e061d5c74ac127759b20a5b80ef..HEAD -- src tests
git diff -- src tests
git diff --cached -- src tests
git stash list
npm run format:check
npm run lint
npm run lint:typed
npm run typecheck
npm test
npm run -s check:code -- --fail-on-baseline-growth --baseline-base origin/main
git diff --check
```

Record actual HEAD and relevant drift from the planning SHA. Preserve staged, unstaged and untracked
work. Never reset another worker's changes. REF-26 is preserved in a named stash, not part of GitHub
main. Restore only its paths when resuming it. No implementation worker may write until the queue
owner grants ownership. The sole main push slot remains with the queue owner.

## Verification and delivery

First reproduce user-visible behavior and make the relevant test fail. Run the affected checks, then
the full gates from the master list. For shared editor changes run
`node .agents/skills/verify-clipper/scripts/verify.mjs all`. Run the isolated `performance` journey
alone for performance work. Use real media APIs and synthetic or public inputs, never private Mac
capture material. Keep Fallow shrink-only; no threshold relaxation or suppression to get green.

Before delivery, fetch and rebase onto current `origin/main`, rerun affected and full gates, inspect
the diff, and verify author and committer use the approved noreply address. Push one ticket from a
clean tree, subscribe the exact SHA, and wait for green CI. Only then update the master to
Delivered. No deployment, history rewrite or branch deletion is authorized. Preserve the actual
failing and passing receipts and any unverified acceptance in the brief or linked evidence.
