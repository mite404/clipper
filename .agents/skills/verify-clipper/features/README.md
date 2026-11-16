# Clipper feature map

Start each journey from a fresh tab and wait for `4 assets ready`. The UI shares files across
features, so a source-file diff cannot safely select a complete subset. Run the full browser suite
after shared editor, timeline, composition, or media changes.

- [Local media](local-media.md) covers import, source in/out, errors, and privacy.
- [Timeline and transport](timeline-transport.md) covers splices, seeking, audio, and J/K/L.
- [Composition](composition.md) covers masks, crops, manual mouse zooms, zoom fields, and undo.
- [Cursor and automatic zoom](cursor.md) covers pointer sidecars, the drawn cursor, click-generated
  zooms, camera follow, and hidden ranges.
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
- `all` builds both previews and discovers the entire existing suite, including new spec files. It
  is the only command that runs `controls.spec.ts`, `cursor.spec.ts`, `cursor-render.spec.ts`,
  `cursor-shapes.spec.ts`, `auto-zoom.spec.ts` and `framing.spec.ts`.

The feature map defines coverage, not the command name. `export` alone does not run the separate
UI-driven project-export checks in `refinements.spec.ts`; use `editor` or `all` too. The `media` and
`storybook` journeys do not select the cursor, click-zoom, follow or controls specs; run `all` for
those, then read [cursor.md](cursor.md) for what each one proves and what stays unproven.
