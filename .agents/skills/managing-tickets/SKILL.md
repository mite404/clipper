---
name: managing-tickets
description: >-
  Coordinates Clipper ticket assignment, implementation, review, verification, serialized main
  delivery and archival. Use before performing any of those ticket operations.
---

# Managing Clipper tickets

Use `docs/master-tickets.md` as the sole operational state record. Read paths below relative to the
repository root. This skill owns the workflow policy, not ticket status or current assignments.

## Assign and scope

- Read the master's current scope, dependencies, owner and path reservations before assigning work.
  Prioritize correctness, performance and unblocking changes before dependent features; optional
  cleanup must not delay features. Wait for dependencies rather than taking another owner's paths.
- Preserve existing models, candidates and unshipped changes when transferring assignments. Obtain
  the coordinator's exact-path grant before a worker edits shared files. The coordinator retains the
  sole main writer and push slot; disjoint preparation does not grant concurrent delivery or
  acceptance runs.
- Maintain exactly two implementation workers: `anthropic/claude-opus-5-5` with medium effort for
  non-simple tickets, and `anthropic/claude-sonnet-5-5` with high effort for easy, bounded tickets.
  Keep both queues, readiness, ownership transfers and disjoint grants in the master. Transfer
  preserved candidates before editing; former implementation owners retain evidence without a
  concurrent implementation grant. Additional implementation workers need the owner's approval.
- Other newly created worker threads use `anthropic/claude-opus-5-5` with medium effort unless Mite
  explicitly names an exception. Existing threads retain their locked models. The two-lane
  implementation exception does not change required reviews or authorize extra reviewers.
- Follow poteto-mode and emil-design-eng. Selected tickets may have `docs/tickets/<ID>.md` briefs
  with the ID as H1 and a link to their master anchor. Briefs hold acceptance/evidence, not another
  live status field. Proposals may retain inline scope in the master until selected.

## Preserve and verify

- Fetch `origin/main`, record actual base/HEAD and inspect staged, unstaged, untracked and stashed
  work before integration. Transfer other threads' unpushed work with real change/file-transfer
  tools or verified Git bundles/WIP branches before editing. Never overlay stale files or reset
  another worker's changes. A fresh checkout must not discard an existing local candidate.
- Reproduce user-visible defects end to end first. Use red/green TDD for behavior changes and retain
  the first-failure and passing receipts. Verify the public contract, not only compilation.
- Use Storybook for shared controls, break-ui for affected layout edge cases, real Playwright
  verification and the project verify-clipper skill for affected journeys. Inspect rendered UI
  states and pointer/keyboard evidence for UI changes. Keep preview/copy/export behavior aligned.
- Run affected checks and the existing full gates before delivery. The package scripts and CI define
  the mechanical gates; use the verify-clipper skill for their execution details. Include
  `node scripts/check-tickets.mjs` and `git diff --check` for ticket/guidance edits. Shared editor
  changes require `node .agents/skills/verify-clipper/scripts/verify.mjs all`; performance changes
  also require the isolated `performance` journey alone. Docs-only work needs applicable doc/link/
  ticket checks; remote CI still runs the repository's full pipeline.
- Keep Fallow identity/stale-baseline checks and the shrink-only comparison against latest main.
  Never loosen thresholds, suppress failures or expand the baseline to manufacture a pass.
- Use synthetic/public fixtures and local media APIs. Do not transfer, upload or call `view_media`
  on private capture video, sidecars, frames or crops. Real-recording compatibility stays unclaimed
  until the master's real-fixture gate is satisfied. Preserve responsive playback and local-only
  processing.

## Review the exact candidate

- Each implementation ticket gets one exact-diff review, by the code reviewer named in the master's
  Owners table, using the `ce-code-review` skill (owner decision, 2026-11-18). Fix accepted findings
  before delivery. Do not add a second reviewer or panel, and do not repeat a completed review.
  Docs-only delivery needs no review.
- A verdict applies only to its reviewed diff/tree. Preserve frozen candidates; qualify later deltas
  explicitly rather than silently extending an old verdict. A review PASS alone is not verification
  or delivered-main acceptance.
- When checks fail, obtain the worker's actual failure report, assess it and direct corrections.
  Preserve failing receipts and strict assertions. Escalate decisions outside approved scope, not
  routine repairs; do not claim success while required checks fail or CI is pending.

## Deliver one tested ticket

1. Obtain the coordinator's sole main push slot for the ticket and exact paths. Preserve unrelated
   WIP separately; the delivery tree must be clean. Rebase onto fetched latest `origin/main`, rerun
   affected/full gates and inspect the final exact diff. A local green on an older base is not the
   final gate. Do not amend a reviewed candidate without qualifying the correction.
2. Check author and committer use `Ethan Anderson <150651098+mite404@users.noreply.github.com>`
   before publishing; rebasing can replace committer identity. Push one tested ticket to main
   without force-push. Several commits may represent one ticket; CI's baseline comparison uses the
   commit main held before the push.
3. Subscribe this working thread to exact pushed SHA/branch CI with `create_github_subscription`,
   `filter_kind: ci` and `automatic: true`. If a PR is opened, also subscribe to `pr-comments` for
   that repository/PR. Reuse equivalent active subscriptions; paused is not active. Verify them
   before handing back work. If unavailable, report that feedback will not return automatically.
4. Wait for accepted review and successful required CI on the exact delivered main SHA. Inspect
   failed checks/logs and fix failures caused by the change under the existing authorization;
   subscribe to any authorized corrected SHA. Subscriptions grant no new push/deploy permission.
5. Only after acceptance and exact-SHA green CI, mark the ticket Delivered in the master and release
   its paths/push slot. Report actual commits, CI, remaining acceptance and ownership handoffs.
   Local, committed, pushed, CI-accepted and deployed are different states.
6. Send the accepted main SHA and successful exact-SHA CI directly to the canonical preview owner
   listed in the master. Require that owner's promoted revision and verification receipt before
   describing the canonical portal as updated. A Space report or CI subscription is not promotion.

Continue with the next eligible bounded ticket after accepted delivery without per-ticket approval.
Keep dependent/overlapping workers held; continue unrelated eligible work. Stop a lane at genuine
owner-only gates, not routine integration decisions. No external issue creation is implied.

## Archive without losing ownership

Archive a delivered implementation thread only after main acceptance and exact-SHA green CI, and
only when it has no remaining assignments, unshipped work or follow-ups. Recheck ownership before
archiving a reused worker. Keep coordinators, stable portals, active reviewers, dependency-held
threads and experiments awaiting review open. Keep portal owners until responsibility is resolved.
Archival does not authorize deleting branches or worktrees. Preserved WIP branches need explicit
owner approval for deletion.

Tested direct-main delivery is authorized within approved ticket scope. This does not authorize
production deployments, private-media uploads, paid services, published-history rewrites or branch
deletion. Seek explicit approval for those actions; keep published history unchanged by default.
