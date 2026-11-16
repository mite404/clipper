# Local ticket workflow

`master-tickets.md` is the only operational queue and status source. Selected tickets get a
`tickets/<ID>.md` brief whose H1 is the ID. The brief holds scope and evidence, not another live
status field. Proposals can retain inline scope in the master until selected. No external issue
creation is part of this workflow.

## Continuous small-ticket Sonnet lane

The owner's 2026-11-16 standing authorization supersedes the historical one-ticket Sonnet limits.
Use the [saved workflow][sonnet-workflow] and the sole master queue to select genuinely small,
bounded candidates whose dependencies and path ownership permit implementation.

Run implementation on Sonnet 5.5 medium with poteto-mode and emil-design-eng. Every ticket requires
an actual GPT-6.1 Sol medium code review of its exact diff, findings fixed, all verification gates,
and green exact-delivered-head CI. CI alone is not code review. The coordinator retains shared-path
ownership and the exclusive main push slot. Larger or already assigned Sol work stays with Sol.

After a reviewed ticket lands green, start the next eligible Sonnet candidate without a new
per-ticket approval request. Wait for dependencies and existing owners instead of taking their
paths. REF-31 starts only after REF-20's green delivery releases its rewind reservation; its
approved behavior pauses rewind on tab hide and ignores repeated Space toggles.

When checks fail, get the Sonnet worker's actual failure report, assess it and direct corrections.
Do not waive gates. Report substantive blockers and decisions outside approved scope. This standing
authorization does not permit production deployment, private-media uploads, paid services, history
rewrites or branch deletion.

[sonnet-workflow]:
  https://ampcode.com/artifacts/skills/sonnet-ticket-workflow-6be44ca7-55ac-4f1c-b705-d1267f0d846c

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
