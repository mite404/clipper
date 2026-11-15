# Clipper feature map

Start each journey from a fresh tab and wait for `4 assets ready`. The UI shares files across
features, so a source-file diff cannot safely select a complete subset. Run the full browser suite
after shared editor, timeline, composition, or media changes.

- [Local media](local-media.md) covers import, source in/out, errors, and privacy.
- [Timeline and transport](timeline-transport.md) covers splices, seeking, audio, and J/K/L.
- [Composition](composition.md) covers masks, crops, manual mouse zooms, and undo.
- [Project delivery](project-delivery.md) covers portable save/reopen and real rendered video
  export.
- [Shared library](shared-library.md) covers Storybook and worst-case layouts.

For a full sweep run all Playwright tests and inspect representative rendered states. A failed or
skipped journey is not covered by a passing neighboring journey. The editor is desktop-first; 320px
checks prove horizontal overflow handling, not a physical phone or touch interaction.

## Executable journeys

Run `.agents/skills/verify-clipper/scripts/verify.mjs <journey>` from the repository root. This
launches and cleans up isolated servers automatically. Feature files use this CLI so focused
journeys cannot accidentally target a stale shared preview.

- `media` runs both local import/privacy and difficult-import checks.
- `composition` runs splice/scrub/zoom, swap/trim/scroll, and mouse-focus/save/reopen checks.
- `delivery` runs save/reopen and malformed-project checks.
- `export` runs cancellation, muted audio, and decoded HD/4K fixture checks.
- `editor` runs all editor and refinement checks, including UI-driven HD/4K project export.
- `storybook` builds and tests the shared library and its stress states.
- `performance` builds production code and repeats the responsiveness assertions five times.
- `all` builds both previews and discovers the entire existing suite, including new spec files.

The feature map defines coverage, not the command name. `export` alone does not run the separate
UI-driven project-export checks in `refinements.spec.ts`; use `editor` or `all` too. Cursor sidecar
import and its Storybook stress states run through `all`, which discovers `cursor.spec.ts`; `media`
and `storybook` do not select that spec. It covers valid, invalid and absent sidecars, source-local
offsets, removal, and portable save/reopen. Trim-aware recorded cursor rendering, click-generated
zoom, and smooth follow remain future feature tickets, not coverage supplied by manual-focus tests.
