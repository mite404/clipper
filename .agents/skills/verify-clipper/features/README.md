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
