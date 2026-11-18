# Clipper ticket history

This is a non-operational record of delivered-ticket history moved out of the master;
[master-tickets.md](master-tickets.md) is authoritative for state, scope and ownership.

## Delivery receipts, 2026-11-17 to 2026-11-18

CLIP-20b is delivered at `6156fb4`, a cherry-pick of the reviewed tree onto `f6b77aa` with all
eleven source blobs unchanged. Coordinator gates on that exact tree passed 136 units, strict
shrink-only Fallow, `all` 126/126 and isolated `performance` 20/20, then exact-SHA
[CI44022990182](https://github.com/mite404/clipper/actions/runs/44022990182) passed. Its paths are
released. Its historical grant was limited to `src/media.ts`, `src/components.tsx`,
still-source/insertion/duration hunks in `src/App.tsx`, still rules in `src/styles.css`, image
handling in `src/Composition.tsx` and `src/export.ts`, image envelopes in `src/project.ts`,
`src/project.test.ts`, `tests/editor.spec.ts`, `tests/frame-image.spec.ts` and
`tests/export.spec.ts`. It cannot alter the filename modal, `tests/refinements.spec.ts`, transport,
cursor or dynamic-track behavior.

Sonnet's completed grant covered `.agents/skills/verify-clipper/scripts/verify.mjs`, the adjacent
`verify.test.mjs`, `.agents/skills/verify-clipper/SKILL.md`, its `features/README.md` and
`features/timeline-transport.md`, `tests/transport-lifecycle.spec.ts` and an optional
`docs/tickets/VERIFY-6.md` evidence brief. No product source, performance workload, package/config,
baseline, master or managing-tickets edits are granted. Its proofs must exercise the actual CLI's
journey selection and native executable override, preserving REF-31's product assertions/timeouts.
REF-38 is delivered at `02010f6`. Its first commit is reviewed `ff9832f` rebased onto `0d81c22` with
identical blobs; the second applies Fable's P2: checkbox Enter acts once per press and ignores
Meta/Ctrl/Alt chords. Independent and Fable reviews returned LAND on final tree `c3d0501`.
Coordinator gates on that tree passed 136 units, strict shrink-only Fallow, `all` 128/128 and
isolated `performance` 20/20, then
[CI44035760045](https://github.com/mite404/clipper/actions/runs/44035760045) passed. Focused file
inputs still open the native chooser on Space; whether Space should play there is an open owner
question, not a defect.

VERIFY-7 is delivered at `0d81c22` with
[CI44032486736](https://github.com/mite404/clipper/actions/runs/44032486736). Beyond the
verify-clipper and README refresh it changed one `package.json` line at the owner's request: the
`dev` script now passes `--strictPort`, so an occupied 5173 fails loudly. Both reviews returned LAND
on tree `6921486c` after a docs-only correction; `media` 4/4 and `editor` 43/43 passed on that tree.
The canonical editor was promoted to CLIP-20b at `6156fb4` with an inspected synthetic-still
receipt.

Opus held CLIP-2e, transferred from its contract owner
[T-b99a528d](https://ampcode.com/threads/T-b99a528d-0528-4004-be79-2b65721b96ca), which retains
research and the approved contract but no source or concurrent grant. Its granted paths were
`src/timeline-model.ts` and its tests, `src/project.ts` and `src/project.test.ts` for saved
locks/track selection, `src/Timeline.tsx`, the keydown, change/split, Split-button and track-header
hunks of `src/App.tsx`, split/lock/Razor rules in `src/styles.css`, new split-tool specs under
`tests/` and help/shortcut expectations those changes break. Any other path needs a further
exact-path grant.

UI-6 is delivered at `f164235` with exact-SHA
[CI44041254397](https://github.com/mite404/clipper/actions/runs/44041254397). It removes the
ORIGINAL source tag (the AUDIO cue stays), the L/R meter and its calculation, EDIT WORKSPACE and the
On your device tag. The coordinator kept the transport-state text accessible and clipped it while
paused instead of rewriting Paused assertions; a desktop grid rule keeps the controls centered.
Independent and Fable reviews returned LAND on tree `b606333f`; `all` 135/135, isolated
`performance` 20/20, build and Storybook build passed. The other remnants were already absent and
stay guarded by tests.

CLIP-2e's grant also covers the `saveProject`/`openProject` lock and selection hunks, `change()`
returning whether an edit applied so callers never report a refused edit as success, and the
`src/Timeline.stories.tsx`/`src/Editor.stories.tsx` prop migration.

Sonnet held UI-6b: the UI-6 review leftovers in `src/styles.css` workspace-bar rules and
`tests/workspace-layout.spec.ts`. The stale meter comment in `src/timeline-model.ts` belongs to
CLIP-2e's grant. Folding the remaining Shortcuts strip into the header is an owner choice, not
UI-6b.

UI-6b is delivered at
[3ec157c](https://github.com/mite404/clipper/commit/3ec157c31b75ef87ee577409bb1bbfb16a57018b) with
[CI44047934496](https://github.com/mite404/clipper/actions/runs/44047934496). CLIP-2e is delivered
at [a26c7e7](https://github.com/mite404/clipper/commit/a26c7e7139947049a2f592e62e8cecc119db2a88)
with [CI44050988058](https://github.com/mite404/clipper/actions/runs/44050988058) on attempt 2; both
reviews returned LAND on tree `005ad1ad` after one correction (state icons, null rejection,
Shift+C/V guards). On the cherry-picked delivery tree `all` passed 137/137 and isolated
`performance` 20/20. Attempt 1 failed once in `transport-end.spec.ts`: on the seventh of eight
fast-playback runs the playhead stayed at frame 200 for 30 seconds while the transport read Playing
at 4x. CLIP-2e does not touch the player or transport; ten repeats on the same tree passed locally.
The sighting is recorded under REF-37. VERIFY-8 is delivered at
[71e9c90](https://github.com/mite404/clipper/commit/71e9c90a6facf3da9a7bbc4b47f054221b761a35) with
[CI44055968763](https://github.com/mite404/clipper/actions/runs/44055968763).

Opus held CLIP-2c, transferred from its contract owner
[T-7a47f0bf](https://ampcode.com/threads/T-7a47f0bf-09c2-4891-92ec-aaf7ec41bd52), which keeps
[contract revision 10](https://ampcode.com/artifacts/clip-2c-insertion-contract-6e8501c5-a3fb-40e0-b359-dfd8b483b92b)
and research and confirms no untransferred source. Granted paths were `src/timeline-model.ts`,
`src/project.ts`, `src/history.ts`, `src/Timeline.tsx`, `src/components.tsx`, `src/App.tsx`,
`src/styles.css`, `src/Composition.tsx`, `src/export.ts`, cursor layering in `src/cursor-render.ts`,
a shared full-stage rectangle in `src/stage.ts`, their existing unit tests,
`src/Editor.stories.tsx`/`src/Timeline.stories.tsx` fixture shapes, new `tests/media-drop.spec.ts`,
`tests/export.spec.ts` and expectations those changes break. Accept only internal media-pool asset
drags; cursor-metadata routing stays CLIP-11b. The registry keeps `muted`, `locked` and
`selectedTracks` by stable ID and writes a version after 3. CLIP-2c may split into several reviewed
commits but delivers as one accepted unit. REF-39/40/41 App hunks are on main; rebase over them.

REF-39 is delivered at
[d423d7c](https://github.com/mite404/clipper/commit/d423d7cee013f31e05ed7d864ce06104ffbe674a) with
[CI44063138586](https://github.com/mite404/clipper/actions/runs/44063138586). REF-40 and REF-41 are
delivered together at
[46e9dc7](https://github.com/mite404/clipper/commit/46e9dc7d1affa2dfc7c722f67cbce9983ea9bfd8) with
[CI44102354477](https://github.com/mite404/clipper/actions/runs/44102354477). Both reviews returned
LAND on each; `all` 140/140 and isolated `performance` 20/20 passed on the exact head. On the
owner's answers, a focused range keeps only its movement keys, ignores Delete and Backspace, and
passes every other key to the editor; a focused file input gives Space to transport and keeps Enter
and click for its chooser. Whether Delete should also do nothing on a focused trim grip
(`role="slider"`) is an open owner question. Folding the Shortcuts strip into the header is deferred
by the owner.

REF-42 is delivered at
[6d4350d](https://github.com/mite404/clipper/commit/6d4350d81add221c831b428224c490e745cd3d3d) with
[CI44111981121](https://github.com/mite404/clipper/actions/runs/44111981121). Open project is
keyboard-reachable with a focus ring and is dimmed and inert while busy or exporting; help and
timeline-transport docs describe REF-40/41. Both reviews returned LAND after one delta that made the
ring assertion able to fail; `all` 142/142 passed on the exact head. Its hit area is still the label
text only, and Import and Open show the ring after a mouse click too; neither is a defect. REF-43 is
delivered at
[f8fa072](https://github.com/mite404/clipper/commit/f8fa072553b10ecb744de84665fc93de0689a7c5) with
[CI44124453125](https://github.com/mite404/clipper/actions/runs/44124453125). Open project is a
Save-style button directly right of Save, matching Save at rest, hover, press, keyboard focus and
disabled; REF-42's keyboard, Space, Enter, discard and disabled behavior stay. Both reviews returned
LAND after one delta that matched Open's press, focus-visible ring and disabled cursor to Save;
`all` passed on the exact head. A click within about 1.5 px of either button's right edge misses
because of the shared 0.97 press scale; every button behaves this way.

REF-44 is delivered at
[b9f4bc4](https://github.com/mite404/clipper/commit/b9f4bc4f94573a28c689f39212ff508b46598b9e) with
[CI44134842288](https://github.com/mite404/clipper/actions/runs/44134842288). Delete and Backspace
remove the selected clip or zoom only when the last panel the user pressed or focused is the Main
sequence panel (`#sequence-pane`), tracked by capture-phase window `pointerdown` and `focusin`.
Elsewhere the keys do nothing and are not claimed. It stays live after Undo or Ctrl+Z drops focus to
the body, after clicks on the panel title or timecode, and after a trim-grip drag; hiding the
timeline turns it off. Both reviews returned LAND after two deltas (Safari click focus, then panel
tracking replacing the `activeElement` guard). `all` passed 149/149 on the exact head; isolated
`performance` missed the cursor-follow `rafP95 < 100` bound once in five repeats, as unchanged
`f8fa072` did in the same orb, so it is recorded as orb noise. Known, accepted: Enter on Hide
timeline and Delete in the same frame can still delete; clicking the ruler leaves Delete inert
(REF-40 slider rule). REF-45 is delivered at
[5a34428](https://github.com/mite404/clipper/commit/5a3442841d08a143ccdf3575bcd49849f8b4692a) with
[CI44146318878](https://github.com/mite404/clipper/actions/runs/44146318878). An unchanged still
Duration blur or Enter (including equivalent values such as `5.0`) no longer commits or reports
"Still duration updated."; real changes and the invalid, locked and overlap errors behave as before,
in the inspector and the source monitor. The lingering "Mute Music" tooltip did not reproduce: a
tooltip stays only while the pointer rests on its trigger and closes within 200 ms after it leaves.
Both reviews returned LAND; `all` passed 150/150 on the exact head; isolated `performance` missed
the cursor-follow bound twice in five repeats, as unchanged `0ab5552` did in the same orb. Seen on
main, not scheduled: a sub-200 ms "Play source" tooltip during very fast Tabbing, and duration
changes within about a second undo as one step. The Sonnet lane then had no active grant.

REF-47 is delivered at
[aae6f84](https://github.com/mite404/clipper/commit/aae6f8443cc1810e40ab255428158f7bf9656d32) with
[CI44217820183](https://github.com/mite404/clipper/actions/runs/44217820183). At each frame the
covering clip on the frontmost painted screen-role track owns the cursor; only its sidecar draws,
inside that track's mask, and on overlap the front track wins with no fallback. Preview, Copy frame
and export take the owner from one `cursorFrame`, and framing follows each clip only over the frames
it owns. Zoom generation and the project parser accept a source anchor on any screen-role clip
through one `screenTracks` predicate and still reject camera anchors; shots keep their whole clip
range. Single-screen-track edits are unchanged. v1 (`ec05fe4`) was blocked by the independent review
because zoom generation trimmed source shots to owned frames and wrote the trim back, so covering or
reordering screen tracks destroyed them; v2 keeps shots clip-based, adds round-trip tests and drops
the `tracks` defaults. Both reviews returned LAND, including a UI journey through placement, Move,
Undo and save/reopen. Known ceiling: a transparent still or a failed export decode on a front screen
track still owns the frame. Opus then took REF-50 (delivered at `4bc0f24`).

## Owner recording items REF-49 and REF-50

- REF-49, delivered by Sonnet at `063bc31`: clips could be shortened but never extended. Root cause
  in code: `trimClip` clamps the removed frames to zero or more, so an outward drag or arrow does
  nothing, and a shortened clip cannot be restored. The recording shows an outward drag on the left
  edge of the second V1 clip at about 6.0 s that does not move. Reproduce end to end first, then let
  edges extend in both directions up to the source head and tail (stills unbounded), the
  neighbouring clip on the same lane, frame 0 and the 24-hour cap, with the drag preview showing the
  clamped result, one undo step per gesture and keyboard arrows both ways. Also report any shorten
  failure found. Granted paths: `trimClip` in `src/timeline-model.ts` and its test, the grip
  handlers and `commitTrim` in `src/Timeline.tsx`, the `onTrim` call site in `src/App.tsx` if limits
  need asset lengths or neighbours, and one focused spec.
- REF-50, delivered by Opus at `4bc0f24`: a zoom must magnify the target source inside its own mask,
  uniformly, never revealing empty mask. Root cause in code: `cameraTransform` in `src/stage.ts`
  does not clamp the translation, so 1.4x with focus 83%/87% leaves about 26% of the mask empty on
  the right and 32% at the bottom, as the recording shows. Clamp once where preview, Copy frame,
  export and the mouse-target mapping all route, including cursor-follow framing; keep X/Y scale
  linked.

## REF-49, REF-50, CLIP-2c and REF-46 delivery

REF-49 is delivered at
[`063bc31`](https://github.com/mite404/clipper/commit/063bc314860750472368cdc8246ab917839f15fe),
with green exact-SHA [CI44223873248](https://github.com/mite404/clipper/actions/runs/44223873248). A
first candidate was blocked because a still's left edge stayed pinned; v2 gives stills no source
head and keeps the offset at 0 or more. Both reviews returned LAND; `all` passed 172/172 and
isolated `performance` 20/20 on the exact head. Known existing behaviours, accepted and not in
scope: history merges changes made within 800 ms; on clips shorter than about 7 frames the left grip
is partly covered; a clip whose asset is missing has an unbounded right tail. REF-51 was then
granted to Sonnet on `src/Timeline.tsx`, `src/App.tsx` and `tests/split-tools.spec.ts`.

REF-50 is delivered at
[`4bc0f24`](https://github.com/mite404/clipper/commit/4bc0f24a5ec87059ad7b28f5dc34c0365678f05f),
with green exact-SHA [CI44229120203](https://github.com/mite404/clipper/actions/runs/44229120203).
`framingAt` clamps every zoom's pan to the owning clip's cover, or to the mask when no clip owns the
frame, so preview, Copy frame and export never show empty mask. A first candidate kept an old
`controls.spec` expectation that a 2x zoom at focus Y 80% centres; v2 expects the clamped 0.6. Both
reviews returned LAND on each version; `all` passed 173/173 and isolated `performance` 20/20 on the
exact head. By design, a zoom marked near an edge now stops at the source edge instead of centring.
REF-48 was then granted to Opus.

CLIP-2c is delivered at
[1de89b5](https://github.com/mite404/clipper/commit/1de89b5895d8fcdd530c13d91bc34a4fe71e7942) with
[CI44185392612](https://github.com/mite404/clipper/actions/runs/44185392612): thirteen reviewed
commits replayed on `0a3fd3d`. It adds the ordered track registry, Move up/down, Background and
extra audio tracks, pool drops onto lanes and creation rows, keyboard Place on timeline, and the
owner's shadow-free masks in preview, Copy frame and export. Review rounds added the 24-hour
placement cap, Delete after a drop (`drop` joins REF-44's panel tracking), live Place/Insert targets
after Undo, decimal seconds, a sticky drop hint, one-line creation labels, Move refocus without a
label selector and a "No video track" placeholder. A follow-playback regression from extra Tooltip
IconButtons was bisected to the placement commit and fixed by memoizing `TrackHeader`. Both reviews
returned LAND on the final delta (independent T-f987a229; source review moved from Fable T-2d1e888a
to T-9f34d223 during CLIP-2c). Coordinator acceptance on the exact head passed gates, `all` 164/164
and isolated `performance` 20/20 (follow p95 33-67 ms). A +72px default timeline height (`685854e`)
was dropped because it clipped the stage, source and pool and broke `editor.spec.ts:408`; it is
preserved as Opus local `clip2c-height72` for REF-46. Known and accepted: zoom applies to every
screen-role track while the cursor stays on `screen` (REF-47); a refused drop counts as a timeline
action for Delete; the "No video track" placeholder shows while audio tracks a video can go onto are
listed.

REF-46 is delivered at
[729b72d](https://github.com/mite404/clipper/commit/729b72d5854e13cfbf4d7af845de99f95beb579b) with
[CI44198295097](https://github.com/mite404/clipper/actions/runs/44198295097). Only timeline rows
changed: transport, toolbar, scale label, footer, creation rows, end note, ruler and track heights.
The top row and the default timeline height are untouched, so the stage, source Insert and pool
match base. Compact 46px tracks apply up to a 1069px tall window, because a 1080p screen's browser
viewport is about 950-990px; every lane and creation row fits from 900px tall up at 1440 and 1920
wide. 1280x800 improves (134 to 57px hidden). Waveforms scale with their clips. v1 was blocked by
the independent review for 951-1069px overflow and a waveform crossing clip titles; v2 fixed both.
Both reviews returned LAND. Coordinator acceptance on the exact head passed gates; `all` 168/169 and
isolated `performance` 19/20 each missed one rAF p95 sample, and a same-orb rerun's cursor-follow
p95 matched unchanged `2cc11bd`. Optional later: a 58px tier below 1650 wide at 991-1069 tall, where
1440x1000 now shows about 63px of spare space; the waveform title check has a 0.5px margin at 1650+
wide. The Sonnet lane then had no active grant.

CLIP-2c owner decision: "there shouldn't be a drop shadow." The preview's mask shadow
(`0 25px 65px #0005` in `src/Composition.tsx`) is removed, so preview, Copy frame and export are all
shadow-free and agree over a Background. This supersedes the unshipped coordinator choice to draw
the shadow in copy and export. It lands as its own reviewed CLIP-2c commit with a same-pixel
preview/copy/export comparison and isolated `performance`. CLIP-2c gates now include full `all`,
because fixture specs call the shared render functions directly.

The superseded UI-6 grant read: removal hunks for the named remnants in `src/App.tsx` and the
components and `src/styles.css` that render them, plus tests whose text-only assumptions those
removals break. Cursor/metadata access relocated to the inspector stays. UI-6 and CLIP-2e could
prepare in parallel on disjoint hunks; delivery was serialized and UI-6 landed first.

## All-new-Opus cutoff audit

The earlier all-new-Opus cutoff audit found six children of the former coordinator. Only the Opus
REF-27 reviewer was created after that standing rule; no new implementation worker on another model
was found. REF-27b and CLIP-20b reused existing Sol threads. The new Sonnet lane is the owner's
subsequent explicit exception, not a retroactive change to those threads' models.

## Model trials, UI-1 CI repair and REF-20

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

## REF-31 delivery

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

## UI-3 header cleanup

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
focused Media to play/pause the timeline without toggling the pool. Correct it in
[UI-7](master-tickets.md#ui-7), not a separate transport ticket. Existing input/select guards remain
unchanged.

## UI-5 resizable workspace panes

Accepted main is
[`601ba78`](https://github.com/mite404/clipper/commit/601ba7891571c436da6360ec1a981b6dd468c0f7),
with successful required
[CI43978647729](https://github.com/mite404/clipper/actions/runs/43978647729). The ruler correction
changes only test layout preconditions, retaining all seeking expectations. Local acceptance passed
132 unit tests, ten corrected ruler repetitions and the full 84-browser-test gate without retries or
skips. Both existing exact-delta reviewers returned LAND. The canonical preview owner returned
promotion receipts for editor and Storybook at `601ba78`, including authenticated public revision,
matching editor bundle hash, native-video readiness and exercised keyboard resize/hide/restore.
Coordinator inspected both public-preview captures. Existing media/inspector clipping is not
resolved by this promotion; no production deployment is claimed.

Use the requested Yaklabs implementation as the source reference, not a new splitter dependency.
Research located `apps/web/src/shell/sidebar-resize.tsx` and `sidebar-width.ts` in mite404/yaklabs:
captured-pointer movement writes a CSS width variable directly, then commits; keyboard arrows,
Shift, Home/End and double-click reset provide alternatives. No repository license was found. The
owner's explicit reuse request authorizes adapting owner-authored code, not inventing an open-source
license or copying third-party code without its terms. Confirm file provenance first. Coordinate
both pane bounds, narrow layouts, collapse/persistence policy and resize observer effects with
delivered UI-2. The implementation release below supersedes the research hold.

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

The research baseline `0b5584e` is historical. Implementation is released to the existing Sol owner
on accepted `b9c2e835e8e4f96f3d521b2e9f6d0fdd5c6f4acd`, including CLIP-9b and UI-7, with green
exact-main [CI43953490741](https://github.com/mite404/clipper/actions/runs/43953490741). Fetch that
successor before editing; preserve the older checkout and any local work.

The grant covers new `src/PanelResizeHandle.tsx` and its shared-component Storybook file; App
workspace/sequence layout state, dividers, timecode-adjacent buttons and `.app-footer` restore
hunks; scoped workspace column/row/handle/control CSS; `tests/workspace-layout.spec.ts`; and
`docs/tickets/UI-5.md` for acceptance evidence. Preserve UI-7's mounted drawer, peek and focus
behavior, including its responsive widths. Finalize the provisional joint bounds through rendered
extreme-width/height checks, not by silently reducing preview or track usability.

The separate ruler grant covers `src/Timeline.tsx` ruler input/marker presentation and local
geometry props only, corresponding CSS, `tests/controls.spec.ts` seeking/endpoints/keyboard cases,
and workspace alignment checks. Retain native ruler click/drag and keyboard seeking while making the
thumb/focus/pressed affordance visible and aligning marker endpoints. Reproduce the defect on the
accepted successor before correction. Do not change clip selection, move/trim handlers, scale hooks
or project/model data. No header, inspector-control, cursor, parser, exporter, baseline, tooling or
dependency edits are granted. This is one bounded UI-5 assignment, not a second worker. The
coordinator retains main delivery and reviews the frozen candidate before exact-main CI.

Acceptance covers all three combined extremes, short/tall and narrow windows, pointer release and
rollback, keyboard isolation, dynamic ARIA bounds, reset, playback continuity, scrollable tracks/
inspector and stable px/s/ruler geometry when width is unchanged. Inspect default, expanded,
reduced, hidden/restored and narrow states plus a real-pointer recording. Check custom-to-default-
to-custom and hide/restore after either mode, including viewport clamp/restore without losing the
custom height. Retain full strict gates and required exact-candidate review. The existing Timeline
ResizeObserver should need no forced scale update.

## UI-6 scope and CLIP-25 contract

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
that shared geometry work belonged to REF-27, not a label-only cleanup.

CLIP-25 copies the held composed output frame to the clipboard as PNG on explicit user action, using
shared render math and the existing output-resolution choice. No DOM screenshot or video-wide encode
is acceptable. Independent decoded-pixel checks cover source offsets, repeated cuts, seeks,
crop/swap/zoom/follow and cursor rotation. Denied/unsupported clipboard and unreadable media must
leave the edit intact, free resources and clear busy state with a useful visible error. Full strict
gates, inspected UI states/interaction and green exact-SHA CI remain delivery gates.

## UI-7 media header and peek

The owner requested moving Media into the header immediately left of Save project and temporarily
sliding the media pool in when hovering the left edge. Reuse the owner-authored Yaklabs pattern in
`apps/web/src/shell/sidebar-peek.tsx` at `1ccdae55a5f26e96c042a322f980db9e226b3c41`, not an
unrelated sidebar implementation. Space on focused Media must only play/pause the timeline, never
show or hide the pool. Click and Enter retain the persistent toggle. Hiding the pool preserves
selection and playback. Keep transient peek distinct from persistent open state and qualify focus,
pointer exit, narrow layouts, touch fallback and reduced-motion behavior.

Extend UI-2's delivered mounted accessible drawer at `ceb40bb`, already in accepted main; do not
build a second hide/show implementation. UI-7 completed reference research and reproduced the
focused-Media Space deviation in the production UI before its implementation release.

The existing [Sol medium worker](https://ampcode.com/threads/T-93cc1d51-b15d-443e-afc8-5267ef98ab33)
is released on accepted `acb62f748fa0a6625b93e2140b3d5fb0d2dbc3f6`, with green exact-main
CI43938067635. Its grant covers App media visibility/state, header toggle, workspace/drawer event
and accessibility hunks; scoped header/drawer/peek styles; workspace-layout and refinements tests;
and `docs/tickets/UI-7.md` for acceptance evidence. `src/useMediaDrawer.ts` is permitted only if it
owns the actual timer/listener state rather than forwarding callbacks. Exact test paths are
`tests/workspace-layout.spec.ts` and `tests/refinements.spec.ts`. In `tests/transport-end.spec.ts`,
`tests/transport-lifecycle.spec.ts` and `tests/performance.spec.ts`, focus-parking coordinates alone
may change if the peek zone demonstrably intersects them; workload, thresholds, repeats, sampling
and transport assertions stay unchanged. No Timeline/model/parser/renderer, insertion, source
monitor, zoom, export, baseline or verification-tool edits are released. No push grant is
transferred. Do not duplicate this worker or the ticket. Update UI-3's superseded
Save-within-20-pixels header assertion. Require real pointer/keyboard verification, inspected
public/synthetic captures, strict/full gates and exact-main green CI. Existing review gates and the
coordinator's exclusive push slot remain unchanged.

The coordinator reproduced the transferred candidate and applied one review correction: clicking a
media row no longer holds temporary peek open after pointer exit. Keyboard focus still holds it;
mouse-focused rows return focus to Media before closing. Both independent Sol and existing Fable
return LAND for corrected tree `e5119412a525e69cd99657bf670a0c99f1ff110a`. Fresh strict checks,
shrink-only Fallow against `9733390`, 132 units, seven helper tests, all 77 browser cases and the
isolated five-repeat performance gate (20 cases) pass. The click/leave regression failed before the
correction and passes afterward. Public demo captures and the corrected real-pointer recording were
inspected. No performance threshold, baseline or private-media processing changed. Delivery is
accepted at
[`b9c2e83`](https://github.com/mite404/clipper/commit/b9c2e835e8e4f96f3d521b2e9f6d0fdd5c6f4acd) with
green [exact-main CI43953490741](https://github.com/mite404/clipper/actions/runs/43953490741).
UI-7's reservation is released to UI-5. The coordinator retains the sole push slot. Canonical
preview promotion was requested directly; no updated-preview claim precedes its verification
receipt. Real-device, Firefox/Safari and private-recording qualification remain unclaimed.

## Former queue thread handoff

The former queue thread
[T-2d1e888a](https://ampcode.com/threads/T-2d1e888a-23ff-4bf4-b2d1-551553f2ef0a) has stopped
implementation and coordination. Its baseline review is complete and is not repeated. The successor
received the actual 13 CLIP-11 changed files, including `src/cursor-touch.png`, through
`download_thread_changes` before editing. Integration uses a three-way merge from `8095a273`, not an
overlay of stale files. Server-side usage confirms GPT-6.1 Sol routing for the successor, created
with medium effort. Implementation workers have disjoint paths and one main push-slot owner.

## Released path reservations

| Owner                        | Paths                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cursor implementation        | No active reservation after the speed-style delivery; further work requires a new scoped grant                                                          |
| Cursor inspector             | No active implementation reservation after green inspector delivery                                                                                     |
| Workspace layout             | UI-5 delivered at accepted 601ba78 with green exact-main CI; resize/layout/ruler reservation released                                                   |
| Source-preview lifecycle     | REF-32 delivered at 4b49623 with green exact-SHA CI; SourceMonitor/test reservation released; UI-8 remains research-only pending a new exact-path grant |
| Export integration           | REF-27 delivered at 27099dc with green exact-SHA CI44001648378; reservation released to bounded CLIP-20b image integration                              |
| Still timeline media         | CLIP-20b delivered at `6156fb4` with green exact-SHA CI44022990182; eleven-path reservation released                                                    |
| Focused-control Space        | REF-38 delivered at `02010f6` with green exact-SHA CI44035760045; reservation released                                                                  |
| Verification docs            | VERIFY-7 delivered at `0d81c22` with green exact-SHA CI44032486736; reservation released                                                                |
| Split tools and locks        | CLIP-2e delivered at `a26c7e7` with green exact-SHA CI44050988058; reservation released                                                                 |
| Track registry and drops     | CLIP-2c delivered at `1de89b5` with green exact-SHA CI44185392612; reservation released                                                                 |
| Default layout fit           | REF-46 delivered at `729b72d` with green exact-SHA CI44198295097; reservation released                                                                  |
| Second-screen cursor         | REF-47 delivered at `aae6f84` with green exact-SHA CI44217820183; reservation released                                                                  |
| Obsolete UI deletion         | UI-6 delivered at `f164235` with green exact-SHA CI44041254397; reservation released                                                                    |
| UI-6 leftovers               | UI-6b delivered at `3ec157c` with green exact-SHA CI44047934496; reservation released                                                                   |
| Unsaved and shortcut fixes   | REF-39/40/41 delivered at `46e9dc7` with green exact-SHA CI44102354477; reservation released                                                            |
| Open project keyboard access | REF-42 delivered at `6d4350d` with green exact-SHA CI44111981121; reservation released                                                                  |
| Open project placement       | REF-43 delivered at `f8fa072` with green exact-SHA CI44124453125; reservation released                                                                  |
| Timeline-scoped Delete       | REF-44 delivered at `b9f4bc4` with green exact-SHA CI44134842288; reservation released                                                                  |
| Still duration status        | REF-45 delivered at `5a34428` with green exact-SHA CI44146318878; reservation released                                                                  |
| Verification follow-up       | VERIFY-6 delivered at `3260b3b`, exact-SHA CI44018967483 green; seven-path reservation released; no active worker acceptance                            |
| Header cleanup               | No active implementation reservation after green UI-3 delivery                                                                                          |
| Media drawer follow-up       | UI-7 delivered at b9c2e83 with green exact-main CI; no remaining implementation reservation                                                             |
| Transport lifecycle          | No active reservation after green REF-31 delivery; preserve accepted REF-20/31 transport behavior                                                       |
| Zoom regions                 | No active implementation reservation; creation slice delivered, old owner quiescent, full ramps contract-held in Opus queue                             |
| Oxc tooling                  | No active reservation after green VERIFY-5 delivery; VERIFY-6 follow-up needs a separate exact-path grant                                               |

## CLIP-11 delivered units and inspector decision

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

## UI-1 tooltip pilot

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

## UI-2 workspace layout and inspector integration

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
reservation is released. UI-3 then rebased its preserved reviewed header candidate onto this
accepted successor; no deployment was authorized.

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

## REF-32 acceptance

REF-32's exact source/test patch retained SHA-256
`66389e1674068a14284a6d865928e317122a5c629a45d7de9f5fb035c616cce4`. Both independent Sol and
existing Fable reviews returned LAND without P0-P2 findings. Coordinator acceptance passed strict
shrink-only/static gates, 132 unit tests, seven helper tests and all 89 browser cases with zero
skipped, unexpected or flaky cases. The first full attempt hit an evidenced orb OOM; the unchanged
retry passed. Source video and native audio now pause on busy/export without auto-resume or
range/target/time reset. Intentional aborts and stale play requests no longer become codec warnings,
while genuine current-request failure remains visible and a new Play clears the old warning. The
canonical preview owner promoted both editor and Storybook to exact `4b49623`. Authenticated
revision checks and public bundle hashes match the local immutable releases, and the accepted
video/audio export/cancel test passed against both isolated and stable production preview builds.
Coordinator inspected the returned editor and Timeline divider captures. Existing media/inspector
clipping remains; this promotion does not claim to repair it.
[Acceptance evidence](https://ampcode.com/artifacts/ref-32-acceptance-evidence-f85dcd12-dc9e-4e93-96e3-21f23cf3a4b8)
retains native reds, mutation checks and inspected public-media recordings. No private recording,
physical speaker or independent five-repeat performance qualification is claimed.

## VERIFY-7 and VERIFY-6 delivery

VERIFY-7 comes from the read-only orb/verify-clipper
[audit](https://ampcode.com/threads/T-09c3dae5-17af-485a-ad48-d9b12b1b44f3) against `6156fb4`. The
orb setup scripts and services need no change. The coordinator confirmed that `local-media.md` still
calls still import undelivered and the input video/audio only, `project-delivery.md` still calls
REF-27 blocked with only WebM proven, and `features/README.md` still lists stills, MP4/MOV and
format choice as pending. The page set also lacks workspace-layout and cursor-inspector coverage,
and the all-only spec list omits `workspace-layout.spec.ts`, `cursor-inspector.spec.ts` and
`zoom-creation.spec.ts`. The `media` journey's still and MP4/MOV tests are undescribed.

Map only delivered behavior with exact-SHA green CI and name the spec that proves each claim. Keep
private real-recording, every-codec, EXIF-rotated JPEG and NLE claims unqualified. The root README
gains stills, MOV and format choice in What works and limits, plus one Run line steering browser
checks to `verify.mjs` because non-CI `npm run test:ui` needs a dev server. Acceptance runs one real
`media` and one `editor` journey on the coordinator's serialized slot,
`node scripts/check-tickets.mjs` and `git diff --check`. Docs-only delivery needs no Fable review;
an independent review of the exact diff remains required.

VERIFY-6 preserves REF-31's behavior and timeout contract. Verify journey selection and executable
override through the real CLI. It does not reopen REF-31 or require the completed worker to remain
assigned. BOOT-1's unchecked fresh-GitHub-orb acceptance stays under BOOT-1, not a duplicate ticket.

The original seven-path tree `6ce42ee79635bae2caf28cce3604fa4069ee7f75` is preserved in transferred
commit `88479afa8a86889f442e304b9d38c143ff3bdbb0`. Clean integration on accepted `631f0bc` gives
source-review tree `b763be1fe561e9f78748beb7af6c13e31b4551e8`; all seven changed blobs are
identical. Authorized helper9/9 and real editor37/37 have zero skipped, flaky or unexpected tests. A
recording wrapper proves the spec's native `--remote-debugging-port=0` launch used `CHROME_PATH`,
not only Playwright's doctor/fixtures. The transferred wrapper log has six launches; its native
launch is fifth, correcting the earlier relayed seventh-of-seven count. Both existing independent
Opus and Fable reviewers return LAND for this exact successor, with no blocking findings. Fresh
successor static gates pass, including 134 units and strict shrink-only Fallow against `631f0bc`.
After CLIP-20b released the slot, fresh coordinator helper9/9 and editor41/41 passed on the accepted
filename successor. The subsequent full `all` qualification passed 109/109 in the same isolated
delivery tree, with zero skipped, flaky or unexpected tests. The pre-push base was accepted
`631f0bc`; the seven reviewed blobs are unchanged. Delivery at `3260b3b` has green exact-SHA
CI44018967483. VERIFY-6 was the former coordinator T-6706048a's final ticket before the owner's
requested Opus 5.5 medium handoff to T-136752bf. The completed baseline review is not repeated.

## CLIP-9b creation slice and Add zoom follow-up

Latest narrow-slice state: transferred candidate `b2d0353` is corrected locally to source-review
tree `6a08f46c359bcd5c32fa50e1d5329de30afb8518`. The existing Fable reviewer confirms LAND for that
exact tree, with no new review. The correction removes the App import from auto-zoom fixture setup
and restores the baseline byte-identical to `19c571e`; runtime and performance bytes are unchanged.
Source blobs match that reviewed tree on accepted `6365288`; the Fallow baseline is unchanged. Fresh
coordinator gates pass 132 unit tests, seven CLI-helper tests, full 73/73 and isolated performance
20/20, with zero skipped or flaky browser cases. The rebuilt AutomaticZooms story also creates one
four-second zoom. That slice delivered at
[`ad40248`](https://github.com/mite404/clipper/commit/ad402482fc0d9eda67a1b9273f239b5107996ca8),
with [green exact-main CI43934129560](https://github.com/mite404/clipper/actions/runs/43934129560)
and canonical preview promotion. This is not acceptance of the whole ticket.

The same coordinator owns the bounded **Add zoom** label/map follow-up on that accepted base: App
panel accessible/visible name, Editor.stories exact-name selector, existing zoom-creation spec, and
verify-clipper's cursor page/index. Keep the toolbar/inspector's existing **Add zoom at playhead**
names; the panel is exactly **Add zoom**. No runtime logic, CLI, baseline or performance workload
changes. The former verification owner is archived with no unshipped work or active assignment; only
those two feature-map paths are released for this correction. The old-name product red and three
focused greens are recorded. Fresh strict/Fallow shrink-only gates, 132 units and full 73/73 pass,
with no skipped or flaky browser cases. The rebuilt story creates exactly one duration-four zoom
through the unique **Add zoom** name; the renamed control's rendering was inspected. The existing
reviewer returns LAND for exact five-path tree `5eb12a812f000a222fd5673eb728b37af4bffbdb`,
independently reproduced by the coordinator; the master-only status delta adds no source change. The
follow-up delivered at
[`acb62f7`](https://github.com/mite404/clipper/commit/acb62f748fa0a6625b93e2140b3d5fb0d2dbc3f6),
with [green exact-main CI43938067635](https://github.com/mite404/clipper/actions/runs/43938067635).
UI-7's source hold is released on that accepted base. Full ramp scope remains open.

The coordinator verified the transferred complete-history bundle, nine-path dirty/untracked draft
and receipt archive against `clip-9b-SHA256SUMS.txt`. The frozen base and HEAD are both `b9596c6`;
there are no implementation commits above it. Backups remain under `.amp/in/orb-backup/`, without
source import, rebase, rerun or push during preservation. REF-31's exact-main CI is now green. The
existing Sol medium owner may integrate the narrow creation/panel-removal draft onto fetched
`9132ecf` or its accepted successor, preserving all newer source and test changes. Do not restore
stale files or the old Fallow baseline wholesale. Performance setup-only migration is released for
the preserved two-shot legacy workload, without threshold, repeat, assertion or sampling changes.
The sole push slot stays with the coordinator. Full Timeline/model/ramp ownership remains held.

## Delta audit, 2026-11-16

Planning and audited GitHub main:
[`7b23be8`](https://github.com/mite404/clipper/commit/7b23be80ff417e061d5c74ac127759b20a5b80ef).
Compared with reviewed baseline
[`5a9bc1f`](https://github.com/mite404/clipper/commit/5a9bc1f44c21fad089a25c5cbd4ad05530624a9c). The
audit used `git log`, ticket commit diffs, aggregate name-status and narrow test hunks. GitHub's 40
main CI runs from the baseline through this head all report success, including each delivered row's
SHA. The latest [CI run](https://github.com/mite404/clipper/actions/runs/43786045477) is green. No
new whole-codebase review or expensive reviewer was run.

## Delta audit receipts

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

## VERIFY-4 and REF-20 delivery

The owner explicitly requested this refresh independent of REF-31's transport dependency. Build on
delivered VERIFY-3 and REF-18 production support. Do not mark pending inspector/layout/zoom,
movement, still imports, export selection or the failed REF-20 candidate as verified delivery.
Skill/map Markdown is assigned; runnable helper edits require an exact scoped follow-up after audit.
No package, configuration, browser-spec or runtime-source edits are granted. The previous
verification-tools thread is archived, not an active writer. The exact transferred candidate was
reviewed with GPT-6.1 Sol medium, findings were fixed and full strict gates and serialized
exact-head CI were retained.

Delivered VERIFY-4
[`6abc9df`](https://github.com/mite404/clipper/commit/6abc9df3099272385d265bc2a022190d804bb411)
changes ten skill/map Markdown files only on accepted `b9596c6`. The
[actual Sol medium reviewer](https://ampcode.com/threads/T-8d28222c-4b4e-4430-b695-72888a11014b)
approved its exact correction delta after three documentation findings. Doctor/full55/performance10
and helper7 receipts cover the unchanged code/specs. Fresh applicable strict gates and
[exact-SHA CI43816920677](https://github.com/mite404/clipper/actions/runs/43816920677) passed. The
push slot is released. UI-3 then started on this accepted successor.

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
The rewind reservation is released. Inspector integration then resumed on that successor; UI-2
followed the accepted inspector. No timeout or workload changed.

## VERIFY-5 Oxc tooling

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

## REF-27, REF-27b and CLIP-20b export history

The owner explicitly requires H.264 MP4 as the default export at the application's selected
resolution, with alternative formats in an export modal. This supersedes the earlier WebM-default
and header-only format-select plan without changing the actual selected-size render-root
requirement. REF-27 included selection and qualification, owned by
[Sol research](https://ampcode.com/threads/T-66b606e9-c0a0-44fd-82a8-189dd0f928ba) (archived after
delivery). Inspect installed Mediabunny muxers and actual encoder support before granting
exporter/App/test edits. Container, MIME and extension must agree; never rename WebM or silently
substitute another selected format. Unsupported selections need a visible failure before expensive
work. Preserve local processing, cancel/retry, progress, audio mute/gain, shared frame rendering and
HD/4K behavior. Qualification requires decoded real output, not only a capability query. REF-20 is
delivered and its progress reservation is released; preserve that accepted behavior.

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
rendering and verified parity. Keep one resolution selector beside Export video and delete its
duplicate readout. Format alternatives belong in the export modal, not a header-only selector.

REF-27 owner may implement the actual-root geometry/test hunks below. Preserve the already verified
two-file exporter candidate. Final release must use the exact delivered inspector/UI-2 and header
successors; serialize this resolution/geometry integration before full CLIP-9b ramp/PiP and
still/dynamic-track renderer changes. Acceptance must inspect actual HD/4K render-root dimensions,
decoded/copy/export parity, corners/crops/cursor/zoom and interactive marking, selection/playback
during changes, legacy project behavior and fitted narrow/wide display.

The coordinator's initial grant covered the owner's rev9 actual-root geometry/test portion on
accepted `c987ab6`, with green
[exact-SHA CI43988105005](https://github.com/mite404/clipper/actions/runs/43988105005): App
Player-size/marking hunks, Composition, stage, cursor-render and the listed geometry/parity tests.
The preserved exporter pair remains separate. The revised bounded modal/AAC plan below is now
approved for integration. The transferred exporter patch is verified at SHA-256
`9253e6e7261ff0cf7a87e42771498d57469393111bb389bb9247622e4f363c1d`. Exact paths are `src/App.tsx`,
`src/export.ts`, `src/Composition.tsx`, `src/stage.ts`, `src/cursor-render.ts`, `src/stage.test.ts`,
`src/cursor-render.test.ts`, `tests/export.spec.ts`, `tests/refinements.spec.ts`,
`tests/framing.spec.ts`, `tests/frame-image.spec.ts`, `tests/cursor-render.spec.ts`,
`tests/cursor-speeds.spec.ts` and `tests/cursor-rotation.spec.ts`. The last three permit actual-unit
expectation corrections only, preserving temporal/shape/angle assertions. Additional exact paths are
`package.json`, generated `package-lock.json`, scoped export-dialog hunks in `src/styles.css`, and
`public/licenses/mediabunny-aac-encoder.txt`. `tests/editor.spec.ts` permits only inserting Render
video clicks after the three existing Export video activations in the source-blocking and
progress/cancel/retry cases, plus three radius expectations from 22px to 33px for the actual HD root
in composition playback and slider undo; preserve every assertion. `tests/workspace-layout.spec.ts`
permits one Render video click after Export video in the export-cancellation resize-recovery case,
retaining every compact-layout, resize and cancellation assertion. No schema, FPS, ramp, PiP,
still-image, fit or attachment changes. Keep SourceMonitor/sourceBlocked, Save, drawer and Inspector
untouched. The only transport-listener exception suppresses editor shortcuts while the export modal
is open. Use a fresh exact-base worktree and apply the preserved patch, not old `b9596c6` files in
place. Return the integrated exact candidate and actual runtime evidence before the coordinator
assigns Opus 5.5 medium independent review. No worker push or new reviewer grant is implied.
PiP/UI-2 owners are notified; no silent fixed-stage exception or premature shared-source grant.

The owner requested investigating FFmpeg where browser export is insufficient. Native AVC MP4 and
MOV/PCM are demonstrated; native AAC is the concrete orb gap. Approve exact
`@mediabunny/aac-encoder@1.66.0`, matching installed Mediabunny, without a core upgrade or full
ffmpeg.wasm. Prefer native AAC; dynamically load the local fallback only for audible MP4 requiring
it, and prove encoder initialization before source decoding/rendering. Preserve actionable early
failure, never dropping audio or silently substituting a container. Inspect distributed license
notices and retain corresponding-source/rebuild links. Require positive AAC full-decode/audio-sync
evidence and worker/load-failure, cancellation and retry checks before qualification.

Use a native export dialog with H.264 MP4 initial-session default and current application resolution
shown read-only. Offer MOV H.264/PCM with size disclosure and WebM VP9/Opus alternatives. Export
video opens the dialog; Render video starts the existing export lifecycle. Verify Close, Escape and
focus return. Keep the sole resolution selector in the header, with no header format selector.

REF-27 source is pushed at
[`27099dc`](https://github.com/mite404/clipper/commit/27099dcf976a1d6eae6b39d431e33afae7659f9a).
[Exact-SHA CI44001648378](https://github.com/mite404/clipper/actions/runs/44001648378) passed;
REF-27 is delivered and its reservation released. The verified transferred patch reproduces reviewed
tree `7bbb71d201c8ac126c6dd173525dcd10fdbf5431`, and staged source matches it exactly. Opus 5.5
medium and the existing Fable supplemental reviewer both returned LAND. Coordinator strict gates,
134 units, seven harness tests, full browser 105/105 and isolated performance 20/20 pass without
skips, retries or relaxed assertions. Actual HD/4K MP4 AAC, MOV PCM and WebM Opus output passed
decoded pixel/audio comparisons. Production DOM checks cover root dimensions, Escape, Cancel/focus
return, lazy AAC loading and byte-identical notice delivery. All inspected media is synthetic or
public; native AAC, Safari/macOS, physical speakers, universal MOV playback and real recording
compatibility remain unclaimed. See the
[acceptance evidence](https://ampcode.com/artifacts/ref-27-acceptance-evidence-1c4d6327-5fb4-4334-862f-e575e5279762).
No deployment or preview promotion is claimed.

REF-27b follows the owner's portal test: MP4/MOV exports work and saved files have extensions, but
the native save-dialog filename field hides them. Clipper already supplies the extension through
`anchor.download`; do not append a second suffix or claim control of native OS display settings.
Show the complete prospective filename in the export dialog, updating with format/resolution, with a
short note that the save dialog may hide the extension. Preserve actual MIME/container/download
agreement. Keep scope to export-dialog/name hunks and existing affected browser tests; coordinate
the active CLIP-20b App reservation before granting edits. Verify MP4/MOV/WebM filename display,
actual suggested download names, long-name/narrow layout and keyboard access. No codec, encoder,
native-dialog replacement, naming-system redesign or still-media change is requested.

The existing Sol medium export owner
[T-66b606e9](https://ampcode.com/threads/T-66b606e9-c0a0-44fd-82a8-189dd0f928ba) completed REF-27b
read-only scoping on accepted runtime `27099dc` and docs-only successor `b44e7c9`. Its scope is
`src/App.tsx` export-dialog filename/note and existing download-name expression only if needed, plus
`tests/refinements.spec.ts` export-modal/download cases. The exact plan is now accepted and those
hunks released for implementation: share the fixed naming stem, preserve actual Blob-MIME suffixes,
add the prospective filename/note before the license link, and extend existing modal/download cases.
Retain every existing assertion, with exact displayed/downloaded names for HD/4K MP4/MOV/WebM,
320px/wide rendering and red/green evidence. No custom naming or other source/style changes.
CLIP-20b is notified; its image-specific grant excludes these hunks and this test file. Full
acceptance runs and main pushes remain serialized through the coordinator.

REF-27b held the next full acceptance slot after its focused seven-case checks passed and its
candidate froze: full verify-clipper, then isolated performance. The missing-filename red is
captured on unchanged production source. The coordinator transferred and inspected the failing
receipt and all seven focused passes, including six actual downloads and 320px/wide filename states.
The transferred three-path patch matches SHA256
`90af6fab513f2c64b22c040adf6ebcfc762f1a9ebadc9bce2cbf82d1b0cc92e6` and produces frozen tree
`1ff5506f7378bd651ccb57bf80f3eae60032153d` on `b44e7c9`. Independent exact-delta reviews from the
existing Opus and Fable reviewers both return LAND. The transferred full 109/109 and subsequent
isolated performance 20/20 results have zero skipped, flaky or unexpected tests. The coordinator
verified all 71 packet file hashes, inspected the twelve-state modal matrix and moving-pointer clip,
and passed fresh editor 38/38 on documentation-only successor `7f51dd9`. The three candidate blobs
still match the reviewed tree exactly. Fresh format, tsc, strict Fallow against latest main and 134
units pass. REF-27b is delivered at
[`631f0bc`](https://github.com/mite404/clipper/commit/631f0bc4a6ac1f784c9bfcf77d2fef25052525a1),
with [green exact-SHA CI44012171159](https://github.com/mite404/clipper/actions/runs/44012171159).
The canonical editor returns that revision and its public bundle matches the immutable build; its
twelve-state modal check passes and inspected public captures show full filenames and guidance.
Storybook remains closed under the owner's sole-editor-portal restriction; no new portal or
production deployment is implied. Staffing documentation at `7f51dd9` has green CI44011040120.
[REF-27b evidence](https://ampcode.com/artifacts/ref-27b-acceptance-evidence-e151ef51-464b-4f20-aef7-5f3211653dbf)
preserves their findings and transferred receipts without replacing this operational record.
CLIP-20b then reported focused implementation ready and was next for full acceptance on the filename
successor. Its transferred original eleven-path patch SHA256 is
`94d759e68e1462b0ec0164b410cf15847548393093a9ea2b1738d3a4ff1d9fe9`; the coordinator reproduced tree
`8ee99f467d2bf18537fbc582288c01900f8b27f2` on its exact `6ef3fa1` base in a separate index. The
original remains preserved and unapplied to delivery. The successor grant and acceptance slot are
released on accepted `631f0bc`; the unchanged eleven-path patch applies cleanly, producing initial
staged tree `e7246a42f1666ae3f721127a00207215ba0481cb`. The qualified successor is now frozen at
commit `57b59b9e5d18ea44ec9ff36958fa2cca55453149`, tree `5bc2f675c53b6aed62fe3bd9a454ad7fc789f09c`.
The sole correction is test-first still-duration error layout in the granted style/editor-test
hunks. The coordinator reproduced both trees from the original patch plus the exact correction,
verified all six transferred packet hashes and inspected actual result JSONs. Units136/136,
full126/126 and subsequent isolated performance20/20 pass with zero skipped, flaky or unexpected
tests; focused still15/15 and Storybook2/2 pass. The independent review returns LAND for the exact
eleven-path successor; Fable also returns LAND with no P0-P2 findings and independently passed
exact-tree static gates. Its runtime assessment uses the worker's receipts, not a separate run. The
worker was quiescent with preserved evidence. The coordinator then held the released slot for fresh
VERIFY-6 acceptance before this successor's latest-main integration/qualification, with no worker
push grant. CLIP-20b was delivered at `6156fb4` and its owner T-01a1e2f2 is archived.

One additional path is granted only for a generated shrink correction:
`.fallow-health-baseline.json`, using Fallow prune to reduce App's `crap_moderate` count from three
to two and remove only the `exportVideo` debt identity (21 to 20 identities). Shared basename
extraction removed that branch; do not preserve artificial complexity to keep stale debt. No
baseline growth, unrelated churn, manual editing, threshold or config change is granted. Retain the
prune report/diff and rerun strict identity/stale/shrink-only checks before full acceptance.

## CLIP-20b, CLIP-2c and CLIP-2e contracts

CLIP-20b is still images as timeline media, not the separately scoped composition background. Use
explicit editable still duration, correct aspect and alpha handling, matching preview/export and
embedded save/reopen. Qualify MOV/MP4 using actual supported codec fixtures, not suffix-only claims.
Corrupt/unsupported input must show an error, preserve the prior edit and release failed resources.
Keep processing local; do not upload private capture material.

Neither owner then had shared implementation or push permission; CLIP-20b has since delivered, and
CLIP-2b's owner still has none and may inspect and reproduce. The audited delivery order supersedes
the earlier CLIP-2b-before-media order, putting media and track foundations before their dependent
association/insertion work. REF-31's reservation is released. Model/parser/render/export grants wait
for exact path needs and reproduction results. Serialize REF-27 container selection before CLIP-20b
image export changes on its delivered successor. CLIP-20b's accepted still contract uses a
five-second editable default, screen/camera tracks only, and clip-owned duration, with legacy reopen
and decoded alpha/aspect parity required. Every unit retains strict, full browser and isolated
performance gates plus exact-head CI.

The [CLIP-20b brief](tickets/CLIP-20b.md) records the refreshed bounded paths on `27099dc`. Its
owner confirms there is no untransferred source candidate, only preserved research. The coordinator
accepts v3 for embedded-image envelopes with v2 retained for video/audio-only saves, and atomic
rejection of duration growth into a following same-track clip without ripple. These are
implementation decisions to verify. With REF-27 accepted, the then-existing GPT-6.1 Sol medium owner
T-01a1e2f2 (now archived) received the brief's bounded source hunks on `27099dc` and its docs-only
successor. No worker push, new dependency, config/baseline change, unrelated source edit or
concurrent acceptance run was granted.

CLIP-2c is explicitly authorized dynamic track creation, not a four-fixed-lane workaround. Drop from
the media pool onto a compatible track inserts at mouse-up timeline time. Audio belongs only on
audio tracks; video/stills belong on visual tracks. Dropping in the blank creation area creates a
compatible new track and inserts there. Define track identity, visual stacking/audio mixing,
legacy-project conversion, mute, source anchors and portable save/reopen before editing. Preserve
undo and clear nondestructive collision behavior; do not silently ripple or overwrite. Its Sol owner
inspected/reproduced only until exact model/parser/render and UI path grants followed; Opus then
held the grant and delivered CLIP-2c at `1de89b5`.

The owner's V1 requirement additionally authorizes a full-composite still/video underlay beneath
both screen/camera roles. This supersedes screen-mask-only creation for backgrounds, not ordinary
masked creation. Use an explicit Background role/label, centered cover across the whole stage,
without radius or screen zoom. Display V numbering independently from stable role IDs; preserve
top-row-frontmost order, undo, offsets/gaps/alpha, cursor occlusion, save/reopen and decoded output.
CLIP-2c's
[current contract](https://ampcode.com/artifacts/clip-2c-insertion-contract-6e8501c5-a3fb-40e0-b359-dfd8b483b92b)
coordinated still-media lifetime/schema with CLIP-20b and geometry with PiP.

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

## Owner-feedback coverage audit, 2026-11-16

This table indexes requirements, not a second operational queue. Status and execution order remain
in their linked master entries. Inline scopes are repo documentation; external research artifacts
support them but do not replace them. No GitHub or Linear issue creation is implied.

| Explicit request                                                                                                                          | Concrete ticket and repo scope                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Hide media pool, increase timeline room, scroll both axes, adaptive min/max scale and narrow ruler                                        | [UI-2](master-tickets.md#ui-2)                                                                                         |
| Remove branding/title and move Save without changing save behavior                                                                        | [UI-3](master-tickets.md#ui-3)                                                                                         |
| Horizontal label scrubbing across numeric properties, not booleans/enums                                                                  | [UI-4](master-tickets.md#ui-4)                                                                                         |
| Resize side panes/timeline, hide/restore and default/custom height controls, visible ruler playhead and scrub affordance                  | [UI-5](master-tickets.md#ui-5)                                                                                         |
| Media before Save, temporary left-edge media-pool peek and Space-only timeline control                                                    | [UI-7](master-tickets.md#ui-7)                                                                                         |
| Space play/pause despite focused native controls, with checkbox Enter activation and text-entry exceptions                                | [REF-38](tickets/REF-38.md)                                                                                            |
| Cursor metadata import from source panel or targeted composition/timeline sidecar drop                                                    | [CLIP-11b](tickets/CLIP-11b.md)                                                                                        |
| Remove ORIGINAL, obsolete above-timeline cursor panel, L/R meter, Paused and selected slogans/tags                                        | [UI-6](master-tickets.md#ui-6), with cursor access preserved by [CLIP-11](tickets/CLIP-11.md)                          |
| One resolution selector, true selected-size composer plus copy/export, real MP4/MOV/WebM                                                  | [REF-27](master-tickets.md#ref-27)                                                                                     |
| Zoom creation at playhead for four seconds, B shortcut, old batch removal, editable ramps and referenced Bklit/D3/Motion curve technology | [CLIP-9b](master-tickets.md#clip-9b)                                                                                   |
| PiP beside Side by side, direct live-preview four-corner placement, padding/radius                                                        | [CLIP-22 PiP subset](master-tickets.md#clip-22-pip-composition-subset)                                                 |
| Full-composite still/video V1 underlay below both roles; dynamic compatible visual/audio tracks                                           | [CLIP-2c](master-tickets.md#clip-2c)                                                                                   |
| Move video/audio clips with an associated-audio link toggle; drag media-pool inserts into compatible/new tracks                           | [CLIP-2b](master-tickets.md#clip-2b), [CLIP-2c](master-tickets.md#clip-2c)                                             |
| V Selection/C Razor, selected-target Split button, Cmd+K Mac or Alt+K Windows/Linux all-unlocked cuts and saved locks/track selection     | [CLIP-2e](master-tickets.md#clip-2e)                                                                                   |
| MOV/MP4 import qualification and PNG/JPG timeline still imports                                                                           | [CLIP-20b](master-tickets.md#clip-20b)                                                                                 |
| Functional 24/29.97/60/100/120/Auto FPS beside resolution, no fake 30 label                                                               | [CLIP-21b](master-tickets.md#clip-21b)                                                                                 |
| Auto-fit new visual media to selected composition and per-clip scale slider/numeric input                                                 | [CLIP-19b](tickets/CLIP-19b.md)                                                                                        |
| FCP7 XMEML choice, source-path mapping and real Premiere/relink qualification                                                             | [CLIP-31a](master-tickets.md#clip-31a), [CLIP-31b](master-tickets.md#clip-31b), [CLIP-31c](master-tickets.md#clip-31c) |
| Requested oxlint-tsgolint typecheck script and oxfmt installation without lost compiler checks                                            | [VERIFY-5](master-tickets.md#verify-5)                                                                                 |
| Continuous bounded tickets with required exact-diff review and serialized exact-SHA CI                                                    | [Repository workflow skill](../.agents/skills/managing-tickets/SKILL.md)                                               |

The audit compared fetched `origin/main` at `6abc9df` with the coordinator's working docs. That
baseline contains older REF-27, CLIP-9b and framing/background backlog rows, but not these expanded
requirements or UI-2 through UI-6, CLIP-2b/2c, CLIP-20b/21b/19b operational entries. This is the
pre-publication baseline, not a claim that the newly written docs were already remote. Publication
must name the actual pushed commit and its CI separately from product implementation delivery.
