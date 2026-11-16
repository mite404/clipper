# Clipper

Local-first React video editor. Source media stays in the browser. See README.md for the development
and verification commands, and `.agents/skills/verify-clipper/` for user journeys.

## Ticket delivery

- Use `docs/master-tickets.md` as the only operational queue. Before assigning or delivering a
  ticket, read `docs/ticket-workflow.md` for scope, verification and delivery procedures.
- Run small, bounded eligible tickets on Sonnet 5.5 medium with poteto-mode and emil-design-eng.
  Keep larger and already assigned Sol work on GPT-6.1 Sol medium unless the owner directs
  otherwise.
- Every Sonnet ticket requires an actual GPT-6.1 Sol medium review of its exact diff, with findings
  fixed. Source and tooling tickets also require the existing Fable reviewer's pre-landing verdict
  on the exact candidate or correction delta, one ticket at a time. Use Fable sparingly for review,
  not implementation or coordination. Do not repeat the baseline review or require it for docs-only
  delivery.
- The coordinator grants shared-path ownership and retains the single main push slot. Respect
  existing reservations. Fetch and rebase onto latest main, rerun affected and full gates, then push
  one tested ticket. Wait for accepted review and green CI on the exact delivered main SHA before
  releasing the slot or starting the next ticket in that lane.
- When checks fail, obtain the worker's actual failure report, assess it and direct fixes. Preserve
  strict gates and the shrink-only Fallow baseline. Pending CI is not delivery.
- After acceptance and exact-main green CI, start the next eligible bounded Sonnet ticket without
  per-ticket approval. Continue until none remain eligible; wait for dependencies rather than taking
  another owner's paths. Escalate decisions outside approved scope, not routine repairs.
- Archive a delivered implementation thread only after main acceptance and exact-SHA green CI, and
  only when it has no remaining assignments, unshipped changes or follow-ups. Keep coordinators,
  stable portals, active reviewers, experiments awaiting review and dependency-held threads open.
  Archival does not authorize deleting branches or worktrees.
- This workflow authorizes tested main delivery, not production deployments, private-media uploads,
  paid services, history rewrites or branch deletion.

## GitHub follow-ups in Amp

- After every push, subscribe the working Amp thread to CI results for the exact pushed commit and
  branch using `create_github_subscription` with `filter_kind: ci` and `automatic: true`.
- After opening a PR, subscribe that thread with `filter_kind: pr-comments`, the repository and PR
  number, and `automatic: true` to receive comments and reviews.
- Before handing back work, verify matching subscriptions exist and are active. Reuse equivalent
  active subscriptions; do not treat a paused subscription as active. If subscription tools or
  access are unavailable, report that CI/review feedback will not return automatically.
- On CI failure, inspect the failed checks and logs, fix failures caused by your changes, and
  subscribe to the new commit after pushing an authorized fix. A subscription grants no new
  permission to push, merge, deploy, or change unrelated code.
