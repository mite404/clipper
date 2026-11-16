# CLIP-19b

Authoritative state: [master ticket](../master-tickets.md#clip-19b).

## Requested behavior

Automatically scale visual source media inserted or dragged into the timeline to the selected
composer/output dimensions. Preserve aspect ratio, without implicit stretching or destructive crop.
Expose a per-clip Inspector scale slider and numeric input. Scale belongs to the clip instance, not
the shared source asset or the whole recording. Editing one use must not change another use.

Preview, Copy frame, export, save/reopen and undo must agree. The current selected-resolution
requirement is actual HD/4K composer rendering, not merely a larger CSS box.

## Research before source release

The accepted coordinator defaults use instance-local `fit` (`contain` or `cover`) and dimensionless
`scale`. New screen/camera clips use contain/1 relative to the assigned role mask; missing legacy
fields preserve cover/1. An explicit Fill option uses cover without aspect distortion and preserves
existing crop positions. Background retains CLIP-2c's explicit full-composition cover default.
Resolution changes scale the actual role mask numerically, not the saved clip-scale value.

Validate these defaults against delivered role geometry before implementation. Document
fit/position/crop interaction, allowed bounds and step, split/copy behavior and parser migration.
Existing cover-cropped projects must not silently change appearance when this control is added.

This is a scoped per-clip framing feature, not a general transform framework or a global replacement
of the edit timebase. Do not add source decoding, layout schema or numeric gesture abstractions
without tracing the actual delivered owners.

## Ownership and dependencies

- REF-27 owns actual selected-resolution Player/composer roots and shared dimension/scaling API.
- CLIP-22 owns PiP role masks, current padding/radius and live-preview corner overlays.
- CLIP-20b owns image kind, duration, decode lifetime and its delivered project-format contract.
- CLIP-2c owns dynamic track identity, order and full-frame Background role.
- UI-4 owns the shared numeric-property label-scrubbing contract. No implementation API exists yet.
- The master records exact source grants and the single push slot; this brief grants no paths.

Potential files are timeline-model, stage, Composition, project/parser, App Inspector, shared
controls/styles and their existing tests. Cursor rendering, framing and generated split-piece zoom
focus must consume instance sizing too. Export decoded layers must retain clip identity and sizing
rather than looking up source-wide scale. Reuse the delivered preview/copy/export geometry path.
Research is read-only until the coordinator supplies an exact integrated successor and hunk grant.

## Acceptance

1. Use asymmetric landscape, portrait and transparent still fixtures. Newly inserted and dragged
   media fit the chosen target without aspect distortion, at both actual HD and 4K render sizes.
2. Two clips using the same source retain independent scale; split, trim and movement preserve the
   intended instance setting and source-time anchors.
3. Slider, direct numeric entry and shared label scrubbing produce the same bounded scale. One
   gesture is one undo; cancel restores it and click-only interaction adds no edit.
4. Compare independently decoded preview/frame-copy/export geometry, including PiP, crop, cursor and
   animated zoom composition. Verify alpha and gaps instead of checking only dimensions.
5. Save/reopen preserves the setting; legacy files keep their prior appearance and remain readable.
6. Run strict shrink-only gates, existing units/helper tests, isolated full browser and separate
   performance journeys. Inspect real pointer/keyboard captures and narrow/wide rendered states.
7. Deliver only through exact-successor integration, serialized authorized push and exact-SHA CI.

## Source request and research owner

The owner's latest request is automatic fit on insert/drag plus per-clip slider and numeric scale.
[Sol research owner](https://ampcode.com/threads/T-45868c85-1af4-45b7-ac3a-2e317bb8f64d) is tracing
the existing framing and role contracts. The
[fit and scale contract](https://ampcode.com/artifacts/clip-19b-fit-and-scale-contract-296979c4-ff4f-454d-94c7-d9d79f9cd13d)
records source consumers and test paths. Accepted defaults are not a claim of implementation or
verified compatibility. No private recording material is required for these synthetic checks.
