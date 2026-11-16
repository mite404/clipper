# CLIP-11b

Authoritative state: [master ticket](../master-tickets.md#clip-11b).

## Requested behavior

Import cursor metadata from the source media panel, or drop a supported sidecar onto a screen
recording in the composition or timeline. Both entry points attach to the explicitly targeted
recording source. They do not insert or move clips, create a new media track, or create clip-local
copies of recording-wide pointer data.

This is new attachment UX, separate from the frozen cursor-inspector reorganization. Preserve that
candidate and integrate its accepted successor before shared-path implementation.

## Research before source release

Trace the existing attachment action, supported parser, validation, asset identity, error reporting,
project serialization and undo ownership. Inspect original user context if the source-panel target
or composition hit target is ambiguous. Do not guess source identity from a filename or expand
supported metadata formats. Screen Studio import remains a separate CLIP-7b decision.

Define hit-testing for the screen recording versus camera, empty stage, overlay controls and
overlapping tracks. Define file discrimination and mixed/multiple-file rejection before handling a
drop. CLIP-2b moves existing clips; CLIP-2c inserts media and owns compatible/new-track drop
behavior. Metadata drops must not consume those gestures or change timeline insertion/movement
semantics.

Parse and validate before replacing source data. Failure or cancel preserves the prior metadata,
selection and edit. Successful attachment must have explicit recording-wide feedback and a tested
undo and dirty/save contract rather than silently bypassing edit history. Current asset cursor
updates bypass `Edit[]` history and the edit-only dirty predicate. Resolving that attachment
transaction is a required foundation within CLIP-11b, not permission for an unrelated global history
rewrite or a new Redo feature. Reinspect the delivered successor before choosing the smallest seam.

The
[source-grounded contract](https://ampcode.com/artifacts/clip-11b-attachment-contract-315725aa-bfaa-4b93-bbd2-f5d66e1b7a56)
records parser, routing and proposed hunks. The schema cannot prove that valid telemetry belongs to
a particular video. Explicit user targeting is not automatic mismatch detection. Composition
premount/postmount DOM is not active-source identity; use the rendered screen and displayed frame.
Freeze the source instance during asynchronous validation and reject stale completion after project
replacement or a later accepted attachment. History research belongs to the same scoping owner;
implementation still requires an explicit shared-path grant.

## Ownership and dependencies

- Inspector owner retains its frozen existing-control reorganization and attachment access.
- CLIP-2b and CLIP-2c retain clip movement, insertion and track-registry/drop ownership.
- REF-27 retains composer dimensions, role geometry and selection/marking scaling.
- This research owner receives no App, Timeline, Composition, parser or project-write grant yet.
- Coordinator owns the sole master, exact successor/hunk release and exclusive main push slot.

Potential shared paths are the source-panel/attachment App code, cursor controls, timeline and
composition hit targets, pointer parser, asset/history/project state and existing browser tests.
Narrow the actual paths after tracing the delivered code. Do not build a parallel import/parser
framework or embed private recordings as fixtures.

## Acceptance

1. Source-panel file selection and drops on composition/timeline resolve the intended screen source,
   including two recordings and repeated clips of the same source. No filename-based guess passes.
2. Existing supported synthetic metadata yields matching cursor playback across all uses of that
   source and survives save/reopen. Unrelated recordings remain unchanged.
3. Malformed, unsupported, mixed or ambiguously targeted files show useful feedback without losing
   current metadata, changing clips or inserting tracks. Cancel makes no edit.
4. Successful attachment/replacement and undo preserve source-wide data and editor selection, with
   correct dirty/save state. Pointer import does not change the timeline timebase. No global Redo
   feature is part of this scope.
5. Media insertion/movement, pane controls and composer selection remain usable. Inspect real
   pointer/keyboard recordings plus representative rendered success and error states.
6. Run strict shrink-only/static/typed/unit and real isolated browser/performance gates on the
   integrated successor. Existing Fable reviews the exact tested candidate before serialized push
   and exact-SHA CI. No real-Mac recording qualification or production deploy is implied.

## Source and owner

The Space relayed Mite's explicit source-media import and composition/timeline sidecar-drop request.
[Sol scoping owner](https://ampcode.com/threads/T-fb08e0ff-0f5d-4dab-9d9e-470de7fd0490) researches
the contract read-only before a source grant. The
[Space](https://ampcode.com/threads/T-01a1ddcb-afef-7281-b644-0816028b6f43) holds the original
request context. This brief records requirements, not delivered implementation.
