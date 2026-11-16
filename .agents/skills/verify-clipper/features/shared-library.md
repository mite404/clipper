# Shared component library

Storybook records the same source monitor, media bin, timeline, composition, waveform, inspector,
icon buttons, and whole editor used by the application.

## Sub-features

- Stories with real demo media, not separate mock editor implementations.
- Demo data, Worst case, Empty, One, and 1,000-item toggles in media/timeline stories.
- Long filenames, multilingual and one-character names, missing thumbnail, and empty waveform.
- Narrow 320px layout and enlarged text without page overflow.
- `ui-iconbutton` Normal and Stress records for the shared IconButton tooltip; see
  [tooltips.md](tooltips.md).

## How to get to it (user POV)

Open Storybook and choose Clipper / Shared library. Open Worst Case Media Bin or Worst Case Timeline
and use the fixed dataset switcher. The switcher exists only in Storybook, not the editor.

## Driving it with Playwright

Run `.agents/skills/verify-clipper/scripts/verify.mjs storybook`. It builds and serves an isolated
Storybook without requiring shared preview services. It uses the real Storybook iframe URLs and
tests the five dataset states, 1,000 rendered cards, 320px overflow, 24px root text, and
composition/ruler. Require `0 assets ready`, `1 asset ready`, and `1000 assets ready` for the
corresponding states. The stress selection persists in the iframe URL's `stress` parameter. The
mouse-centered zoom story demonstrates the actual app's marking mode. The timeline story persists
trims in local story state. The portable-project/export story exposes the real app controls.

## Gotchas

`verify.mjs storybook` runs only `storybook.spec.ts`; the IconButton records are exercised by `all`
through `icon-button.spec.ts`. The sidebar is 240px wide even in a wide viewport. Missing thumbnails
must show a placeholder, not an empty image URL. A thousand fixture cards tests layout, not a
thousand full video decodes. RTL is not a supported editor layout. Chromium narrow screenshots are
not physical-device proof.
