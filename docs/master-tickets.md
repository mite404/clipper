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

Each anchored ticket row below is its canonical entry. The audited delivery order controls
sequencing; older candidate/grant narratives preserve history, not a second current assignment. The
audit's previously unnumbered scopes are UI-8 through UI-12, CLIP-2d and VERIFY-6. Subtitles expand
CLIP-33, the Add zoom follow-up stays in CLIP-9b, and CLIP-31 remains an umbrella rather than
another exporter. Their scope, gates and delivery limits are recorded at those entries.

## Workflow

The queue thread owns updates to this state record; workers send it scope and evidence. Load
[managing-tickets](../.agents/skills/managing-tickets/SKILL.md) for workflow policy, new-thread
defaults, review gates, verification, delivery and archival. Current state stays here.

The repository is `https://github.com/mite404/clipper.git`. The Amp project has used it as its
primary repository since 2026-11-16; the Amp-hosted scaffold is gone. See
[Known limits](#known-limits) for the historical private-media hosting record.

## Audited delivery order, 2026-11-16

This order supersedes older numeric/default ordering and historical reservation language below.
Delivered means accepted main with exact-SHA green CI. Research, a preserved branch and source LAND
alone are not delivery. The audit compared the master with active repository/project threads and
their linked research. The audit baseline was accepted main
`d8776cde2f1fc381da7bd4a5b069501c5ded73c5`; this is not a moving latest-main pointer.

1. Finish the already reviewed CLIP-9b creation/panel-removal slice, then its owner-requested **Add
   zoom** label and stale verification-map follow-up under the same ID. Full ramps stay open.
2. Deliver UI-7 on that accepted successor, then UI-5 side-pane and timeline resizing. Both extend
   UI-2 rather than replacing its mounted drawer or scrolling rules. Reproduce REF-32 before UI-8
   changes source preview lifecycle; repair a demonstrated defect in its own tested ticket. CLIP-2e
   may then deliver selected-target/all-unlocked splits on the no-link project model before CLIP-2b
   introduces associations, using stable current track IDs and saved locks/track selection.
3. Integrate REF-27 real export formats/resolution before CLIP-20b's image export changes, then
   deliver CLIP-20b media-kind support and CLIP-2c stable tracks/insertion/Background role. These
   are feature foundations, not a generic model rewrite. Preserve CLIP-2c's pointer-release lane
   targeting and video-only pool-drop contract. UI-8's source-metadata probe remains its own scope.
4. Settle explicit source-audio membership/component mapping in CLIP-2b with UI-9, then implement
   association creation/persistence and linked movement before UI-9 consumes them. Do not duplicate
   the primary audio mix across selected lanes. UI-9 validates header-targeted insertion atomically.
   CLIP-2b must qualify partial-cut membership on CLIP-2e's accepted successor before linked
   movement delivery. No fragment lifecycle/schema is approved by the split research.
5. Deliver UI-8 media rows/scrubbing on UI-7 and media metadata. Its old target selector stays until
   UI-9 works; remove it with the coordinated range-only insertion callback transition. Its
   independent view/scrubbing portion may move earlier with a disjoint exact-path grant.
6. Deliver CLIP-21b output FPS on REF-27. Complete CLIP-19b instance fit/scale and CLIP-22 PiP
   against the same accepted preview/copy/export geometry.
7. Complete CLIP-9b ramps, CLIP-11b targeted sidecars, UI-11 selected-type inspector and CLIP-2d
   whole-clip visibility in separate verified units. UI-10 adoption/polish follows a scoped decision
   on its preserved experiment; it does not block these features or authorize wholesale replacement.
8. Schedule UI-4 shared numeric scrubbing before dependent numeric consumers when its contract is
   ready. UI-6 removes only still-present requested remnants after their feature owners release
   paths. Neither optional cleanup nor an experiment delays the feature foundations above.
9. Then take ungated backlog features in this dependency order: CLIP-17, CLIP-19, CLIP-20, CLIP-21,
   CLIP-23, CLIP-24, CLIP-12, CLIP-13, CLIP-15, CLIP-16, CLIP-18, CLIP-29, CLIP-27, CLIP-28,
   CLIP-39, CLIP-40, CLIP-45, CLIP-41, CLIP-42, CLIP-26 and CLIP-30. These remain proposals until
   their bounded acceptance is scoped, not new source grants.

Prepare tests/research in parallel only when paths are disjoint; serialize App, Timeline, model,
parser, renderer and export changes. REF-35/36 and VERIFY-6 may take independent test/tool paths,
but must not compete with a feature's acceptance run. REF-28/37 qualify actual decoder/performance
risks before affected changes land. REF-22/30 precede CLIP-38 only if its saved-data work needs
them. REF-23 requires D-1; REF-24/29/34 are conditional work, never automatic prerequisites.

Keep gated chains visible and skip them rather than blocking other work: CLIP-31a then CLIP-31b then
CLIP-31c needs Premiere qualification (D-9); CLIP-32 then CLIP-33/34 then CLIP-36 needs the local
model/dependency decision; CLIP-35 then CLIP-37 needs D-5; CLIP-7b/43 needs D-4; CLIP-14 and typing
suggestions need key events; CLIP-44 needs a hosting decision; CLIP-46 then CLIP-47 needs a
recording decision; native CLIP-48 needs a device path. CLIP-11 real recording qualification stays
under D-7. UI-12 remains parked. CLIP-31 is an umbrella, not a fourth XML implementation.

This audit grants no additional source paths, experiment landing, deployment or history rewrite. The
coordinator remains the only main writer, rebases each tested ticket onto latest main and waits for
exact-SHA green CI before releasing the slot.

## Owners

| Lane                     | Thread                                                                           | Owns                                                          |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Queue and implementation | [T-6706048a](https://ampcode.com/threads/T-6706048a-c051-4e23-9ec6-68afd669b492) | This file, REF and CLIP tickets, exclusive main push slot     |
| Cursor implementation    | [T-77c027fc](https://ampcode.com/threads/T-77c027fc-1240-4757-bef9-fcac238ea35a) | Speed-style unit delivered; no active implementation grant    |
| Cursor inspector         | [T-c7f554cb](https://ampcode.com/threads/T-c7f554cb-b157-4f8c-b515-6b07a23b4214) | Inspector delivered; no active implementation grant           |
| Workspace layout         | [T-2a8c77a8](https://ampcode.com/threads/T-2a8c77a8-9a49-4cc2-ae3f-9c4a2550fbea) | UI-2 delivered; no active implementation grant                |
| Transport lifecycle      | [T-0f030227](https://ampcode.com/threads/T-0f030227-5357-4bc3-baf5-7974b220dd59) | REF-31 delivered; no active implementation grant              |
| Zoom regions             | [T-46d4a5ee](https://ampcode.com/threads/T-46d4a5ee-39f1-46ae-bde0-eced0da19a5a) | Narrow CLIP-9b creation/panel-removal integration, Sol medium |
| Cursor preservation      | [T-930219f2](https://ampcode.com/threads/T-930219f2-6c3a-4543-a9e0-9a1073cc4d94) | Frozen original CLIP-11 work, no implementation or push       |
| Editor and bootstrap     | [T-01a1ddd7](https://ampcode.com/threads/T-01a1ddd7-317f-7312-a2ce-db23a9d866da) | `.agents/setup`, `.agents/resume`                             |
| Verification tools       | [T-282b9f84](https://ampcode.com/threads/T-282b9f84-b86a-4498-b4cf-b8fb963a33cc) | `.agents/skills/verify-clipper/**`                            |
| Canonical preview        | [T-6dd30293](https://ampcode.com/threads/T-6dd30293-c740-418a-8174-5d2a1b69da89) | Accepted-main promotion and revision/check receipts           |

The archival audit has coordinator ownership clearance for the completed UI-3 worker/reviewer,
REF-18/20/31 transport worker, tooltip pilot/repair, VERIFY-5, fresh-orb qualifier and OpenScreen
comparison. They have no new assignments or reusable-worker reservations. This is clearance, not a
claim that they were archived. UI-2 remains open until its historical stress-portal ownership is
clear. Keep the inspector/REF-37 owner, dependency-held workers, Fable, coordinator, stable portal
and unaccepted experiments open. SPEC-01 remains archived with its parked branch preserved.

The owner's one-ticket Sonnet 5.5 trial for VERIFY-3 in
[T-24b3f0ad](https://ampcode.com/threads/T-24b3f0ad-9a83-4b3b-b297-6f86319b8e81) concluded with
delivery at `f76a702` and green exact-SHA CI. Its feature-map and control-journey ownership is
released. Ongoing assignment policy lives in the repository workflow skill.

The owner separately approved one Sonnet 5.5 medium feature trial for CLIP-25 in
[T-bfa34ef0](https://ampcode.com/threads/T-bfa34ef0-3d3f-4007-99c7-58c097d8dc58). It owned the
one-frame render seam in `src/export.ts`, a narrow copy/status/busy action in `src/App.tsx`, new
`tests/frame-image.spec.ts` and its ticket brief. Sol retains diff/acceptance review and exclusive
push authority. No generic component, stylesheet, package, persistence or cursor edits are granted.
The exception ended with CLIP-25's green delivery at `6fa99af`; its paths are released. Cursor
speed-style, REF-18, and REF-14 path reservations are also released after their green deliveries.
UI-1 delivered at `b9596c6` with green exact-SHA CI and released its reservation and push slot.
UI-1's test-only CI repair is pushed at
[`3b90f11`](https://github.com/mite404/clipper/commit/3b90f11297fce9c799b02233d457a9f3b2afbe49).
Both failed `4f2ce3a` CI traces and a controlled font replay show late font loading moves the button
outside the stationary pointer and cancels hover. The test now waits for font readiness; no
component, CSS, story, assertion, timeout or retry changed. Coordinator strict gates, 135 units and
isolated full 55/55 pass. Exact-main
[CI 43835506294](https://github.com/mite404/clipper/actions/runs/43835506294) passed. The
coordinator delivered REF-20 at `612486f` with green exact-main CI. No third old-SHA rerun was
issued. REF-20 was assigned to Sol medium in
[T-0f030227](https://ampcode.com/threads/T-0f030227-5357-4bc3-baf5-7974b220dd59). It owns App's
rewind/readout listener and export-progress hunks, focused editor/performance tests, and its brief.
REF-20's reservation is released. The inspector owner now rebases its preserved candidate onto
`612486f` for combined acceptance; UI-2 follows that accepted successor.

Existing worker models and assignments remain unchanged. New-thread defaults and review policy live
only in [managing-tickets](../.agents/skills/managing-tickets/SKILL.md); older model-selection
narratives in this record are historical, not authorization to create threads under those defaults.

[REF-31](tickets/REF-31.md) delivered pause-on-tab-hide rewind and repeated-Space handling at
[`9132ecf`](https://github.com/mite404/clipper/commit/9132ecfa925389b5167e10a1ccc2ded27ee4a3ce),
with [green exact-main CI](https://github.com/mite404/clipper/actions/runs/43898463793). Its
transport reservation is released. No zoom, layout or general shortcut expansion was included.

Frozen REF-31 candidate `e40ba83` is transferred by verified bundle on accepted `57f5864`, with only
App transport, `tests/transport-lifecycle.spec.ts` and its brief changed. The worker's product reds,
three-repeat greens and each-fix mutation failures are preserved. It reports strict gates, 135
units, seven helpers, full 70/70 and isolated performance 20/20 passing. The coordinator has
verified transfer hashes, inspected the source delta and first-failure receipts, and passed fresh
static/unit/helper gates. Its first independent full invocation passed 69 and failed only native
Chromium's five-second DevTools port startup wait, before product assertions. The existing Fable
reviewer reproduced that startup failure and cleared the runtime with one test-only fix: allow
thirty seconds for the port inside the existing sixty-second native test. That exact pre-cleared
delta is applied with source bytes unchanged; its identity patch is transferred to the reviewer. The
startup cause is not established. The corrected coordinator invocation passed full 70/70, then
isolated performance 20/20, both with zero skips or flakes. Fable's source LAND condition is
satisfied, and exact-main CI passed at `9132ecf`. Separate verification follow-ups are the new
spec's missing named `editor`/feature-map coverage and its direct Chromium launch ignoring
`CHROME_PATH`; neither is silently represented as verified by this candidate.

### Delivered header cleanup

| Ticket ID                      | Scope                                                                        | State                                                                                                                                                                               | Needs                                                          |
| ------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| <a id="ui-3"></a>[UI-3](#ui-3) | Remove header branding/title and move existing Save project into their place | Delivered at [ed37b20](https://github.com/mite404/clipper/commit/ed37b201e1b62a24581766ec6dbf92540e5cd7a6), [green CI](https://github.com/mite404/clipper/actions/runs/43881190925) | Header reservation released; Sol PASS and Fable LAND preserved |

Mite requested this cleanup from the stable preview at 617 × 1295. Remove the header `clipper` brand
and `Developer walkthrough` title. Move the existing Save project control into their place,
preserving its handler, disabled states and project-save behavior. Keep export, inspector and
workspace behavior unchanged. Audit title-dependent test focus locators rather than retaining
removed text or accidentally clicking Save to leave another control. Inspect narrow and wide
rendered states and exercise real pointer/keyboard saving with public synthetic data. The portal
owner serves accepted builds only. The delivered unit's actual GPT-6.1 Sol medium review is retained
below; the completed assignment does not authorize a new implementation thread.

Exact UI-3 candidate `4dbaef8` is transferred on accepted `6abc9df`. Its
[Sol medium review](https://ampcode.com/threads/T-e5172fb3-2c86-421e-aa9b-e80633362772) passed
without blocking findings, including independent editor 23/23 and real pointer/Enter save plus
neutral-focus checks. The worker's earlier broader run had four Storybook connection failures. The
corrected isolated full run passed 56/56 and separate five-repeat performance passed. Typed lint and
ticket checks also passed. These receipts qualify the frozen candidate, not a rebased successor;
rerun applicable gates after integration. No push grant. LOCAL PROJECT was removed with its wrapper;
privacy remains for UI-6.

Rebased candidate `f6b6292` is transferred by verified bundle on accepted UI-2 `ceb40bb`. Runtime
and style changes match the reviewed patch; newer transport/editor checks use header padding for
neutral focus after title removal. The worker's full run passed 67/67, but standalone performance
failed 4/20 and its accepted-base control failed 6/20. These receipts remain preserved; no source
cause or absence of UI-3 impact is established. One independent coordinator invocation per side
passed candidate 20/20, then base 20/20, with unchanged gates and no concurrent browser/build work.
These qualify local gates, not matched-rendering nonregression. Coordinator strict/shrink-only
gates, 135 units, seven helpers and the full 67/67 integration journey passed. The existing Fable
reviewer returned LAND for the exact source/navigation delta. Its obsolete logo-click test step and
documentation reference were removed without runtime changes; both affected Save/unsaved-edit checks
passed again. Production pointer/Tab/Enter saving and a downloaded 5,445,100-byte version-2 project
with five clips and four embedded media assets were verified. UI-3 is accepted at
[`ed37b20`](https://github.com/mite404/clipper/commit/ed37b201e1b62a24581766ec6dbf92540e5cd7a6) with
green [exact-main CI](https://github.com/mite404/clipper/actions/runs/43881190925). Its header
reservation is released.

The owner
[closed the UI-3 heading and Save advisories](https://ampcode.com/threads/T-2d1e888a-23ff-4bf4-b2d1-551553f2ef0a#message-1742).
P3 item 2 needs no hidden `h1` and no ticket. P3 item 3 is intended behavior: Space is play/pause
only, not a second activation behavior for Save; Enter-only keyboard coverage is correct. No ticket
is created for either item, and the LAND verdict is unchanged. P3 item 1 is already resolved by the
test/docs cleanup in accepted `ed37b20`, with both affected checks passing afterward. The reviewer's
source-read media-toggle Space exception is now a confirmed deviation. The owner requires Space on
focused Media to play/pause the timeline without toggling the pool. Correct it in [UI-7](#ui-7), not
a separate transport ticket. Existing input/select guards remain unchanged.

### Numeric property label scrubbing

| Ticket ID                      | Scope                                                      | State                              | Needs                                                                      |
| ------------------------------ | ---------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| <a id="ui-4"></a>[UI-4](#ui-4) | Horizontal label scrubbing for all numeric property values | Audit before exact-path assignment | Shared control seam, inspector/zoom/PiP coordination and actual Sol review |

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

| Ticket ID                      | Scope                                                                          | Owner                                                                                    | State                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| <a id="ui-5"></a>[UI-5](#ui-5) | Panel resizing, timeline layout controls and visible playhead/scrub affordance | [Existing Sol owner](https://ampcode.com/threads/T-e1ee6ff4-16fb-49e6-b05b-45a0b6fcecff) | Research-only; implementation follows accepted CLIP-9b and UI-7 with exact-path release |

Use the requested Yaklabs implementation as the source reference, not a new splitter dependency.
Research located `apps/web/src/shell/sidebar-resize.tsx` and `sidebar-width.ts` in mite404/yaklabs:
captured-pointer movement writes a CSS width variable directly, then commits; keyboard arrows,
Shift, Home/End and double-click reset provide alternatives. No repository license was found. The
owner's explicit reuse request authorizes adapting owner-authored code, not inventing an open-source
license or copying third-party code without its terms. Confirm file provenance first. Coordinate
both pane bounds, narrow layouts, collapse/persistence policy and resize observer effects with
delivered UI-2. Source integration is held; no App/styles/layout hunk grant yet.

Research now pins Yaklabs source to `1ccdae55a5f26e96c042a322f980db9e226b3c41`, with owner-authored
provenance and no third-party wrapper. The
[UI-5 research](https://ampcode.com/artifacts/ui-5-pane-resize-research-2844dfea-b28e-43a8-92c1-439681080603)
proposes release commit, Escape/cancel/lost-capture rollback, 16/64px keyboard changes, responsive
reset, visit-only desired widths and handles hidden at widths up to 960px. Coordinator accepts these
design defaults pending rendering; pane minima/maxima and center reserve must hold jointly on the
delivered successor. No project-persistence expansion is approved.

The owner's human post `M-034yiRcvqo7mjFoO7JIOiW` expands this same ticket to a vertically draggable
timeline divider, not another worker or ticket. Place a full-width horizontal separator above
`.sequence-area`; upward dragging enlarges the complete timeline region, downward reduces it. Reuse
the same captured-pointer/direct-CSS handle across both axes. Pointer-up commits; Escape, cancel and
unexpected capture loss roll back. Keyboard Up/Down changes height by 16px, Shift by 64px; Home/End
choose effective bounds and double-click restores the responsive default. Expose the sequence
target, horizontal separator orientation and effective height/range accessibly.

Solve side widths and timeline height jointly so preview, inspector, transport and track scrolling
stay usable. Research revision 3 proposes a timeline minimum of max(320px, measured transport,
toolbar and footer plus 160px usable scroll), an upper-row reserve of 240px, and a maximum based on
actual remaining workspace height after chrome and divider. These numbers are provisional pending
rendering, not accepted pixel guarantees. Retain desired size through temporary effective clamping;
use the accepted stacked/page-scroll fallback when bounds cannot fit. Initially hide desktop
dividers at widths up to 960px. No drag-to-collapse, editor undo, saved layout or playback remount.

The owner's follow-up `M-034yiVE5syDttd2HDFppuX` adds two buttons left of the timeline timecode. One
hides the timeline and relocates to the bottom status bar while hidden, where it restores the
timeline. Keep that restore control reachable by keyboard and move focus with the relocated control
when needed. The other toggles responsive default height versus the most recent user-selected
height. Preserve the remembered custom height across default, hidden and restored states, and
through temporary viewport clamps. Before a custom height exists, retain the responsive default.
Only a changed, committed manual resize updates remembered height; reset/default, hide/restore and
clamping do not overwrite it. Hide/restore retains the prior height mode; cancel restores both mode
and height. Place the footer restore button outside status live text. Explicit hide is distinct from
dragging to minimum. Hiding does not pause/remount playback or discard edit/selection/scroll state.
These are visit-only layout controls, not project/history edits.

The same owner coordinates the timeline playhead follow-ups `M-034yiWzlDdTdDmnzlowqDk` and
`M-034yiXtJgBU0IAlTJFSN8l`. The playhead must extend through elapsed-time ticks to the top of the
ruler, making current time obvious. The owner reports scrubbing requires dragging an invisible
handle and rejects that discoverability. Reproduce it on the accepted successor and propose a
visible playhead/scrub affordance; do not assume a replacement gesture or treat a longer painted
line as interaction acceptance. Preserve clip selection, move/trim hit targets, ruler seeking,
keyboard access and zoom/scroll/resize alignment. Check both ruler and track alignment at multiple
frames/scales and after horizontal/vertical scrolling; show pointer and keyboard scrubbing with
neighboring clip controls. No specific new gesture is approved by these requirements.

The existing owner reproduced the invisible native ruler input on accepted `0b5584e` with the public
demo: its full-width input has opacity 0 while the noninteractive body marker starts 23px below
ruler top. Native thumb/end-point geometry and the body's frame/duration position also differ, so
extending paint alone is insufficient. The minimal candidate is a visibly styled native range
thumb/focus/pressed affordance with aligned ruler/body marker, retaining native ruler click/drag and
keyboard behavior. Qualify it on the accepted implementation successor before acceptance; do not
overlay clip hit targets or silently change gestures.

Current accepted research baseline is `0b5584ef9d5dd8a8005bbaeedf0bc91993524936`, which already
contains UI-2, cursor-inspector and UI-3 deliveries; the worker's `6abc9df` checkout is stale.
Implementation remains after accepted CLIP-9b and UI-7. At that release the coordinator supplies
their exact accepted successor SHA and grants `src/PanelResizeHandle.tsx`, `src/App.tsx` workspace/
sequence state, divider, timecode-adjacent buttons and status-bar restore hunks, `src/styles.css`
workspace columns/rows/handles/control placement, and `tests/workspace-layout.spec.ts`. The App
boundary explicitly includes `.app-footer` for the relocated restore control. This is the planned
path boundary, not a source release now. No header, inspector-control, cursor, model/parser, or
exporter edits are granted. The playhead/scrub follow-ups may require a separately enumerated
`src/Timeline.tsx` ruler/playhead hunk and matching browser checks after reproduction and a scoped
interaction proposal; those paths remain held, not implicitly released with panel resizing. The
proposed narrow addition is ruler input/marker presentation and local geometry props only, matching
styles and `tests/controls.spec.ts` seeking/endpoints/keyboard coverage plus workspace alignment
checks. No scale-hook/model or clip-selection/trim-handler changes are implied.

Acceptance covers all three combined extremes, short/tall and narrow windows, pointer release and
rollback, keyboard isolation, dynamic ARIA bounds, reset, playback continuity, scrollable tracks/
inspector and stable px/s/ruler geometry when width is unchanged. Inspect default, expanded,
reduced, hidden/restored and narrow states plus a real-pointer recording. Check custom-to-default-
to-custom and hide/restore after either mode, including viewport clamp/restore without losing the
custom height. Retain full strict gates and required exact-candidate review. The existing Timeline
ResizeObserver should need no forced scale update.

### Selected obsolete UI deletion

| Ticket ID                      | Scope                                               | State                                          | Needs                                                                      |
| ------------------------------ | --------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------- |
| <a id="ui-6"></a>[UI-6](#ui-6) | Remove selected source/old cursor/transport clutter | Next bounded cleanup after UI-3; no worker yet | Inspector/REF-20/UI-2 exact successor and Sol-reviewed serialized delivery |

Delete the source header ORIGINAL tag, the entire old above-timeline cursor-sidecar section,
transport L/R meter and visible Paused text. Do not delete inspector cursor capabilities or source
metadata attachment access relocated there. Inspector already owns moving the old cursor section;
integrate that delivery rather than duplicating removal. Remove meter-only derived calculation and
styles after verifying remaining callers. Preserve playback/readout behavior and accessibility;
replace text-only Paused test assumptions with actual control/media state without softening exact
held-frame assertions. Also remove workspace slogan `Make something worth watching.`, EDIT WORKSPACE
label and remaining LOCAL PROJECT/On your device tags. UI-3 already owns title/brand removal and its
LOCAL PROJECT wrapper; reconcile actual candidate before any duplicate header deletion. Keep this
separate from UI-3's header cleanup. Resolution duplication is REF-27 App scope: remove
composition-header `1280 × 720` and retain one resolution control beside Export video. The latest
explicit request also makes selected HD/4K the actual composer render dimensions, not only output;
that shared geometry work belongs REF-27, not a label-only cleanup. No source grant yet.

CLIP-25 copies the held composed output frame to the clipboard as PNG on explicit user action, using
shared render math and the existing output-resolution choice. No DOM screenshot or video-wide encode
is acceptable. Independent decoded-pixel checks cover source offsets, repeated cuts, seeks,
crop/swap/zoom/follow and cursor rotation. Denied/unsupported clipboard and unreadable media must
leave the edit intact, free resources and clear busy state with a useful visible error. Full strict
gates, inspected UI states/interaction and green exact-SHA CI remain delivery gates.

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

| Ticket ID                      | Scope                                                          | State                    | Needs                                                  |
| ------------------------------ | -------------------------------------------------------------- | ------------------------ | ------------------------------------------------------ |
| <a id="ui-7"></a>[UI-7](#ui-7) | Media before Save, temporary left-edge peek and Space behavior | Sol medium research only | Accepted CLIP-9b successor and exact shared-path grant |

The owner requested moving Media into the header immediately left of Save project and temporarily
sliding the media pool in when hovering the left edge. Reuse the owner-authored Yaklabs pattern in
`apps/web/src/shell/sidebar-peek.tsx` at `1ccdae55a5f26e96c042a322f980db9e226b3c41`, not an
unrelated sidebar implementation. Space on focused Media must only play/pause the timeline, never
show or hide the pool. Click and Enter retain the persistent toggle. Hiding the pool preserves
selection and playback. Keep transient peek distinct from persistent open state and qualify focus,
pointer exit, narrow layouts, touch fallback and reduced-motion behavior.

Extend UI-2's delivered mounted accessible drawer at `ceb40bb`, already in accepted main; do not
build a second hide/show implementation. UI-7 has completed read-only reference research and
reproduced the focused-Media Space deviation in the production UI, but has no implementation yet.

The existing [Sol medium worker](https://ampcode.com/threads/T-93cc1d51-b15d-443e-afc8-5267ef98ab33)
may research the reference and current behavior on accepted `19c571e`, but has no source reservation
or push grant. Its exact implementation base and App/header/drawer/style/test paths follow the
accepted CLIP-9b successor and coordinator grant. Do not duplicate this worker or the ticket. Update
UI-3's superseded Save-within-20-pixels header assertion. Replace header `(4, 4)` focus parking in
affected transport/performance tests if it intersects the peek zone, preserving their transport
assertions and performance workload, thresholds, repeats and sampling. Require real pointer/keyboard
verification, inspected public/synthetic captures, strict/full gates and exact-main green CI.
Existing review gates and the coordinator's exclusive push slot remain unchanged.

### Media-pool views and source scrubbing

| Ticket ID                      | Scope                                                               | State                    | Needs                                               |
| ------------------------------ | ------------------------------------------------------------------- | ------------------------ | --------------------------------------------------- |
| <a id="ui-8"></a>[UI-8](#ui-8) | Compact clip rows, selected-thumbnail scrubbing and source mini-bar | Sol medium research only | Accepted UI-7 successor and exact source/test grant |

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
the reference and current source on accepted `d8776cd`. Source edits remain held until UI-7's
header/drawer successor is accepted and the coordinator grants exact paths. Extend the existing
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

The former queue thread
[T-2d1e888a](https://ampcode.com/threads/T-2d1e888a-23ff-4bf4-b2d1-551553f2ef0a) has stopped
implementation and coordination. Its baseline review is complete and is not repeated. The successor
received the actual 13 CLIP-11 changed files, including `src/cursor-touch.png`, through
`download_thread_changes` before editing. Integration uses a three-way merge from `8095a273`, not an
overlay of stale files. Server-side usage confirms GPT-6.1 Sol routing for the successor, created
with medium effort. Implementation workers have disjoint paths and one main push-slot owner.

Evidence-only threads:
[reuse research](https://ampcode.com/threads/T-01a1ddd8-535c-7129-a7d7-9a0c28f41449) (what the
owner's `sequence-spear-fish` prototype can lend),
[Premiere XML design](https://ampcode.com/threads/T-52bd93c4-0eb5-46f3-ae30-0d2ff60a23ff) (proposals
CLIP-31a to CLIP-31c),
[capture research](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc) (source
reading, complete) and the Mac capture check, a thread on the owner's Mac that he has since deleted
(three real OpenScreen recordings; the videos and sidecars were not transferred, but eight derived
images were hosted, see [Known limits](#known-limits)).

### Current path reservations

| Owner                    | Paths                                                                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor implementation    | No active reservation after the speed-style delivery; further work requires a new scoped grant                                                              |
| Cursor inspector         | No active implementation reservation after green inspector delivery                                                                                         |
| Workspace layout         | No active implementation reservation after green UI-2 delivery                                                                                              |
| Header cleanup           | No active implementation reservation after green UI-3 delivery                                                                                              |
| Media drawer follow-up   | UI-7 reference/design research only; no source reservation until accepted CLIP-9b successor and exact-path grant                                            |
| Media-pool views         | UI-8 reference/source research only; canonical T-fd12a7e5, accepted UI-7 successor and exact-path grant before edits                                        |
| Track targets/visibility | UI-9 research only; canonical T-cbade74d, insertion/model contract and exact-path grant before edits                                                        |
| Transport lifecycle      | No active reservation after green REF-31 delivery; preserve accepted REF-20/31 transport behavior                                                           |
| Zoom regions             | CLIP-9b narrow App creation/B/hints, AutoZoomControls deletion, zoom-generation removal and listed test/story consumers; no Timeline/model/ramp/style edits |
| Oxc tooling              | No active reservation after green VERIFY-5 delivery; VERIFY-6 follow-up needs a separate exact-path grant                                                   |
| Queue implementation     | Queue/docs and acceptance; sole main push slot                                                                                                              |
| Shared, keep edits small | `src/App.tsx`, other `tests/**`, `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `README.md`                                            |

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
| <a id="clip-5"></a>[CLIP-5](#clip-5)          | Local HD and 4K export                                                                                                                                                                                                                                                                                                                                                                | `5a9bc1f`                                                                                       | same; WebM VP9/Opus only, see [Known limits](#known-limits)                                                                                                                                                                                                                                                                                             |
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

Top to bottom is the order of work. Correctness and unblocking work precede dependent features. One
queue owner coordinates disjoint implementation lanes; pushes are serialized and await exact-SHA CI.

### Mouse tracking and automatic zoom

| Ticket ID                                         | Title                                                                        | Risk   | Status   | Owner                 | Needs   |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ------ | -------- | --------------------- | ------- |
| <a id="clip-11"></a>[CLIP-11](tickets/CLIP-11.md) | Cursor appearance and behavior: style, idle hide, loop return, shake removal | Medium | Partial  | Cursor implementation | nothing |
| <a id="clip-7b"></a>[CLIP-7b](#clip-7b)           | Screen Studio `mousemoves`/`mouseclicks` metadata import                     | Medium | Decision | Queue implementation  | D-4     |

CLIP-11's preserved first unit covers recorded, fixed and Touch styles, idle hiding, shake removal,
and stop or return endings. Its three-way integration onto `9b64f563` passes 127 unit and all 39
browser checks, including decoded cursor exports and local save/reopen. Six new behavior assertions
failed on the unchanged implementation first. This core unit is delivered at
[`7b23be8`](https://github.com/mite404/clipper/commit/7b23be80ff417e061d5c74ac127759b20a5b80ef),
with [green CI](https://github.com/mite404/clipper/actions/runs/43786045477). Source-time segment
hiding is delivered at
[`bea0526`](https://github.com/mite404/clipper/commit/bea052601a0181080956f6ad08b93bf1df419311),
with [green CI](https://github.com/mite404/clipper/actions/runs/43794298710). Its half-open ranges
apply to every use of a source, independently of telemetry offset. The worker verified 129 units, 39
browser checks and 10 isolated performance checks. Shape stabilization is delivered at
[`a6f0448`](https://github.com/mite404/clipper/commit/a6f0448fbd93f749187f3a40e6a0bc45d8d74103),
with [green CI](https://github.com/mite404/clipper/actions/runs/43797731005). Its optional 100 ms
shape debounce preserves interaction shapes and resets across missing/disconnected tracking. The
worker verified 131 units, 40 browser checks and ten isolated performance checks with stabilization
enabled. Movement rotation is delivered at
[`e3428ee`](https://github.com/mite404/clipper/commit/e3428eeb4b88fb44bf23dcafc1dcf16a08167353),
with [green CI](https://github.com/mite404/clipper/actions/runs/43800623105). Default-off rotation
uses a deterministic 100 ms horizontal lookback, capped at ±12°, around the scaled recorded hotspot.
The worker verified 133 units, 43 browser checks and ten isolated performance checks with rotation
and stabilization enabled. Speed styles are delivered at
[`bd6120f`](https://github.com/mite404/clipper/commit/bd6120fa070f1386fa92324e7459cea459918178),
with [green CI](https://github.com/mite404/clipper/actions/runs/43805205300), independently checked
by the queue owner. Smooth retains the existing sampler; Medium and Rapid traverse the final 75% and
50% of each sample interval; None steps and Raw bypasses styling. The worker verified 135 units,
seven helper checks, 44 browser checks and ten isolated performance checks. Its cursor paths are
released. Full CLIP-11 remains partial for video-wide ending parity and real-Mac qualification.
Endings apply per trimmed clip, not per whole video. The 1 s idle delay, 0.5% shake radius, 0.5 s
ending duration, 100 ms shape threshold and speed-style fractions are engineering defaults.

The expanded cursor-control layout is not accepted UX. On 2026-11-16, the owner said: "this UI makes
no sense. options for the cursor animation probably need to live in the inspector to still allow
room for the sequence timeline." Delivered behavior and passing gates do not constitute layout
acceptance. The owner subsequently approved modeling the workflow after Screen Studio: "then lets
model ours after that." The comparison and inspector recommendation are preserved in
[research](https://ampcode.com/artifacts/cursor-editing-comparison-2961b129-327d-4172-b269-ef8e96678f21).
The approved Sol medium implementation belongs to
[T-c7f554cb](https://ampcode.com/threads/T-c7f554cb-b157-4f8c-b515-6b07a23b4214). It first
reorganizes existing controls into the selected-screen-clip inspector, keeping the timeline visible
and explicitly labeling recording-wide settings. The latest owner decision below limits visibility
to the selected relevant timeline clip; cursor edits must not silently change selection. No new
effects, sampler defaults, or pretend clip-local overrides are granted. UI-1's IconButton, tooltip
CSS, packages and story/spec remain reserved, as do REF-20's playback/readout/export-progress hunks
and editor/performance tests. The inspector owner must integrate UI-1's delivered base before final
gates and request a serialized push slot.

### CLIP-11b: targeted cursor metadata attachment

| Ticket ID                                            | Scope                                                                                        | Owner                                                                             | State                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| <a id="clip-11b"></a>[CLIP-11b](tickets/CLIP-11b.md) | Import from source media panel or drop sidecar onto screen recording in composition/timeline | [Sol scoping](https://ampcode.com/threads/T-fb08e0ff-0f5d-4dab-9d9e-470de7fd0490) | Read-only; separate from frozen inspector; shared successor/hunk grant required |

The [repo brief](tickets/CLIP-11b.md) covers explicit source-wide targeting, supported
parser/errors, failure/cancel preservation, undo/dirty state and save/reopen. CLIP-2b/2c media
movement/insertion drops are different gestures and retain their owners; REF-27 retains composer
geometry/hit-target seams. Research actual existing state/history before changing shared paths. Do
not infer new metadata format support or attach by filename guess. Publish this new mapping at the
next appropriate doc delivery; a local entry is not remote implementation.

### Audited experiment and inspector scopes

These IDs turn previously unnumbered scope into canonical tickets without accepting experiments. The
detailed source decisions below remain evidence for these rows, not additional tickets.

| Ticket ID                               | Feature                                                                                                   | State and dependency                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| <a id="ui-10"></a>[UI-10](#ui-10)       | Adopt selected shared ui-sdk controls and requested tooltip/checkbox polish from the preserved experiment | Preserved experiment only; coordinator owns eventual Sol implementation after exact scope/path grant; UI-1 is delivered |
| <a id="ui-11"></a>[UI-11](#ui-11)       | Show editable inspector properties only for the selected timeline clip type                               | Approved behavior; integration held; coordinate CLIP-11b source attachment and CLIP-9b inspector consumers              |
| <a id="clip-2d"></a>[CLIP-2d](#clip-2d) | Hide/show an individual whole clip while retaining its dimmed timeline region                             | Approved behavior; integration held; distinct from UI-9 layer visibility and cursor-only hiding                         |
| <a id="ui-12"></a>[UI-12](#ui-12)       | Evaluate adoption of the SPEC-01 hardware-inspired editor skin and haptics                                | Parked by owner; preserved remote experiment, no main adoption or implementation grant                                  |

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
acceptance states. Any eventual implementation uses GPT-6.1 Sol medium after an exact shared-path
grant. No duplicate worker or recording-to-clip settings migration is authorized.

The preserved candidate owner reports Sonnet, so it remains research/preservation-only. The Sol
medium coordinator retains eventual implementation ownership until an existing Sol worker receives
an exact grant. Read-only inspection identifies the no-selection fallback to the library asset as
the immediate cursor-visibility deviation. A cursor-only fix is not by itself acceptance of all
selected-type inspector properties. Scope missing-sidecar attachment, library-only source access and
the remaining selected-clip versus project-global inspector sections before integration; preserve
the existing attachment contract and do not duplicate CLIP-9b's batch-panel deletion.

The owner's additional polish request is one separate local commit on
`exp/ui-sdk-marginal-controls-polish`, cut from preserved `dec534e` and owned by the Sol medium
coordinator. Remove the visible recording-scope line and Appearance/behavior legend without changing
setting ownership or accessible group names. Replace the Animation and ending notes with toggleable
info tooltips using UI-1's ui-sdk implementation, styling and motion. Align the four checkboxes and
make hidden clips' dashed outlines visible. Verify affected controls/hiding specs, full gates and
inspected cursor/hidden-clip captures. This is not a Sonnet source release, main reservation, push
or landing acceptance. The original candidate and backup remain unchanged.

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

The owner approved this one-component pilot after CLIP-11. It replaces shared `IconButton`'s native
`title`, not all native controls. Reserve `src/components.tsx`'s IconButton/import hunk, a scoped
tooltip block and initial `@layer ui-sdk;` in `src/styles.css`, `package.json`, `package-lock.json`,
new `src/IconButton.stories.tsx`, `tests/icon-button.spec.ts` and `docs/tickets/UI-1.md`. No App,
Timeline, cursor, Remotion, `Editor.stories.tsx`, README or test-config edits are granted. REF-18
owns configuration/CLI/README paths, which do not overlap.

Pin `@ui-sdk/react` and `@ui-sdk/core` to exactly `0.1.0-beta.5` with npm `--save-exact`. Do not
import `web.css`. Preserve native button semantics, disabled behavior and accessible names without a
duplicate tooltip announcement. Use owned dark styling, transform origin `var(--transform-origin)`,
125 ms opacity/scale transitions with `cubic-bezier(0.23,1,0.32,1)` from scale 0.97, no transition
for `[data-instant]`, and fade only under reduced motion.

Gate on all strict checks, actual same-base main-chunk gzip delta ≤35 KB, and inspected hover,
focus, group-instant and reduced-motion captures plus a pointer-sweep recording. Report total
production JS/CSS delta too. If release-age policy blocks installation, stop and ask the owner;
never weaken or bypass it. No dependency is installed or push authorized by this queue entry. The
initial path grant preceded the ordering clarification: the worker reports two exact packages
installed without a policy refusal or bypass, with only package/lock edits preserved locally.
Source/CSS/story/test implementation resumed after `bd6120f` passed exact-SHA CI. UI-1 is pushed at
`b9596c6` with [green exact-main CI](https://github.com/mite404/clipper/actions/runs/43809636737).
Its worker released the slot. Local acceptance includes 55 browser checks, ten isolated performance
checks and a separate four-case coordinator rerun.
[Approval research](https://ampcode.com/threads/T-85e2e0a7-9485-4657-9f22-48ae0622da7b) and
[recommendation](https://ampcode.com/artifacts/ui-sdk-emil-design-guidance-for-clipper-research-recommendat-2cddfaeb-7327-41d5-8037-d4d685b2a035)
remain linked evidence, not another operational queue.

### Approved workspace layout unit

| Ticket ID                      | Title                                                              | Status                                 | Owner                                                                            | Needs                                                                              |
| ------------------------------ | ------------------------------------------------------------------ | -------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| <a id="ui-2"></a>[UI-2](#ui-2) | Hide/show media drawer, timeline room and two-axis track scrolling | Delivered ceb40bb; exact-main CI green | [Sol medium](https://ampcode.com/threads/T-2a8c77a8-9a49-4cc2-ae3f-9c4a2550fbea) | Reservation released; historical stress portal ownership still needs clarification |

The owner approved this connected layout unit. It owns drawer UI state/toggle/library wrapper,
workspace/sequence shell, Timeline viewport markup and scoped media/workspace/timeline CSS. The
proposed sequence-area wrapper may span workspace columns. It may reconcile the inspector's outer
height/overflow rule with the bounded grid only after integrating the cursor-inspector delivery,
preserving internal inspector scrolling. No cursor contents, sampler, playback/readout/progress,
video geometry, project format, exporter, package, test-config or master edits are granted.

The drawer toggle must be keyboard-accessible and preserve selection/playback. Both video and audio
lanes must remain reachable by horizontal and vertical scrolling at representative wide/narrow
sizes, with more usable sequence room. UI-only drawer state is not new saved edit data. Use a
focused workspace-layout browser spec, existing or disjoint stories, worst-case content and
inspected pointer/keyboard captures. Full strict/browser/performance gates and exact-SHA CI remain
required.

UI-2's unpushed checkpoint is `5119fbd` on delivered UI-1 base `b9596c6`. It includes the owner's
clip-region bleed correction and a dev-only Demo/Worst/Empty/One/1,000-clip timeline stress story.
The coordinator preserved all five changed files through `download_thread_changes` and inspected the
synthetic before/after captures. The worker reports a red/green gutter hit-test, all 15
dataset/width combinations, 16 focused browser checks and 135 units passing. These are preliminary
checks, not final combined acceptance. See the
[stress evidence](https://ampcode.com/artifacts/timeline-clip-region-stress-fc0f5a96-848e-47ff-9a37-179ab2f8a11d).
The inspector successor is delivered at
[`27bae5a`](https://github.com/mite404/clipper/commit/27bae5ab956c02b391aaef3d54abc459ae0ae79e),
with green [exact-main CI](https://github.com/mite404/clipper/actions/runs/43862475576). UI-2 is
released to rebase its preserved work onto that successor and complete combined acceptance.

The owner additionally requires both timeline-scale bounds to adapt proportionately to total
sequence duration and actual available timeline width. Grant Timeline scale state/bounds and
workspace-layout tests only. Retain a chosen scale while valid, clamp only outside new bounds, and
update after duration, resize and media-pool visibility changes. Check empty/short/long,
growth/shrink and resizing without touching trim/seek/model, zoom handles or playback internals.

UI-2 candidate `df6ba3c` is transferred by verified Git bundle and integrated locally on accepted
`27bae5a`; the original `5119fbd` checkpoint remains preserved. The worker's first full run was
65/66: the radius drag targeted an offscreen slider, not an undo defect. A granted single native
scroll step before its bounding-box measurement preserves all assertions. Its corrected full run
passed 66/66, and its separate unchanged performance invocation passed 20/20. First-failure trace
and all receipts remain preserved. Coordinator strict/shrink-only gates, 135 units and seven helper
tests passed; its fresh integrated browser invocation passed 66/66 with no skips or flakes. The
coordinator's separate unchanged performance journey passed 20/20 on its first invocation. Delivery
is accepted at
[`ceb40bb`](https://github.com/mite404/clipper/commit/ceb40bbe3136aee4331356f11f2dea048b536e75),
with green [exact-main CI](https://github.com/mite404/clipper/actions/runs/43871531117). UI-2's
reservation is released. UI-3 may rebase its preserved reviewed header candidate onto this accepted
successor; no deployment is authorized.

Final integration order is UI-1, REF-20, cursor inspector, then UI-2. REF-31 begins only after
REF-20; its playback hunks stay disjoint from both layout units. No worker may overwrite another
unit's tests or relax performance assertions to accommodate disclosure changes. The cursor-inspector
owner has a narrow exception for one Cleanup disclosure click in the existing performance setup and
minimal disclosure selectors in cursor, cursor-speed and cursor-shape tests.

Inspector successor `ba0fd4f` is transferred and frozen on delivered `612486f`. Bundle and archive
identity are verified. Static/build gates, 135 units, seven helper tests and full browser 62/62
passed. Performance is unresolved: candidate batches passed 18/20 and 19/20, while the intervening
same-orb delivered-base control passed 20/20. Three candidate cursor-follow samples failed the
unchanged strict rAF p95 bound. This is not yet a source-cause attribution. The existing inspector
owner completed five alternating pairs: base 5/5, candidate 2/5. Verified DOM snapshots establish a
confound: base preview wholly offscreen, candidate preview onscreen, with matching dimensions. Both
advance media without captured page/media errors. A second finite read-only grant normalizes preview
visibility for five alternating pairs; it uses the same DOM Play click on both sides to avoid
automation scrolling the baseline transport back down. Both sides passed 0/5 with overlapping
results, but repeated layout-reading guards add unquantified overhead. The final low-intrusion
five-pair diagnostic removed those in-window guards; both sides still passed 0/5. No source cause or
equivalence is established; diagnostics are concluded. The existing independent qualifier's single
untouched candidate performance journey and subsequent base control each passed 20/20. Actual
receipts are transferred and hash-verified. These are strict local gate passes, not matched-workload
nonregression or a universal guarantee. The coordinator integrated the exact frozen source for final
combined acceptance; fresh static/shrink-only gates, 135 units and seven helper tests passed. Full
browser gates passed 62/62 in the single final integrated invocation, with no skips, flakes or
retries. Delivered at
[`27bae5a`](https://github.com/mite404/clipper/commit/27bae5ab956c02b391aaef3d54abc459ae0ae79e),
with green [exact-main CI](https://github.com/mite404/clipper/actions/runs/43862475576). The
inspector reservation is released to UI-2's outer-layout integration only; no cursor behavior change
is granted. No deployment is authorized or claimed.

### Not blocking mouse work

Take these when a push slot is free and the files do not overlap an in-flight ticket. Owner is the
queue thread unless stated.

| Ticket ID                                      | Title                                                                               | Risk   | Status                                                                                                                                                                              | Findings            |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| <a id="ref-14"></a>[REF-14](tickets/REF-14.md) | One constant each for music gain and peak rate; blob-URL test asserts no fetch      | Small  | Delivered at [afe4c60](https://github.com/mite404/clipper/commit/afe4c605f551c979083297b0e0d5d24f4a32a484); [green CI](https://github.com/mite404/clipper/actions/runs/43806193468) | #32, #33, #34       |
| <a id="ref-18"></a>[REF-18](tickets/REF-18.md) | Editor journeys also run against the production bundle                              | Medium | Delivered at [7373115](https://github.com/mite404/clipper/commit/7373115e9a501312bea5a4192a101094dce5d08f); [green CI](https://github.com/mite404/clipper/actions/runs/43803496212) | #18                 |
| <a id="ref-20"></a>[REF-20](tickets/REF-20.md) | Rewind and export progress re-render at 10 Hz                                       | Medium | Delivered 612486f; exact-main CI 43850098949 green; full 61/61 and fresh-orb performance 20/20; host-sensitive failures preserved                                                   | #36                 |
| <a id="ref-26"></a>[REF-26](tickets/REF-26.md) | Keep footer errors and warnings visible without scrolling                           | Small  | Delivered at [4535665](https://github.com/mite404/clipper/commit/45356659c892b3607230778270c5d4eb16786c3c)                                                                          | found during REF-21 |
| <a id="ref-22"></a>[REF-22](#ref-22)           | Project container without one giant JSON string (format version 3, reads version 2) | Large  | Proposal                                                                                                                                                                            | #3                  |
| <a id="ref-23"></a>[REF-23](#ref-23)           | Zooms anchored to source time and source coordinates                                | Large  | Decision D-1                                                                                                                                                                        | #14, #24            |
| <a id="ref-24"></a>[REF-24](#ref-24)           | Edit operations in a tested reducer outside `App.tsx`                               | Large  | Proposal; only if REF-19 proves too thin                                                                                                                                            | #20                 |

REF-22 and REF-23 change saved data, so each needs the owner's go-ahead before code.

### Review follow-ups without a delivery claim

These rows make the review's informational recommendations explicit. They are proposals, not new
confirmed defects. Optional cleanup does not delay features. The coverage table below identifies the
original note for every row.

| Ticket ID                                            | Title                                                            | Risk   | Status                                                                                                                                                                              | Needs                                                                                                   |
| ---------------------------------------------------- | ---------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| <a id="doc-2"></a>[DOC-2](#doc-2)                    | Audit ticket coverage, IDs and delivery evidence                 | Small  | Delivered at [a8078ff](https://github.com/mite404/clipper/commit/a8078ffb4d737bf028bd0b864f31125dbd510263), [green CI](https://github.com/mite404/clipper/actions/runs/43789649834) | nothing                                                                                                 |
| <a id="ref-27"></a>[REF-27](#ref-27)                 | Select real MP4/MOV/WebM exports and qualify codecs              | Medium | Exporter/test-only implementation granted to T-66b606e9; App integration held                                                                                                       | Actual composition/codecs/gates before acceptance                                                       |
| <a id="ref-28"></a>[REF-28](#ref-28)                 | Define missing decoded-frame behavior                            | Medium | Proposal                                                                                                                                                                            | reproduce null and early-end decoder cases                                                              |
| <a id="ref-29"></a>[REF-29](#ref-29)                 | Assess complexity-score baseline blind spots                     | Small  | Deferred proposal                                                                                                                                                                   | only if count-only baseline permits real growth                                                         |
| <a id="ref-30"></a>[REF-30](#ref-30)                 | Progress and cancellation for import, Open and Save              | Large  | Proposal                                                                                                                                                                            | define bounded-memory and cancellation behavior with REF-22                                             |
| <a id="ref-31"></a>[REF-31](tickets/REF-31.md)       | Prevent hidden-tab rewind jumps and held-Space toggles           | Small  | Delivered at [9132ecf](https://github.com/mite404/clipper/commit/9132ecfa925389b5167e10a1ccc2ded27ee4a3ce); [green CI](https://github.com/mite404/clipper/actions/runs/43898463793) | Transport reservation released                                                                          |
| <a id="ref-32"></a>[REF-32](#ref-32)                 | Correct source-preview playback error and busy lifecycle         | Medium | Ready                                                                                                                                                                               | reproduce pause, switch and export races                                                                |
| <a id="ref-33"></a>[REF-33](#ref-33)                 | Qualify download URL lifetime outside Chromium                   | Medium | Blocked                                                                                                                                                                             | another supported WebCodecs browser                                                                     |
| <a id="ref-34"></a>[REF-34](#ref-34)                 | Remove Player listener lifetime assumptions                      | Small  | Deferred proposal                                                                                                                                                                   | reproduce a listener lifecycle defect first                                                             |
| <a id="ref-35"></a>[REF-35](#ref-35)                 | Close edit and project-boundary test gaps                        | Medium | Ready                                                                                                                                                                               | asymmetric ripple, fractional trim, parser bounds, source-track rules, save snapshot and chunking cases |
| <a id="ref-36"></a>[REF-36](#ref-36)                 | Prove delivery recovery and individual audio mute                | Medium | Ready                                                                                                                                                                               | UI cancel and retry; failed export and partial-open recovery; one muted track at a time                 |
| <a id="ref-37"></a>[REF-37](#ref-37)                 | Qualify video cadence, rewind, scrub and large telemetry         | Medium | Verification remains open; broad stall investigation stopped unless standalone recurrence or new Amp-view request                                                                   | Preserve existing performance thresholds; inspector ownership retained pending explicit closure         |
| <a id="verify-3"></a>[VERIFY-3](tickets/VERIFY-3.md) | Bring the feature map in line with delivered motion and controls | Small  | Delivered at [f76a702](https://github.com/mite404/clipper/commit/f76a702f85a0bcdf64f7c8bc2b0726823c447003); [green CI](https://github.com/mite404/clipper/actions/runs/43798560663) | frame-step and zoom-field journeys; current cursor and follow coverage                                  |
| <a id="clip-9b"></a>[CLIP-9b](#clip-9b)              | Visible zoom regions, editable ramps and numeric equivalents     | Medium | Reviewed creation slice in main delivery; fresh full 73/73 and isolated performance 20/20; exact-main CI pending; Add zoom follow-up and full ramps open                            | Exact-SHA green CI before acceptance; preserve CLIP-9/10                                                |

| Ticket ID                                  | Feature                                                                                                      | State and dependency                                                     |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| <a id="verify-6"></a>[VERIFY-6](#verify-6) | Include transport lifecycle in named editor/feature-map coverage and honor CHROME_PATH for its native launch | Open follow-up from delivered REF-31; exact tool/test paths before grant |

VERIFY-6 preserves REF-31's behavior and timeout contract. Verify journey selection and executable
override through the real CLI. It does not reopen REF-31 or require the completed worker to remain
assigned. BOOT-1's unchecked fresh-GitHub-orb acceptance stays under BOOT-1, not a duplicate ticket.

CLIP-9b retains the reference inventory's remaining zoom-edge interaction. `Timeline.tsx` renders
zoom intervals as selection buttons only; inspector start/duration fields do not supply timeline
edge dragging. CLIP-9's delivered row describes generation, not completion of this reference extra.

Latest narrow-slice state: transferred candidate `b2d0353` is corrected locally to source-review
tree `6a08f46c359bcd5c32fa50e1d5329de30afb8518`. The existing Fable reviewer confirms LAND for that
exact tree, with no new review. The correction removes the App import from auto-zoom fixture setup
and restores the baseline byte-identical to `19c571e`; runtime and performance bytes are unchanged.
Source blobs match that reviewed tree on accepted `6365288`; the Fallow baseline is unchanged. Fresh
coordinator gates pass 132 unit tests, seven CLI-helper tests, full 73/73 and isolated performance
20/20, with zero skipped or flaky browser cases. The rebuilt AutomaticZooms story also creates one
four-second zoom. The slice is in serialized main delivery, awaiting exact-main CI; this is not
acceptance of the whole ticket. Keep the owner's subsequent **Add zoom** panel label and stale
cursor feature-map update as the next follow-up under CLIP-9b, after the reviewed slice, not a
duplicate ticket. Choose the panel accessible name explicitly because toolbar/inspector already have
Add zoom actions; update exact-name story/spec consumers together. Full ramp scope remains open.

The coordinator verified the transferred complete-history bundle, nine-path dirty/untracked draft
and receipt archive against `clip-9b-SHA256SUMS.txt`. The frozen base and HEAD are both `b9596c6`;
there are no implementation commits above it. Backups remain under `.amp/in/orb-backup/`, without
source import, rebase, rerun or push during preservation. REF-31's exact-main CI is now green. The
existing Sol medium owner may integrate the narrow creation/panel-removal draft onto fetched
`9132ecf` or its accepted successor, preserving all newer source and test changes. Do not restore
stale files or the old Fallow baseline wholesale. Performance setup-only migration is released for
the preserved two-shot legacy workload, without threshold, repeat, assertion or sampling changes.
The sole push slot stays with the coordinator. Full Timeline/model/ramp ownership remains held.

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

Planning and audited GitHub main:
[`7b23be8`](https://github.com/mite404/clipper/commit/7b23be80ff417e061d5c74ac127759b20a5b80ef).
Compared with reviewed baseline
[`5a9bc1f`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c). The
audit used `git log`, ticket commit diffs, aggregate name-status and narrow test hunks. GitHub's 40
main CI runs from the baseline through this head all report success, including each delivered row's
SHA. The latest [CI run](https://github.com/mite404/clipper/actions/runs/43786045477) is green. No
new whole-codebase review or expensive reviewer was run.

All **34 retained findings** have ticket or owner-decision mappings in the historical
[ranked table](refactor/refactor01.md#ranked-findings): 31 actionable and three decision findings.
Those mappings resolve to this list. That did not previously mean every informational recommendation
had a queued disposition. The following **33 notes** now do too. R, T and A are source-note labels
in original order, not ticket IDs or new queues.

The planning audit confirmed 19 delivered REF tickets. REF-18 is now delivered at `7373115`, with
green exact-SHA CI, 133 units, seven CLI checks, repeated 43/43 isolated browser runs and a 43/43
CI-mode run reported by its worker. Production UI journeys and dev-only fixture checks remain
separate. REF-14 and REF-20 are delivered at `afe4c60` and `612486f` with green exact-SHA CI. REF-22
remains a container proposal, REF-23 a decision, and REF-24 conditional cleanup. REF-19 already
provides public behavior coverage, so REF-24 is not a feature prerequisite. CLIP-11's core is on
main, as are segment hiding, shape stabilization, rotation, and speed styles. Full CLIP-11 remains
partial as described above. CLIP-38 is also partial: REF-12 supplies only its unsaved-close warning,
not recent projects or Save-as.

REF-26's three-line sticky-footer fix passes 129 units and all 39 browser checks in
`verification/all-2DvU6O`. Unchanged main and the fixed build each passed ten isolated performance
checks, including five cursor-follow repetitions, with the strict below-100-ms gate unchanged. The
earlier single p95 failure at exactly 100 ms remains unexplained; these controlled runs show no
reproduced regression, not a claimed performance fix. Default, error, narrow and scrolled states
were inspected, including real-pointer access to the bottom track controls. Exact-SHA
[CI 43796470502](https://github.com/mite404/clipper/actions/runs/43796470502) passed for
[`4535665`](https://github.com/mite404/clipper/commit/45356659c892b3607230778270c5d4eb16786c3c).

### Informational recommendation coverage

Dispositions use commit diffs and existing receipts, not a fresh mutation or browser audit. "Open"
means the exact recommended edge case is not established by those receipts. Related work does not
imply the entire recommendation is done. The full source wording stays in the historical
[Coverage](refactor/refactor01.md#coverage) and
[Agent-Native Gaps](refactor/refactor01.md#agent-native-gaps) sections.

| Ticket mapping                                          | Source | Recommendation                                       | Disposition and delta evidence                                                            |
| ------------------------------------------------------- | ------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [CLIP-8](#clip-8), [REF-37](#ref-37)                    | R1     | Indexed pointer lookup and large-fixture time budget | Binary lookup delivered in `1195cda`; explicit 200k-sample budget still open              |
| [REF-27](#ref-27)                                       | R2     | MP4 AVC and AAC qualification                        | Open; only WebM is proven                                                                 |
| [REF-25](#ref-25)                                       | R3     | Case-insensitive timeline filenames                  | Delivered `90cf4b4`; actual Mac rerun still unverified                                    |
| [REF-19](#ref-19), [REF-35](#ref-35), [REF-23](#ref-23) | R4     | Playhead and zoom bounds after shortening            | Explicit seek clamps delivered; edit-induced clamp and stranded zoom cases remain open    |
| [REF-28](#ref-28)                                       | R5     | Missing or early-ended decoded frames                | Open; exporter still omits missing samples                                                |
| [REF-29](#ref-29)                                       | R6     | Count-only Fallow baseline blind spots               | Deferred; REF-13 fixed comparison base, not score tracking                                |
| [REF-30](#ref-30)                                       | R7     | Import, Open and Save progress and cancel            | Open; REF-21 limits size but does not add cancellation                                    |
| [REF-31](#ref-31)                                       | R8     | Hidden-tab rewind and held Space                     | Delivered `9132ecf`; exact-main CI green                                                  |
| [REF-32](#ref-32)                                       | R9     | SourceMonitor play rejection and busy lifecycle      | Open; no corresponding repair in delta                                                    |
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
delivery. The five selected briefs cover CLIP-11, REF-14, REF-18, REF-20 and REF-26. Additional
Ready rows need their brief before assignment, not bulk template files for every historical ticket.

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

The owner explicitly requested this refresh independent of REF-31's transport dependency. Build on
delivered VERIFY-3 and REF-18 production support. Do not mark pending inspector/layout/zoom,
movement, still imports, export selection or the failed REF-20 candidate as verified delivery.
Skill/map Markdown is assigned; runnable helper edits require an exact scoped follow-up after audit.
No package, configuration, browser-spec or runtime-source edits are granted. The previous
verification-tools thread is archived, not an active writer. Review the exact transferred candidate
with GPT-6.1 Sol medium, fix findings and retain full strict gates and serialized exact-head CI.

Delivered VERIFY-4
[`6abc9df`](https://github.com/mite404/clipper/commit/6abc9df3099272385d265bc2a022190d804bb411)
changes ten skill/map Markdown files only on accepted `b9596c6`. The
[actual Sol medium reviewer](https://ampcode.com/threads/T-8d28222c-4b4e-4430-b695-72888a11014b)
approved its exact correction delta after three documentation findings. Doctor/full55/performance10
and helper7 receipts cover the unchanged code/specs. Fresh applicable strict gates and
[exact-SHA CI43816920677](https://github.com/mite404/clipper/actions/runs/43816920677) passed. The
push slot is released. UI-3 has started on this accepted successor.

REF-20's original `5c82e70` remains rejected. Corrected `bd222030` uses layout cleanup to flush the
held rewind frame before pause paints. Independent coordinator production acceptance passed all ten
checks across five held-frame and five export progress/cancel/retry repetitions. Its full58 and
performance15 receipts were inspected, but the subsequent pre-landing review reproduced two other
regressions on real production: the speed-dependent listener resubscription loses final forward
frame updates, and rewind ignores a shortened timeline's clamp after undo. Both frozen review heads,
`480bd875` and `1414179`, remain rejected. The existing reviewer returned LAND for correction
`0def2ba` with no P0 to P2 findings after independent production and mutation checks. The
coordinator integrated its runtime and performance test unchanged onto docs-only main. Permitted
tests/docs-only follow-up adds per-animation-frame timecode assertions after undo and removes a
diagnostic log; the immediate-readout mutation failed all three local repetitions at frame 709
against maximum 359. Negative-elapsed mutation coverage remains nondeterministic. A possible
duration/end-pause race is unreproduced, not an established bug or covered behavior. Coordinator
static/shrink-only gates, 135 units and seven helper tests pass. The isolated full run passed 60/61
but hit the eight-ending test's aggregate 120-second budget during its final iteration. Seven
endings completed. The completed read-only diagnosis confirms aggregate-budget exhaustion and
supports capture-related buffering overhead in controlled runs, without proving that cause for the
original trace. All 104 diagnostic endings settled at frame 359. On delivered VERIFY-5 tooling, five
interleaved runs per recording mode confirmed capture overhead with all 80 endings correct. The
unchanged ending test now has its own file, retaining DOM/action/network traces and screenshots but
disabling continuous screencast frames and video. The editor CLI includes it. Restoring the old
listener fails all three production repetitions under that recording policy; the reviewed listener
passes all three. The fresh combined full gate passes 61/61 without retries, skips or flakes.
Reviewed runtime and performance-test bytes remain unchanged. The standalone gate passed 19/20 but
failed its frame-time check on this orb; an interleaved comparison also failed on published main. A
fresh orb then passed unchanged published-main 10/10 and the exact transferred candidate 20/20 on
their first invocations. Receipt hashes and runtime/test identity were checked. This supports host
sensitivity, not a proven cause or universal performance guarantee. Failed receipts remain
preserved. The existing reviewer returned LAND for the exact recording-policy/selector delta;
coordinator comparison confirms its bytes match. Runtime review is unchanged and performance was
qualified separately. Delivered at
[`612486f`](https://github.com/mite404/clipper/commit/612486fd83428d6a9fd4d5e2ee93f01f056a821d),
with green [exact-main CI 43850098949](https://github.com/mite404/clipper/actions/runs/43850098949).
The rewind reservation is released. Inspector integration resumes on that successor; UI-2 follows
the accepted inspector. No timeout or workload changed.

### VERIFY-5: requested Oxc typecheck and formatter tooling

| Ticket ID                                  | Scope                                                                            | Owner                                                                            | State                                                                                                                                                                                         |
| ------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="verify-5"></a>[VERIFY-5](#verify-5) | Use requested oxlint-tsgolint checking and install oxfmt without weakening gates | [Sol medium](https://ampcode.com/threads/T-fb8879aa-fa27-4044-89bf-518b53b04498) | Delivered at [7cddaea](https://github.com/mite404/clipper/commit/7cddaea18c8669c40a610e723a58144b437982c0); [green exact-SHA CI](https://github.com/mite404/clipper/actions/runs/43838721676) |

Mite explicitly requests using oxlint-tsgolint for the typecheck script instead of tsc and
installing oxfmt. Inspect the installed tool's CLI and current upstream documentation before
changing scripts. Compiler diagnostics and type-aware lint are different contracts: do not silently
remove compiler checking or label lint as equivalent. Report the supported solution and any genuine
unresolved product choice. Preserve production-build validation and existing strict workloads.

The owner also requests CI modernization through create-ts-ci; the available matching workflow is
setup-ts-ci. Extend the existing pipeline rather than replacing repo-specific gates with a generic
template. The supported candidate uses `oxlint --type-aware --type-check` for typecheck and retains
`tsc --noEmit` as a separate compiler-safety CI step while the new path is experimental. Preserve
main-push/manual triggers, comparison against the pre-push commit, all browser/performance projects
and no cancellation that skips unchecked commits. Pin oxfmt and provide a usable format command;
Mite's newer direct request removes Prettier. Replace format:check with Oxfmt on the same explicit
prior scope, remove Prettier dependency/config and the redundant extra formatter CI step. Preserve
style options and disable default package sorting. Prove actual Markdown rejection under the
verification skill, not only file discovery counts. Update that one live formatter-name reference;
do not rewrite historical records or mass-format unrelated files.

Reserve package.json, package-lock.json, .oxlintrc.json, formatter configuration and only necessary
CI/hook/README command changes, including .github/workflows/ci.yml and lefthook.yml. No
feature-source edits, broad formatting migration, baseline growth, threshold/retry changes or
unrelated dependency upgrades. Existing REF-20, inspector, UI-2 and UI-3 candidate gates stay on
their frozen toolchains; this work cannot retroactively qualify or invalidate a different candidate.
Coordinate a latest-main successor before integration.

Acceptance includes actual clean-project execution and intentional compiler-error/type-aware-lint
probes proving what the new commands reject, formatter installation/version execution, reproducible
lockfile install, applicable strict/build/unit/browser/performance gates without changed workloads,
and an inspected diff proving no mass reformat. Existing Fable reviews the exact tested tooling
candidate before landing, one ticket at a time. The coordinator retains the only main push slot;
fetch/rebase, rerun affected gates, push once and wait for exact-SHA CI before release.

Superseded frozen tooling candidate
[`1c99a72`](https://github.com/mite404/clipper/commit/1c99a72d07d7812635a99527417702567587ac91) is
on review-only branch `wip/verify5-review-1c99a72`, based on accepted `af649b8`. Five paths differ:
package/lock, Oxfmt config, README commands and two additive CI gates. Transferred worker receipts
show clean locked install, 135 units, builds, 55 browser cases and ten separate performance cases.
Compiler-negative and formatter probes are included. Existing Fable has the exact-diff review; this
is not main delivery or exact-head CI qualification. The newer Prettier-removal request requires a
new verified candidate and reviewed delta; do not land this old head as the completed request. No
source/test workload or hook changed in the frozen head.

Reviewed `bb8488a` resolved the skipped shrink guard and conflicting formatters, but explicit
formatter operands could silently omit missing paths and root glob shadowing could skip JSONC.
Pre-cleared successor `3e4ca75` uses bare `oxfmt --check` followed by the unchanged read-only Node
lock comparison, with only the reviewer's specified README/skill wording corrections. The
coordinator verified the transferred bundle hashes and exact three-file delta; no lock, config, CI,
hook, source or test differs from `bb8488a`. The identity receipt went to the existing reviewer. No
additional review is required for that exact correction. Integration onto green main `3b90f11`
preserves all seven approved paths byte-for-byte. Coordinator formatting, lint, both compiler gates,
strict shrink-only Fallow, 135 unit tests, seven helper tests, isolated full 55/55 and standalone
five-repeat performance 10/10 pass. Replayed formatter negatives reject all categories, eight
missing-path variants and the old root-JSONC shadow false green. Source, browser tests and baseline
are unchanged. Exact-main CI passed at `7cddaea`; its standalone TypeScript and shrink-only health
steps both ran successfully. The new `!cancelled()` guard is present in that delivered workflow.

Bare discovery retains Fallow's original 32 entries without recursive formatter operands. Oxfmt
always skips lock files, and its stdin formatter changes npm's array layout. The read-only Node
comparison preserves npm-generated lock layout without rewriting the lock or adding a dependency.
Build and hook retain reviewed Oxc behavior; CI additionally runs standalone `typecheck:tsc`.

The worker reports fourteen comparative category negatives plus docs rejection, rejection of
malformed formatting in all 76 prior-scope files, and clean generated-lock acceptance. Whitespace,
collapsed arrays, malformed JSON and empty or missing lock input fail. Actual Fallow-generated
baseline bytes remain unchanged through checks and bare formatting. These are worker receipts, not
coordinator acceptance. Transfer the exact final candidate and rerun required integration gates.
Earlier file discovery counts do not prove coverage parity.

The frozen-head review also found that formatter failure can skip the pre-push shrink guard. Exclude
generated `.fallow-health-baseline.json` from Oxfmt and run the growth step with
`if: ${{ !cancelled() }}` so earlier failures cannot skip it. `.fallowrc.jsonc` is the literal
configuration-file alternative to the root `*.jsonc` glob, not the generated health baseline.
Prettier removal resolves the conflicting dual-formatter gates. Keep all other CI workloads.
Transfer the corrected candidate, exact base, delta against `1c99a72` and runnable receipts before
the existing reviewer's successor review. No baseline growth or health suppression is granted.

## Export selection and responsiveness ownership

The owner explicitly requests selectable real MP4 and MOV alongside WebM. REF-27 now includes that
selection and qualification, owned by
[Sol research](https://ampcode.com/threads/T-66b606e9-c0a0-44fd-82a8-189dd0f928ba). Inspect
installed Mediabunny muxers and actual encoder support before granting exporter/App/test edits.
Container, MIME and extension must agree; never rename WebM or silently substitute another selected
format. Unsupported selections need a visible failure before expensive work. Preserve local
processing, cancel/retry, progress, audio mute/gain, shared frame rendering and HD/4K behavior.
Qualification requires decoded real output, not only a capability query. REF-20 is delivered and its
progress reservation is released; preserve that accepted behavior.

Capability research reports genuine HD/4K MOV AVC/PCM-s16 and silent MP4 AVC output in Chromium, but
no AAC encoder in that browser. Grant only `src/export.ts` format/capability/container/codec
selection and `tests/export.spec.ts` now. MOV uses a declared AVC/PCM-s16 policy, with its larger
audio size made clear; MP4 AVC/AAC must fail early if an audible project cannot encode AAC. An
explicit format never silently substitutes a container or drops audio. App selection/filename
integration remains held; preserve existing automatic callers and CLIP-25 rendering seams.
Standalone probes are not composition/audio/cancel acceptance. No exporter push grant exists.

The exporter-only patch is transferred for acceptance, not applied. Source-fixture and composed
encode/decode/audio/mute/cancel evidence is recorded in the
[capability artifact](https://ampcode.com/artifacts/ref-27-export-capabilities-63637137-a02f-4e8b-a4c4-936c562c16fe).
Positive AVC/AAC output remains unqualified. Stable-portal measurements confirm HD/4K choices
produce actual 1920×1080/3840×2160 clipboard PNGs and VP9/WebM downloads while preview remains
1280×720 logical coordinates and the identical fitted box. These measurements document OLD behavior,
not the desired behavior after the latest explicit clarification.

The selected resolution must now dictate actual Player/composer render dimensions as well as
copy/export. A fitted CSS display may remain constant, but CSS-only enlargement or a fixed actual
1280×720 render root does not satisfy the request. Scope the true Player/composition dimensions and
consistent geometry, crop, radius, cursor, zoom and marking transforms across preview/frame-copy/
export. Internal logical coordinates may be retained only as a math detail with actual selected-size
rendering and verified parity. Keep one selector beside Export video and delete duplicate readout.

REF-27 owner is tracing proposed App/Composition/shared-stage/test hunks read-only. Preserve the
already verified two-file exporter candidate. Final release must use the exact delivered
inspector/UI-2 and header successors; serialize this resolution/geometry integration before full
CLIP-9b ramp/PiP and still/dynamic-track renderer changes. Acceptance must inspect actual HD/4K
render-root dimensions, decoded/copy/export parity, corners/crops/cursor/zoom and interactive
marking, selection/playback during changes, legacy project behavior and fitted narrow/wide display.
PiP/UI-2 owners are notified; no silent fixed-stage exception or premature shared-source grant.

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
owner reports `/revision.json` serves the full accepted `b9596c6` SHA, isolated production build and
browser/media-range checks passed, and failed-candidate promotion retained the last good release.
This is an orb preview, not a production deployment or always-on hosting guarantee.

## Approved movement and timeline-media requests

The owner's live-preview feedback explicitly requests repositioning video and audio clips and
importing MOV, MP4, PNG and JPG media. These are scoped follow-ups, not retrospective delivery
claims for CLIP-2 or the background-image part of CLIP-20.

Use the owner's terms "media pool pane" or "source media panel" in future UI/docs/work descriptions.
The later completed drag-insertion requirement is CLIP-2c below; it is distinct from same-track
movement.

| Ticket ID                                  | Scope                                                                     | Owner                                                                                 | State and dependency                                                                    |
| ------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| <a id="clip-2b"></a>[CLIP-2b](#clip-2b)    | Reposition clips with associated-audio link toggle                        | [Sol medium](https://ampcode.com/threads/T-e625cc4d-8431-4df9-b146-0869cf28ac8b)      | Research/path-held; explicit association contract and CLIP-9b successor before grant    |
| <a id="clip-20b"></a>[CLIP-20b](#clip-20b) | Import still timeline media and qualify MOV/MP4 paths                     | [Sol medium](https://ampcode.com/threads/T-01a1e2f2-99be-775a-be34-43cbce070c38)      | Reproduce/scope only; coordinate model/parser/render paths after preceding shared work  |
| <a id="clip-2c"></a>[CLIP-2c](#clip-2c)    | Media-pool drag insertion and dynamic track creation                      | [Sol medium](https://ampcode.com/threads/T-7a47f0bf-09c2-4891-92ec-aaf7ec41bd52)      | Research only; model/render/persistence design after existing shared/media predecessors |
| <a id="clip-2e"></a>[CLIP-2e](#clip-2e)    | Selection/Razor tools, selected-target Split and unlocked-track shortcuts | [Opus 5.5 medium](https://ampcode.com/threads/T-b99a528d-0528-4004-be79-2b65721b96ca) | Saved-state/no-link contract scoped; source held after accepted timeline predecessors   |

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

CLIP-20b is still images as timeline media, not the separately scoped composition background. Use
explicit editable still duration, correct aspect and alpha handling, matching preview/export and
embedded save/reopen. Qualify MOV/MP4 using actual supported codec fixtures, not suffix-only claims.
Corrupt/unsupported input must show an error, preserve the prior edit and release failed resources.
Keep processing local; do not upload private capture material.

Neither owner has shared implementation or push permission yet. They may inspect and reproduce. The
audited delivery order above supersedes the earlier CLIP-2b-before-media order, putting media and
track foundations before their dependent association/insertion work. REF-31's reservation is
released. Model/parser/render/export grants wait for exact path needs and reproduction results.
Serialize REF-27 container selection before CLIP-20b image export changes on its delivered
successor. CLIP-20b's accepted still contract uses a five-second editable default, screen/camera
tracks only, and clip-owned duration, with legacy reopen and decoded alpha/aspect parity required.
Every unit retains strict, full browser and isolated performance gates plus exact-head CI.

CLIP-2c is explicitly authorized dynamic track creation, not a four-fixed-lane workaround. Drop from
the media pool onto a compatible track inserts at mouse-up timeline time. Audio belongs only on
audio tracks; video/stills belong on visual tracks. Dropping in the blank creation area creates a
compatible new track and inserts there. Define track identity, visual stacking/audio mixing,
legacy-project conversion, mute, source anchors and portable save/reopen before editing. Preserve
undo and clear nondestructive collision behavior; do not silently ripple or overwrite. Its Sol owner
inspects/reproduces only until exact model/parser/render and UI path grants follow the
CLIP-2b/CLIP-20b predecessors. No dynamic-track implementation or compatibility claim exists yet.

The owner's V1 requirement additionally authorizes a full-composite still/video underlay beneath
both screen/camera roles. This supersedes screen-mask-only creation for backgrounds, not ordinary
masked creation. Use an explicit Background role/label, centered cover across the whole stage,
without radius or screen zoom. Display V numbering independently from stable role IDs; preserve
top-row-frontmost order, undo, offsets/gaps/alpha, cursor occlusion, save/reopen and decoded output.
CLIP-2c's
[current contract](https://ampcode.com/artifacts/clip-2c-insertion-contract-6e8501c5-a3fb-40e0-b359-dfd8b483b92b)
coordinates still-media lifetime/schema with CLIP-20b and geometry with PiP. No source grant yet.

### CLIP-2e: Selection/Razor tools and distinct split targets

User story: As an editor, I want Selection and Razor tools for selecting or cutting clips, a Split
button for my selected clip/track targets, and a platform shortcut for every unlocked track at the
playhead, with saved locks and track selection restored when I reopen my project.

The coordinated no-link contract retains distinct scopes. The Split button cuts the union of the
selected clip and crossing clips on selected tracks, excluding locked tracks, without following the
movement-link toggle. Multiple tracks may be selected; selecting a clip does not clear those track
selections. Keep selection on the left fragment ID. No crossing clip means no history entry. Cmd+K
on Mac and Alt+K on Windows/Linux cut all unlocked crossing clips independently of selection. Match
physical KeyK with only the intended modifier, leave Ctrl+K native, ignore repeat, and retain
text/modal/busy guards. REF-5's unique IDs and REF-7's other modifier guards remain required;
CLIP-18's configurable command menu is not a dependency or duplicate scope.

The owner's direct answers `M-034yipk2DjRnY7tzikraGX` require locks and selected-track toggles to be
saved in the project and approve Linux Alt+K, superseding the unpublished session-only default.
Optional `locked` and `selectedTracks` arrays, validated like mute and defaulting to empty for old
projects, are the worker's schema proposal, not the owner's exact field/version choice. Qualify
legacy/default/round-trip/rejection behavior before retaining or changing the project version. Keep
persisted-toggle dirty/save state honest. Use separate labeled header controls keyed by stable track
IDs, not positions, insertion targets or eye/mute. Current fixed IDs may seed the contract before
CLIP-2c; its dynamic registry must preserve it. UI-9 owns atomic refusal naming an actually mutated
locked destination, including ripple/link effects, with no partial insert, fallback or auto-unlock.
Ignored audio targets on silent video/stills do not veto insertion.

The owner's `M-034yitFsNj94lMW2Ayk6S2` supersedes direct-C splitting: C selects Razor and V selects
Selection. Razor shows a blade cursor; clicking a clip cuts that clip at the clicked frame rather
than selecting it. Trim grips are inert; locked lanes show not-allowed and reject cuts. Boundary/gap
clicks do nothing. Chorded C/V remain native copy/paste. The Split button stays a direct
selected-target action without a shortcut, beside the tool toggles; remove the old S binding and
update hints/help. Keep keyboard access through the button. The owner's `M-034yiuZuJCSBrXlnIX9UvX`
confirms retaining that button and states toggles have no undo steps while value changes do. Tool,
lock and track-selection toggles stay outside history; cuts, trims, deletion, insertion and existing
value edits remain undoable.

The owner's subsequent answers approve Razor snapping and Escape doing nothing: Razor remains active
until V. The worker proposes an 8-screen-pixel threshold to the playhead or any track's clip edge;
that radius and target priority are implementation defaults to qualify, not owner-specified numbers.
Snapping exactly to the clicked clip's own edge remains a no-op. Do not add an unrequested snap
toggle or Shift-click split-all gesture. The owner's undo clarification concerns toggles only; his
final answer explicitly requires undoing a split whether tracks are locked or not. Undo ignores
locks and restores the previous edit without a refusal message; lock toggles themselves remain
outside history. Locks guard new split/Razor/delete/trim/insert mutations, not history replay.
Open/demo replaces the document and loads its own lock/selection state.

The owner approved this final contract in the split thread: "Looks right, build it when the grant
lands." That approval does not release overlapping paths before their predecessors are accepted.

The split owner reproduced missing shortcuts on accepted `0b5584e` runtime in Chromium at frame 45
with MacIntel/Win32 emulation: modifier chords leave counts unchanged and unprevented through
REF-7's guard. This is not native OS qualification. Current source lacks track edit selection and
locks. Do not call shortcut-only work the whole feature. CLIP-2e may land on no-link projects first;
CLIP-2b owns partial-cut membership qualification before linked movement. No link-present
integration or split-dissolves-pair policy is accepted. Cuts retain App.change/resolveZooms; do not
intentionally edit manual zooms or bypass anchored re-resolution to promise identical arrays.

Acceptance covers asymmetric selected/unselected and locked/unlocked tracks, button versus all-track
shortcut, pointer Razor cuts, C/V typing/chord guards, boundary/gap no-ops, unique IDs, source
offsets/lineage, one atomic multi-track undo even after locking a changed track, refusal of new
locked-track mutations and saved-toggle round trips without toggle undo steps. Inspect controls and
retain strict/full gates and exact-candidate review. Research base remains accepted
`0b5584ef9d5dd8a8005bbaeedf0bc91993524936`; no source or push slot is released. Planned paths are
timeline-model and its existing unit test, project.ts/ project.test.ts parsing, App
split/keydown/tool/lock/selection/save/open/history hunks, Timeline header/clip Razor controls,
snapping geometry, styles, Timeline stories and editor browser checks. Enumerate exact hunks on the
accepted timeline successor before release, not blanket file ownership.

### CLIP-22: PiP composition subset

The owner explicitly requests PiP alongside Side by side, four-corner placement in the 16:9
composition chooser, current outer padding and adjustable corner radius. The existing CLIP-22
camera-layout ticket owns this subset; other camera features remain separate backlog scope.
[Sol medium owner](https://ampcode.com/threads/T-8f2894da-53a9-41d3-9391-33b6477fff7d) traced shared
Layout/maskRect in stage.ts through preview, frame-copy and export. Keep chooser DOM outside
rendered Composition, preserve legacy side-by-side defaults and validate optional layout mode/corner
fields in parseProject. Keep screen as main and camera above it; CLIP-2c backgrounds remain below
both regardless of mode/corner. No background scaffolding or exporter rewrite.

Read-only scope remains held until full CLIP-9b after inspector/UI-2 release; then integrate PiP
before CLIP-2b/20b/2c shared-model work. Requested paths are App composition controls, stage
geometry, project layout parsing, scoped styles and matching unit/browser/persistence/decoded-output
tests. Composition changes require an evidenced need because shared maskRect may already suffice.
Inset defaults are coordinator choices: 16:9 at one-third usable width, initially bottom-right, with
10px outer padding; retain side-swap state but apply it only in Side by side. The user's required
flow is direct four-corner selection in the live composition preview using editor-only DOM overlays,
with pointer/keyboard access and no overlays in frame-copy/export. An Inspector alternative may
coexist but cannot replace this flow; the earlier Inspector-only coordinator default is superseded.
Inset dimensions remain reversible defaults, not user-specified values. UI-4 owns shared numeric
scrubbing; do not invent separate numeric gesture handling.

### CLIP-21b: functional output FPS selection

| Ticket ID                                  | Scope                                 | Owner                                                                              | State                                                                                      |
| ------------------------------------------ | ------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| <a id="clip-21b"></a>[CLIP-21b](#clip-21b) | Output FPS selector beside resolution | [Sol research](https://ampcode.com/threads/T-6d58e1c6-33c5-473e-9b9a-4ae908c3b309) | Timing research complete; actual-resolution/parser successors and exact source grants held |

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
exporter is implemented. Synthetic probes are not an integrated prototype. Release requires the
accepted REF-27 actual-resolution successor, designated layout/still rendering and parser/model
coordination, then exact timing/exporter/tests/App UI ownership grants from the queue. Auto and
endpoint semantics above are settled; this is not waiting on another owner preference decision.

### CLIP-19b: per-clip automatic fit and scale

| Ticket ID                                            | Scope                                                                       | Owner                                                                              | State                                                                            |
| ---------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| <a id="clip-19b"></a>[CLIP-19b](tickets/CLIP-19b.md) | Auto-fit inserted/dragged media and per-clip Inspector slider/numeric scale | [Sol research](https://ampcode.com/threads/T-45868c85-1af4-45b7-ac3a-2e317bb8f64d) | Research only; REF-27, PiP and still/parser successors before exact source grant |

Preserve aspect ratio, avoid implicit stretch/crop, and keep scale instance-local rather than
source-wide. Preview/copy/export, undo and save/reopen must agree at actual selected composer
dimensions. The [brief](tickets/CLIP-19b.md) records exact fit-target, legacy, insertion/split and
acceptance questions. REF-27 dimension/scaling, CLIP-22 role geometry and CLIP-20b image/parser
contracts precede implementation; coordinate with CLIP-2c registry/Background and UI-4 shared
numeric scrubbing. No model/stage/Composition/parser/App/control/style grant exists yet.

The research worker confirms no implementation candidate or product code on accepted main `57f5864`.
Existing cover-fit and zoom scale do not implement per-instance Fit/scale. New contain/1 and legacy
cover/1 defaults are settled. Release follows accepted REF-27, PiP and CLIP-20b successor SHAs plus
the queue's exact shared-path grant; CLIP-2c is later integration, not an extra prerequisite to
finish first. UI-4 still has no delivered scrub API. No priority or dependency bypass follows from
this status clarification.

## Recent owner-feedback coverage audit, 2026-11-16

This table indexes requirements, not a second operational queue. Status and execution order remain
in their linked master entries. Inline scopes are repo documentation; external research artifacts
support them but do not replace them. No GitHub or Linear issue creation is implied.

| Explicit request                                                                                                                          | Concrete ticket and repo scope                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Hide media pool, increase timeline room, scroll both axes, adaptive min/max scale and narrow ruler                                        | [UI-2](#ui-2)                                                                |
| Remove branding/title and move Save without changing save behavior                                                                        | [UI-3](#ui-3)                                                                |
| Horizontal label scrubbing across numeric properties, not booleans/enums                                                                  | [UI-4](#ui-4)                                                                |
| Resize side panes/timeline, hide/restore and default/custom height controls, visible ruler playhead and scrub affordance                  | [UI-5](#ui-5)                                                                |
| Media before Save, temporary left-edge media-pool peek and Space-only timeline control                                                    | [UI-7](#ui-7)                                                                |
| Cursor metadata import from source panel or targeted composition/timeline sidecar drop                                                    | [CLIP-11b](tickets/CLIP-11b.md)                                              |
| Remove ORIGINAL, obsolete above-timeline cursor panel, L/R meter, Paused and selected slogans/tags                                        | [UI-6](#ui-6), with cursor access preserved by [CLIP-11](tickets/CLIP-11.md) |
| One resolution selector, true selected-size composer plus copy/export, real MP4/MOV/WebM                                                  | [REF-27](#ref-27)                                                            |
| Zoom creation at playhead for four seconds, B shortcut, old batch removal, editable ramps and referenced Bklit/D3/Motion curve technology | [CLIP-9b](#clip-9b)                                                          |
| PiP beside Side by side, direct live-preview four-corner placement, padding/radius                                                        | [CLIP-22 PiP subset](#clip-22-pip-composition-subset)                        |
| Full-composite still/video V1 underlay below both roles; dynamic compatible visual/audio tracks                                           | [CLIP-2c](#clip-2c)                                                          |
| Move video/audio clips with an associated-audio link toggle; drag media-pool inserts into compatible/new tracks                           | [CLIP-2b](#clip-2b), [CLIP-2c](#clip-2c)                                     |
| V Selection/C Razor, selected-target Split button, Cmd+K Mac or Alt+K Windows/Linux all-unlocked cuts and saved locks/track selection     | [CLIP-2e](#clip-2e)                                                          |
| MOV/MP4 import qualification and PNG/JPG timeline still imports                                                                           | [CLIP-20b](#clip-20b)                                                        |
| Functional 24/29.97/60/100/120/Auto FPS beside resolution, no fake 30 label                                                               | [CLIP-21b](#clip-21b)                                                        |
| Auto-fit new visual media to selected composition and per-clip scale slider/numeric input                                                 | [CLIP-19b](tickets/CLIP-19b.md)                                              |
| FCP7 XMEML choice, source-path mapping and real Premiere/relink qualification                                                             | [CLIP-31a](#clip-31a), [CLIP-31b](#clip-31b), [CLIP-31c](#clip-31c)          |
| Requested oxlint-tsgolint typecheck script and oxfmt installation without lost compiler checks                                            | [VERIFY-5](#verify-5)                                                        |
| Continuous bounded tickets with required exact-diff review and serialized exact-SHA CI                                                    | [Repository workflow skill](../.agents/skills/managing-tickets/SKILL.md)     |

The audit compared fetched `origin/main` at `6abc9df` with the coordinator's working docs. That
baseline contains older REF-27, CLIP-9b and framing/background backlog rows, but not these expanded
requirements or UI-2 through UI-6, CLIP-2b/2c, CLIP-20b/21b/19b operational entries. This is the
pre-publication baseline, not a claim that the newly written docs were already remote. Publication
must name the actual pushed commit and its CI separately from product implementation delivery.

## Feature backlog after CLIP-11

Rows are proposals unless explicitly approved below. They come from the reference backlog, which
holds the source links, unless a subsection below names another source. Use the audited dependency
order above, skipping gated rows. CLIP-25 is delivered with exact-main green CI. CLIP-38 has a
delivered warning subpart only. Existing subparts must not be counted twice.

| Ticket ID                                         | Title                                                                                                                          | Gate                                                                                                                                                                                |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="clip-12"></a>[CLIP-12](#clip-12)           | Click sounds with volume                                                                                                       | CLIP-7; needs a licensed or original sound                                                                                                                                          |
| <a id="clip-13"></a>[CLIP-13](#clip-13)           | Motion blur for cursor, zoom and pan                                                                                           | CLIP-10                                                                                                                                                                             |
| <a id="clip-14"></a>[CLIP-14](#clip-14)           | Keystroke overlays                                                                                                             | No key-event source: OpenScreen sidecars carry pointer data only                                                                                                                    |
| <a id="clip-15"></a>[CLIP-15](#clip-15)           | Audio scrub and reference hotkey parity                                                                                        | none                                                                                                                                                                                |
| <a id="clip-16"></a>[CLIP-16](#clip-16)           | Clip retiming and typing-segment speed-up                                                                                      | typing suggestions need key events                                                                                                                                                  |
| <a id="clip-17"></a>[CLIP-17](#clip-17)           | Per-clip and whole-recording gain                                                                                              | REF-14                                                                                                                                                                              |
| <a id="clip-18"></a>[CLIP-18](#clip-18)           | Command menu and custom shortcuts                                                                                              | REF-7                                                                                                                                                                               |
| <a id="clip-19"></a>[CLIP-19](#clip-19)           | Padding, proportions and arbitrary crop bounds                                                                                 | REF-1                                                                                                                                                                               |
| <a id="clip-20"></a>[CLIP-20](#clip-20)           | Background wallpaper, gradient, color, image, inset, shadow; the image part is scoped [below](#clip-20-still-image-background) | REF-1                                                                                                                                                                               |
| <a id="clip-21"></a>[CLIP-21](#clip-21)           | Output aspect ratios and responsive composition                                                                                | REF-1                                                                                                                                                                               |
| <a id="clip-22"></a>[CLIP-22](#clip-22)           | Camera hide, position, mirror, size, roundness                                                                                 | REF-1                                                                                                                                                                               |
| <a id="clip-23"></a>[CLIP-23](#clip-23)           | Timed camera layouts                                                                                                           | CLIP-22                                                                                                                                                                             |
| <a id="clip-24"></a>[CLIP-24](#clip-24)           | Blur and redaction masks, highlights                                                                                           | REF-1                                                                                                                                                                               |
| <a id="clip-25"></a>[CLIP-25](tickets/CLIP-25.md) | Copy the current frame as a PNG image                                                                                          | Delivered at [6fa99af](https://github.com/mite404/clipper/commit/6fa99afb10c8df35427a0ce0120d82b370a0b1e0); [green CI](https://github.com/mite404/clipper/actions/runs/43807235930) |
| <a id="clip-26"></a>[CLIP-26](#clip-26)           | Multicam angles and per-speaker mixes                                                                                          | none                                                                                                                                                                                |
| <a id="clip-27"></a>[CLIP-27](#clip-27)           | Derived social clips from a timeline range                                                                                     | none                                                                                                                                                                                |
| <a id="clip-28"></a>[CLIP-28](#clip-28)           | Teaser, title sequence and program assembly                                                                                    | CLIP-27                                                                                                                                                                             |
| <a id="clip-29"></a>[CLIP-29](#clip-29)           | Chapter markers                                                                                                                | none                                                                                                                                                                                |
| <a id="clip-30"></a>[CLIP-30](#clip-30)           | Interactive player bundle with separate synchronized outputs                                                                   | none                                                                                                                                                                                |
| <a id="clip-31"></a>[CLIP-31](#clip-31)           | Final Cut and After Effects interchange                                                                                        | none                                                                                                                                                                                |
| <a id="clip-31a"></a>[CLIP-31a](#clip-31a)        | Premiere: prove a synthetic FCP7 XML import contract in a real Premiere                                                        | a real Premiere installation (D-9)                                                                                                                                                  |
| <a id="clip-31b"></a>[CLIP-31b](#clip-31b)        | Premiere: export an editable XML sequence with reviewed source paths                                                           | CLIP-31a; a push slot for its `App.tsx` change                                                                                                                                      |
| <a id="clip-31c"></a>[CLIP-31c](#clip-31c)        | Premiere: qualify the file Clipper downloads in a named Premiere build                                                         | CLIP-31b; a real Premiere installation (D-9)                                                                                                                                        |
| <a id="clip-32"></a>[CLIP-32](#clip-32)           | Local transcription                                                                                                            | new dependency and model download need approval                                                                                                                                     |
| <a id="clip-33"></a>[CLIP-33](#clip-33)           | Clip-linked burned-in subtitles, basic text/speaker editing, styling and SRT/VTT export                                        | CLIP-32; scoped story below, not a new ticket                                                                                                                                       |
| <a id="clip-34"></a>[CLIP-34](#clip-34)           | Transcript-suggested edits                                                                                                     | CLIP-32                                                                                                                                                                             |
| <a id="clip-35"></a>[CLIP-35](#clip-35)           | Editable Remotion graphics sequences                                                                                           | Remotion license check (D-5)                                                                                                                                                        |
| <a id="clip-36"></a>[CLIP-36](#clip-36)           | Caption reconstruction from a flat video pair                                                                                  | CLIP-33                                                                                                                                                                             |
| <a id="clip-37"></a>[CLIP-37](#clip-37)           | Batch rendering and reusable graphics library                                                                                  | CLIP-35                                                                                                                                                                             |
| <a id="clip-38"></a>[CLIP-38](#clip-38)           | Save-as and recent projects; unsaved-close warning already delivered by REF-12                                                 | REF-22; remaining scope is a proposal                                                                                                                                               |
| <a id="clip-39"></a>[CLIP-39](#clip-39)           | Styling presets                                                                                                                | CLIP-19, CLIP-20                                                                                                                                                                    |
| <a id="clip-40"></a>[CLIP-40](#clip-40)           | GIF, quality and frame-rate options, clipboard export                                                                          | REF-3                                                                                                                                                                               |
| <a id="clip-41"></a>[CLIP-41](#clip-41)           | Preview quality and power-saving modes                                                                                         | none                                                                                                                                                                                |
| <a id="clip-42"></a>[CLIP-42](#clip-42)           | Extract original screen, camera and audio tracks                                                                               | none                                                                                                                                                                                |
| <a id="clip-43"></a>[CLIP-43](#clip-43)           | Native Screen Studio package ingestion                                                                                         | needs a real package fixture (D-4)                                                                                                                                                  |
| <a id="clip-44"></a>[CLIP-44](#clip-44)           | Hosted sharing links and timestamped comments                                                                                  | needs hosting and a product decision; conflicts with local-only today                                                                                                               |
| <a id="clip-45"></a>[CLIP-45](#clip-45)           | Quick share, save and copy actions                                                                                             | CLIP-40                                                                                                                                                                             |
| <a id="clip-46"></a>[CLIP-46](#clip-46)           | Browser recording of display, window, camera and audio                                                                         | product decision: OpenScreen covers recording today                                                                                                                                 |
| <a id="clip-47"></a>[CLIP-47](#clip-47)           | Speaker-note teleprompter                                                                                                      | CLIP-46                                                                                                                                                                             |
| <a id="clip-48"></a>[CLIP-48](#clip-48)           | iPhone and iPad capture, device frames                                                                                         | native capture; not possible in a browser orb                                                                                                                                       |

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
color, inset, shadow). Not started.

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

Work continues on the stated default until the owner says otherwise.

| Ticket ID                   | Title                          | Outcome                                                         |
| --------------------------- | ------------------------------ | --------------------------------------------------------------- |
| <a id="d-3"></a>[D-3](#d-3) | First capture route            | OpenScreen first; settled 2026-11-15                            |
| <a id="d-6"></a>[D-6](#d-6) | Hosted capture image retention | Thread deleted; hosted-file deletion not independently verified |

| Ticket ID                   | Title                                                                                                                                                                                                                                  | Default in force                                                                                                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="d-1"></a>[D-1](#d-1) | Should zooms follow their footage (source time, source coordinates) instead of fixed timeline frames and mask percent? (#14, #24)                                                                                                      | CLIP-9 stores generated zooms with a source anchor; manual version-2 zooms keep today's behavior until REF-23 is approved                                                                                             |
| <a id="d-2"></a>[D-2](#d-2) | Should CI also run on pull requests, and unit tests in the pre-commit hook? (#35)                                                                                                                                                      | No change: direct pushes to `main` with post-push CI                                                                                                                                                                  |
| <a id="d-4"></a>[D-4](#d-4) | Provide a real Screen Studio project to build CLIP-7b and CLIP-43 against                                                                                                                                                              | Both stay parked; nothing is inferred from screenshots of file names                                                                                                                                                  |
| <a id="d-5"></a>[D-5](#d-5) | Check the Remotion license before commercial or team use                                                                                                                                                                               | Not checked                                                                                                                                                                                                           |
| <a id="d-7"></a>[D-7](#d-7) | CLIP-7 to CLIP-10 are on `main`: import a real OpenScreen recording into Clipper on the Mac, generate zooms, and check that the cursor, the zooms and the follow framing line up with the video                                        | Compatibility with real recordings stays unclaimed; work continues on synthetic fixtures                                                                                                                              |
| <a id="d-8"></a>[D-8](#d-8) | Three commits on public `main` carry a personal email address instead of the noreply address: `2bb8263` and `de27f06` (author and committer) and `e9f99fc` (committer). Rewrite `main` from `2bb8263` with a force-push to replace it? | Not rewritten: a force-push changes every later commit ID and needs the owner's approval. The old commits would stay fetchable on GitHub by ID until GitHub Support purges them. Both workers have fixed their config |
| <a id="d-9"></a>[D-9](#d-9) | CLIP-31a and CLIP-31c need someone to import files into a real Premiere Pro and report what it shows. Is Premiere installed on the Mac, and which version?                                                                             | CLIP-31a to CLIP-31c stay proposals; no Premiere compatibility is claimed                                                                                                                                             |

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
- Export is exercised as WebM VP9/Opus only. The MP4 AVC/AAC branch has never run in CI or locally.
  REF-27 needs an encoding-capable browser or runner; macOS AAC remains unqualified.
- Reverse shuttle is silent. Filmstrips repeat the first thumbnail. Edge handles only shorten.
- Unsaved edits vanish on reload. The browser asks first (REF-12); CLIP-38 adds persistence. Mute
  changes and imported media do not count as unsaved, and after more than 50 edits, undoing all 50
  kept steps reads as saved.
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
  "nothing was uploaded" statements. The owner has since deleted that thread (D-6, settled below),
  so its transcript is gone; this file and `tests/openscreen/README.md` keep the findings.
