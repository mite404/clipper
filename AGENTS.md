# Clipper

Local-first React video editor. Source media stays in the browser. See README.md for the development
and verification commands, and `.agents/skills/verify-clipper/` for user journeys.

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
