# Icon button tooltips

Every shared `IconButton` shows its label in a tooltip. This is the UI-1 pilot, delivered in
`eb55a36`. Native buttons that do not use `IconButton` keep their own behavior.

## Sub-features

- The tooltip repeats the accessible name. It adds no description, and the native `title` is gone.
- Pointer entry waits 400 ms. After one tooltip is open, a neighbor opens at once with no
  transition. Keyboard focus shows it without the delay. Escape closes it and keeps focus.
- Hovering the tooltip keeps it open. A disabled button stays disabled and shows no tooltip.
- Entry and exit use opacity and scale over 125 ms. Reduced motion removes the scale and keeps the
  fade. A long multilingual label fits at 320px.

## How to get to it (user POV)

Hover or Tab to Play source, Insert source at playhead, Go to start, Previous frame, Next frame,
Undo, Delete selected clip or zoom, or a track's Mute and Unmute button. Split and Add zoom are not
`IconButton`s and keep their own behavior. Storybook has the same button as `ui-iconbutton--normal`
and a Stress record.

## Driving it with Playwright

`.agents/skills/verify-clipper/scripts/verify.mjs all` runs `tests/icon-button.spec.ts`. The
`storybook` and `editor` names do not select it. Three tests open the isolated Storybook iframe and
check focus and Escape, Enter and Space with no form submit, the absence of a duplicate description
or title, the disabled button, the 400 ms delay and its cancellation, neighbor handoff with a `0s`
transition, tooltip hover, and 320px reduced-motion fit. The fourth opens the production editor,
hovers Next frame, requires the tooltip text, an empty accessible description, one frame advanced
and the tooltip gone after the click.

Hover with a real pointer move across neighbors. Setting state or dispatching events does not prove
the delay or handoff.

# Info notes

Shared `InfoNote` buttons replace visible setting notes with a toggleable tooltip (UI-10). The
cursor inspector uses them for its Animation and Per-clip ending notes.

## Sub-features

- The note is the button's accessible description from the start, and there is no `title`.
- Pressing the button (pointer, Enter or Space) opens or closes the note. Escape or an outside press
  closes it. While open, an overlay catches the outside press before it reaches the page.
- A long multilingual note fits at 320px.

## Driving it with Playwright

`.agents/skills/verify-clipper/scripts/verify.mjs all` runs `tests/info-note.spec.ts` against the
isolated Storybook iframe (`ui-infonote--normal` and `--stress`). The outside press uses raw
`page.mouse` events because the open tooltip's overlay intercepts element clicks.
`tests/cursor-inspector.spec.ts` checks the real inspector's two info buttons.

## Gotchas

Timing assertions are wall-clock bounds in headless Chromium, not a frame-accurate animation check.
Contrast and the exact curve were inspected by the UI-1 worker; no command here measures them. Touch
devices and screen-reader announcements are not tested. UI-1 added about 30 KB gzip to the main
chunk; Vite's large-chunk advisory remains and is not a failed build.
