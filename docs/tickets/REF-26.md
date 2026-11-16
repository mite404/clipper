# REF-26

## Status

- Authoritative state: [master ticket](../master-tickets.md#ref-26).
- Goal: keep errors and warnings visible without scrolling to the footer.
- Priority: correctness feedback before new features.
- Effort: small. Risk: narrow-width wrapping or overlaying useful controls.
- Dependencies: resolve the observed full-run cursor-follow performance failure before delivery.
- Planned at: `7b23be80ff417e061d5c74ac127759b20a5b80ef`, 2026-11-16.
- Local path: `docs/tickets/REF-26.md`.

## Why this matters

The footer is the only error and warning location. At 1440 by 1000 the original page is 1098 px tall
and the footer begins at 1062.5 px, so users cannot see whether an operation failed.

## Current state

Two extended Playwright journeys failed viewport assertions before the fix. A local three-line
sticky-footer CSS change passes those checks at desktop, short and narrow widths. It is in the stash
named `ref26 local footer fix pending performance investigation`, not GitHub main. 127 units and
static/Fallow gates passed; the full browser run passed 38 of 39 checks. The remaining cursor-follow
performance check measured p95 exactly 100 ms against a strict below-100-ms bound. That failure has
no established cause yet. It must not be hidden by a retry-only success claim.

## Approach

Keep the existing footer and live status region visible, preserving document space and wrapping. Do
not add a second notification system or change the whole editor layout for this fix.

## Scope

In: footer position, default and error states, responsive visibility, actual interaction evidence.
Out: notification redesign, unrelated cursor optimization, lowering performance standards.

## Steps

1. **Preserve and reproduce**. Restore only the known CSS and refinement-test paths; inspect drift.
2. **Resolve the gate**. Investigate the performance failure using unchanged-base comparisons.
3. **Inspect final states**. Check default, error and narrow footer states plus scroll interaction.
4. **Deliver one ticket**. Run gates, clean-tree push and exact-SHA CI.

## Test plan

Require full viewport intersection at 1440 by 1000, 1440 by 700, 960 by 1000 and 320 by 700.
Malformed Open must retain the current edit and show its error visibly. Check horizontal overflow,
scrolling to controls underneath the sticky region and playback. Inspect after screenshots and
pointer recording. Keep the existing 100 ms performance bound.

## Why this approach

A sticky status region retains the current semantics and avoids duplicating message state.

## Files You'll Touch

| Path                                       | Role                                                 | Edit or Read |
| ------------------------------------------ | ---------------------------------------------------- | ------------ |
| `src/styles.css`                           | Footer position                                      | Edit         |
| `tests/refinements.spec.ts`                | Real default and error viewport checks               | Edit         |
| `tests/performance.spec.ts`, `src/App.tsx` | Investigate observed gate without guessing its cause | Read         |

## Initial state and preflight

Run [dispatch preflight](../ticket-workflow.md#initial-state-and-preflight). Verify the stash name
and its two-file diff before applying it. Do not remove the stash until equivalent work is durable.

## Done when

Every tested status is fully visible without hiding controls, inspected captures match, and the full
local gate plus exact-SHA CI pass. A local fix or green focused test alone is not Delivered.

## Notes

Failure evidence is in the queue owner's `ref26-browser.log` and `verification/all-D1VCS3`.
Before-state screenshot shows the footer absent. No private capture material was used.
