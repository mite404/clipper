# Clipper master ticket list

This is the only operational queue for Clipper. Workers, the Space and the owner read status here
and nowhere else. Other documents are records, not queues:

- [docs/refactor/refactor01.md](refactor/refactor01.md) is the one-time review of baseline
  `5a9bc1f`. Its finding numbers (`#1` to `#38`) are cited below.
- [Reference features and capture evidence](reference-features.md) preserves the current reference
  artifact's revision 8, including source links and acceptance details. The owner approved deleting
  only that artifact; its owning thread confirmed deletion on 2026-11-16.
- The
  [refinement tickets](https://ampcode.com/artifacts/clipper-refinement-tickets-9f40b94d-40bf-4ca2-9641-78208057b5a2)
  and the
  [steel thread verification](https://ampcode.com/artifacts/clipper-steel-thread-verification-72434030-61d6-453a-a53c-982d2ce52e29)
  are the acceptance and evidence records for CLIP-1 to CLIP-6.

## Reading current state

The remaining-ticket audit is resolved into this file. Its separate artifact no longer carries an
inventory or status. Update ticket scope, state, dependencies, ownership and priority here only.
Artifacts and ticket briefs may retain supporting evidence, but never a competing state record.

Each anchored ticket row below is its canonical entry. [Order of work](#order-of-work) is the one
sequencing record; older candidate/grant narratives preserve history, not a second current
assignment. The audit's previously unnumbered scopes are UI-8 through UI-12, CLIP-2d and VERIFY-6.
Subtitles expand CLIP-33, the Add zoom follow-up stays in CLIP-9b, and CLIP-31 remains an umbrella
rather than another exporter. Their scope, gates and delivery limits are recorded at those entries.

## Workflow

The queue thread owns updates to this state record; workers send it scope and evidence. Load
[managing-tickets](../.agents/skills/managing-tickets/SKILL.md) for workflow policy, new-thread
defaults, review gates, verification, delivery and archival. Current state stays here.

The repository is `https://github.com/mite404/clipper.git`. The Amp project has used it as its
primary repository since 2026-11-16; the Amp-hosted scaffold is gone. See
[Known limits](#known-limits) for the historical private-media hosting record.

## Two-lane queue audit, 2026-11-19

Audited against `origin/main` `d9d3b6f3e22301197ec07bc0f3b98978d595308e` (green exact-SHA
CI44440331315, promoted) and the coordinator's staged batches. Each ticket row below carries its own
state; this section only summarizes. 55 tickets remain open: 9 in flight, 5 partly delivered with
named scope left, 32 to scope (some held on another ticket) and 9 gated on an environment, a real
fixture or the owner. Decision rows (D-1 to D-10), closed REF-23 and CLIP-44, parked UI-12, CLIP-46
and CLIP-47, conditional REF-24/29/34 and the CLIP-31 umbrella are not counted.

| Group                      | Tickets                                                                                                                                                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivered (batch 5)        | CLIP-19b, UI-4, UI-8 view/scrubbing part, UI-17 and REF-68 at `8e7b506`, plus the UI-16 font preload `74b719a`; pushed 2026-11-19                                                                                 |
| Delivered (batch 6)        | CLIP-20c `bdd6ab7`, the Layout choice fix `2538622` and UI-14 `5f75096`; pushed 2026-11-19, green exact-SHA [CI44577985376](https://github.com/mite404/clipper/actions/runs/44577985376)                          |
| Delivered (CLIP-20d)       | WebP backgrounds and the background-image control at `046eedc`; pushed 2026-11-19, green exact-SHA CI44581073353                                                                                                  |
| Delivered (CLIP-17 polish) | CLIP-17 gain-row polish at `66b0d51`; pushed 2026-11-19, green CI on its docs head `83f8e16`                                                                                                                      |
| Delivered (CLIP-49)        | CLIP-49 phase 1 in-app assistant at `a8848cb` (`21004c6` plus two case-gate rename commits and a CI timeout fix); pushed 2026-11-19, green exact-SHA CI44594000504                                                |
| Delivered (REF-71)         | Source footer keeps only the asset count at `589a0e1`, plus the owner-directed toolbar-centering follow-up `91b230b`; pushed 2026-11-19, green exact-SHA CI44623097400                                            |
| Delivered (REF-69)         | Pool-local source scrub at `1407036`; pushed 2026-11-19, green exact-SHA CI44630820804                                                                                                                            |
| Delivered (REF-70)         | Resolution and fps on compact pool rows at `7544b6c`; pushed 2026-11-19, green exact-SHA CI44638639368 (after one apt-mirror rerun)                                                                               |
| Partly delivered           | CLIP-11 (synthetic scope), CLIP-15 (audio scrub), CLIP-22 (hide, mirror, size, roundness), CLIP-41 (power saving), CLIP-9b (full ramps)                                                                           |
| Ready to scope             | CLIP-13, CLIP-18, CLIP-19, CLIP-21, CLIP-23 (CLIP-22 PiP is delivered), CLIP-24, CLIP-27, CLIP-30, CLIP-35, CLIP-40, CLIP-42, CLIP-16 manual retiming                                                             |
| Held on another ticket     | CLIP-28 (CLIP-27), CLIP-39 (CLIP-19, CLIP-20), CLIP-45 (CLIP-40), CLIP-37 (CLIP-35), CLIP-33 then CLIP-34 and CLIP-36, CLIP-38 (REF-22), CLIP-26 (association semantics), CLIP-11b, UI-11, CLIP-2d, PUB-2 (PUB-1) |
| Contract-held              | CLIP-12 (licensed sound), CLIP-2b with UI-9, UI-10, REF-22, REF-30, PUB-1                                                                                                                                         |
| Gated                      | CLIP-14 (key events), CLIP-31a to CLIP-31c (D-9), CLIP-7b and CLIP-43 (D-4), CLIP-48 (device), REF-33 (another WebCodecs browser), REF-37 (recurrence evidence)                                                   |

Chapter flag creation, export and editing beyond delivered CLIP-29 are deferred by the owner
([ADR-37](adr.md#adr-37-further-chapter-work-is-deferred)). Follow [Order of work](#order-of-work)
over numeric order.

### Excluded from new implementation assignments

| Entries                                                 | Disposition                                                                                                                             |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [REF-27b](#ref-27b)                                     | Delivered at accepted `631f0bc`, exact-SHA CI44012171159 green; excluded from remaining counts. Canonical editor promoted and verified. |
| [REF-24](#ref-24), [REF-29](#ref-29), [REF-34](#ref-34) | Conditional proposals only; evidence thresholds are unmet, so do not manufacture cleanup work or feature prerequisites.                 |
| [UI-12](#ui-12)                                         | Parked by the owner; no adoption or implementation grant.                                                                               |
| [CLIP-46](#clip-46), [CLIP-47](#clip-47)                | Parked by the owner on 2026-11-18. CLIP-46 is narrowed to voice-over audio recording; the teleprompter waits on it.                     |
| [REF-23](#ref-23), [CLIP-44](#clip-44)                  | Closed by the owner on 2026-11-18: zooms stay pinned to the timeline (D-1); hosted share links are dropped.                             |
| [CLIP-31](#clip-31)                                     | Umbrella only; its three concrete XML tickets are counted above, not a fourth exporter.                                                 |

The original CLIP-20b owner confirms no edits, acceptance run or unique untransferred source. Patch
`94d759e6` and textual receipts `be8a63df` are transferred and hash-verified; CLIP-20b is delivered,
so its raw traces are no longer needed and that worker is archived. The original CLIP-9b owner is
also quiescent with no untransferred source; its historical candidate/compact receipts are
transferred and its full ramp scope is not implemented. REF-27/27b's Sol owner
[T-66b606e9](https://ampcode.com/threads/T-66b606e9-c0a0-44fd-82a8-189dd0f928ba) and CLIP-20b's
owner [T-01a1e2f2](https://ampcode.com/threads/T-01a1e2f2-99be-775a-be34-43cbce070c38) are archived
after delivery. The former coordinator T-6706048a and the Sol reviewer T-8d28222c are retired, and
T-9f34d223 replaced the Fable reviewer T-2d1e888a. These old threads retain their evidence, not
concurrent implementation grants. Research-only owners retain research, not source ownership. Main
pushes and full/performance acceptance remain coordinator-serialized; no review gate changes.

### Active two-worker grants

| Lane                 | Worker                                                                                | Current grant                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Main implementation  | [T-2a7c5d23](https://ampcode.com/threads/T-2a7c5d23-64d3-4375-ba55-68cd48570f8d)      | REF-70 delivered at `7544b6c`; REF-72 (timeline zoom steps follow the frame rate) granted next, then CLIP-15 audio scrub. |
| Small implementation | [T-01a1f45a-296f](https://ampcode.com/threads/T-01a1f45a-296f-7511-96f2-7e665d921cda) | REF-71 delivered at `91b230b`; lane idle, awaiting the next grant.                                                        |
| Design and UI SDK    | [T-01a1f45a-212a](https://ampcode.com/threads/T-01a1f45a-212a-738f-ad28-f5ee679393cb) | CLIP-49 phase 1 delivered at `a8848cb`; no active assignment.                                                             |

### Current state, 2026-11-19

- Main is `a8848cb` (a CI timeout fix on two case-gate rename commits on CLIP-49 on the docs head on
  the CLIP-17 polish on CLIP-20d on batch 6), pushed 2026-11-19. Batch 5 `8e7b506` acceptance:
  static gates green, `all` 247 passed, `performance` 17/20 with the cursor-follow rAF test failing
  only on the loaded 2-core acceptance orb and proven environmental by a same-orb A/B against
  `d9d3b6f` plus the UI-14 lane's independent A/B and quiet-machine 20/20; green exact-SHA
  [CI44564865497](https://github.com/mite404/clipper/actions/runs/44564865497); canonical preview
  promoted to `8e7b506`. Batch 6 `5f75096` acceptance: static gates green, `all` 255/256 and
  isolated `performance` 19/20 with the same single environmental cursor-follow failure; green
  exact-SHA CI44577985376; canonical preview promoted to `5f75096`. CLIP-20d `046eedc`: green
  exact-SHA CI44581073353, canonical preview promoted. CLIP-17 gain-row polish `66b0d51`: rebased
  from `3a73afb` with an identical diff; gates green; its own CI run was superseded by the docs head
  `83f8e16`, which passed green on the same code tree. CLIP-49 `21004c6` plus the
  `DictationModal.tsx` case-gate rename commits `ea80ca1` and `d72e2b7`: rebased from `cfe4c57` with
  an identical 15-file +1697/-37 diff (two additive conflict resolutions, design-lane confirmation
  pass CONFIRMED); static gates, 350/350 unit, production build and agent/transcribe specs 6/6 green
  on the rebased tree; green exact-SHA CI44594000504 after raising the CI job cap from 20 to 30
  minutes - the suite outgrew it. REF-71 `589a0e1` plus the owner-directed toolbar-centering
  follow-up `91b230b`: review LAND on both trees (v2 delta re-review); lane gates green
  (verify-clipper `all` 268/268, unit 350/350); green exact-SHA CI44623097400 after one rerun on the
  known apt-mirror flake; canonical preview promoted to `91b230b` with a byte-verified public
  receipt (toolbar tools centered within 0.008 px at 1440-390 px, hint and px/s output absent).
- Environment note, 2026-11-19: `verify.mjs all` OOM-kills at the 400 MB sparse-file save test
  (refinements.spec.ts) on 3 GiB orbs - the workload cgroup slice is capped at 3 GiB with no swap,
  confirmed on candidate and pristine main by two lanes and the coordinator. Fix in-orb: a 6 GB
  swapfile (`fallocate` + `mkswap` + `swapon`); it does not survive an orb pause, so recreate it
  before acceptance. Larger orbs are unaffected.
- CLIP-49, REF-71, REF-69 and REF-70 are delivered; the owner ruled the `?agent-test` hook stays in
  production as-is. REF-69 acceptance note: run source-scrub specs under the verify-clipper skill
  config (deviceScaleFactor 2) - the repo config at dsf 1 fails 3 of the 6 on identical code. Next:
  REF-70 (fps on the pool icon row) delivered at `7544b6c`, then REF-72 and CLIP-15 audio scrub.
  Owner audit 2026-11-19: REF-70 and REF-71 are the only actionable Small tickets - REF-29 and
  REF-34 stay deferred proposals.
- Coordinator handoff, 2026-11-19:
  [T-01a1f458](https://ampcode.com/threads/T-01a1f458-64c3-77cd-b7dd-7a1f78923a04) (Kimi K3)
  replaced T-136752bf as coordinator, acceptance owner and sole main writer after a full verified
  state transfer (bundles, preserve refs and the held docs commit `cc146a3`). Reviewer is now
  [T-01a1f458-e0e9](https://ampcode.com/threads/T-01a1f458-e0e9-76cc-b291-da970b75f7df); the lanes
  above replaced T-0e774456, T-01a1e78d and T-e2082a9f, which retain their evidence.

### State, 2026-11-18

- REF-52 is delivered on main at `3048947` with green exact-SHA CI44241841877. REF-51 delivered at
  `cc12bb5` (CI44236114469). Promotion of `3048947` is requested from the canonical preview editor
  ([T-6dd30293](https://ampcode.com/threads/T-6dd30293-c740-418a-8174-5d2a1b69da89)) serves REF-50
  at `4bc0f24` (exact-SHA CI44229120203), checked publicly by the preview owner.
- REF-51 landed as two commits: `9ef5ca8` folds Timeline's four track-header props into one
  `headers` prop, because Fallow's cognitive score for `Timeline()` tracks its prop count and sat at
  the 15 limit; `cc12bb5` adds Razor hover seek through a separate `onRazorHover` prop. Both reviews
  returned LAND; `all` passed 177/177 and isolated `performance` 20/20.
- REF-48 is delivered as `e021c14` (refactor) and `0f1fca9` (feature), exact-SHA CI44247241370
  green. `all` passed 182/183 then isolated `performance` 22/22; the one miss was a cursor-follow
  p95 of exactly 100 ms after the 20-minute run, and a same-orb A/B against `3048947` showed parity.
- REF-52 landed as `3048947`: the window keydown handler now registers in a layout effect. `all`
  passed 182/182 and `performance` 20/20.
- Review gate: one review per ticket by
  [T-01a1f458-e0e9](https://ampcode.com/threads/T-01a1f458-e0e9-76cc-b291-da970b75f7df) with
  `ce-code-review` (owner, 2026-11-18). T-f987a229 and T-9f34d223 are retired. Coordinator,
  acceptance owner and sole main writer:
  [T-01a1f458](https://ampcode.com/threads/T-01a1f458-64c3-77cd-b7dd-7a1f78923a04).

Open owner questions and known, unscheduled behavior carried from delivered tickets (receipts in
history):

- Whether Delete should also do nothing on a focused trim grip (`role="slider"`) is an open owner
  question (REF-40/41). Folding the Shortcuts strip into the header is deferred by the owner.
- Seen on main, not scheduled (REF-45): a sub-200 ms "Play source" tooltip during very fast Tabbing,
  and duration changes within about a second undo as one step.
- Known, accepted (REF-44): Enter on Hide timeline and Delete in the same frame can still delete;
  clicking the ruler leaves Delete inert (REF-40 slider rule).
- Known ceiling (REF-47): a transparent still or a failed export decode on a front screen track
  still owns the frame. Known (CLIP-2c): a refused drop counts as a timeline action for Delete; the
  "No video track" placeholder shows while audio tracks a video can go onto are listed.
- Optional later (REF-46): a 58px tier below 1650 wide at 991-1069 tall.

Moved to [history](master-tickets-history.md#delivery-receipts-2026-11-17-to-2026-11-18).

The owner's recording in Space `M-034zScKmht0Y3aFONzRRhS` (2026-11-17) reports four items. None was
covered by a ready ticket; CLIP-9b's contract-held ramps do not include moving a region. REF-49 and
REF-50 are delivered (see history); the two open items follow.

- REF-48, delivered at `0f1fca9`: drag a zoom region's body to move it, keeping its duration,
  refusing overlap and sequence bounds, one undo step, keyboard equivalent, and click still selects.
  A generated source-anchored shot must keep its anchor in step so `resolveZooms` does not move it
  back.
- REF-51, delivered at `cc12bb5`. Owner decision (2026-11-18, this coordinator thread): option A, a
  real seek. "They would stay there until the playhead is moved again. Cutting a clip region doesn't
  move the playhead anywhere else but to the frame that's being cut." With Razor active, hovering a
  cuttable clip seeks the playhead and preview to the frame a click would cut, and they stay there
  after the pointer leaves until something else moves the playhead. A click cuts at that frame and
  leaves the playhead on it. This supersedes any stationary-playhead reading of CLIP-2e. Snapping to
  the playhead becomes circular, so Razor snaps to clip edges only. Hover seeks add no undo steps.
  Locked lanes and gaps do not seek. Coordinator default, open to the owner: while playing, hover
  does not seek, so playback is not fought.

Moved to [history](master-tickets-history.md#ref-49-ref-50-clip-2c-and-ref-46-delivery).

Neither lane may spawn another implementation worker, reviewer or start concurrent full acceptance.
On 2026-11-17 the Opus 5.5 medium successor
[T-136752bf](https://ampcode.com/threads/T-136752bf-6ed3-4930-b791-1cd134662797) verified the hashed
transfer from the former coordinator
[T-6706048a](https://ampcode.com/threads/T-6706048a-c051-4e23-9ec6-68afd669b492) and received
explicit release. It is now the sole coordinator, acceptance owner and main writer. Neither worker
has a push grant or concurrent acceptance run.

Moved to [history](master-tickets-history.md#all-new-opus-cutoff-audit).

## Order of work

This is the one order of work. It supersedes older numeric/default ordering, historical reservation
language and the grouping of the queue tables. Delivered means accepted main with exact-SHA green
CI. Research, a preserved branch and source LAND alone are not delivery. It was set by the audit of
2026-11-16 against accepted main `d8776cde2f1fc381da7bd4a5b069501c5ded73c5` (not a moving
latest-main pointer) and updated on 2026-11-18 against `c30c509`.

Done from that audit's steps 1-3 and 8:

- CLIP-9b creation/panel removal and the **Add zoom** label/map follow-up were accepted at
  `acb62f7`, with green exact-main CI43938067635. Full ramps stay open (step 5 below).
- UI-7 delivered at `b9c2e83` and UI-5 at `601ba78`, both extending UI-2. REF-32 delivered at
  `4b49623`. CLIP-2e delivered selected-target/all-unlocked splits on the no-link project model at
  `a26c7e7`, using stable track IDs and saved locks/track selection.
- REF-27 real export formats/resolution delivered at `27099dc`, then CLIP-20b media-kind support at
  `6156fb4` and CLIP-2c stable tracks/insertion/Background role at `1de89b5`. CLIP-2c's
  pointer-release lane targeting and video-only pool-drop contract stand.
- UI-6 removed the requested remnants at `f164235`.

Remaining, in this order:

1. Batch 5 is delivered at `8e7b506` and promoted. Batch 6 (CLIP-20c, Layout choice fix, UI-14) is
   delivered at `5f75096`, CLIP-20d at `046eedc`. Next: the CLIP-17 gain-row polish (`3a73afb`),
   then CLIP-49 phase 1 (`cfe4c57`), then REF-69 (owner-reported pool scrub coupling) ahead of
   CLIP-15 audio scrub. REF-66, UI-15, UI-13, CLIP-9c, UI-16, REF-67, CLIP-22 PiP, CLIP-41 preview
   quality, CLIP-17 per-clip gain and CLIP-21b are delivered. Owner direction (2026-11-18): keep
   going through every remaining ticket; gated chains stay visible and skipped.
2. Settle explicit source-audio membership/component mapping in CLIP-2b with UI-9, then implement
   association creation/persistence and linked movement before UI-9 consumes them. Do not duplicate
   the primary audio mix across selected lanes. UI-9 validates header-targeted insertion atomically.
   CLIP-2b must qualify partial-cut membership on delivered CLIP-2e before linked movement delivery.
   No fragment lifecycle/schema is approved by the split research. UI-8's old target selector goes
   only after UI-9 works.
3. Complete CLIP-9b ramps, CLIP-11b targeted sidecars, UI-11 selected-type inspector and CLIP-2d
   whole-clip visibility in separate verified units. UI-10 adoption/polish follows a scoped decision
   on its preserved experiment; it does not block these features or authorize wholesale replacement.
4. Then take ungated backlog features in this dependency order: CLIP-19, CLIP-20 wallpapers,
   CLIP-21, CLIP-23, CLIP-22 remainder, CLIP-24, CLIP-12, CLIP-13, CLIP-15 audio scrub, CLIP-16,
   CLIP-18, CLIP-27, CLIP-28, CLIP-39, CLIP-40, CLIP-45, CLIP-41 power saving, CLIP-42, CLIP-26 and
   CLIP-30. These remain proposals until their bounded acceptance is scoped, not new source grants.

Prepare tests/research in parallel only when paths are disjoint; serialize App, Timeline, model,
parser, renderer and export changes. REF-35/36 may take independent test/tool paths, but must not
compete with a feature's acceptance run. REF-28/37 qualify actual decoder/performance risks before
affected changes land. REF-22/30 precede CLIP-38 only if its saved-data work needs them. REF-23 is
closed (D-1: no); REF-24/29/34 are conditional work, never automatic prerequisites.

Keep gated chains visible and skip them rather than blocking other work: CLIP-31a then CLIP-31b then
CLIP-31c needs Premiere qualification (D-9); CLIP-32 (Whisper `tiny.en`, approved) then CLIP-33/34
then CLIP-36; CLIP-35 (D-5 settled) then CLIP-37; CLIP-7b/43 needs D-4; CLIP-14 and typing
suggestions need key events; CLIP-44 is dropped; CLIP-46 (voice-over only) and CLIP-47 are parked;
native CLIP-48 needs a device path. CLIP-11 real recording qualification stays under D-7. PUB-1 then
PUB-2 (host Netlify, D-10). UI-12 remains parked. CLIP-31 is an umbrella, not a fourth XML
implementation.

This order grants no additional source paths, experiment landing, deployment or history rewrite. The
coordinator remains the only main writer, rebases each tested ticket onto latest main and waits for
exact-SHA green CI before releasing the slot.

### Publish dialog

| Ticket ID                         | Scope                                                                                                   | State                                               | Needs                                                                                                                      |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| <a id="pub-1"></a>[PUB-1](#pub-1) | Publish dialog with live Preview tweet panel, API cost estimate and xeet-rendered preview               | Contract-held; prototype preservation/research only | Transferred candidate, private-use asset/payload checks and exact-path implementation grant; REF-27 delivered at `27099dc` |
| <a id="pub-2"></a>[PUB-2](#pub-2) | Public preview link: a page that renders the post as an X card, with a copy-and-compose button above it | Proposal; owner-requested 2026-11-18                | PUB-1's preview renderer and intent link; D-10                                                                             |

Mite requested the existing mockup design without the endpoint list, using the installed UI
framework, a live Preview tweet panel, developer-app cost estimates and xeet as the preview
direction.
[Research/prototype owner](https://ampcode.com/threads/T-e5b236cc-34e7-47bc-a102-0d3fa017ca69)
preserves the six-file prototype and brief on local `feat/publish-dialog-prototype`; local WIP
commit/bundle preservation is allowed, not a push or integration. Reported local checks are not
accepted feature verification. No implementation source paths are reserved. Future implementation
follows the current worker-model policy; REF-27 is delivered and its App/export reservation is
released. Mite approved the feature direction and explicitly requires Opus 5.5 medium code review of
the exact integrated candidate before landing; do not start that review on the unintegrated
prototype.

Prototype `12d8ef6` on base `18d3089` is transferred by verified Git bundle and preserved locally as
`preserve/pub1-prototype`, without applying it to the delivery tree. Bundle SHA-256 is
`bd0c1ff9237b32cb59e96f57d8130da16fe20c2a602407fa2f71dfa51133ab84`; bundle verification and the
exact six-file scope pass. Sonnet 5.5 produced this prototype; no implementation exception is
granted. No source code, dependency or font has been adopted or pushed by the coordinator.

The separate xeet research candidate `0705fb8`, parent `12d8ef6`, is also transferred and preserved
as local `preserve/pub1-xeet`. Its verified 24,485-byte bundle SHA-256 is
`d171811fea15f2591cd1c30d368a38393dda83da65008e7ddd2ab32aa7c91759`. No candidate files are applied.
It contains the npm/Vite browser adapter research and known counting, real-TLD, SVG and font-payload
limits. Preserve it as research, not delivered implementation or font-distribution qualification.

Candidate paths are `src/PublishDialog.tsx`, `src/publish-dialog.css`, `src/post-preview.ts`,
`src/post-preview.test.ts`, `src/PublishDialog.stories.tsx` and `docs/tickets/PUB-1.md`. Transfer
and inspect the exact candidate before adopting these files; do not overlay them from stale main.
The App trigger/state hunk requires a later explicit grant. Keep the scope local-only: preview,
export metadata and an X intent link with clear manual media-attachment instructions. Estimates
describe a possible API route, not a charge incurred by opening the intent composer. Verify current
rates and disclose unpriced upload costs before release. Do not present bitrate estimates as exact
downloaded-file size.

Owner addition, 2026-11-18: a **Share video** button hands the exported file to the operating
system's share sheet (`navigator.share` with `files`), so choosing X there opens a post with the
video attached. Show it only where `navigator.canShare({ files })` is true, and keep the intent link
as the fallback. Nothing is uploaded by Clipper. Qualify it in a real browser on the owner's Mac
(Safari and Chrome), since headless Chromium cannot open a share sheet.

Mite clarified personal workflow use and explicitly authorized proceeding with xeet integration
without holding for the font question. This is not permission to publish font assets or deploy. Keep
vendored fonts out of Git and inspect emitted WASM/assets before any public distribution; an npm
install alone does not establish redistribution rights. Qualify private/local serving, media inputs,
lazy-loaded payload and counting behavior without asking for a licence purchase. The HTML prototype
is not an exact xeet preview or delivery. Real X API posting, credentials, a server relay and other
destinations are outside PUB-1; relay approval must not block this local-only scope. Verify current
browser/API restrictions before making categorical CORS claims. No production service or media
upload is authorized.

#### PUB-2: public preview link

The owner asked on 2026-11-18 for a public URL he can send to someone. It opens a web page that
renders the post as an X card. Above the card, outside it, a button copies the post text to the
clipboard and opens X's compose page, where the visitor is most likely already signed in. The
visitor is the person the owner sends the link to, and they post from their own account. The compose
box is prefilled; the clipboard copy is a fallback if X drops the prefill. CLIP-44 (review links
with timestamped comments) stays dropped.

Contract:

- Nothing is uploaded. The post travels inside the link itself, in the URL fragment (`#...`), which
  browsers never send to the server. The page is static and stores nothing.
- Clipper's Publish dialog gets a **Copy preview link** action that builds that URL.
- The page renders the card with the same xeet renderer as PUB-1's in-app preview, so they match.
- The button copies the text and opens `x.com/intent/post` with it prefilled, in a new tab. Media
  can't ride in a link, the clipboard or an intent, and X's upload dialog can't be opened from
  another site, so the recipient posts the text alone, or attaches a video the owner sent them
  separately. On the card it shows as a CSS skeleton in the video's aspect ratio, like iOS share
  placeholders, with a gentle shimmer that stops under `prefers-reduced-motion`.
- A link that is too long or malformed shows a clear error, not a broken card.
- Verification: an e2e opens a built link, checks the card matches the in-app preview, checks the
  clipboard text and the intent URL, and checks the page makes no request beyond its own origin.

D-10 is answered: Netlify serves one plain static HTML file, with no framework at runtime. Deploying
it is a separate step that needs the owner's go-ahead. Placement: after PUB-1, because it reuses
PUB-1's renderer and intent link, and in the gated chains, because no other ticket depends on it.

## Owners

| Lane                  | Thread                                                                                | Owns                                                                  |
| --------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Queue and delivery    | [T-01a1f458](https://ampcode.com/threads/T-01a1f458-64c3-77cd-b7dd-7a1f78923a04)      | This file, acceptance and exclusive main push slot                    |
| Main implementation   | [T-2a7c5d23](https://ampcode.com/threads/T-2a7c5d23-64d3-4375-ba55-68cd48570f8d)      | UI-14                                                                 |
| Small implementation  | [T-01a1f45a-296f](https://ampcode.com/threads/T-01a1f45a-296f-7511-96f2-7e665d921cda) | CLIP-20d, CLIP-17 polish                                              |
| Code review           | [T-01a1f458-e0e9](https://ampcode.com/threads/T-01a1f458-e0e9-76cc-b291-da970b75f7df) | The one review per ticket, with `ce-code-review`                      |
| Cursor implementation | [T-77c027fc](https://ampcode.com/threads/T-77c027fc-1240-4757-bef9-fcac238ea35a)      | Speed-style unit delivered; no active implementation grant            |
| Cursor inspector      | [T-c7f554cb](https://ampcode.com/threads/T-c7f554cb-b157-4f8c-b515-6b07a23b4214)      | Inspector delivered; no active implementation grant                   |
| Workspace layout      | [T-2a8c77a8](https://ampcode.com/threads/T-2a8c77a8-9a49-4cc2-ae3f-9c4a2550fbea)      | UI-2 delivered; no active implementation grant                        |
| Transport lifecycle   | [T-0f030227](https://ampcode.com/threads/T-0f030227-5357-4bc3-baf5-7974b220dd59)      | REF-31 delivered; no active implementation grant                      |
| Zoom preservation     | [T-46d4a5ee](https://ampcode.com/threads/T-46d4a5ee-39f1-46ae-bde0-eced0da19a5a)      | Quiescent historical candidate/evidence only; no implementation grant |
| Cursor preservation   | [T-930219f2](https://ampcode.com/threads/T-930219f2-6c3a-4543-a9e0-9a1073cc4d94)      | Frozen original CLIP-11 work, no implementation or push               |
| Editor and bootstrap  | [T-01a1ddd7](https://ampcode.com/threads/T-01a1ddd7-317f-7312-a2ce-db23a9d866da)      | `.agents/setup`, `.agents/resume`                                     |
| Verification tools    | [T-282b9f84](https://ampcode.com/threads/T-282b9f84-b86a-4498-b4cf-b8fb963a33cc)      | Archived after delivery; no active path reservation                   |
| Canonical preview     | [T-6dd30293](https://ampcode.com/threads/T-6dd30293-c740-418a-8174-5d2a1b69da89)      | Accepted-main promotion and revision/check receipts                   |
| Design and UI SDK     | [T-01a1f45a-212a](https://ampcode.com/threads/T-01a1f45a-212a-738f-ad28-f5ee679393cb) | UI-16, UI-17 and REF-68 delivered in batch 5; CLIP-49 phase 1         |

The archival audit has coordinator ownership clearance for the completed UI-3 worker/reviewer,
REF-18/20/31 transport worker, tooltip pilot/repair, VERIFY-5, fresh-orb qualifier and OpenScreen
comparison. They have no new assignments or reusable-worker reservations. This is clearance, not a
claim that they were archived. UI-2 and UI-5 also have coordinator archive-only clearance: no
remaining worker assignment or dependency on their noncanonical local services is recorded. UI-2's
historical stress fixture and portable evidence are preserved; its old live portal is not required.
UI-5's 240px scroll-control acceptance is recorded in its brief, not an outstanding worker
assignment. This clearance does not authorize deleting services, files, branches or worktrees. Keep
the inspector/REF-37 owner, dependency-held workers, the review gate T-9f34d223, coordinator
T-136752bf, stable portal owner T-6dd30293 and unaccepted experiments open. SPEC-01 remains archived
with its parked branch preserved.

Moved to [history](master-tickets-history.md#model-trials-ui-1-ci-repair-and-ref-20).

Existing worker models and assignments remain unchanged. New-thread defaults and review policy live
only in [managing-tickets](../.agents/skills/managing-tickets/SKILL.md); older model-selection
narratives in this record are historical, not authorization to create threads under those defaults.

Moved to [history](master-tickets-history.md#ref-31-delivery).

### Delivered header cleanup

| Ticket ID                      | Scope                                                                        | State                                                                                                                                                                               | Needs                                                          |
| ------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| <a id="ui-3"></a>[UI-3](#ui-3) | Remove header branding/title and move existing Save project into their place | Delivered at [ed37b20](https://github.com/mite404/clipper/commit/ed37b201e1b62a24581766ec6dbf92540e5cd7a6), [green CI](https://github.com/mite404/clipper/actions/runs/43881190925) | Header reservation released; Sol PASS and Fable LAND preserved |

Moved to [history](master-tickets-history.md#ui-3-header-cleanup).

### Numeric property label scrubbing

| Ticket ID                      | Scope                                                      | State                                                                                                                                                                                 | Needs                                                                                                                                                                                                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="ui-4"></a>[UI-4](#ui-4) | Horizontal label scrubbing for all numeric property values | Delivered on main at `8e7b506` (batch 5, pushed 2026-11-19) (`125391a`, `1b139e3`, Sonnet lane). Custom `bindDrag` plus `@ui-sdk/core/number`; one undo step per drag, none on Escape | Custom `bindDrag` plus `@ui-sdk/core/number`, not the SDK NumberInput (its Escape commits; coordinator decision, open to Mite). One undo step per drag, none on Escape, shortcuts ignored mid-drag. Entry fields, transport sliders and touch out of scope. Known: a zoom scrubbed into its neighbour stops at the last valid value |

Mite broadened the original crop/framing-only request to all numeric property values. Booleans,
enums and transport seek controls are not numeric property scrubs. Preserve direct entry and
accessibility, each property's units/bounds/step, live preview and one-gesture undo. Require pointer
capture, cancellation rollback, no click-only edits and no accidental text selection. New zoom/PiP
numeric properties must inherit the shared behavior rather than add bespoke handlers.

Initial source audit finds numeric inputs in App source In/Out, crop X/Y, zoom start/length/focus,
CursorControls hidden-range drafts/size/offset, plus property ranges for radius and zoom level.
AutoZoomControls Amount/Hold are superseded by panel removal and must not be migrated. Timeline
scale and media-position ranges need explicit classification, not blanket DOM event delegation. No
shared numeric component currently owns these controls. Audit controlled/uncontrolled fields,
draft-form versus persisted-edit updates and history grouping before assigning source paths. Split a
genuinely bounded reusable-control candidate from consumer migration only if independently
verifiable; otherwise retain the coherent expanded scope and the workflow's current assignment
rules.

### Resizable workspace panes

User story: As an editor, I want to resize the side panes and timeline, hide/restore the timeline,
switch between default and remembered custom height, and clearly see and scrub the current time
without sacrificing preview room or accidentally selecting/trimming a clip.

| Ticket ID                      | Scope                                                                          | Owner                                                                                    | State                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| <a id="ui-5"></a>[UI-5](#ui-5) | Panel resizing, timeline layout controls and visible playhead/scrub affordance | [Existing Sol owner](https://ampcode.com/threads/T-e1ee6ff4-16fb-49e6-b05b-45a0b6fcecff) | Delivered at 601ba78 with green exact-main CI43978647729; paths released; canonical previews verified |

Moved to [history](master-tickets-history.md#ui-5-resizable-workspace-panes).

### Selected obsolete UI deletion

| Ticket ID                         | Scope                                               | State                                                                                                                                                                                                    | Needs                                                                                                                                                                          |
| --------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="ui-6"></a>[UI-6](#ui-6)    | Remove selected source/old cursor/transport clutter | Delivered at [f164235](https://github.com/mite404/clipper/commit/f164235d4b2ecd5e4761790a9943c2ee8eb9d5f4); green exact-SHA [CI44041254397](https://github.com/mite404/clipper/actions/runs/44041254397) | Reservation released                                                                                                                                                           |
| <a id="ui-6b"></a>[UI-6b](#ui-6b) | Clear UI-6 review leftovers                         | Delivered at [3ec157c](https://github.com/mite404/clipper/commit/3ec157c31b75ef87ee577409bb1bbfb16a57018b); green exact-SHA [CI44047934496](https://github.com/mite404/clipper/actions/runs/44047934496) | Delete dead `.workspace-bar` rules, pin desktop transport centering with a failing-first test, rename the accessible-Paused test and merge redundant absence checks; no new UI |

Moved to [history](master-tickets-history.md#ui-6-scope-and-clip-25-contract).

CLIP-25 exposed a nominal-index versus stored-time mismatch in a synthetic 30 fps WebM without a
frame-rate hint. An independent unchanged-main reproduction confirms indices 2, 5, 8, 11, 14 and 17
select the preceding marker when requested at index/30; requesting stored packet timestamps selects
all 18 markers correctly. Mediabunny documents last-frame-at-or-before selection, so this alone is
not a proven exporter bug. Track the sampling-contract investigation under [REF-28](#ref-28),
separately from missing/early-end cases. The worker's actual Remotion-video versus PNG receipt has
24 matching logged marker pairs across forward/reverse holds, including all six affected indices.
This is inspected diagnostic output, not a parity assertion in that uploaded test. It demonstrates
no preview/copy mismatch for those holds, so the investigation no longer blocks CLIP-25. Keep
stored-time sampling unchanged and add an asserted affected-boundary preview/PNG regression to the
feature's browser tests. No nominal-ordinal or complete WebM/VFR compatibility claim follows.

### Media header and temporary drawer peek

| Ticket ID                      | Scope                                                          | State                                                    | Needs                                                                        |
| ------------------------------ | -------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------- |
| <a id="ui-7"></a>[UI-7](#ui-7) | Media before Save, temporary left-edge peek and Space behavior | Delivered at b9c2e83 with green exact-main CI43953490741 | Shared paths released to bounded UI-5 successor; preview promotion requested |

Moved to [history](master-tickets-history.md#ui-7-media-header-and-peek).

### Detailed audio waveforms

| Ticket ID                         | Scope                                                    | State                                                                                                                                                                                                                                    | Needs                                                                                                                                                                                                            |
| --------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="ui-13"></a>[UI-13](#ui-13) | Dense, zoom-aware waveform envelope and inner level core | Delivered at [bd1c041](https://github.com/mite404/clipper/commit/bd1c041d77a884bf90ec86ff2097756d17abfe51) with CLIP-29 and CLIP-15 part A; green exact-SHA [CI44413425655](https://github.com/mite404/clipper/actions/runs/44413425655) | Owner (2026-11-18): "dense speech waveform is what i want it to look like, no matter the zoom". 1000 bins/s Float32Array, outline through bin centres; peaks are never saved. Foundation for CLIP-17 and CLIP-26 |

The [UI-13 brief](tickets/UI-13.md) records the owner's traditional waveform request and the
[research findings](https://ampcode.com/threads/T-a7ae6f1e-63eb-400b-80a3-702a2ebd3335). Current
decode samples every 32nd sample into frame-rate peaks, and the renderer stretches 120 bars
regardless of timeline scale. Preserve short transients, expose useful detail at fit and maximum
zoom, and preserve meter, trimming, played highlight and Save/Open behavior. The owner confirmed one
combined stereo envelope and a fixed audio bins-per-second rate independent of video FPS. Follow BBC
audiowaveform's data method in the existing Mediabunny loop, without a new dependency or second
decode. The owner narrowed acceptance to rendered voice at fit/max zoom and existing gates and
behavior staying green; no new mixed-rate CI/reference-comparison pipeline is required. This is not
CLIP-15 audio scrubbing or delivered REF-14's FPS correction. REF-32 is accepted separately.

### Media-pool views and source scrubbing

| Ticket ID                      | Scope                                                               | State                                                                                                                      | Needs                                                 |
| ------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| <a id="ui-8"></a>[UI-8](#ui-8) | Compact clip rows, selected-thumbnail scrubbing and source mini-bar | View/scrubbing part Delivered on main at `8e7b506` (batch 5, pushed 2026-11-19) (`1e2e32d`); selector removal held on UI-9 | Exact source/test grant (UI-7 delivered at `b9c2e83`) |

User story: As an editor, I want compact media rows and direct thumbnail/mini-bar scrubbing so I can
find and preview footage without spending space on source-view form fields.

The owner's Space post `M-034yg9UONyDA5gwEr0XyT9` retains thumbnail view and adds a compact clip
view with resolution, frame rate and duration only. After selecting a thumbnail, mouse movement
scrubs it and wheel up advances while wheel down moves backward. Remove the visible source In/Out
inputs and track selector; display in/out points on the mini playback bar and allow dragging to
seek. Preserve source insertion, selection and preview behavior. Inspect the supplied recording
before deciding how seeking differs from editing the in/out points; do not invent that contract.

The canonical
[Sol medium worker](https://ampcode.com/threads/T-fd12a7e5-1552-4d83-9403-72837d4f91ee) may inspect
the reference and current source on accepted `d8776cd`. UI-7's header/drawer successor is delivered
at `b9c2e83`; source edits wait only for the coordinator's exact-path grant. Extend the existing
mounted media pool, not a second drawer. Proposed ownership is media-pool/source-preview rendering
and interactions, scoped styles, shared-component stories and affected tests; App shared hunks and
any metadata extraction changes require an explicit grant. No inspector, zoom, transport, schema or
push ownership is implied. Keep unavailable metadata honest and processing local. Require TDD, real
pointer/wheel/bar-drag checks, inspected synthetic/public captures and the strict/full gates. This
is the single operational ticket for the request, not a duplicate of UI-7.

Removal of the source track selector waits for [UI-9](#ui-9)'s functional track-header targeting, so
insertion always has an accessible destination control. Media view/scrubbing may be delivered before
that coordinated transition if its exact paths are disjoint and independently verified.

### Timeline track targeting and video-layer visibility

| Ticket ID                      | Scope                                                     | State                    | Needs                                                           |
| ------------------------------ | --------------------------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| <a id="ui-9"></a>[UI-9](#ui-9) | Header insertion targets and whole-video-layer eye toggle | Sol medium research only | Insertion/model contract with CLIP-2b/2c, then exact-path grant |

User story: As an editor, I want to choose video and audio destinations in timeline track headers
and hide a whole video layer so I can insert media where intended and compare the composition
without changing individual clips.

The owner's Space post `M-034ygAuFNYuWXN0QUvqc2J` moves active-target toggles into timeline track
headers, replacing the source-view track selector. Audio and video targets can be active together.
Silent video and still images ignore audio targets and insert on the chosen video track. Add a
whole-video-layer eye toggle analogous to audio mute. This is distinct from individual hidden clips,
does not authorize inferred A/V associations and does not duplicate CLIP-2c dynamic-track creation.

The canonical
[Sol medium worker](https://ampcode.com/threads/T-cbade74d-9737-43bb-a163-8489fc434389) may research
the supplied reference and current insertion, undo, preview/export and persistence on accepted
`d8776cd`; all source paths remain held. Return proposed exact Timeline/header, App insertion,
model/renderer/parser, style/story and test hunks, including missing/multiple-target behavior,
before implementation grant. Coordinate track identity with CLIP-2c and insertion/link boundaries
with CLIP-2b; their proposed association policies are not requirements. Target-state and visibility
persistence are contracts to resolve, not implicit schema permission. Coordinate with UI-8 so header
targeting works before the old selector disappears. Preserve existing insertion, source offsets,
audio behavior and undo. Verify actual silent-video/still insertion with both target types active,
layer hide/show in preview and decoded export, project reopen under the agreed contract, keyboard
access and strict/full gates. The coordinator retains the sole main push slot.

Coordinate CLIP-2e's selected-track split intent and unlocked-track shortcut with this header
contract. Insertion targets are not implicitly editing selection or locks; agree their identities,
visible controls and ownership before either consumer adds competing track-header state.

Moved to [history](master-tickets-history.md#former-queue-thread-handoff).

Evidence-only threads:
[reuse research](https://ampcode.com/threads/T-01a1ddd8-535c-7129-a7d7-9a0c28f41449) (what the
owner's `sequence-spear-fish` prototype can lend),
[Premiere XML design](https://ampcode.com/threads/T-52bd93c4-0eb5-46f3-ae30-0d2ff60a23ff) (proposals
CLIP-31a to CLIP-31c),
[capture research](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) (source
reading, complete) and the Mac capture check, a thread on the owner's Mac that he has since deleted
(three real OpenScreen recordings; the videos and sidecars were not transferred, but eight derived
images were hosted, see [Known limits](#known-limits)).

### Owner timeline and marking requests, 2026-11-18

Mite's requests from Spaces `M-034zc672BMpv1rc7BIWWNw` and `M-034zcC0et7mk6qM5A6BRBC`, audited
against `aa6db5b`.

- REF-58: a zoom region's length is adjustable like other clips, by dragging its left or right edge.
  `ZoomBlock` in `Timeline.tsx` is one button whose body drag moves the region (REF-48); it has no
  edge grips, and the inspector start/duration fields are the only resize today. Add edge grips
  matching `.clip-grip`, refuse overlap and sequence bounds as `moveZoom` does, keep a minimum
  length, one undo step per gesture, a keyboard equivalent, and keep body drag and click-to-select.
  This closes CLIP-9b's zoom-edge item; ramps stay with CLIP-9b.
- REF-59: clicking or selecting a clip must not change its size; selection shows with darker or
  lighter colour contrast, like hover. Selection itself keeps a 1 px border, so its geometry does
  not change. The size change is the global `button:active:not(:disabled)` press
  `transform: scale(0.97)` in `styles.css`, which `.timeline-clip` and `.zoom-block` inherit because
  they are buttons. Exclude timeline items from the press scale, give `.selected` a colour contrast
  step instead of relying on the ring, and keep a visible `:focus-visible` outline without any
  layout or size change. Check clips, zoom blocks, still clips and locked lanes.
- REF-60: `-` zooms the timeline scale out and `=` zooms it in, shortening or lengthening the
  displayed timeline only, never a clip's duration. Today the scale is the ruler's range input in
  `useTimelineScale` (`Timeline.tsx`), clamped between fit and 32× fit, with no key binding. Follow
  the App key rules: no modifiers, ignore text inputs, keep the playhead in view, clamp at the same
  limits, and list the keys in help and README.
- REF-61: one press on the screen video in the compose panel enters mark mouse position mode;
  dragging moves the yellow target circle, which stays visible through the gesture, and mouseUp sets
  the focus and leaves the mode. Delete the inspector's **Mark mouse position** button, its "Mark
  focus in the unzoomed frame" copy and the compose "Recordings do not contain cursor metadata"
  guide. Today `onMarkMouse` arms `markingZoomId`, which renders the preview unzoomed and overlays
  the `.mouse-target` button sized to the screen mask, and a click stores `x`/`y` as the percent of
  that mask. Keep that mapping under zoom, crop and corner radius (the existing `framing.test.ts`
  case and `refinements.spec.ts` journeys move to the new gesture). A cancelled gesture (Escape,
  pointercancel, lost capture) restores the previous focus with no undo step; a completed drag is
  one undo step. Pause playback on press, as arming does today. The focus X/Y inspector fields
  remain the keyboard equivalent. Coordinator defaults, open to the owner: the gesture edits the
  selected zoom, else the zoom under the playhead, and does nothing without one; the preview shows
  the unzoomed frame only while the button is held.
- REF-62 (priority): on the canonical preview, Export no longer brings up a save dialog. With the
  owner's exact project on `aa6db5b`, Chromium opens the modal, renders in about 18 s and fires one
  `developer-walkthrough-1080p.mp4` download with no errors (coordinator and preview owner,
  independently). `downloadBlob` clicks an `<a download>` only after the render, when
  `navigator.userActivation.isActive` is false, so the browser treats it as an automatic download
  (Chrome blocks repeats per site after the first; Safari asks), and it revokes the blob URL in the
  same tick. The app never used a native save picker; a dialog depends on browser settings. The
  owner's browser state is not reproduced, so this is the leading cause, not a verified one.
  Reproduce first with automatic downloads blocked for the site, then deliver the finished render
  from a user click (a **Save video** action once rendering completes) and revoke the URL only after
  the download starts. Keep cancel, failure messages, the filename and Save project working.
  Headless Chromium applies no per-site download limit, so the red test asserts the download fires
  only from the user's click with activation. Known risk, not in scope: Save project downloads after
  `serializeProject`, so a large embedded project can also outlive the activation window.
- UI-14 (decided): Mite picked option B: "B but the clip name needs to come up so its ceneted within
  the darker band at the top of the clip". The clip name sits vertically centred in the dark top
  band, not in the thumbnail or body, and the leading thumbnail keeps fixed aspect and geometry
  while a region is resized. The [UI-14 brief](tickets/UI-14.md) holds the design hand-off and
  Mite's words. Clipper already depends on Vercel's UI SDK (`@ui-sdk/*` 0.1.0-beta.5 since
  `eb55a36`); Mite directed a full migration on a branch with proof of no regressions, so UI-14 and
  REF-58 follow that candidate. Earlier exploration: the design exploration in
  [T-e2082a9f](https://ampcode.com/threads/T-e2082a9f-5cd0-43fc-8960-e0c6f69f8a86) offers five
  clip-region cards: one fixed-size 16:9 still at the region head and a solid shape for the rest,
  [options A-E](https://ampcode.com/artifacts/visuals/clip-region-card-options-a-e-502496bd-bcc3-469a-95ee-c6737ace7890).
  The pick replaces the tiled `.filmstrip` in `Timeline.tsx` and `styles.css`, which also closes the
  "Filmstrips repeat the first thumbnail" note. It overlaps UI-8 thumbnails and UI-13's shared
  Waveform hunk, so it is scoped and granted only after the pick and serialized with them. Every
  option keeps fixed source-time waveform detail and REF-59's colour-only selection.
- REF-63: deep zoom leaves the ruler blank. `rulerMarks` in `timeline-model.ts` steps only in whole
  seconds, so past about one second per viewport no mark is visible. REF-55's note allowed "whole
  seconds or show frames"; add frame-boundary steps with distinct labels, keeping REF-55/56 labels
  unchanged where they already apply and the nine-mark cap.
- REF-64 (owner, this thread): "clips need to be able to be overlapped. when an overlapping clip is
  let go on mouseUp it shoul doverwrite any clip underit so there aren't 2 clips playing at once on
  the same track. this behavior also applies to audio clips and zoom clips". On `f0cca49` timeline
  clips cannot be moved by dragging at all (trim, split, delete and pool placement only);
  `placeClip` refuses a drop that overlaps on its track, and REF-48 zoom drags stop at neighbours.
  Scope: drag a clip's body in time on its track (video and audio) with a live preview that may
  overlap; on release, overwrite the covered span of every other clip on that track (trim an edge,
  split a clip the drop lands inside, remove one it fully covers), as one undo step. Zoom drags and
  pool drops onto occupied spans overwrite the same way, and a trim that extends over a neighbour
  overwrites it. Escape or a cancelled pointer restores the original with no undo step. Preview,
  Copy frame, export and Save/Open agree. Owner addition: "video & audio clips should be able to be
  dragged between tracks of their respective type too", so a drag may also land on another video
  track (video clips) or audio track (audio clips) and overwrites there; locked tracks refuse it.
  Coordinator default, open to the owner: a drop never ripples later material.
- CLIP-9c (owner, this thread): "the in/out point of where the animation curve for the mouse zoom
  clip needs to be draggable in the inspector panel. so the 2 points on a curve can be moved. also a
  drop down selector for ease in/ease out an s curve and a curve that is fast at first and more
  slowly eases into the final position should be options". Today `zoomAt` ramps every zoom over at
  most 24 frames with a fixed smoothstep; the only option is `instant`. Scope: an Inspector curve
  editor whose two control points drag like a cubic Bezier, with a preset dropdown (Ease in, Ease
  out, S-curve, Fast then settle, and Custom once a point is moved) and numeric or keyboard
  equivalents. Store an optional per-zoom curve; a zoom without one keeps today's smoothstep, so old
  projects play unchanged. Preview, Copy frame and export share `zoomAt`; Save/Open round-trips the
  curve. Coordinator defaults, open to the owner: the zoom-out ramp mirrors the zoom-in curve, and
  "ease in/ease out" means two separate presets. Ramp durations stay with CLIP-9b.
- REF-64 and the UI SDK migration: T-e2082a9f's migration swaps only the trim-grip, ZoomBlock and
  panel-resize pointer code to `bindDrag` with unchanged math; it adds no spans or overlap rules.
  REF-64's new clip body drag uses `bindDrag`, and REF-58 is no longer held.
- UI-15 and UI-16 (design owner T-e2082a9f, direct owner requests): UI-15 moves pointer mechanics to
  UI SDK `bindDrag` (trim grips, ZoomBlock, splitters) and eight selects to a shared `Choice`, with
  unchanged math; Camera follow stays native because of REF-61. UI-16 restyles Clipper to shadcn
  preset b78kBE8jT6 keeping the layout. Owner answer: asked "I'm keeping UI SDK for behavior and
  applying only your preset's design language", he replied "yes", so UI-16 is preset tokens over the
  current UI SDK and native controls, not Base UI or shadcn components. After the preview he wrote
  "after looks better and more compact. plz continue converting all components. also add toast
  notification for things like 'still frame sent to clipboard'". Palette approved as previewed: zinc
  replaces the olive chrome and lime/violet accents, primary buttons use preset primary, and the
  timeline/playhead lime and track colours stay; Lucide icons stay. UI-16 includes the previewed
  compact sizing (28px controls, tighter dialog padding), so its proof bar accepts changed control
  and dialog boxes, checked by captures at 1440 and 390 and updated size assertions. The preset
  fonts are self-hosted like REF-57. UI-16 stays in styles.css, fonts and the font test so the
  lanes' CSS hunks (REF-58, REF-64, UI-14, CLIP-9c) rebase cleanly.
- UI-17 (owner request, design owner T-e2082a9f): a UI SDK `toast()` with a styled toaster for
  success messages, first Copy frame ("still frame sent to clipboard") and the other successes now
  shown in the footer status. Paths: src/App.tsx (success paths, toaster mount), src/main.tsx or
  src/components.tsx, src/styles.css toast rules, one spec assertion. Branches from UI-16 and
  delivers after it; App.tsx hunks rebase over REF-64.
- UI-13 (owner wording): "Audio waveform resolution must not change with container scaling. Keep
  waveform detail/scale consistent with source time; zoom it with clips and timeline in unison,
  extending the displayed waveform length rather than changing its resolution." Today `Waveform`
  draws exactly 120 bars across any clip width, so zooming stretches the same bars wider: detail per
  second falls as the clip grows. UI-13's fixed bins-per-second data already ties detail to source
  time. Its brief's "one column per device pixel" rendering is the coordinator's reading, not the
  owner's words: it must not invent detail beyond the stored bins, so at zooms past the bin rate a
  bin widens rather than being resampled, and below it bins aggregate by min/max. Acceptance adds a
  check that a clip's waveform at two timeline scales shows the same bins per source second.

### Current path reservations

| Owner                    | Paths                                                                                                            |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Media-pool views         | UI-8 reference/source research only; canonical T-fd12a7e5; exact-path grant before edits (UI-7 delivered)        |
| Track targets/visibility | UI-9 research only; canonical T-cbade74d, insertion/model contract and exact-path grant before edits             |
| Queue implementation     | Queue/docs and acceptance; sole main push slot                                                                   |
| Shared, keep edits small | `src/App.tsx`, other `tests/**`, `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `README.md` |

Moved to [history](master-tickets-history.md#released-path-reservations).

### Preservation branches

Made on 2026-11-15 before the Amp project's switch to GitHub. They are not for merging and are
deleted only on the owner's word.

| Branch                          | Holds                                                                                                 |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `wip/clip-10-smooth-follow`     | CLIP-10 before it landed; redundant now                                                               |
| `wip/queue-thread-resume-files` | The queue thread's helper scripts and raw review output, ignored on main                              |
| `wip/queue-handoff-master-list` | Preserved queue draft at `31e5e725`, integrated by the successor                                      |
| `wip/clip-11-original-handoff`  | Exact 13-file cursor capture at `6939b52`, parent `8095a273`; integrated core is on main at `7b23be8` |

The checkpoint found nothing only on the Amp-hosted repository: its one ref, `main` at `0b11477`,
was two empty commits that GitHub `main` contains. The owner confirmed the switch on 2026-11-16 and
the project now maps to GitHub. `wip/ref-17-19-export-gate-edit-keys` was deleted with his consent
after both of its commits were on `main`.

## Status key

- **Delivered**: on GitHub `main` with a green CI run for that commit.
- **In progress**: an owner is implementing it now.
- **Granted**: the coordinator granted exact paths to a lane worker; **in review** means its
  candidate is with the review gates.
- **Ready to scope**: technical predecessors are delivered, but bounded acceptance must be scoped
  before a grant.
- **Dependency-, Contract-, Owner-, Source-, Environment- or Evidence-held**: the queue tables' held
  classes; the named gate (a ticket, an unsettled contract, an owner decision, a missing data
  source, a missing environment, or missing evidence) must clear first.
- **Partial**: a tested unit is delivered, but named acceptance remains open.
- **Local only**: preserved work has not been pushed or passed its delivery gate.
- **Ready**: nothing blocks it; waiting for its owner or a push slot.
- **Blocked**: waits on the tickets named in "Needs".
- **Decision**: waits on the owner; see [Decisions](#decisions-for-the-owner).
- **Proposal**: inventoried from the reference material, not yet designed or accepted.

## Delivered on main

| Ticket ID                                     | Title                                                                                                                                                                                                                                                                                                                                                                                 | Commit                                                                                          | Evidence                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="clip-1"></a>[CLIP-1](#clip-1)          | Play responds without freezing the editor                                                                                                                                                                                                                                                                                                                                             | [`5a9bc1f`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c) | [CI 43733454487](https://github.com/mite404/clipper/actions/runs/43733454487), steel thread record                                                                                                                                                                                                                                                      |
| <a id="clip-2"></a>[CLIP-2](#clip-2)          | Swap sides, edge trims, scalable timeline                                                                                                                                                                                                                                                                                                                                             | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="clip-3"></a>[CLIP-3](#clip-3)          | Manual fixed-point zoom ("mark mouse position")                                                                                                                                                                                                                                                                                                                                       | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="clip-4"></a>[CLIP-4](#clip-4)          | Portable version-2 project save and reopen                                                                                                                                                                                                                                                                                                                                            | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="clip-5"></a>[CLIP-5](#clip-5)          | Local HD and 4K export                                                                                                                                                                                                                                                                                                                                                                | `5a9bc1f`                                                                                       | same; WebM VP9/Opus at delivery; MP4/MOV formats came with [REF-27](#ref-27), see [Known limits](#known-limits)                                                                                                                                                                                                                                         |
| <a id="clip-6"></a>[CLIP-6](#clip-6)          | Shared records, tests, verification skill, CI gate                                                                                                                                                                                                                                                                                                                                    | `5a9bc1f`                                                                                       | same                                                                                                                                                                                                                                                                                                                                                    |
| <a id="boot-1"></a>[BOOT-1](#boot-1)          | Orb bootstrap `.agents/setup`                                                                                                                                                                                                                                                                                                                                                         | [`1a5a572`](https://github.com/mite404/clipper/commit/1a5a572a32f68106930c69806bbb4465f2d30da0) | [CI 43735176014](https://github.com/mite404/clipper/actions/runs/43735176014)                                                                                                                                                                                                                                                                           |
| <a id="verify-1"></a>[VERIFY-1](#verify-1)    | Isolated verification CLI `verify.mjs`                                                                                                                                                                                                                                                                                                                                                | [`2bb8263`](https://github.com/mite404/clipper/commit/2bb8263ce692770f62d0ae37ca3bcb162424cadf) | [CI 43736808192](https://github.com/mite404/clipper/actions/runs/43736808192); its 4 CLI tests are local-only                                                                                                                                                                                                                                           |
| <a id="doc-1"></a>[DOC-1](#doc-1)             | Baseline review record and this list                                                                                                                                                                                                                                                                                                                                                  | [`f702568`](https://github.com/mite404/clipper/commit/f7025680e6144abc216097009f99d5e5ce363028) | [CI 43761407681](https://github.com/mite404/clipper/actions/runs/43761407681), [refactor01.md](refactor/refactor01.md)                                                                                                                                                                                                                                  |
| <a id="ref-5"></a>[REF-5](#ref-5)             | Split never mints a duplicate clip ID (#13)                                                                                                                                                                                                                                                                                                                                           | [`42324e3`](https://github.com/mite404/clipper/commit/42324e3623a56c6421b99bc9106b088fd28add4f) | [CI 43762022693](https://github.com/mite404/clipper/actions/runs/43762022693)                                                                                                                                                                                                                                                                           |
| <a id="ref-2"></a>[REF-2](#ref-2)             | `covers` and `sourceFrame` helpers for timeline-to-source time (#22)                                                                                                                                                                                                                                                                                                                  | [`e2ad4b8`](https://github.com/mite404/clipper/commit/e2ad4b8b3380a73fac2e269c820c9e6381655759) | [CI 43762301972](https://github.com/mite404/clipper/actions/runs/43762301972)                                                                                                                                                                                                                                                                           |
| <a id="clip-7"></a>[CLIP-7](#clip-7)          | Import, validate and persist OpenScreen pointer sidecars per source asset                                                                                                                                                                                                                                                                                                             | [`e9f99fc`](https://github.com/mite404/clipper/commit/e9f99fce4a02be914b6f6d8cb387c152326d737b) | [CI 43762946342](https://github.com/mite404/clipper/actions/runs/43762946342); proven on synthetic fixtures only, see [Known limits](#known-limits)                                                                                                                                                                                                     |
| <a id="ref-1"></a>[REF-1](#ref-1)             | One `src/stage.ts` for mask rects, cover crop and zoom projection; preview pan pinned (#1, #17)                                                                                                                                                                                                                                                                                       | [`4cc0761`](https://github.com/mite404/clipper/commit/4cc07610fb7f027324aab54287f2c1f1c7bc72a0) | [CI 43763390689](https://github.com/mite404/clipper/actions/runs/43763390689); preview screenshots byte-identical before and after                                                                                                                                                                                                                      |
| <a id="ref-3"></a>[REF-3](#ref-3)             | `drawFrame` seam in the exporter, pooled decode canvases (#26, #25)                                                                                                                                                                                                                                                                                                                   | [`64e5578`](https://github.com/mite404/clipper/commit/64e5578c79f0195a3170538048efe6ce99c4b983) | [CI 43763669090](https://github.com/mite404/clipper/actions/runs/43763669090); pooled and unpooled decode matched on 180 frames                                                                                                                                                                                                                         |
| <a id="verify-2"></a>[VERIFY-2](#verify-2)    | Retired `control-clipper.sh`; feature files use `verify.mjs`; story tally removed                                                                                                                                                                                                                                                                                                     | [`de27f06`](https://github.com/mite404/clipper/commit/de27f06c96166824c174dc82a9a8f8c214ca2029) | [CI 43764263393](https://github.com/mite404/clipper/actions/runs/43764263393); the three helper defects were reproduced first                                                                                                                                                                                                                           |
| <a id="ref-4"></a>[REF-4](#ref-4)             | Zoom limits and overlap rule in `src/timeline-model.ts`, enforced by the project parser; ramp and pan pinned (#8, #10, #12)                                                                                                                                                                                                                                                           | [`43cb368`](https://github.com/mite404/clipper/commit/43cb368907755de265ea2a830761754965cb267d) | [CI 43764564172](https://github.com/mite404/clipper/actions/runs/43764564172)                                                                                                                                                                                                                                                                           |
| <a id="ref-6"></a>[REF-6](#ref-6)             | Playback gate fails on a stall: worst frame and worst long task bounded at 500 ms (#16)                                                                                                                                                                                                                                                                                               | [`7fa2e43`](https://github.com/mite404/clipper/commit/7fa2e4379593254a8d77c9d54512a8d2b7d1d003) | [CI 43765213526](https://github.com/mite404/clipper/actions/runs/43765213526); an injected 2-second freeze failed all five repetitions                                                                                                                                                                                                                  |
| <a id="ref-7"></a>[REF-7](#ref-7)             | Ctrl, Cmd and Alt chords no longer split, delete, seek or drive the transport (#7)                                                                                                                                                                                                                                                                                                    | [`de0d059`](https://github.com/mite404/clipper/commit/de0d0591b58bd3e6fa6e5245beeb5388c5601896) | [CI 43765744937](https://github.com/mite404/clipper/actions/runs/43765744937)                                                                                                                                                                                                                                                                           |
| <a id="clip-8"></a>[CLIP-8](#clip-8)          | Smooth, trim-aware cursor in preview and export, with raw mode, size and visibility                                                                                                                                                                                                                                                                                                   | [`1195cda`](https://github.com/mite404/clipper/commit/1195cdaea0d94d99b9181c896a6b2264473216c0) | [CI 43766525052](https://github.com/mite404/clipper/actions/runs/43766525052); decoded cursor pixels checked across a cut, source offset, crop, swap and zoom; synthetic fixtures only                                                                                                                                                                  |
| <a id="clip-9"></a>[CLIP-9](#clip-9)          | Editable zooms generated from recorded left clicks; each keeps a source anchor, so it stays with its footage through splits and ripple edits; manual zooms win collisions and survive regeneration                                                                                                                                                                                    | [`f3b3021`](https://github.com/mite404/clipper/commit/f3b30213dad8ee8d3a367d537b8cd507a6be7513) | [CI 43771222108](https://github.com/mite404/clipper/actions/runs/43771222108); 107 unit tests, preview and decoded-export focus agree, generated zooms survive save and reopen; synthetic fixtures only                                                                                                                                                 |
| <a id="clip-10"></a>[CLIP-10](#clip-10)       | Smooth follow framing: a zoom can follow the recorded cursor with a dead zone, the same in preview and export; generated zooms default to Focused                                                                                                                                                                                                                                     | [`c2a6be0`](https://github.com/mite404/clipper/commit/c2a6be013164ba289944551f1eaf704c155a9fb1) | [CI 43778344010](https://github.com/mite404/clipper/actions/runs/43778344010); the worker reports 112 unit tests, 35 browser checks including decoded-frame follow cases, and 10 of 10 throttled playback runs; synthetic fixtures only                                                                                                                 |
| <a id="ref-8"></a>[REF-8](#ref-8)             | Mouse-marking mode ends when its zoom is removed, undone or deselected (#6)                                                                                                                                                                                                                                                                                                           | [`fd16d0f`](https://github.com/mite404/clipper/commit/fd16d0fe0e3f8330464266b22d88bff226cb8cb7) | [CI 43766869839](https://github.com/mite404/clipper/actions/runs/43766869839)                                                                                                                                                                                                                                                                           |
| <a id="ref-9"></a>[REF-9](#ref-9)             | Timecode, playhead and frame buttons match the frame the player holds after a pause (#21)                                                                                                                                                                                                                                                                                             | [`7661750`](https://github.com/mite404/clipper/commit/7661750f49e4283266311365ad93238bfc079584) | [CI 43767536538](https://github.com/mite404/clipper/actions/runs/43767536538); reproduced first: readout showed frame 6 while the player held frame 9                                                                                                                                                                                                   |
| <a id="ref-10"></a>[REF-10](#ref-10)          | Trim grip: a click commits nothing; a release trims the clip as it is then (#15, #38)                                                                                                                                                                                                                                                                                                 | [`6eef40b`](https://github.com/mite404/clipper/commit/6eef40b5cd1690d56efec9322ab5a820408e1e85) | [CI 43768432875](https://github.com/mite404/clipper/actions/runs/43768432875); both defects reproduced first                                                                                                                                                                                                                                            |
| <a id="ref-15"></a>[REF-15](#ref-15)          | Export audio mix cost follows clip count, not decoded packet count (#2)                                                                                                                                                                                                                                                                                                               | [`f9ef3c3`](https://github.com/mite404/clipper/commit/f9ef3c3e2397a09f0ba9ce668127de99f47affd4) | [CI 43769770918](https://github.com/mite404/clipper/actions/runs/43769770918); 40 s of Opus mixes in 0.3 s, was 13 s; audio matches the old build and an ffmpeg render equally                                                                                                                                                                          |
| <a id="ref-11"></a>[REF-11](#ref-11)          | A multi-file import names every file it could not read; the demo download gives up after 15 s and frees what it loaded (#9, #37)                                                                                                                                                                                                                                                      | [`30e4254`](https://github.com/mite404/clipper/commit/30e4254f2e66b820264b9b3486096b4623bcc0ab) | [CI 43771794337](https://github.com/mite404/clipper/actions/runs/43771794337); both defects reproduced first                                                                                                                                                                                                                                            |
| <a id="ref-12"></a>[REF-12](#ref-12)          | The logo no longer reloads the page; the browser is asked to confirm a reload or tab close with unsaved edits or a running export; Open project asks before replacing unsaved edits (#23)                                                                                                                                                                                             | [`4115ac6`](https://github.com/mite404/clipper/commit/4115ac644972ca0fe8e74731ff5845d229746863) | [CI 43772612477](https://github.com/mite404/clipper/actions/runs/43772612477); the handler is tested through a `beforeunload` event, the browser's own prompt was not observed (headless Chromium shows none)                                                                                                                                           |
| <a id="ref-13"></a>[REF-13](#ref-13)          | CI compares the fallow baseline with the commit `main` held before the push, and no run is cancelled by a later push (#4)                                                                                                                                                                                                                                                             | [`5ba3392`](https://github.com/mite404/clipper/commit/5ba3392f1017aee08e49d075d9ae6f8b79b0c052) | [CI 43772931127](https://github.com/mite404/clipper/actions/runs/43772931127); in a throwaway clone the old base passed a two-commit push that grew the baseline, the new base failed it                                                                                                                                                                |
| <a id="ref-17"></a>[REF-17](#ref-17)          | Export pixel gate scores the camera and screen panels separately, and a new test checks the exact source frame of every exported frame on both tracks (#31)                                                                                                                                                                                                                           | [`4ed307d`](https://github.com/mite404/clipper/commit/4ed307dccc0b753a676612d8e09d47cb43ef73af) | [CI 43776617847](https://github.com/mite404/clipper/actions/runs/43776617847); five deliberately broken exporters fail it, two of which the old gate passed                                                                                                                                                                                             |
| <a id="ref-19"></a>[REF-19](#ref-19)          | One browser journey for Delete, Backspace, the undo chord, Space, seek clamping at both ends and the overlapping-zoom refusal (#20)                                                                                                                                                                                                                                                   | [`d4174be`](https://github.com/mite404/clipper/commit/d4174beacc53d133c4fdc99e444a5635f7f2de68) | [CI 43777308249](https://github.com/mite404/clipper/actions/runs/43777308249); eight deliberately broken editors fail it; the 50-step undo limit is left for REF-16                                                                                                                                                                                     |
| <a id="ref-16"></a>[REF-16](#ref-16)          | A slider drag or a held key is one undo step, and an edit that changes nothing is not a step, so one drag no longer pushes earlier edits out of the 50-step history (#5)                                                                                                                                                                                                              | [`8fd4ae6`](https://github.com/mite404/clipper/commit/8fd4ae6ef9f92fa0e02609cdf7eaf052e1a23c58) | [CI 43780934384](https://github.com/mite404/clipper/actions/runs/43780934384); 119 unit tests and 37 browser checks; nine of ten deliberately broken versions failed the tests, the tenth led to one more test case; the 50-step limit now has a browser test                                                                                           |
| <a id="ref-21"></a>[REF-21](#ref-21)          | Save refuses a project its file cannot hold (375 MB of media on the timeline) before reading any media, and import warns when the library passes that size; media no clip uses is left out and named when it cannot be read or does not fit; importing a file named like a source that can no longer be read repairs that source in place; export names the unreadable file (#3, #28) | [`319cf38`](https://github.com/mite404/clipper/commit/319cf386c451d7b1e7fdc05ebde8c410add86703) | [CI 43783622890](https://github.com/mite404/clipper/actions/runs/43783622890); #28 was reproduced in Chromium for the first time: changing an imported file's modification time made Save fail although no clip used it; 122 unit tests and 39 browser checks, one with a 400 MB sparse file; seventeen deliberately broken versions all fail the tests |
| <a id="capture-1"></a>[CAPTURE-1](#capture-1) | Manual OpenScreen sidecar checks under `tests/openscreen/`, not part of CI                                                                                                                                                                                                                                                                                                            | [`d72d33c`](https://github.com/mite404/clipper/commit/d72d33c05d1a2213f6d0b6e662fb6907c6a425c1) | [CI 43776958967](https://github.com/mite404/clipper/actions/runs/43776958967); pushed by the Mac capture thread at the owner's request, outside the push slot and with the pre-commit hook skipped (see REF-25); inspected afterwards: four text files, no capture data                                                                                 |
| <a id="ref-25"></a>[REF-25](#ref-25)          | `src/timeline.ts` is now `src/timeline-model.ts`, so no two files differ only by case; CI refuses such names                                                                                                                                                                                                                                                                          | [`90cf4b4`](https://github.com/mite404/clipper/commit/90cf4b43de90d18092803fa9e7a947cc739c9723) | [CI 43779257417](https://github.com/mite404/clipper/actions/runs/43779257417); with imports resolved as a case-insensitive disk resolves them, the old tree gives the Mac's TS2305 and TS1149 errors and the new tree gives none; not yet rerun on the Mac itself                                                                                       |

CLIP-3 is manual fixed-point zoom. It does not satisfy CLIP-7 to CLIP-10. BOOT-1 is on `main`.
Whether it runs for new orbs now that they clone GitHub has not been checked.

## Queue

These tables group tickets by area; [Order of work](#order-of-work) is the one sequencing record.
Correctness and unblocking work precede dependent features. One queue owner coordinates disjoint
implementation lanes; pushes are serialized and await exact-SHA CI.

### Mouse tracking and automatic zoom

| Ticket ID                                         | Title                                                                        | Risk   | Status   | Owner                 | Needs   |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ------ | -------- | --------------------- | ------- |
| <a id="clip-11"></a>[CLIP-11](tickets/CLIP-11.md) | Cursor appearance and behavior: style, idle hide, loop return, shake removal | Medium | Partial  | Cursor implementation | nothing |
| <a id="clip-7b"></a>[CLIP-7b](#clip-7b)           | Screen Studio `mousemoves`/`mouseclicks` metadata import                     | Medium | Decision | Queue implementation  | D-4     |

CLIP-11's core, segment hiding, shape stabilization, rotation and speed styles are delivered (last
at `bd6120f`); its cursor paths are released. Full CLIP-11 remains partial for video-wide ending
parity and real-Mac qualification. Endings apply per trimmed clip, not per whole video. The 1 s idle
delay, 0.5% shake radius, 0.5 s ending duration, 100 ms shape threshold and speed-style fractions
are engineering defaults.

Moved to [history](master-tickets-history.md#clip-11-delivered-units-and-inspector-decision).

### CLIP-11b: targeted cursor metadata attachment

| Ticket ID                                            | Scope                                                                                        | Owner                                                                             | State                                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| <a id="clip-11b"></a>[CLIP-11b](tickets/CLIP-11b.md) | Import from source media panel or drop sidecar onto screen recording in composition/timeline | [Sol scoping](https://ampcode.com/threads/T-fb08e0ff-0f5d-4dab-9d9e-470de7fd0490) | Read-only; separate from the delivered inspector; shared successor/hunk grant required |

The [repo brief](tickets/CLIP-11b.md) covers explicit source-wide targeting, supported
parser/errors, failure/cancel preservation, undo/dirty state and save/reopen. CLIP-2b/2c media
movement/insertion drops are different gestures and retain their owners; REF-27 retains composer
geometry/hit-target seams. Research actual existing state/history before changing shared paths. Do
not infer new metadata format support or attach by filename guess.

Owner clarification, relayed by the Space from `M-034yqB8CMOD13t0F7AHfIn`: attach and synchronize
cursor metadata once per screen recording source. Many zoom timeline clips can mark when to zoom
within that recording; they are not metadata attachment targets and require no per-zoom manual
synchronization. Every use of the recording shares its source-time cursor data and synchronization
offset. Preserve source-time mapping through clip edits. This clarification does not approve the
separate D-1/REF-23 migration of existing manual zoom anchors.

The owner further clarifies that, once both files are in Clipper, dragging the sidecar onto the
source video in Project media makes them one logical recording asset. The cursor data accompanies
that source through timeline use, not a separate metadata clip or track to align. This requested
drop workflow remains CLIP-11b work, not delivered behavior or a physical merge into the source MP4.

Recording-wide association and persistence in the Clipper project do not mean telemetry is embedded
in the video container. The existing owner's
[source research](https://ampcode.com/artifacts/openscreen-metadata-workflow-269d1a1c-08e6-4a7d-83d2-727a67d2cdf6)
pins OpenScreen v2.2.2 and Clipper main `601ba78`. Editable capture records video and cursor data
during one take, then writes the original video and sibling `<videoPath>.cursor.json`. It rebases
cursor times to the video start and compacts pauses. Start with source offset 0, not a second
subtraction of the capture delay. No automatic calibration or sidecar/video fingerprint guarantee
exists. A click timestamp alone cannot align video without a matching visible or audible anchor.

The current Inspector attachment stores `Asset.cursor` once; cuts and cursor-follow zooms reuse its
source-time mapping. Save project retains original media and cursor data in Clipper JSON, not MP4
telemetry. Standard rendered OpenScreen and Clipper exports flatten the cursor into picture frames;
Clipper does not extract editable telemetry from those MP4s. Keep the original recording and sidecar
for editing. Source-panel/drop entry points and attachment undo/dirty handling remain pending
CLIP-11b. Successful replacement currently resets offset/settings; undo must restore the prior
track. These are source findings, not a new native capture/export run or real-recording acceptance.
CLIP-11b remains read-only under its existing owner.

### Audited experiment and inspector scopes

These IDs turn previously unnumbered scope into canonical tickets without accepting experiments. The
detailed source decisions below remain evidence for these rows, not additional tickets.

| Ticket ID                               | Feature                                                                                                   | State and dependency                                                                                                                        |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="ui-10"></a>[UI-10](#ui-10)       | Adopt selected shared ui-sdk controls and requested tooltip/checkbox polish from the preserved experiment | Preserved experiment only; coordinator T-136752bf assigns eventual implementation to a lane after exact scope/path grant; UI-1 is delivered |
| <a id="ui-11"></a>[UI-11](#ui-11)       | Show editable inspector properties only for the selected timeline clip type                               | Approved behavior; integration held; coordinate CLIP-11b source attachment and CLIP-9b inspector consumers                                  |
| <a id="clip-2d"></a>[CLIP-2d](#clip-2d) | Hide/show an individual whole clip while retaining its dimmed timeline region                             | Approved behavior; integration held; distinct from UI-9 layer visibility and cursor-only hiding                                             |
| <a id="ui-12"></a>[UI-12](#ui-12)       | Evaluate adoption of the SPEC-01 hardware-inspired editor skin and haptics                                | Parked by owner; preserved remote experiment, no main adoption or implementation grant                                                      |

UI-10's source is the UI SDK design parent and candidate thread linked below. Accept controls and
the requested separate local polish only after checking keyboard behavior, legacy projects, actual
final-head gates and inspected states. It does not own UI-11 selection semantics, CLIP-2d saved
visibility, or already delivered UI-1 tooltips. Preserve the original candidate and backup.

UI-11 preserves recording-wide cursor settings ownership while changing which editable controls are
visible. Verify relevant selection, unrelated selection, no selection and source-sidecar access. Do
not turn selection visibility into an unrequested settings migration.

CLIP-2d requires preview, Copy frame and decoded export parity, explicit audio behavior for hidden
clips, unchanged timeline length/order, undo and legacy save/reopen. The owner approved whole-clip
hiding and a retained dimmed region, not deleting media or auto-pairing hidden clips. Resolve audio
and association interactions before implementation. Existing experimental behavior is not accepted.

The [UI SDK design parent](https://ampcode.com/threads/T-85e2e0a7-9485-4657-9f22-48ae0622da7b)
reports the owner's preferred local candidate is `exp/ui-sdk-marginal-controls`, frozen at `dec534e`
on accepted `19c571e` in
[T-5842510f](https://ampcode.com/threads/T-5842510f-6f83-40ad-bcda-37d1b704f756). Confirmed design
puts animation style, cursor style and size first; makes idle hide, shake removal, shape
stabilization and rotation inspector options; removes hidden ranges; and requests right-click
Hide/Show on every timeline clip type. The owner subsequently confirmed whole-clip hiding: retain
the clip dimmed on the timeline and exclude it from preview and export. These decisions overlap
CLIP-11, CLIP-11b and CLIP-7, but do not grant main paths, a push slot or experiment acceptance.

The owner's later Space decision `M-034yfjXvPQVcAEJvbX2nzL` requires the inspector to show editable
properties only for the currently selected timeline clip/type. Cursor animation controls appear only
when the relevant cursor-animated clip is selected, leaving room for the other selected clip's
properties otherwise. This supersedes library-only cursor-inspector visibility, not recording-wide
cursor ownership, edit scope or persistence. The existing candidate owner must preserve `dec534e`
and scope this as a later visibility delta with selected-relevant, unrelated clip/type and no-clip
acceptance states. Any eventual implementation follows the current worker-model policy after an
exact shared-path grant. No duplicate worker or recording-to-clip settings migration is authorized.

The preserved candidate owner reports Sonnet, so it remains research/preservation-only. Coordinator
T-136752bf retains eventual implementation ownership until a lane worker receives an exact grant.
Read-only inspection identifies the no-selection fallback to the library asset as the immediate
cursor-visibility deviation. A cursor-only fix is not by itself acceptance of all selected-type
inspector properties. Scope missing-sidecar attachment, library-only source access and the remaining
selected-clip versus project-global inspector sections before integration; preserve the existing
attachment contract and do not duplicate CLIP-9b's batch-panel deletion.

The owner's additional polish request is one separate local commit on
`exp/ui-sdk-marginal-controls-polish`, cut from preserved `dec534e` and owned by the former Sol
medium coordinator T-6706048a (retired); coordinator T-136752bf now holds it. Remove the visible
recording-scope line and Appearance/behavior legend without changing setting ownership or accessible
group names. Replace the Animation and ending notes with toggleable info tooltips using UI-1's
ui-sdk implementation, styling and motion. Align the four checkboxes and make hidden clips' dashed
outlines visible. Verify affected controls/hiding specs, full gates and inspected cursor/hidden-clip
captures. This is not a Sonnet source release, main reservation, push or landing acceptance. The
original candidate and backup remain unchanged.

Sidecar auto-pairing by basename, old-project hidden-range handling, menu keyboard details, Instant
zoom and numeric Enter/blur commits are not confirmed design choices. Resolve those semantics and
ticket boundaries before integration; do not silently replace the approved attachment contract.
Basic keyboard accessibility and preservation of existing projects still apply. The latest candidate
also leaves legacy Hide-cursor reopening, hidden-clip export length and fallback Attach-sidecar
semantics unaccepted. Its receipts report 138 units and 81 browser checks, but the full run preceded
CSS/note fixups; affected specs reran later. This is not exact-final-head full qualification.

SPEC-01's `exp/spec01-hardware` in
[T-9594a0bf](https://ampcode.com/threads/T-9594a0bf-cee4-449d-8bc1-7e5f808fc0a3) stays parked for
main integration. It is now remotely preserved at
[`83c8eb6`](https://github.com/mite404/clipper/commit/83c8eb66a044c7aa5336df2d3a7bda4ea319b473),
whose parent is the previously backed-up `796e09f`; the new commit mutes skin sounds by default. The
remote branch and main remaining at `d8776cd` were independently checked. This is not landing
acceptance or a production deployment; no PR or branch CI is claimed.

Actual transferred backups remain under `.amp/in/orb-backup/`: the older SPEC-01 `796e09f` bundle
and UI SDK `e93f8f6`/`6c52832` bundle plus separate dirty inspector test are retained. The latter
requires `7878c60` and `57f5864`; its older base label is not authoritative. The newer UI SDK
`dec534e` split bundle was reassembled, all payload hashes checked, and `git bundle verify` passed
with complete history and no prerequisites. It retains both `dec534e` and pre-rebase `6c52832`, plus
main `19c571e`. No experiment source or refs have been imported into the working tree. No additional
remote push, dependency/configuration migration or experiment landing is granted here.

### Acceptance added by the real capture

One OpenScreen 2.2.2 recording was checked on the owner's Mac. These points are binding on CLIP-7
and CLIP-8 in addition to the reference backlog.

- CLIP-7 accepts version 2 `native` sidecars and keeps unknown fields. The real file carries
  `visible` on samples and `id` and `platform` on cursor images.
- Timestamps may repeat: the first three samples are all 0 ms. Samples arrive at about 23 Hz.
- Clicks and mouseups need not pair: the capture has five clicks, four mouseups, one duplicate
  mouseup and two trailing clicks.
- Hotspots are fractional (4.5, 11.5) and must not be rounded.
- Samples are stored in source time per asset. A user-adjustable time offset defaults to 0, because
  the clock offset between video and sidecar was not measured.
- Malformed input is rejected without replacing existing data. A video with no sidecar shows a clear
  no-tracking state.
- Saving must not drop pointer data: `serializeProject` writes only what `parseProject` returns
  (#29), so CLIP-7 ships a round-trip test for every pointer field.
- CLIP-8 picks the cursor image by `assetId`, never `cursorType`: all 28 `pointer` labels in the
  capture sit on the arrow image. It interpolates between samples and looks them up by binary
  search, not a per-frame scan.
- Engineering rules in CLIP-9 as shipped, not owner decisions: a click pairs with the next mouseup,
  and repeated downs collapse into one until a release arrives. An unpaired click in the last 250 ms
  is left out of zoom generation as a heuristic, on the unverified guess that it is the click on
  Stop; an unpaired click elsewhere still counts. Raw samples are never altered.
- Engineering choices in REF-16 and REF-21 as shipped, not owner decisions. REF-16: changes to the
  same numeric values less than 800 ms apart are one undo step. REF-21: a re-import repairs an
  unreadable source by file name (the other remedy in #28, copying every file into memory at import,
  was not taken); Save still embeds unused library media whenever it fits and can be read, so what a
  reopened library contains is unchanged in the normal case; the limit is 375 MB of source bytes,
  which leaves an unmeasured 36 million characters for the edit and cursor sidecars.
- Engineering choices in CLIP-10 as shipped, not owner decisions: follow half-lives of 100 and 300
  ms, a dead zone of 20% of the viewport half extent, and Focused as the default for generated
  zooms.
- CLIP-9 applies no automatic clock or drift correction between video and sidecar. The Mac capture
  thread measured no drift over a 139 s take and a median offset of 7 ms, with about one frame of
  jitter; its method and result are in `tests/openscreen/README.md`. The queue thread has read that
  record, not the recording.
- Cursor bitmaps are drawn at their pixel size. Whether size and hotspot should be divided by
  `scaleFactor` is unknown: OpenScreen 2.2.2 (`d7adf05`) declares the field in
  `src/native/contracts.ts` without drawing semantics, and its macOS renderer draws its own theme
  sprites, not captured bitmaps. The real capture has scale 1 only, so no rule was added.
- Compatibility claim: OpenScreen 2.2.2, macOS, full display, scale 1. Scale 1 was inferred, not
  measured. Retina, window capture, multi-display and non-left buttons are untested.

### Approved tooltip pilot after CLIP-11

| Ticket ID                                | Title                                | Status                                   | Owner                                                                            | Needs               |
| ---------------------------------------- | ------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------- | ------------------- |
| <a id="ui-1"></a>[UI-1](tickets/UI-1.md) | Shared IconButton tooltip via ui-sdk | Delivered at b9596c6; exact-SHA CI green | [Sol medium](https://ampcode.com/threads/T-66876f27-839b-4898-be45-5614e480a7cd) | none; slot released |

Moved to [history](master-tickets-history.md#ui-1-tooltip-pilot).

### Approved workspace layout unit

| Ticket ID                      | Title                                                              | Status                                 | Owner                                                                            | Needs                                                                               |
| ------------------------------ | ------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <a id="ui-2"></a>[UI-2](#ui-2) | Hide/show media drawer, timeline room and two-axis track scrolling | Delivered ceb40bb; exact-main CI green | [Sol medium](https://ampcode.com/threads/T-2a8c77a8-9a49-4cc2-ae3f-9c4a2550fbea) | Reservation released; historical stress portal not required; archive-only clearance |

Moved to [history](master-tickets-history.md#ui-2-workspace-layout-and-inspector-integration).

### Not blocking mouse work

Take these when a push slot is free and the files do not overlap an in-flight ticket. Owner is the
queue thread unless stated.

| Ticket ID                                      | Title                                                                                                        | Risk   | Status                                                                                                                                                                              | Findings            |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| <a id="ref-14"></a>[REF-14](tickets/REF-14.md) | One constant each for music gain and peak rate; blob-URL test asserts no fetch                               | Small  | Delivered at [afe4c60](https://github.com/mite404/clipper/commit/afe4c605f551c979083297b0e0d5d24f4a32a484); [green CI](https://github.com/mite404/clipper/actions/runs/43806193468) | #32, #33, #34       |
| <a id="ref-18"></a>[REF-18](tickets/REF-18.md) | Editor journeys also run against the production bundle                                                       | Medium | Delivered at [7373115](https://github.com/mite404/clipper/commit/7373115e9a501312bea5a4192a101094dce5d08f); [green CI](https://github.com/mite404/clipper/actions/runs/43803496212) | #18                 |
| <a id="ref-20"></a>[REF-20](tickets/REF-20.md) | Rewind and export progress re-render at 10 Hz                                                                | Medium | Delivered 612486f; exact-main CI 43850098949 green; full 61/61 and fresh-orb performance 20/20; host-sensitive failures preserved                                                   | #36                 |
| <a id="ref-26"></a>[REF-26](tickets/REF-26.md) | Keep footer errors and warnings visible without scrolling                                                    | Small  | Delivered at [4535665](https://github.com/mite404/clipper/commit/45356659c892b3607230778270c5d4eb16786c3c)                                                                          | found during REF-21 |
| <a id="ref-22"></a>[REF-22](#ref-22)           | Project container without one giant JSON string (a new format version; never 3, which means embedded stills) | Large  | Proposal                                                                                                                                                                            | #3                  |
| <a id="ref-23"></a>[REF-23](#ref-23)           | Zooms anchored to source time and source coordinates                                                         | Large  | Closed by the owner 2026-11-18: D-1 answered no                                                                                                                                     | #14, #24            |
| <a id="ref-24"></a>[REF-24](#ref-24)           | Edit operations in a tested reducer outside `App.tsx`                                                        | Large  | Proposal; only if REF-19 proves too thin                                                                                                                                            | #20                 |

REF-22 changes saved data, so it needs the owner's go-ahead before code. REF-23 is closed.

### Review follow-ups without a delivery claim

These rows make the review's informational recommendations explicit. They are proposals, not new
confirmed defects. Optional cleanup does not delay features. The coverage table below identifies the
original note for every row.

| Ticket ID                                            | Title                                                                                                             | Risk   | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Needs                                                                                                                                                                                                                                                                                 |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="doc-2"></a>[DOC-2](#doc-2)                    | Audit ticket coverage, IDs and delivery evidence                                                                  | Small  | Delivered at [a8078ff](https://github.com/mite404/clipper/commit/a8078ffb4d737bf028bd0b864f31125dbd510263), [green CI](https://github.com/mite404/clipper/actions/runs/43789649834)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | nothing                                                                                                                                                                                                                                                                               |
| <a id="ref-27"></a>[REF-27](#ref-27)                 | Select real MP4/MOV/WebM exports and qualify codecs                                                               | Medium | Delivered at [27099dc](https://github.com/mite404/clipper/commit/27099dcf976a1d6eae6b39d431e33afae7659f9a); [green exact-SHA CI](https://github.com/mite404/clipper/actions/runs/44001648378)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Reservation released                                                                                                                                                                                                                                                                  |
| <a id="ref-27b"></a>[REF-27b](#ref-27b)              | Show the complete export filename before the native save dialog                                                   | Small  | Delivered at [631f0bc](https://github.com/mite404/clipper/commit/631f0bc4a6ac1f784c9bfcf77d2fef25052525a1); [green exact-SHA CI](https://github.com/mite404/clipper/actions/runs/44012171159)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Reservation released; canonical editor promoted and verified                                                                                                                                                                                                                          |
| <a id="ref-28"></a>[REF-28](#ref-28)                 | Define missing decoded-frame behavior                                                                             | Medium | Delivered at [962d14c](https://github.com/mite404/clipper/commit/962d14cf83a50f5e1a9bfa5b1cf5e9fff59fe260); green exact-SHA [CI44383128043](https://github.com/mite404/clipper/actions/runs/44383128043); preview promoted. Contract (coordinator defaults, open to Mite): early end and holes hold the last frame with audio continuing; before the first sample Copy frame and export hold the first frame; a decode error fails as `"<clip>" could not be decoded at mm:ss:ff.`; the preview freezing on a decode error is a known limit                                                                                                                                                                                                                                                                                                                                                                                        | reproduce null and early-end decoder cases                                                                                                                                                                                                                                            |
| <a id="ref-29"></a>[REF-29](#ref-29)                 | Assess complexity-score baseline blind spots                                                                      | Small  | Deferred proposal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | only if count-only baseline permits real growth                                                                                                                                                                                                                                       |
| <a id="ref-30"></a>[REF-30](#ref-30)                 | Progress and cancellation for import, Open and Save                                                               | Large  | Proposal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | define bounded-memory and cancellation behavior with REF-22                                                                                                                                                                                                                           |
| <a id="ref-31"></a>[REF-31](tickets/REF-31.md)       | Prevent hidden-tab rewind jumps and held-Space toggles                                                            | Small  | Delivered at [9132ecf](https://github.com/mite404/clipper/commit/9132ecfa925389b5167e10a1ccc2ded27ee4a3ce); [green CI](https://github.com/mite404/clipper/actions/runs/43898463793)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Transport reservation released                                                                                                                                                                                                                                                        |
| <a id="ref-38"></a>[REF-38](tickets/REF-38.md)       | Keep Space transport on keyboard-focused controls                                                                 | Medium | Delivered at [02010f6](https://github.com/mite404/clipper/commit/02010f61b07508462b62567789af32b39a9ada49); [green exact-SHA CI44035760045](https://github.com/mite404/clipper/actions/runs/44035760045)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Reservation released; file-input Space was later settled by [REF-41](#ref-41)                                                                                                                                                                                                         |
| <a id="ref-39"></a>[REF-39](#ref-39)                 | Mark the project unsaved when a track mute changes                                                                | Small  | Delivered at [d423d7c](https://github.com/mite404/clipper/commit/d423d7cee013f31e05ed7d864ce06104ffbe674a); green exact-SHA [CI44063138586](https://github.com/mite404/clipper/actions/runs/44063138586)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Mute is saved but never sets the unsaved state, so Open and closing the tab lose it silently; compare it like locks                                                                                                                                                                   |
| <a id="ref-40"></a>[REF-40](#ref-40)                 | Keep editor shortcuts working after a ruler scrub                                                                 | Small  | Delivered at [46e9dc7](https://github.com/mite404/clipper/commit/46e9dc7d1affa2dfc7c722f67cbce9983ea9bfd8); green exact-SHA [CI44102354477](https://github.com/mite404/clipper/actions/runs/44102354477)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | The focused playhead slider swallows J/K/L/B/C/V and Cmd/Alt+K; keep native arrow, Home, End and Page keys                                                                                                                                                                            |
| <a id="ref-41"></a>[REF-41](#ref-41)                 | Give Space to transport from a focused file input                                                                 | Small  | Delivered at [46e9dc7](https://github.com/mite404/clipper/commit/46e9dc7d1affa2dfc7c722f67cbce9983ea9bfd8); green exact-SHA [CI44102354477](https://github.com/mite404/clipper/actions/runs/44102354477)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner-requested; Enter and click still open the chooser                                                                                                                                                                                                                               |
| <a id="ref-42"></a>[REF-42](#ref-42)                 | Make Open project keyboard-reachable and refresh key-rule help/docs                                               | Small  | Delivered at [6d4350d](https://github.com/mite404/clipper/commit/6d4350d81add221c831b428224c490e745cd3d3d); green exact-SHA [CI44111981121](https://github.com/mite404/clipper/actions/runs/44111981121)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | The Open project input is `display: none` with no tab stop; help and timeline-transport docs predate REF-40/41                                                                                                                                                                        |
| <a id="ref-43"></a>[REF-43](#ref-43)                 | Make Open project a Save-style button beside Save                                                                 | Small  | Delivered at [f8fa072](https://github.com/mite404/clipper/commit/f8fa072553b10ecb744de84665fc93de0689a7c5); green exact-SHA [CI44124453125](https://github.com/mite404/clipper/actions/runs/44124453125)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner request; successor to REF-42, keeping its keyboard, chooser, discard and disabled behavior                                                                                                                                                                                      |
| <a id="ref-44"></a>[REF-44](#ref-44)                 | Delete the selection only from the timeline                                                                       | Small  | Delivered at [b9f4bc4](https://github.com/mite404/clipper/commit/b9f4bc4f94573a28c689f39212ff508b46598b9e); green exact-SHA [CI44134842288](https://github.com/mite404/clipper/actions/runs/44134842288)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner request; Delete/Backspace no-op when focus is outside the Main sequence panel                                                                                                                                                                                                   |
| <a id="ref-45"></a>[REF-45](#ref-45)                 | Report Still duration only when it changes                                                                        | Small  | Delivered at [5a34428](https://github.com/mite404/clipper/commit/5a3442841d08a143ccdf3575bcd49849f8b4692a); green exact-SHA [CI44146318878](https://github.com/mite404/clipper/actions/runs/44146318878)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Preview finding after REF-44; also reproduce a tooltip that outlives keyboard focus                                                                                                                                                                                                   |
| <a id="ref-46"></a>[REF-46](#ref-46)                 | Fit every lane and the preview in the default layout                                                              | Small  | Delivered at [729b72d](https://github.com/mite404/clipper/commit/729b72d5854e13cfbf4d7af845de99f95beb579b); green exact-SHA [CI44198295097](https://github.com/mite404/clipper/actions/runs/44198295097)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | CLIP-2c review follow-up; dropped +72px kept as reference                                                                                                                                                                                                                             |
| <a id="ref-47"></a>[REF-47](#ref-47)                 | Cursor overlay for a second screen-role track                                                                     | Medium | Delivered at [aae6f84](https://github.com/mite404/clipper/commit/aae6f8443cc1810e40ab255428158f7bf9656d32); green exact-SHA [CI44217820183](https://github.com/mite404/clipper/actions/runs/44217820183)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | CLIP-2c follow-up; zoom already applies to every screen-role track                                                                                                                                                                                                                    |
| <a id="ref-48"></a>[REF-48](#ref-48)                 | Drag a zoom region to reposition it                                                                               | Medium | Delivered at [0f1fca9](https://github.com/mite404/clipper/commit/0f1fca90b43ef0f50fb6550767a1f6d98be003ef); green exact-SHA [CI44247241370](https://github.com/mite404/clipper/actions/runs/44247241370)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner recording; subpart of CLIP-9b regions                                                                                                                                                                                                                                           |
| <a id="ref-49"></a>[REF-49](#ref-49)                 | Extend clip edges as well as shorten them                                                                         | Small  | Delivered at [063bc31](https://github.com/mite404/clipper/commit/063bc314860750472368cdc8246ab917839f15fe); green exact-SHA [CI44223873248](https://github.com/mite404/clipper/actions/runs/44223873248)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner recording; `trimClip` never adds frames                                                                                                                                                                                                                                         |
| <a id="ref-50"></a>[REF-50](#ref-50)                 | Keep a zoom inside its source mask                                                                                | Medium | Delivered at [4bc0f24](https://github.com/mite404/clipper/commit/4bc0f24a5ec87059ad7b28f5dc34c0365678f05f); green exact-SHA [CI44229120203](https://github.com/mite404/clipper/actions/runs/44229120203)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner recording; unclamped `cameraTransform`                                                                                                                                                                                                                                          |
| <a id="ref-51"></a>[REF-51](#ref-51)                 | Razor hover shows the prospective cut frame                                                                       | Small  | Delivered at [cc12bb5](https://github.com/mite404/clipper/commit/cc12bb53cb492a53e00d987107597c14a0b4bc97); green exact-SHA [CI44236114469](https://github.com/mite404/clipper/actions/runs/44236114469)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner recording; supersedes stationary playhead; v3 first folds Timeline's four track-header props into one `headers` prop (Fallow `Timeline()` cognitive score is at the 15 limit)                                                                                                   |
| <a id="ref-52"></a>[REF-52](#ref-52)                 | Keyboard shortcut pressed right after media finishes loading is dropped                                           | Small  | Delivered at [3048947](https://github.com/mite404/clipper/commit/3048947e89cb4752836e23e48d32c824c6c15353); green exact-SHA [CI44241841877](https://github.com/mite404/clipper/actions/runs/44241841877)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Reproduce end to end first; the first shortcut after the ready text must take effect; then remove the `armRazor` header-click workaround from `tests/split-tools.spec.ts`                                                                                                             |
| <a id="ref-53"></a>[REF-53](#ref-53)                 | Media drawer Escape is missed right after the drawer opens                                                        | Small  | Delivered at [68d6ec1](https://github.com/mite404/clipper/commit/68d6ec1880f17c26b6169a2a073443b8a0d08a61); green exact-SHA [CI44253993735](https://github.com/mite404/clipper/actions/runs/44253993735)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | `useMediaDrawer`'s keydown listener is registered in a passive effect, the gap REF-52 fixed in App.tsx; reproduce, then use a layout effect                                                                                                                                           |
| <a id="ref-55"></a>[REF-55](#ref-55)                 | Timeline ruler labels repeat the same second                                                                      | Small  | Delivered at [bd12fdc](https://github.com/mite404/clipper/commit/bd12fdcba1bccac1c146dec01c1877b5ddb39170); green exact-SHA [CI44260120802](https://github.com/mite404/clipper/actions/runs/44260120802)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Seen on the REF-52 preview: a 6 s sequence shows 00:00, 00:00, 00:01 ... 00:03, 00:03 because nine ticks span the duration evenly and each label is cut to whole seconds (`Timeline.tsx` ruler). Ticks must fall on whole seconds or show frames, and each label must sit at its time |
| <a id="ref-54"></a>[REF-54](#ref-54)                 | Pin generated zooms to the timeline                                                                               | Medium | Delivered at [5d32e36](https://github.com/mite404/clipper/commit/5d32e364a6f6e0b36b2da810b447316f438f75f7); green exact-SHA [CI44257006228](https://github.com/mite404/clipper/actions/runs/44257006228)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | D-1: generated zooms stop following their source anchor; decide how saved anchored zooms open, keeping older files readable                                                                                                                                                           |
| <a id="ref-56"></a>[REF-56](#ref-56)                 | Show hours so long timecodes never read cut                                                                       | Small  | Delivered at [aa6db5b](https://github.com/mite404/clipper/commit/aa6db5b8c2230aa52af0e4950b8505376ac3d8b9); green exact-SHA [CI44260120802](https://github.com/mite404/clipper/actions/runs/44260120802)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Sonnet lane; past 99 minutes timecodes use unpadded hours (1:45:00:00); promoted                                                                                                                                                                                                      |
| <a id="ref-57"></a>[REF-57](#ref-57)                 | Self-host fonts so page load contacts no other origin                                                             | Small  | Delivered at [ced85b0](https://github.com/mite404/clipper/commit/ced85b0117934fce311c829931011f43fb9ec2bb); green exact-SHA [CI44264487369](https://github.com/mite404/clipper/actions/runs/44264487369) (attempt 2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Latin and latin-ext woff2 with OFL licences; no third-party request on load                                                                                                                                                                                                           |
| <a id="ref-58"></a>[REF-58](#ref-58)                 | Resize a zoom region by dragging either edge                                                                      | Medium | Delivered at [79a058b](https://github.com/mite404/clipper/commit/79a058bc8d21e16ce5333feeb8794c03e28b7b8a); green exact-SHA [CI44377998472](https://github.com/mite404/clipper/actions/runs/44377998472) attempt 2 (attempt 1 an apt stall); preview promoted. Known: holding an arrow can silently delete a neighbour zoom remnant under 6 frames                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Owner request 2026-11-18; CLIP-9b's zoom-edge item, distinct from REF-48's body drag                                                                                                                                                                                                  |
| <a id="ref-59"></a>[REF-59](#ref-59)                 | Pressing or selecting a clip must not change its size                                                             | Small  | Delivered at [02ce3e7](https://github.com/mite404/clipper/commit/02ce3e7710bbce129ebb1f802e9e42312c883786); green exact-SHA [CI44275446211](https://github.com/mite404/clipper/actions/runs/44275446211)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Owner request 2026-11-18; clips and zoom blocks inherit the global button press scale                                                                                                                                                                                                 |
| <a id="ref-60"></a>[REF-60](#ref-60)                 | `-` and `=` zoom the timeline scale out and in                                                                    | Small  | Delivered at [f174230](https://github.com/mite404/clipper/commit/f174230ebaddbaaddb0a58cfdb9e76488619361d); green exact-SHA [CI44286909666](https://github.com/mite404/clipper/actions/runs/44286909666); promoted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Owner request 2026-11-18; changes displayed length only, never clip duration                                                                                                                                                                                                          |
| <a id="ref-61"></a>[REF-61](#ref-61)                 | Mark the mouse position by pressing and dragging on the video                                                     | Medium | Delivered at [9cd2c67](https://github.com/mite404/clipper/commit/9cd2c67baaa211e9d557e6abc63d4d862e4b6af4); green exact-SHA [CI44352191597](https://github.com/mite404/clipper/actions/runs/44352191597); promoted; live hit area kept, touch-scroll on the video a known risk                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Owner request 2026-11-18; replaces the inspector-armed mode, button and guide text                                                                                                                                                                                                    |
| <a id="ref-62"></a>[REF-62](#ref-62)                 | Export save prompt is lost after a long render                                                                    | Small  | Delivered at [1075e05](https://github.com/mite404/clipper/commit/1075e053d7778d93b31c4abe845b797e9e06b27e); green exact-SHA [CI44281249762](https://github.com/mite404/clipper/actions/runs/44281249762); promoted; Save project picker excluded (known risk)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Owner report 2026-11-18; see [owner requests](#owner-timeline-and-marking-requests-2026-11-18)                                                                                                                                                                                        |
| <a id="ui-14"></a>[UI-14](tickets/UI-14.md)          | Clip-region card replaces the tiled filmstrip                                                                     | Medium | Delivered on main at `5f75096` (batch 6, pushed 2026-11-19), green exact-SHA [CI44577985376](https://github.com/mite404/clipper/actions/runs/44577985376). Candidate `eb42e1c` verified by lane T-2a7c5d23 (`all` 248/248, isolated `performance` 20/20). Owner picked B                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | See [owner requests](#owner-timeline-and-marking-requests-2026-11-18)                                                                                                                                                                                                                 |
| <a id="ref-63"></a>[REF-63](#ref-63)                 | Ruler marks at deep timeline zoom                                                                                 | Small  | Delivered at [00b4721](https://github.com/mite404/clipper/commit/00b472114016a62298457b73f69a357b188b7a27); green exact-SHA [CI44360134096](https://github.com/mite404/clipper/actions/runs/44360134096)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Seen on the REF-60 capture: at 2890 px/s the ruler is blank because `rulerMarks` never steps below 1 s                                                                                                                                                                                |
| <a id="ref-64"></a>[REF-64](#ref-64)                 | Overlap clips and zooms while dragging; overwrite what lies under them on release                                 | Medium | Delivered at [6479ee3](https://github.com/mite404/clipper/commit/6479ee336105102fa36bce0ac25cce8a20405622); green exact-SHA [CI44366759153](https://github.com/mite404/clipper/actions/runs/44366759153); preview promoted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Owner request 2026-11-18                                                                                                                                                                                                                                                              |
| <a id="ref-65"></a>[REF-65](#ref-65)                 | A held clip hides a neighbour's label under it                                                                    | Small  | Delivered at [962d14c](https://github.com/mite404/clipper/commit/962d14cf83a50f5e1a9bfa5b1cf5e9fff59fe260); green exact-SHA [CI44383128043](https://github.com/mite404/clipper/actions/runs/44383128043); preview promoted                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         | Found on REF-64's promotion receipt; `isolation: isolate` on `.timeline-clip`                                                                                                                                                                                                         |
| <a id="ref-66"></a>[REF-66](#ref-66)                 | One shared `timecode`/`clock` in timeline-model.ts                                                                | Small  | Delivered as 6598e8d with VERIFY-11, main [c037dbb](https://github.com/mite404/clipper/commit/c037dbb456ffa8b3fbd8be83a65c566e9126528a); `all` 197/197, performance 20/20; green exact-SHA [CI44402658418](https://github.com/mite404/clipper/actions/runs/44402658418)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | REF-28 review P3s; export.ts and App/Timeline/components callers                                                                                                                                                                                                                      |
| <a id="ref-67"></a>[REF-67](#ref-67)                 | `[` then `]` within 800 ms fold into one undo step                                                                | Small  | Delivered at [094bbae](https://github.com/mite404/clipper/commit/094bbae33e3836243dcc9c8f0b89ce5f1185a6ab); green exact-SHA [CI44424425235](https://github.com/mite404/clipper/actions/runs/44424425235); preview promoted. `[` and `]` are discrete undo steps                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Found on bd1c041's promotion: history.ts folds a duration-only change into the previous trim; discrete key edits must each be one step                                                                                                                                                |
| <a id="ref-68"></a>[REF-68](#ref-68)                 | ui-sdk agent skill in `.agents/skills`                                                                            | Small  | Delivered on main at `8e7b506` (batch 5, pushed 2026-11-19)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Design owner request                                                                                                                                                                                                                                                                  |
| <a id="ref-69"></a>[REF-69](#ref-69)                 | Media-pool hover scrubs only the pool clip, never the source panel                                                | Small  | Delivered at `1407036` (reviewed `6cca972`, tree identical to the lane's `3d0657d` with the committer identity rebuilt); review LAND; source-scrub 6/6 on the rebased tree; green exact-SHA CI44630820804; preview promoted with receipt. Declined review P3: MediaLibrary's positions Map never evicts removed assets (a number per id; evict on removal only if long sessions with many imports ever matter). Owner report on promoted batch 5: pool hover must visibly scrub the pool clip's own frames and must not move the source panel playhead (the source panel sets in/out; moving it while another panel owns hover is undesired). UI-8's `1e2e32d` coupled pool hover to the source preview - re-scope to a pool-local scrub. Coordinator decisions (owner may veto): clicking a pool card adopts its last local scrub position as the source preview position; the wheel stays, retargeted to the pool-local position | Owner direction 2026-11-19, quoted in the coordinator thread                                                                                                                                                                                                                          |
| <a id="ref-70"></a>[REF-70](#ref-70)                 | Pool compact rows: resolution and frame rate on the icon row                                                      | Small  | Delivered at `7544b6c` (reviewed `4cab607`, rebased over docs-only main); review LAND with no findings; source-scrub 6/6 on the rebased tree; green exact-SHA CI44638639368 after one apt-mirror rerun; preview promoted with receipt. Owner request on the pool list view (screenshot 2026-11-19): resolution and frame speed belong in the same row as the clip icon, to its right - today they sit on a second line as resolution and duration. Adds fps, which compact rows do not show; duration stays unless the owner says otherwise                                                                                                                                                                                                                                                                                                                                                                                        | Owner direction 2026-11-19, quoted in the coordinator thread                                                                                                                                                                                                                          |
| <a id="ref-71"></a>[REF-71](#ref-71)                 | Source footer keeps only the asset count                                                                          | Small  | Delivered at `589a0e1` plus the owner-directed toolbar-centering follow-up `91b230b` (small lane T-01a1f45a-296f); review LAND on both trees; green exact-SHA CI44623097400; preview promoted with receipt. Owner request (screenshots 2026-11-19): in the source footer bar leave only "4 assets ready" - delete the "Double-click a track to seek" hint and the px/s zoom readout                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Owner direction 2026-11-19, quoted in the coordinator thread                                                                                                                                                                                                                          |
| <a id="ref-72"></a>[REF-72](#ref-72)                 | Timeline zoom steps follow the timeline frame rate                                                                | Medium | Granted to the main lane, scope approved 2026-11-19: deepest zoom anchors to the frame rate (FRAME_SCALE = FPS x the ruler's refined gap, 4800 px/s at 30 fps), a measured 33M px content-width cap bounds very long timelines (24 h tops out at ~382 px/s, ruler marks every 15 frames - browser-forced), REF-60's x sqrt(2) key step and playhead anchoring unchanged, rulerMarks windowed to the viewport. Owner direction 2026-11-19: timeline scaling must be based on the timeline frame rate, so zooming at the playhead resolves frames per second rather than seconds per minute or minutes per hour. Affects REF-60 zoom steps and REF-63 deep-zoom ruler marks                                                                                                                                                                                                                                                          | Owner direction 2026-11-19, quoted in the coordinator thread                                                                                                                                                                                                                          |
| <a id="clip-49"></a>[CLIP-49](#clip-49)              | In-app assistant, phase 1: trim/split through the ui-sdk agent bridge, opt-in transcript, local-Whisper dictation | Large  | Delivered at `a8848cb` (`21004c6` on `83f8e16`, plus the `DictationModal.tsx` case-gate rename in `ea80ca1` and `d72e2b7`, plus the CI timeout fix `a8848cb`) (design lane T-01a1f45a-212a, reviewer T-01a1f458-e0e9); owner ruled 2026-11-19 the `?agent-test` hook stays in production as-is, no delta, no re-review; [ADR-38](adr.md#adr-38-an-in-app-assistant-edits-through-ui-sdks-agent-bridge)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Owner approval 2026-11-19; OpenRouter (key in memory) or local Ollama                                                                                                                                                                                                                 |
| <a id="clip-9c"></a>[CLIP-9c](#clip-9c)              | Zoom ramp curve editor and easing presets in the Inspector                                                        | Medium | Delivered at [beefd03](https://github.com/mite404/clipper/commit/beefd0396a95890ded236a3328999dec8199d5b3); green exact-SHA [CI44408378520](https://github.com/mite404/clipper/actions/runs/44408378520); preview promoted. Owner-accepted limit: handles are mouse-only, the labelled preset select is the keyboard path. The orb's cursor-follow perf miss reproduced on base main (250 ms), so host noise                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Owner request 2026-11-18; the curve part of CLIP-9b ramps                                                                                                                                                                                                                             |
| <a id="ui-15"></a>[UI-15](#ui-15)                    | UI SDK interaction migration: `bindDrag` for trim grips, ZoomBlock and splitters; shared `Choice` selects         | Medium | Delivered at [6b55050](https://github.com/mite404/clipper/commit/6b55050af5b5e35ea2191f8ea78cee630ac194de) (df208e6 + 6b55050); `all` 210/210, performance 20/20; green exact-SHA [CI44418327869](https://github.com/mite404/clipper/actions/runs/44418327869)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Owner directed a full migration with proof of no regressions; same math and semantics                                                                                                                                                                                                 |
| <a id="ui-16"></a>[UI-16](#ui-16)                    | Restyle to shadcn preset b78kBE8jT6, keeping the layout                                                           | Large  | Delivered at [dd4c141](https://github.com/mite404/clipper/commit/dd4c141029045d1e3e1e720857fe1de9080b65e0) with the Camera follow `Choice` at [6b2956a](https://github.com/mite404/clipper/commit/6b2956a7f1eaaaf54b336b653f0a25b64192828d); green exact-SHA [CI44433699070](https://github.com/mite404/clipper/actions/runs/44433699070); promoted. Cold-load font flash fixed by `74b719a` in batch 5                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Direct owner request; palette approved, Lucide stays                                                                                                                                                                                                                                  |
| <a id="ui-17"></a>[UI-17](#ui-17)                    | Toast notifications for success messages such as Copy frame                                                       | Small  | Delivered on main at `8e7b506` (batch 5, pushed 2026-11-19) (`6887725`, `013fb77`; design owner T-e2082a9f)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Direct owner request                                                                                                                                                                                                                                                                  |
| <a id="ref-32"></a>[REF-32](#ref-32)                 | Correct source-preview playback error and busy lifecycle                                                          | Medium | Delivered at [4b49623](https://github.com/mite404/clipper/commit/4b4962397e4ac237ab774b8d4a2f2a44280514b2); [green exact-SHA CI](https://github.com/mite404/clipper/actions/runs/43986804408)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Reservation released; canonical previews promoted and verified                                                                                                                                                                                                                        |
| <a id="ref-33"></a>[REF-33](#ref-33)                 | Qualify download URL lifetime outside Chromium                                                                    | Medium | Blocked                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | another supported WebCodecs browser                                                                                                                                                                                                                                                   |
| <a id="ref-34"></a>[REF-34](#ref-34)                 | Remove Player listener lifetime assumptions                                                                       | Small  | Deferred proposal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | reproduce a listener lifecycle defect first                                                                                                                                                                                                                                           |
| <a id="ref-35"></a>[REF-35](#ref-35)                 | Close edit and project-boundary test gaps                                                                         | Medium | Delivered: T3-T5 at [4a6a77b](https://github.com/mite404/clipper/commit/4a6a77b8e557dee8032cdf2a726d5a71c6fbbd8e) (CI44354274078) and T1-T2 with REF-58 at [79a058b](https://github.com/mite404/clipper/commit/79a058bc8d21e16ce5333feeb8794c03e28b7b8a) (CI44377998472)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | asymmetric ripple, fractional trim, parser bounds, source-track rules, save snapshot and chunking cases                                                                                                                                                                               |
| <a id="ref-36"></a>[REF-36](#ref-36)                 | Prove delivery recovery and individual audio mute                                                                 | Medium | Delivered with VERIFY-9/10 at [a9bc3e5](https://github.com/mite404/clipper/commit/a9bc3e5dc9fc06b6d6e77878497db1326c598a40); green exact-SHA [CI44372885999](https://github.com/mite404/clipper/actions/runs/44372885999)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | UI cancel and retry; failed export and partial-open recovery; one muted track at a time                                                                                                                                                                                               |
| <a id="ref-37"></a>[REF-37](#ref-37)                 | Qualify video cadence, rewind, scrub and large telemetry                                                          | Medium | Verification remains open; one CI sighting of a 4x playback start stall on `a26c7e7`; a second sighting opens a focused repro                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | Preserve existing performance thresholds; inspector ownership retained pending explicit closure                                                                                                                                                                                       |
| <a id="verify-3"></a>[VERIFY-3](tickets/VERIFY-3.md) | Bring the feature map in line with delivered motion and controls                                                  | Small  | Delivered at [f76a702](https://github.com/mite404/clipper/commit/f76a702f85a0bcdf64f7c8bc2b0726823c447003); [green CI](https://github.com/mite404/clipper/actions/runs/43798560663)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | frame-step and zoom-field journeys; current cursor and follow coverage                                                                                                                                                                                                                |
| <a id="clip-9b"></a>[CLIP-9b](#clip-9b)              | Visible zoom regions, editable ramps and numeric equivalents                                                      | Medium | Creation accepted at ad40248; Add zoom label/map follow-up accepted at acb62f7 with green CI43938067635; full ramps open                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | UI-7 released; full ramps follow [Order of work](#order-of-work); preserve CLIP-9/10                                                                                                                                                                                                  |

REF-52 evidence: on main `c30c509`, a fresh browser that presses C as soon as `media-status` shows
"4 assets ready" drops the key 10 of 10 times; the next press about 200 ms later works. Cause,
confirmed on `cc12bb5` with a deterministic repro: the window keydown handler is registered in a
passive effect whose closure reads `busy`, so for a moment after the ready text is painted the old
handler still returns early. The approved fix registers it in a layout effect. Contract: the first
shortcut after the ready text must take effect. Reproduce end to end first; once fixed, remove the
header-click workaround (`armRazor`) from `tests/split-tools.spec.ts`. Delivered at `3048947`.

Moved to [history](master-tickets-history.md#ref-32-acceptance).

| Ticket ID                                     | Feature                                                                                                      | State and dependency                                                                                                                                                                                                                                                       |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="verify-6"></a>[VERIFY-6](#verify-6)    | Include transport lifecycle in named editor/feature-map coverage and honor CHROME_PATH for its native launch | Delivered at [3260b3b](https://github.com/mite404/clipper/commit/3260b3b46ca8aee7cbae3fd1da2ef9fe39e0d03c); [green exact-SHA CI44018967483](https://github.com/mite404/clipper/actions/runs/44018967483); reservation released                                             |
| <a id="verify-7"></a>[VERIFY-7](#verify-7)    | Refresh verify-clipper feature maps and README for delivered stills, MP4/MOV formats and workspace layout    | Delivered at [0d81c22](https://github.com/mite404/clipper/commit/0d81c227bb7175ad39a953cb8b573b5c60db64d4); [green exact-SHA CI44032486736](https://github.com/mite404/clipper/actions/runs/44032486736); also adds `--strictPort` to the dev script; reservation released |
| <a id="verify-8"></a>[VERIFY-8](#verify-8)    | Wait for loaded native audio controls before the busy-pause click                                            | Delivered at [71e9c90](https://github.com/mite404/clipper/commit/71e9c90a6facf3da9a7bbc4b47f054221b761a35); green exact-SHA [CI44055968763](https://github.com/mite404/clipper/actions/runs/44055968763); test-only; reservation released                                  |
| <a id="verify-9"></a>[VERIFY-9](#verify-9)    | Make the play-start performance check deterministic                                                          | Small                                                                                                                                                                                                                                                                      | Delivered at [a9bc3e5](https://github.com/mite404/clipper/commit/a9bc3e5dc9fc06b6d6e77878497db1326c598a40); green exact-SHA [CI44372885999](https://github.com/mite404/clipper/actions/runs/44372885999). Ceiling: per-frame costs under about 30 ms are not caught on a contended 2-CPU orb | rafP95 < 100 sits on a 16.7 ms step and fails on unchanged main on 2-CPU orbs                                                                  |
| <a id="verify-10"></a>[VERIFY-10](#verify-10) | Bound and retry the CI browser and ffmpeg install step                                                       | Small                                                                                                                                                                                                                                                                      | Delivered at [a9bc3e5](https://github.com/mite404/clipper/commit/a9bc3e5dc9fc06b6d6e77878497db1326c598a40); green exact-SHA [CI44372885999](https://github.com/mite404/clipper/actions/runs/44372885999)                                                                                     | Third CI cancellation at the 20 minute job limit: the apt install took 15 min on 4a6a77b (CI44354274078), against about 25 s normally          |
| <a id="verify-11"></a>[VERIFY-11](#verify-11) | Print apt and dpkg state when CI's install-deps step fails                                                   | Small                                                                                                                                                                                                                                                                      | Delivered with REF-66 at [c037dbb](https://github.com/mite404/clipper/commit/c037dbb456ffa8b3fbd8be83a65c566e9126528a); green exact-SHA [CI44402658418](https://github.com/mite404/clipper/actions/runs/44402658418)                                                                         | The runner image's `zz-retries` already bounds idle apt connections (Retries 1, Timeout 15), so the earlier apt-config candidate was withdrawn |

Moved to [history](master-tickets-history.md#verify-7-and-verify-6-delivery).

CLIP-9b retains the reference inventory's remaining zoom-edge interaction. `Timeline.tsx` renders
zoom intervals as selection buttons only; inspector start/duration fields do not supply timeline
edge dragging. CLIP-9's delivered row describes generation, not completion of this reference extra.

Moved to [history](master-tickets-history.md#clip-9b-creation-slice-and-add-zoom-follow-up).

The owner expanded this existing ticket with visible zoom FX regions, a stepped multiplier, gradient
in/out ramps, vertical ramp-duration handles and exact numeric inspector equivalents. The approved B
shortcut creates/selects a cursor-follow zoom at the playhead, with text-input, modifier and repeat
safeguards, a shortcut hint and tests. Preserve fixed/focused/smooth/instant controls, source
anchors, undo, overlap rules, preview/export agreement and save/reopen behavior. Independent
optional ramp fields must preserve legacy easing when absent. Ramp gesture sensitivity is an
implementation proposal to verify, not a claimed match to another editor.

The owner's latest explicit creation default is four seconds with the inpoint at the current
playhead, including the B creation path. Preserve already authored/imported regions. The reported
Generate Zooms no-op is a priority current-preview reproduction, not explained away by isolated
green gates. Distinguish the visible creation action from click-derived regeneration and surface
actionable selection/metadata/overlap errors. Any narrow basic-interaction fix needs coordinated
path release before the broader ramp work.

Accepted creation bounds keep the inpoint exact. Use 120 frames when available; truncate only the
outpoint at the sequence end with explicit shorter-length feedback. With fewer than six frames
remaining, refuse actionably rather than shifting backwards or extending the sequence. Overlap also
refuses visibly. The owner's later instruction supersedes batch-panel retention: delete the old
Click-driven zooms Amount/Hold/Generate/Remove panel, keeping primary four-second/playhead/B
creation. Do not commit the superseded retained panel first. The owner must return exact
removal/test/story/ performance consumer paths before that narrow grant expands; preserve generation
source-anchor contracts without retaining dead UI-only wrappers. No curve/Timeline/model grant is
implied. Inspector confirmed no exact conflict and its profiling build stays frozen. Revised grant
covers App primary creation/B/hints, deletion of AutoZoomControls and unused generateZooms/activity
helper, and removal-only consumers in zoom-generation unit tests, auto-zoom browser tests, Editor
stories and zoom-creation tests. Retain resolveZooms and legacy source-anchor resolution unchanged;
replace generation-dependent fixtures with explicit legacy anchored zooms while preserving decoded
parity, undo and save/reopen coverage. Performance setup-only migration preserves the exact existing
two-shot workload/thresholds/repeats/sampling on REF-31's delivered successor, coordinated with
inspector Cleanup and UI-3 focus-locator changes. No superseded naming-only commit. Full
Timeline/model/ramp ownership remains held, with no transport, inspector-placement or style grant.

The full region/ramp unit waits for cursor-inspector and UI-2 successors; its narrow creation slice
may implement disjoint hunks now. Do not duplicate the ticket or treat expanded ramp scope as a
small cleanup candidate. Do not edit REF-20/31 transport lifecycle hunks. Final gates include real
pointer drags and numeric equivalence, inspected media, decoded export and persistence checks, plus
existing strict/full and isolated performance gates and exact-head CI.

The animated curve input must use the technology in the owner's
[referenced implementation](https://ampcode.com/threads/T-01a1bedc-2024-7542-9919-f162a6617cc5).
Full-thread reading identifies source-vendored Bklit React/SVG charts, D3 and Motion, not a finished
editable easing input. Its range-selection overlay and `curveMonotoneX` interpolation do not define
editable ramp semantics. Coordinate exact adopted source/API/dependencies and pointer/keyboard/
numeric/reduced-motion contracts before curve edits; do not import the entire chart registry
blindly.

## Delta audit, 2026-11-16

Moved to [history](master-tickets-history.md#delta-audit-2026-11-16).

All **34 retained findings** have ticket or owner-decision mappings in the historical
[ranked table](refactor/refactor01.md#ranked-findings): 31 actionable and three decision findings.
Those mappings resolve to this list. That did not previously mean every informational recommendation
had a queued disposition. The following **33 notes** now do too. R, T and A are source-note labels
in original order, not ticket IDs or new queues.

### Informational recommendation coverage

Dispositions use commit diffs and existing receipts, not a fresh mutation or browser audit. "Open"
means the exact recommended edge case is not established by those receipts. Related work does not
imply the entire recommendation is done. The full source wording stays in the historical
[Coverage](refactor/refactor01.md#coverage) and
[Agent-Native Gaps](refactor/refactor01.md#agent-native-gaps) sections.

| Ticket mapping                                          | Source | Recommendation                                       | Disposition and delta evidence                                                            |
| ------------------------------------------------------- | ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [CLIP-8](#clip-8), [REF-37](#ref-37)                    | R1     | Indexed pointer lookup and large-fixture time budget | Binary lookup delivered in `1195cda`; explicit 200k-sample budget still open              |
| [REF-27](#ref-27)                                       | R2     | MP4 AVC and AAC qualification                        | Delivered 27099dc; HD/4K output qualified and exact-SHA CI44001648378 green               |
| [REF-25](#ref-25)                                       | R3     | Case-insensitive timeline filenames                  | Delivered `90cf4b4`; actual Mac rerun still unverified                                    |
| [REF-19](#ref-19), [REF-35](#ref-35), [REF-23](#ref-23) | R4     | Playhead and zoom bounds after shortening            | Explicit seek clamps delivered; edit-induced clamp and stranded zoom cases remain open    |
| [REF-28](#ref-28)                                       | R5     | Missing or early-ended decoded frames                | Open; exporter still omits missing samples                                                |
| [REF-29](#ref-29)                                       | R6     | Count-only Fallow baseline blind spots               | Deferred; REF-13 fixed comparison base, not score tracking                                |
| [REF-30](#ref-30)                                       | R7     | Import, Open and Save progress and cancel            | Open; REF-21 limits size but does not add cancellation                                    |
| [REF-31](#ref-31)                                       | R8     | Hidden-tab rewind and held Space                     | Delivered `9132ecf`; exact-main CI green                                                  |
| [REF-32](#ref-32)                                       | R9     | SourceMonitor play rejection and busy lifecycle      | Delivered at `4b49623`; exact-SHA CI green                                                |
| [REF-33](#ref-33)                                       | R10    | Download lifetime outside Chromium                   | Open; Chromium downloads alone are proven                                                 |
| [REF-34](#ref-34)                                       | R11    | Player listener attachment assumptions               | Deferred; effect still depends on `hasAssets`                                             |
| [REF-35](#ref-35)                                       | T1     | Cross-track ripple mutation survivors                | Open; existing voice fixture begins before insertion                                      |
| [REF-35](#ref-35)                                       | T2     | Fractional trim rounding                             | Open; current trim assertions use integer deltas                                          |
| [REF-4](#ref-4), [REF-35](#ref-35)                      | T3     | Parser zoom and layout bounds                        | Partial; overlap and short duration added in `43cb368`; remaining boundary rows open      |
| [REF-35](#ref-35)                                       | T4     | Camera and music source-track validation             | Open; no new assertions for these arms in delta                                           |
| [REF-21](#ref-21), [REF-35](#ref-35)                    | T5     | Save snapshot, validation and chunk-size assertions  | Partial; REF-21 added size preflight, not all original mutation survivors                 |
| [REF-36](#ref-36)                                       | T6     | Exactly one audio track muted                        | Open; existing test mutes both                                                            |
| [REF-36](#ref-36)                                       | T7     | Cancel export from UI, cleanup, retry                | Open; existing cancellation test calls renderer directly                                  |
| [REF-1](#ref-1), [CLIP-8](#clip-8), [CLIP-10](#clip-10) | T8     | Preview and exported geometry agree                  | Delivered shared stage `4cc0761`, decoded cursor `1195cda` and follow `c2a6be0` cases     |
| [REF-21](#ref-21), [REF-36](#ref-36)                    | T9     | Unreadable Save and Export UI recovery               | Partial; REF-21 names bad sources and tests repair; exact failed-export state case open   |
| [REF-36](#ref-36)                                       | T10    | Partial decode failure while opening valid project   | Open; malformed-project test stops before media decode                                    |
| [CLIP-10](#clip-10), [REF-37](#ref-37)                  | T11    | Performance beyond forward demo, video cadence       | Partial; focused follow case delivered, dropped video frames, rewind and scrub still open |
| [VERIFY-1](#verify-1)                                   | A1     | Focused commands select a fresh target               | Delivered `2bb8263`; isolated CLI and servers                                             |
| [VERIFY-1](#verify-1)                                   | A2     | Executable full-run prerequisites                    | Delivered `2bb8263`; builds and servers selected per journey                              |
| [D-2](#d-2)                                             | A3     | Branch and PR CI policy                              | Owner decision; direct-main CI remains default                                            |
| [VERIFY-2](#verify-2), [VERIFY-3](#verify-3)            | A4     | Exact local and CI gate documentation                | Delivered; current skill includes shrink-only growth and baseline comparison flags        |
| [VERIFY-1](#verify-1)                                   | A5     | Five unprofiled performance repetitions              | Delivered `2bb8263`; performance journey selects repeats and disables tracing             |
| [VERIFY-2](#verify-2)                                   | A6     | Wrong story count                                    | Delivered `de27f06`; stale tally removed                                                  |
| [VERIFY-1](#verify-1), [VERIFY-2](#verify-2)            | A7     | Doctor accepts missing-media HTML                    | Delivered new doctor `2bb8263`; obsolete helper removed `de27f06`                         |
| [VERIFY-1](#verify-1), [VERIFY-2](#verify-2)            | A8     | Stop strands state and doctor ignores saved port     | Superseded by isolated lifecycle; old stateful helper removed                             |
| [VERIFY-2](#verify-2)                                   | A9     | Exact test-title instructions incomplete             | Superseded by named journey selectors `de27f06`                                           |
| [VERIFY-1](#verify-1)                                   | A10    | Evidence cleanup loses previous runs                 | Delivered unique evidence directories `2bb8263`                                           |
| [VERIFY-3](#verify-3)                                   | A11    | Frame-step and zoom-field map and journeys           | Delivered tests and current feature map at `f76a702`; exact-SHA CI green                  |

### Ticket identity and local details

The leftmost linked **Ticket ID** is the stable identity. A review finding number, rank and source
note are not ticket IDs. The historical table's ticket mapping can list several tickets for one
finding, or repeat one ticket for several findings. It is not a second queue or a "remaining" count.
Existing IDs are never renumbered. Settled decisions retain their IDs too.

Current detailed briefs are in `docs/tickets/`, with filename and H1 equal to the ID. Their Status
sections link back here rather than duplicating delivery state. Historical delivered rows retain
their commit and evidence links. Proposals retain their scope here until selected. No Linear or
GitHub issues were created. There are no completion fractions because the older backlog did not
define consistent step denominators.

[Repository workflow skill](../.agents/skills/managing-tickets/SKILL.md) owns preflight and
delivery. Seventeen tickets have briefs in `docs/tickets/`: CLIP-11, CLIP-11b, CLIP-19b, CLIP-20b,
CLIP-25, REF-14, REF-18, REF-20, REF-26, REF-31, REF-38, UI-1, UI-5, UI-7, UI-13, VERIFY-3 and
VERIFY-6. Additional Ready rows need their brief before assignment, not bulk template files for
every historical ticket.

The reference artifact had useful material absent from the title-only master rows. Its revision 8 is
now preserved in [reference-features.md](reference-features.md): detailed motion acceptance, hotkey
and layout subcontrols, multicam/caption/program subfeatures, project/export/recording details,
native exclusions, original source links, capture alternatives and contract caveats. No unique
operational state remained there. After migration CI passed, the owner approved deletion and the
owning thread confirmed `deleted: true` for only the reference artifact on 2026-11-16. The separate
steel-thread acceptance and verification artifacts remain intact.

Run `node scripts/check-tickets.mjs` to check unique definitions, leftmost IDs, local detail links,
orphan references and all 34 finding plus 33 informational mappings. The check validates document
structure and coverage, not the truth of implementation or CI claims.

## Approved verification refresh

| Ticket ID                                  | Scope                                                                           | Owner                                                                                   | State                                                                               |
| ------------------------------------------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| <a id="verify-4"></a>[VERIFY-4](#verify-4) | Refresh existing verification skill, feature map and delivered-surface coverage | [Sonnet 5.5 medium](https://ampcode.com/threads/T-a38ee53f-f508-4923-870f-7a2ff13c2235) | Delivered 6abc9df; actual Sol medium review approved; exact-SHA CI43816920677 green |

Moved to [history](master-tickets-history.md#verify-4-and-ref-20-delivery).

### VERIFY-5: requested Oxc typecheck and formatter tooling

| Ticket ID                                  | Scope                                                                            | Owner                                                                            | State                                                                                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="verify-5"></a>[VERIFY-5](#verify-5) | Use requested oxlint-tsgolint checking and install oxfmt without weakening gates | [Sol medium](https://ampcode.com/threads/T-fb8879aa-fa27-4044-89bf-518b53b04498) | Delivered at [7cddaea](https://github.com/mite404/clipper/commit/7cddaea18c8669c40a610e723a58144b437982c0); [green exact-SHA CI](https://github.com/mite404/clipper/actions/runs/43838721676) |

Moved to [history](master-tickets-history.md#verify-5-oxc-tooling).

## Export selection and responsiveness ownership

Moved to [history](master-tickets-history.md#ref-27-ref-27b-and-clip-20b-export-history).

For reported whole-app multi-second stalls, the
[inspector owner](https://ampcode.com/threads/T-c7f554cb-b157-4f8c-b515-6b07a23b4214) is the sole
read-only live-preview profiler under REF-37. Record exact build, reproduction, interaction timing,
workload/browser context and profile evidence before naming a cause. The
[future Sol fix owner](https://ampcode.com/threads/T-01a1e2f4-3296-710a-90be-35ae7f2a4668) waits for
that evidence and an explicit narrow grant. It does not duplicate diagnosis, access private capture
material or edit code now. Proven core responsiveness fixes take priority over dependent features,
with ownership and serialized delivery coordinated rather than silently bypassed.

The original report said video playback and Generate Zooms were unusable in the preview. Later Mite
clarified standalone Chrome works and lag may be specific to the Amp view. Public-demo profiler
controls did not reproduce multi-second stalls. Broad Clipper performance diagnosis is stopped; the
Amp-view cause remains unproven. REF-20 held-frame correctness and CLIP-9b creation changes remain
independent. No cold-start source fix is justified or claimed from these controls.

The refined cold-start report is first Play held on the first frame with repeating audio for about
three seconds, and pre-first-Play scrubbing unresponsive or about five seconds late; warm scrubbing
becomes realtime. These are reported observations, not a proven cause. Acceptance must include
fresh-load scrubbing before any playback and first-play audio/video readiness, with
decode/seek/audio event evidence, not only warm steady-state metrics. REF-20's held-frame mismatch
stays separate unless evidence connects the paths.

Transferred public-demo cold/early-load logs from frozen inspector build `182dd71` show advancing
composition video clocks/pixels, no page errors and working recorded-click generation. No metadata
produces the explicit "No usable clicks" status; a synthetic sidecar produces four regions. These
negative controls do not reproduce or disprove the user's browser/project/audio presentation case.
The owner then clarified standalone Chrome works and lag may be limited to Amp's browser view. Stop
broad Clipper stall diagnosis unless it recurs in standalone Chrome or Amp-view investigation is
explicitly requested. No Clipper performance fix is justified by that distinction alone, and no Amp
cause is proven. No further user input or private recording transfer is needed now.

The [stable preview owner](https://ampcode.com/threads/T-6dd30293-c740-418a-8174-5d2a1b69da89)
receives exact accepted-main SHA and green CI notifications directly. Its initial accepted base is
`b9596c6`. Feature previews, including frozen inspector `182dd71`, stay distinct. Build each
accepted revision in isolation and retain the last good preview on failure; do not combine pending
branches.

Stable accepted-main preview: [Clipper](https://t-6i2ev8m03zdzeqn6o7to372bt-p26495.onamp.dev/). Its
owner first reported `/revision.json` serving the full accepted `b9596c6` SHA, isolated production
build and browser/media-range checks passed, and failed-candidate promotion retained the last good
release. As of 2026-11-18 it serves REF-50 at `4bc0f24` (exact-SHA CI44229120203), checked publicly
by the preview owner; the previous promotion was REF-49 at `063bc31`. This is an orb preview, not a
production deployment or always-on hosting guarantee.

## Approved movement and timeline-media requests

The owner's live-preview feedback explicitly requests repositioning video and audio clips and
importing MOV, MP4, PNG and JPG media. These are scoped follow-ups, not retrospective delivery
claims for CLIP-2 or the background-image part of CLIP-20.

Use the owner's terms "media pool pane" or "source media panel" in future UI/docs/work descriptions.
The later completed drag-insertion requirement is CLIP-2c below; it is distinct from same-track
movement.

| Ticket ID                                            | Scope                                                                     | Owner                                                                                                                    | State and dependency                                                                                                                                                                                                           |
| ---------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="clip-2b"></a>[CLIP-2b](#clip-2b)              | Reposition clips with associated-audio link toggle                        | [Sol medium](https://ampcode.com/threads/T-e625cc4d-8431-4df9-b146-0869cf28ac8b)                                         | Research/path-held; explicit association contract before grant (CLIP-2c, CLIP-2e and the CLIP-9b creation successor are delivered)                                                                                             |
| <a id="clip-20b"></a>[CLIP-20b](tickets/CLIP-20b.md) | Import still timeline media and qualify MOV/MP4 paths                     | [Sol medium T-01a1e2f2](https://ampcode.com/threads/T-01a1e2f2-99be-775a-be34-43cbce070c38) (historical owner, archived) | Delivered at [6156fb4](https://github.com/mite404/clipper/commit/6156fb49d25413086e3eff1090bfea392d6d38e8); [green exact-SHA CI44022990182](https://github.com/mite404/clipper/actions/runs/44022990182); reservation released |
| <a id="clip-2c"></a>[CLIP-2c](#clip-2c)              | Media-pool drag insertion and dynamic track creation                      | [Opus 5.5 medium](https://ampcode.com/threads/T-0e774456-fd5d-4e1e-a9a0-a2b716c91b85)                                    | Delivered at [1de89b5](https://github.com/mite404/clipper/commit/1de89b5895d8fcdd530c13d91bc34a4fe71e7942); green exact-SHA [CI44185392612](https://github.com/mite404/clipper/actions/runs/44185392612)                       |
| <a id="clip-2e"></a>[CLIP-2e](#clip-2e)              | Selection/Razor tools, selected-target Split and unlocked-track shortcuts | [Opus 5.5 medium](https://ampcode.com/threads/T-0e774456-fd5d-4e1e-a9a0-a2b716c91b85)                                    | Delivered at [a26c7e7](https://github.com/mite404/clipper/commit/a26c7e7139947049a2f592e62e8cecc119db2a88); green exact-SHA [CI44050988058](https://github.com/mite404/clipper/actions/runs/44050988058); reservation released |

CLIP-2b reproduced unchanged video and audio positions after real body drags into trimmed empty
space. Accept same-track, frame-rounded nonnegative moves preserving duration and source fields.
Reject overlap with visible feedback, allow adjacency/end extension within existing project bounds,
and leave unrelated clips fixed. No ripple or cross-track reassignment. The owner's later direct
request supersedes the previous no-linking restriction: add a link/unlink toggle above the Tracks
column so associated audio moves with its video. The supplied icon reference and exact request are
in the
[existing movement thread](https://ampcode.com/threads/T-e625cc4d-8431-4df9-b146-0869cf28ac8b).
Current insertion creates independent clips; no A/V association identity exists yet. Do not infer
association from neighboring tracks, equal starts or the same asset alone. The existing owner must
scope explicit association creation, split/trim lifecycle and legacy persistence, plus toggle
default/scope, reciprocal movement and linked-group bounds/collision behavior before source grant.
These details are open design work, not confirmed owner decisions. Linking adds no implicit
selection/deletion/trim/ripple expansion. One move is one undo; cancelled/no-op gestures add no
history. Focused clip arrows move one frame, Shift arrows ten, without changing global playhead
keys. Preserve source offsets, generated zoom anchors, audio synchronization and selection. Verify
real pointer movement on video and audio lanes, scrolling coordinates, bounds/collisions,
preview/export and save/reopen behavior. Do not change layout or native scrolling. The same existing
Sol owner remains research-only/path-held; no expanded implementation or push grant follows from the
revised product scope.

The owner's direct clarification, relayed by the same movement worker, rejects the one-video/
one-audio chooser. With linking on, movement includes the video and all explicitly associated
source-audio clips. With linking off, every video/audio member moves independently, including audio
members from the same source. Show signed desync on both affected video and audio, in frames below
one second and seconds plus remaining frames beyond one second, using sequence FPS. Independently
offset audio members need per-association offsets, not one misleading group offset. Exact-one-second
formatting, split policy, defaults and persistence remain to be resolved; do not infer a schema or
association by matching asset/start values. `originId` remains split lineage, not association.

Coordinate explicit membership creation with UI-9's simultaneous source insertion. A range-only
SourceMonitor callback sends offset/duration once; App resolves current header target IDs, validates
all source components/destinations and commits one edit. Never call the existing one-track insert
twice. Membership cardinality does not establish stream/channel/full-mix mapping; the current
primary mix must not be cloned across all targets. CLIP-2c pool drops remain pointer-release
visual-lane, video-only insertions, with source-audio extraction separate. The workers' proposed
`linkId`, default-on toggle, split-dissolves-pair and version-3 writes are not accepted contracts.
Current version-2 parsing reconstructs known fields, so saved membership needs deliberate
compatibility. No parser/source grant follows from research; unrelated features continue.

CLIP-2b's owner has no implementation or push permission; it may inspect and reproduce.
Model/parser/render/export grants wait for exact path needs and reproduction results. Every unit
retains strict, full browser and isolated performance gates plus exact-head CI.

Moved to [history](master-tickets-history.md#clip-20b-clip-2c-and-clip-2e-contracts).

### CLIP-22: PiP composition subset

The owner explicitly requests PiP alongside Side by side, four-corner placement in the 16:9
composition chooser, current outer padding and adjustable corner radius. The existing CLIP-22
camera-layout ticket owns this subset; other camera features remain separate backlog scope.
[Sol medium owner](https://ampcode.com/threads/T-8f2894da-53a9-41d3-9391-33b6477fff7d) traced shared
Layout/maskRect in stage.ts through preview, frame-copy and export. Keep chooser DOM outside
rendered Composition, preserve legacy side-by-side defaults and validate optional layout mode/corner
fields in parseProject. Keep screen as main and camera above it; CLIP-2c backgrounds remain below
both regardless of mode/corner. No background scaffolding or exporter rewrite.

The inspector, UI-2, CLIP-20b and CLIP-2c are delivered, so PiP is ready to scope against CLIP-2c's
registry and Background role; integrate it before CLIP-2b shared-model work. Source edits still need
the coordinator's exact-path grant. Requested paths are App composition controls, stage geometry,
project layout parsing, scoped styles and matching unit/browser/persistence/decoded-output tests.
Composition changes require an evidenced need because shared maskRect may already suffice. Inset
defaults are coordinator choices: 16:9 at one-third usable width, initially bottom-right, with 10px
outer padding; retain side-swap state but apply it only in Side by side. The user's required flow is
direct four-corner selection in the live composition preview using editor-only DOM overlays, with
pointer/keyboard access and no overlays in frame-copy/export. An Inspector alternative may coexist
but cannot replace this flow; the earlier Inspector-only coordinator default is superseded. Inset
dimensions remain reversible defaults, not user-specified values. UI-4 owns shared numeric
scrubbing; do not invent separate numeric gesture handling.

### CLIP-21b: functional output FPS selection

| Ticket ID                                  | Scope                                 | Owner                                                                              | State                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| <a id="clip-21b"></a>[CLIP-21b](#clip-21b) | Output FPS selector beside resolution | [Sol research](https://ampcode.com/threads/T-6d58e1c6-33c5-473e-9b9a-4ae908c3b309) | Delivered at [e987142](https://github.com/mite404/clipper/commit/e9871422c27292c1aad7d14f973a57bafa3653c4) with the narrow-header wrap fix [d9d3b6f](https://github.com/mite404/clipper/commit/d9d3b6f3e22301197ec07bc0f3b98978d595308e); green exact-SHA [CI44440331315](https://github.com/mite404/clipper/actions/runs/44440331315); promoted |

Exact choices are 24, 29.97, 60, 100, 120 and Auto. Do not add a 30 option or fake selection with
text-only relabeling. Remove static ruler 30 FPS when actual timing semantics are integrated.
Research must distinguish output rate from project timebase, define Auto, preserve audio/source
timing, and validate rational 29.97 duration/frame counts rather than rounding it to 30. Coordinate
REF-27 encoder/container contracts, preview/frame-copy/project compatibility and resource ceilings.
App/model/timing/export/parser/components/tests remain held until exact dependency-first release; no
broad grant or project-format change follows from this queue entry.

Coordinator defaults preserve compatibility: FPS is output-only, while preview/stepping/Copy frame
stay on the edit grid. Auto uses the project cadence, currently 30, with explicit helper text;
absent legacy output setting means Auto and retains prior cadence. Store a separate validated
choice, not a changed root project fps. Do not add speculative source-CFR probing for Auto. Exact
29.97 uses 30000/1001 and fractional composition evaluation. The
[timing research](https://ampcode.com/artifacts/clip-21b-frame-rate-contract-8a56a9fb-26bc-4aab-9ebd-e3ddec57f8f8)
qualified a synthetic terminal-packet policy. Coordinator accepts ISO track FPS hints only for
30000/1001 and no hint for integer rates. WebM uses absolute endpoints rounded to its 1ms container
grid, differences those endpoints and omits zero-length terminal intervals. Disclose up to 0.5ms
endpoint precision error rather than claiming exact rational endpoints or adding a full padded
frame. Use integer rational frame-count math, not floating-point ceiling at a boundary. Silent small
probes do not qualify audio synchronization, HD/4K throughput or the successor composition; those
remain runtime acceptance. No silent truncation, audio stretching or unsupported-rate fallback is
approved. Source paths remain held.

The status check against accepted main `57f5864` confirms no product FPS selector or variable-rate
exporter is implemented. Synthetic probes are not an integrated prototype. REF-27's
actual-resolution successor (`27099dc`) and CLIP-20b's still rendering/parser (`6156fb4`) are
delivered; release now requires CLIP-22's layout geometry, then exact timing/exporter/tests/App UI
ownership grants from the queue. Auto and endpoint semantics above are settled; this is not waiting
on another owner preference decision.

### CLIP-19b: per-clip automatic fit and scale

| Ticket ID                                            | Scope                                                                       | Owner                                                                              | State                                                                              |
| ---------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| <a id="clip-19b"></a>[CLIP-19b](tickets/CLIP-19b.md) | Auto-fit inserted/dragged media and per-clip Inspector slider/numeric scale | [Sol research](https://ampcode.com/threads/T-45868c85-1af4-45b7-ac3a-2e317bb8f64d) | Delivered on main at `8e7b506` (batch 5, pushed 2026-11-19) (`32373bc`, Opus lane) |

Preserve aspect ratio, avoid implicit stretch/crop, and keep scale instance-local rather than
source-wide. Preview/copy/export, undo and save/reopen must agree at actual selected composer
dimensions. The [brief](tickets/CLIP-19b.md) records exact fit-target, legacy, insertion/split and
acceptance questions. CLIP-22 role geometry precedes implementation; REF-27 dimension/scaling and
CLIP-20b image/parser contracts are delivered; coordinate with CLIP-2c registry/Background and UI-4
shared numeric scrubbing. No model/stage/Composition/parser/App/control/style grant exists yet.

The research worker confirms no implementation candidate or product code on accepted main `57f5864`.
Existing cover-fit and zoom scale do not implement per-instance Fit/scale. New contain/1 and legacy
cover/1 defaults are settled. REF-27, CLIP-20b and CLIP-2c are delivered; release follows accepted
CLIP-22 PiP plus the queue's exact shared-path grant. UI-4 still has no delivered scrub API. No
priority or dependency bypass follows from this status clarification.

## Recent owner-feedback coverage audit, 2026-11-16

Moved to [history](master-tickets-history.md#owner-feedback-coverage-audit-2026-11-16).

## Feature backlog after CLIP-11

Rows are proposals unless explicitly approved below. They come from the reference backlog, which
holds the source links, unless a subsection below names another source. Use
[Order of work](#order-of-work), skipping gated rows. CLIP-25 is delivered with exact-main green CI.
CLIP-38 has a delivered warning subpart only. Existing subparts must not be counted twice.

| Ticket ID                                            | Title                                                                                                                          | Gate                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="clip-12"></a>[CLIP-12](#clip-12)              | Click sounds with volume                                                                                                       | CLIP-7; needs a licensed or original sound                                                                                                                                                                                                                                                                                                                                                                             |
| <a id="clip-13"></a>[CLIP-13](#clip-13)              | Motion blur for cursor, zoom and pan                                                                                           | CLIP-10                                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="clip-14"></a>[CLIP-14](#clip-14)              | Keystroke overlays                                                                                                             | No key-event source: OpenScreen sidecars carry pointer data only                                                                                                                                                                                                                                                                                                                                                       |
| <a id="clip-15"></a>[CLIP-15](#clip-15)              | Audio scrub and reference hotkey parity                                                                                        | none. Part A (Up/Down edit points, X select, `[`/`]` trim to playhead) delivered at [bd1c041](https://github.com/mite404/clipper/commit/bd1c041d77a884bf90ec86ff2097756d17abfe51), green [CI44413425655](https://github.com/mite404/clipper/actions/runs/44413425655); audio scrub remains                                                                                                                             |
| <a id="clip-16"></a>[CLIP-16](#clip-16)              | Clip retiming and typing-segment speed-up                                                                                      | typing suggestions need key events                                                                                                                                                                                                                                                                                                                                                                                     |
| <a id="clip-17"></a>[CLIP-17](#clip-17)              | Per-clip and whole-recording gain                                                                                              | REF-14, UI-13 (delivered). Per-clip gain -24 to +12 dB delivered at [cb98e71](https://github.com/mite404/clipper/commit/cb98e71df5ba4cb79d0d309d3e0c8aaf8dc3283b) (main `d9d3b6f`, green [CI44440331315](https://github.com/mite404/clipper/actions/runs/44440331315); promoted). Gain-row polish LAND at `3a73afb` on `clip-17b` (reviewer T-01a1f458-e0e9, no findings), delivers next. Whole-recording gain remains |
| <a id="clip-18"></a>[CLIP-18](#clip-18)              | Command menu and custom shortcuts                                                                                              | REF-7                                                                                                                                                                                                                                                                                                                                                                                                                  |
| <a id="clip-19"></a>[CLIP-19](#clip-19)              | Padding, proportions and arbitrary crop bounds                                                                                 | REF-1                                                                                                                                                                                                                                                                                                                                                                                                                  |
| <a id="clip-20"></a>[CLIP-20](#clip-20)              | Background wallpaper, gradient, color, image, inset, shadow; the image part is scoped [below](#clip-20-still-image-background) | REF-1. CLIP-20b stills delivered. CLIP-20c and CLIP-20d are scoped below. Wallpaper presets remain                                                                                                                                                                                                                                                                                                                     |
| <a id="clip-20c"></a>[CLIP-20c](tickets/CLIP-20c.md) | Composition background colour, gradient and panel shadow                                                                       | Delivered on main at `bdd6ab7` (batch 6, pushed 2026-11-19), green exact-SHA [CI44577985376](https://github.com/mite404/clipper/actions/runs/44577985376)                                                                                                                                                                                                                                                              |
| <a id="clip-20d"></a>[CLIP-20d](tickets/CLIP-20d.md) | WebP backgrounds and one choose/replace/remove background-image control                                                        | Delivered on main at `046eedc` (rebased on batch 6, pushed 2026-11-19); green exact-SHA [CI44581073353](https://github.com/mite404/clipper/actions/runs/44581073353); canonical preview promoted. LAND verdict on `b4a3eb2` (reviewer T-01a1f458-e0e9)                                                                                                                                                                 |
| <a id="clip-21"></a>[CLIP-21](#clip-21)              | Output aspect ratios and responsive composition                                                                                | REF-1                                                                                                                                                                                                                                                                                                                                                                                                                  |
| <a id="clip-22"></a>[CLIP-22](#clip-22)              | Camera hide, position, mirror, size, roundness                                                                                 | REF-1. PiP four-corner subset delivered at [99c350e](https://github.com/mite404/clipper/commit/99c350ece9ee3fcfd3cfed1f604c0a43ffe25482); green exact-SHA [CI44429402197](https://github.com/mite404/clipper/actions/runs/44429402197); promoted. Hide, mirror, size and roundness remain                                                                                                                              |
| <a id="clip-23"></a>[CLIP-23](#clip-23)              | Timed camera layouts                                                                                                           | CLIP-22                                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="clip-24"></a>[CLIP-24](#clip-24)              | Blur and redaction masks, highlights                                                                                           | REF-1                                                                                                                                                                                                                                                                                                                                                                                                                  |
| <a id="clip-25"></a>[CLIP-25](tickets/CLIP-25.md)    | Copy the current frame as a PNG image                                                                                          | Delivered at [6fa99af](https://github.com/mite404/clipper/commit/6fa99afb10c8df35427a0ce0120d82b370a0b1e0); [green CI](https://github.com/mite404/clipper/actions/runs/43807235930)                                                                                                                                                                                                                                    |
| <a id="clip-26"></a>[CLIP-26](#clip-26)              | Multicam angles and per-speaker mixes                                                                                          | UI-13 audio-data foundation; stable tracks and association/mix semantics                                                                                                                                                                                                                                                                                                                                               |
| <a id="clip-27"></a>[CLIP-27](#clip-27)              | Derived social clips from a timeline range                                                                                     | none                                                                                                                                                                                                                                                                                                                                                                                                                   |
| <a id="clip-28"></a>[CLIP-28](#clip-28)              | Teaser, title sequence and program assembly                                                                                    | CLIP-27                                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="clip-29"></a>[CLIP-29](#clip-29)              | Chapter markers                                                                                                                | none. Delivered at [bd1c041](https://github.com/mite404/clipper/commit/bd1c041d77a884bf90ec86ff2097756d17abfe51) with CLIP-15 part A and UI-13; `all` 210/210, performance 20/20; green exact-SHA [CI44413425655](https://github.com/mite404/clipper/actions/runs/44413425655); preview promoted. Coordinator defaults, open to Mite                                                                                   |
| <a id="clip-30"></a>[CLIP-30](#clip-30)              | Interactive player bundle with separate synchronized outputs                                                                   | none                                                                                                                                                                                                                                                                                                                                                                                                                   |
| <a id="clip-31"></a>[CLIP-31](#clip-31)              | Final Cut and After Effects interchange                                                                                        | none                                                                                                                                                                                                                                                                                                                                                                                                                   |
| <a id="clip-31a"></a>[CLIP-31a](#clip-31a)           | Premiere: prove a synthetic FCP7 XML import contract in a real Premiere                                                        | a real Premiere installation (D-9)                                                                                                                                                                                                                                                                                                                                                                                     |
| <a id="clip-31b"></a>[CLIP-31b](#clip-31b)           | Premiere: export an editable XML sequence with reviewed source paths                                                           | CLIP-31a; a push slot for its `App.tsx` change                                                                                                                                                                                                                                                                                                                                                                         |
| <a id="clip-31c"></a>[CLIP-31c](#clip-31c)           | Premiere: qualify the file Clipper downloads in a named Premiere build                                                         | CLIP-31b; a real Premiere installation (D-9)                                                                                                                                                                                                                                                                                                                                                                           |
| <a id="clip-32"></a>[CLIP-32](#clip-32)              | Local transcription with Whisper `tiny.en`, English only                                                                       | Delivered at [f0cca49](https://github.com/mite404/clipper/commit/f0cca49a2fb4032448385aafbc71e5b23f01b1c4); green exact-SHA [CI44269500863](https://github.com/mite404/clipper/actions/runs/44269500863) (attempt 2); promoted                                                                                                                                                                                         |
| <a id="clip-33"></a>[CLIP-33](#clip-33)              | Clip-linked burned-in subtitles, basic text/speaker editing, styling and SRT/VTT export                                        | CLIP-32; scoped story below, not a new ticket                                                                                                                                                                                                                                                                                                                                                                          |
| <a id="clip-34"></a>[CLIP-34](#clip-34)              | Transcript-suggested edits                                                                                                     | CLIP-32                                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="clip-35"></a>[CLIP-35](#clip-35)              | Editable Remotion graphics sequences                                                                                           | none; D-5 settled (personal use)                                                                                                                                                                                                                                                                                                                                                                                       |
| <a id="clip-36"></a>[CLIP-36](#clip-36)              | Caption reconstruction from a flat video pair                                                                                  | CLIP-33                                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="clip-37"></a>[CLIP-37](#clip-37)              | Batch rendering and reusable graphics library                                                                                  | CLIP-35                                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="clip-38"></a>[CLIP-38](#clip-38)              | Save-as and recent projects; unsaved-close warning already delivered by REF-12                                                 | REF-22; remaining scope is a proposal                                                                                                                                                                                                                                                                                                                                                                                  |
| <a id="clip-39"></a>[CLIP-39](#clip-39)              | Styling presets                                                                                                                | CLIP-19, CLIP-20                                                                                                                                                                                                                                                                                                                                                                                                       |
| <a id="clip-40"></a>[CLIP-40](#clip-40)              | GIF, quality and frame-rate options, clipboard export                                                                          | REF-3                                                                                                                                                                                                                                                                                                                                                                                                                  |
| <a id="clip-41"></a>[CLIP-41](#clip-41)              | Preview quality and power-saving modes                                                                                         | none. Preview quality Full/Half/Quarter delivered at [4ee8898](https://github.com/mite404/clipper/commit/4ee88984cde76cc3347631fa76cf61b7e20af8dd) (main `d9d3b6f`, green exact-SHA [CI44440331315](https://github.com/mite404/clipper/actions/runs/44440331315); promoted). Power-saving modes remain                                                                                                                 |
| <a id="clip-42"></a>[CLIP-42](#clip-42)              | Extract original screen, camera and audio tracks                                                                               | none                                                                                                                                                                                                                                                                                                                                                                                                                   |
| <a id="clip-43"></a>[CLIP-43](#clip-43)              | Native Screen Studio package ingestion                                                                                         | needs a real package fixture (D-4)                                                                                                                                                                                                                                                                                                                                                                                     |
| <a id="clip-44"></a>[CLIP-44](#clip-44)              | Hosted sharing links and timestamped comments                                                                                  | dropped by the owner 2026-11-18                                                                                                                                                                                                                                                                                                                                                                                        |
| <a id="clip-45"></a>[CLIP-45](#clip-45)              | Quick share, save and copy actions                                                                                             | CLIP-40                                                                                                                                                                                                                                                                                                                                                                                                                |
| <a id="clip-46"></a>[CLIP-46](#clip-46)              | Voice-over audio recording                                                                                                     | parked by the owner 2026-11-18; OpenScreen covers screen recording                                                                                                                                                                                                                                                                                                                                                     |
| <a id="clip-47"></a>[CLIP-47](#clip-47)              | Speaker-note teleprompter                                                                                                      | CLIP-46; parked                                                                                                                                                                                                                                                                                                                                                                                                        |
| <a id="clip-48"></a>[CLIP-48](#clip-48)              | iPhone and iPad capture, device frames                                                                                         | native capture; not possible in a browser orb                                                                                                                                                                                                                                                                                                                                                                          |

### CLIP-33: clip-linked subtitle story

The [subtitle research thread](https://ampcode.com/threads/T-7ecb980e-b475-4015-8159-fef1afce4026)
maps its [reviewed story](https://ampcode.com/artifacts/27a78395-e83e-40d7-badf-716f7b19401d)
revision 14 to this existing ID, dependent on CLIP-32. Owner requirements relayed there include a
visible subtitle clip linked to its video, moving with the footage; per-use timing with positive
ahead/earlier and negative behind/later; one-frame nudges and Shift-ten; basic text corrections and
manual speaker names in v1; font/color/backing opacity/position and optional speaker display; and a
quiet-clip transcription threshold. Model/runtime, exact threshold measurement, detailed
split/trim/correction ownership and frame-rate behavior remain proposals. Local model/dependency
approval and browser feasibility precede implementation. No private capture/audio upload is allowed.
SRT/VTT remains the existing backlog scope, not a reason to duplicate the burned-in story ticket.

### CLIP-20: still-image background

Scope and acceptance for the image part of CLIP-20, added on 2026-11-16. The
[reuse research thread](https://ampcode.com/threads/T-01a1ddd8-535c-7129-a7d7-9a0c28f41449) relayed
it as the owner's explicit request; the queue thread did not see the owner's message itself. Ticket
maintenance only: CLIP-20 keeps its place, its REF-1 gate and its other parts (wallpaper, gradient,
color, inset, shadow). Not started as a CLIP-20 background control; CLIP-2c (`1de89b5`) delivered a
Background track role that can hold a full-stage still underlay, which may cover part of this scope.

Outcome: import a local still image as the composition background. The file stays in the browser.

Accepted when:

- A background image can be chosen, replaced and removed.
- It fills the stage behind the screen and camera panels with an aspect-preserving cover fit.
- Preview and exported video place it the same way.
- Project save and reopen keep the background together with the media.
- An unsupported or corrupt image fails with a visible message and leaves the previous background in
  place.
- A replaced or removed background releases its object URL and decoded image.
- Checked with landscape, portrait and alpha-bearing images, and with export and save round trips.

First formats: PNG, JPEG and WebP, decoded by the browser.

Outside this ticket: animated images, still images as timeline clips, remote image URLs, and any
change to the original visual direction.

Reuse: adapt the `Image.decode()` and object-URL lifecycle from the owner's prototype,
[`src/routes/+page.svelte` lines 46 to 75](https://github.com/mite404/sequence-spear-fish/blob/4f646d2ab3ef91dbfacb1f19ba37e670bd7f39c5/src/routes/+page.svelte#L46-L75)
(decode first, swap only on success, revoke the superseded or failed blob URL). The queue thread
read those lines. Do not port its Svelte page or its compositor, which stretches every source to the
frame. The prototype has no license file; reuse rests on it being the owner's own repository.
Details are in the
[reuse research](https://ampcode.com/artifacts/clipper-reuse-research-95b08ad7-f0ce-477e-acbd-9e9da46d4319).

Facts about `main` that bear on it, read by the queue thread: the stage background is one fixed
color today (`drawFrame` in `src/export.ts`), `Edit` has no background field, and `src/media.ts`
reads video and audio only. Saving the background therefore adds to the project format, which is a
decision for the implementer to raise before code.

### CLIP-31a to CLIP-31c: Premiere XML export

Proposals from the
[Premiere XML design](https://ampcode.com/artifacts/premiere-xml-export-design-6703a309-dcf9-45cc-bfd4-fd84d677159a),
written by its [research thread](https://ampcode.com/threads/T-52bd93c4-0eb5-46f3-ae30-0d2ff60a23ff)
on 2026-11-16 at the owner's request, relayed by the Space. They narrow CLIP-31 to Premiere; CLIP-31
itself stays a proposal. Nothing is implemented, and no file has been opened in Premiere. No
compatibility is claimed until CLIP-31c passes.

The design recommends Final Cut Pro 7 XML (`<xmeml version="5">`, a `.xml` file), which Adobe
documents as a direct import. It rejects modern `.fcpxml`, which Adobe documents as needing
conversion first.

The owner confirmed FCP7 XML (`.xml`) as the interchange format on 2026-11-16, in the Space, which
relayed it; the queue thread did not see his message. He named Premiere, Avid, Pro Tools, Logic,
Cubase and Resolve as the applications he intends it to work with. That list is an intention, not a
compatibility claim, and nothing has been tested in any of them. CLIP-31a to CLIP-31c stay scoped to
Premiere and to one exporter; AAF, OMF and dialect conversion are separate workflows outside these
tickets.

What each vendor's documentation says, as read by the design thread (the queue thread did not
recheck it). Missing documentation is not proof that an import fails.

| Application         | Documented for FCP7 XML                                                         | Source                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Premiere Pro        | Direct import; modern FCPXML needs conversion                                   | [Adobe](https://helpx.adobe.com/premiere-pro/using/importing-xml-project-files-final.html)                                                                                           |
| DaVinci Resolve     | Import, documented separately from FCPXML                                       | [Resolve 21.1 manual](https://documents.blackmagicdesign.com/UserManuals/DaVinci_Resolve_21.1_Reference_Manual.pdf)                                                                  |
| Avid Media Composer | Not found; the checked documentation covers AAF                                 | [Avid](https://kb.avid.com/pkb/articles/en_US/Knowledge/How-to-export-an-AAF)                                                                                                        |
| Pro Tools 2025.12   | Not found; documents AAF and OMF sequence import                                | [Reference guide](https://resources.avid.com/SupportFiles/PT/Pro_Tools_Reference_Guide_2025.12.pdf)                                                                                  |
| Cubase Pro 15       | Not found; documents AAF and OMF audio import                                   | [Steinberg](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/exchanging_files_with_other_applications/exchanging_files_with_other_applications_aaf_files_c.html) |
| Logic Pro           | Unclear: documents Final Cut XML audio exchange without naming the FCP7 dialect | [Apple](https://support.apple.com/guide/logicpro/final-cut-pro-xml-files-lgcp9b2d2456/mac)                                                                                           |

| Ticket ID             | Outcome                                                                                                                                                                                                                                        | Needs                                                                                                   | Files                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [CLIP-31a](#clip-31a) | A synthetic XML fixture and the exact import contract Premiere accepts: cut frames, gaps, independent mono and stereo audio, mute, music gain, file paths, relinking after a move, duplicate file names, and which frame rates must be refused | A real Premiere installation; the design targets Premiere Pro 26.x on macOS and records the exact build | New `tests/interchange/` and `docs/premiere-xml.md`                                                                                   |
| [CLIP-31b](#clip-31b) | One downloaded XML that keeps the proven cuts and audio, with a dialog where the user reviews the path of every used source and acknowledges what is left out                                                                                  | CLIP-31a; a push slot                                                                                   | New `src/premiere-xml.ts`, `src/XmlExportDialog.tsx`, their tests and story, `tests/xml-export.spec.ts`; a small `src/App.tsx` action |
| [CLIP-31c](#clip-31c) | The file Clipper really downloads imports with the right media, cuts, audio and relink behavior in a named Premiere build                                                                                                                      | CLIP-31b; a real Premiere installation                                                                  | Extends `tests/interchange/`, `tests/xml-export.spec.ts`, `docs/premiere-xml.md`                                                      |

Limits the design states, which the tickets keep:

- The browser never learns a source file's path, only its name. The user supplies a media root and
  per-source paths; the XML references the originals and does not carry them. Moved files are
  relinked in Premiere.
- The first release is cuts and audio only. Panel layout, rounded masks, crops, the cursor, zooms
  and follow framing are left out, and the dialog says so. The imported sequence will not look like
  Clipper's preview.
- Only 30 fps constant-rate video with mono or stereo audio at first. Other rates and variable-rate
  sources are refused with the reason, not relabeled as 30 fps.
- The prototype holds an EDL plan and no exporter code, so what carries over is its rules
  (integer-frame timing, stable source identity, validate before download), not code.
- CLIP-31b does not touch `serializeProject`, `src/media.ts`, `src/export.ts` or the cursor modules,
  and does not change the saved project format.

Native-only Screen Studio settings (camera effects, notifications, Dock, licensing, diagnostics) are
inventoried in the reference backlog and are not Clipper tickets.

## Decisions for the owner

Work continues on the stated default until the owner says otherwise. Dates, reasons and commits for
settled decisions are in the [ADR log](adr.md).

| Ticket ID                   | Title                          | Outcome                                                                                       |
| --------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| <a id="d-1"></a>[D-1](#d-1) | Zooms follow footage?          | No, 2026-11-18: zooms stay pinned to the timeline; REF-23 closed, REF-54 pins generated zooms |
| <a id="d-3"></a>[D-3](#d-3) | First capture route            | OpenScreen first; settled 2026-11-15                                                          |
| <a id="d-5"></a>[D-5](#d-5) | Remotion licence               | Acceptable for personal use, 2026-11-18; CLIP-35 unblocked                                    |
| <a id="d-6"></a>[D-6](#d-6) | Hosted capture image retention | Thread deleted; hosted-file deletion not independently verified                               |

| Ticket ID                      | Title                                                                                                                                                                                                                                  | Default in force                                                                                                                                                                                                      |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="d-2"></a>[D-2](#d-2)    | Should CI also run on pull requests, and unit tests in the pre-commit hook? (#35)                                                                                                                                                      | No change: direct pushes to `main` with post-push CI                                                                                                                                                                  |
| <a id="d-4"></a>[D-4](#d-4)    | Provide a real Screen Studio project to build CLIP-7b and CLIP-43 against                                                                                                                                                              | Both stay parked; nothing is inferred from screenshots of file names                                                                                                                                                  |
| <a id="d-7"></a>[D-7](#d-7)    | CLIP-7 to CLIP-10 are on `main`: import a real OpenScreen recording into Clipper on the Mac, generate zooms, and check that the cursor, the zooms and the follow framing line up with the video                                        | Compatibility with real recordings stays unclaimed; work continues on synthetic fixtures                                                                                                                              |
| <a id="d-8"></a>[D-8](#d-8)    | Three commits on public `main` carry a personal email address instead of the noreply address: `2bb8263` and `de27f06` (author and committer) and `e9f99fc` (committer). Rewrite `main` from `2bb8263` with a force-push to replace it? | Not rewritten: a force-push changes every later commit ID and needs the owner's approval. The old commits would stay fetchable on GitHub by ID until GitHub Support purges them. Both workers have fixed their config |
| <a id="d-9"></a>[D-9](#d-9)    | CLIP-31a and CLIP-31c need someone to import files into a real Premiere Pro and report what it shows. Is Premiere installed on the Mac, and which version?                                                                             | Answered 2026-11-18: Premiere Pro 2026 is installed on the owner's Mac. CLIP-31a to CLIP-31c stay proposals until the owner imports files; no compatibility is claimed                                                |
| <a id="d-10"></a>[D-10](#d-10) | PUB-2: which static host serves the public preview page (nothing is uploaded; the post rides in the link)                                                                                                                              | Netlify, answered 2026-11-18: one plain static HTML file, no framework, no server and no API                                                                                                                          |

Settled by the owner:

- Left clicks first: get OpenScreen's left-click flow working before right clicks, which are later
  "extra credit". The owner wrote this in the
  [capture research thread](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) on
  2026-11-15 at 22:06:51 UTC. He has not decided anything about sample rate, click pairing or cursor
  scaling; those are engineering defaults, listed under the capture acceptance.
- OpenScreen is the first capture route (was D-3). The owner wrote "1. confirmed openscreen first"
  in the
  [capture research thread](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) on
  2026-11-15 at 16:03:54 UTC.
- The Amp project's primary repository is GitHub. The owner wrote "confirmed" in the queue thread on
  2026-11-16, and `amp projects get` shows the project mapped to `mite404/clipper`.
- Interchange format: FCP7 XML (`.xml`). The owner confirmed it in the Space on 2026-11-16, relayed
  to the queue thread. Which applications can open it is not settled; see
  [CLIP-31a to CLIP-31c](#clip-31a-to-clip-31c-premiere-xml-export).
- D-6, the eight hosted capture images: the owner deleted the Mac capture thread on 2026-11-16. The
  queue thread confirmed that the thread can no longer be read. It cannot check whether Amp's
  storage still holds the eight attachment files.

## Verification for every ticket

- A public-behavior test fails before the change and passes after it.
- `npm run format:check`, `lint`, `lint:typed`, `typecheck`, `check:code`, `npm test`, `build` and
  `build-storybook` pass, then the affected journeys from
  `.agents/skills/verify-clipper/scripts/verify.mjs` (`all` after shared editor changes).
- UI changes reuse the shared Storybook components, cover absent, invalid and stress data, and are
  inspected in screenshots; interaction changes also in a recording.
- Changes to rendered video are checked in decoded export frames at seeks, cuts and source offsets,
  with audio checks where audio changes.
- `performance` runs alone, never beside an encode or build.
- The pushed commit's CI run is green before the ticket is marked delivered.

## Known limits

- Import, project save and reopen, and export are fully buffered. Long recordings can exhaust
  memory. One project file holds 375 MB of media: Save refuses more with a message naming the limit,
  and Open has the same ceiling (#3; REF-22 removes it).
- Export offers MP4 H.264/AAC (default), MOV H.264/PCM and WebM VP9/Opus since REF-27 (`27099dc`);
  decoded HD/4K output of all three passed in Chromium, with AAC from the lazily loaded
  `@mediabunny/aac-encoder` fallback. Native AAC encoders, Safari/macOS, universal MOV playback and
  real-recording compatibility remain unqualified.
- Reverse shuttle is silent. Filmstrips repeat the first thumbnail. Edge handles extend as well as
  shorten since REF-49 (`063bc31`). History merges edits within 800 ms, the left grip is partly
  covered on clips shorter than about 7 frames, and a clip whose asset is missing has an unbounded
  right tail.
- Unsaved edits vanish on reload. The browser asks first (REF-12); CLIP-38 adds persistence. Mute
  changes count as unsaved since REF-39 (`d423d7c`). Imported media does not count as unsaved, and
  after more than 50 edits, undoing all 50 kept steps reads as saved.
- Verification ran in Chromium on Linux. Safari, Firefox, physical devices and speaker output are
  unverified.
- CLIP-7 to CLIP-10 are proven on synthetic sidecars shaped like the real capture, not on the
  capture itself.
- No real cursor recording has been imported into Clipper yet. The capture contract above comes from
  one recording inspected outside Clipper.
- Cursor-free pixels are supported by 48 sampled positions in that recording, not by every frame.
  Retina scale, window capture, cropping and multiple displays are unmeasured.
- Privacy state of the recordings: the videos and `.cursor.json` sidecars were read only on the Mac
  and were not uploaded or transferred. Eight derived images did become hosted Amp attachments when
  the Mac capture thread viewed them: three 200x200 crops at click times and one sheet of the three
  cursor bitmaps from the first recording, one full 3440x1440 frame and one half-size frame from the
  second, and two half-size frames from the third. That thread's transcript also holds text
  describing the crops and nine click and mouseup samples. This contradicts the thread's own
  "nothing was uploaded" statements. The owner has since deleted that thread (D-6, settled above),
  so its transcript is gone; this file and `tests/openscreen/README.md` keep the findings.
