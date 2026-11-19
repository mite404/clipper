# CLIP-20d

Authoritative state: [master ticket](../master-tickets.md#clip-20d). WebP backgrounds and one
Background image control. Wallpaper presets are not part of it.

## Contract

- WebP is read like PNG and JPEG. A file is told by its first bytes, never its name or MIME type: a
  WebP is a RIFF file whose form is WEBP, and a WAV is RIFF too. An animated WebP shows its first
  frame. Saved projects embed the original bytes as `image/webp`. The envelope version is unchanged
  (a project with a created Background track is already version 4); an older reader refuses the
  media by name.
- The Inspector's Background image row, under the backdrop colours, is Choose, Replace and Remove.
  It controls the first clip on the lowest Background track, only when that clip is a lone still. A
  video or several clips there is the timeline's own: the row says "Background track in use".
- Choose with no Background track makes one beneath the pair and a cover clip over the whole
  timeline, as one undo step. Replace swaps the clip's asset and keeps its start, length, fit and
  scale. Remove deletes only that clip and leaves the track. A locked track refuses.
- The file is read first: a corrupt or unsupported picture shows the usual message and changes no
  background, library or URL.

## Release

An image the control imported leaves the library, and its object URL is revoked once React has
swapped it out, when no edit, current or in history, uses it. A source the user imported or dragged
in is never released, since library removal is a separate feature. Undo can restore a replaced image
until history drops it, so a replaced image stays until then. ponytail: history keeps 50 edits; an
image only an older, dropped edit used is released and Undo past that ceiling cannot restore it
anyway.

## Paths

`src/media.ts`, `src/project.ts`, `src/components.tsx` (accept list), `src/App.tsx`,
`src/BackgroundImage.tsx`, `src/timeline-model.ts` (`backgroundImage`, `setBackgroundImage`,
`removeBackgroundImage`, `isReferenced`), scoped `.backdrop-image*` rules in `src/styles.css`,
`src/media.test.ts`, `src/project.test.ts`, `src/timeline-model.test.ts`,
`tests/background-image.spec.ts`, `tests/export.spec.ts`.

## Limits

The browser's file chooser dialog is not driven; the specs set the input's files. Animated WebP
beyond its first frame is not handled. The release test needs 52 edits past the 800 ms fold, so it
takes about a minute.
