# Usage: python3 update-master-7.py <REF-16 sha> <REF-16 CI run id>
# Records REF-16 as delivered, adds the still-image scope to CLIP-20 and the Premiere XML proposals
# (CLIP-31a to CLIP-31c) under CLIP-31. Follow with: npx prettier --write docs/master-tickets.md
import re, sys

r16, run16 = sys.argv[1:3]
p = 'docs/master-tickets.md'
s = open(p).read()
gh = 'https://github.com/mite404/clipper'
proto = 'https://github.com/mite404/sequence-spear-fish/blob/4f646d2ab3ef91dbfacb1f19ba37e670bd7f39c5'
reuse_thread = 'https://ampcode.com/threads/T-01a1ddd8-535c-7129-a7d7-9a0c28f41449'
reuse_doc = 'https://ampcode.com/artifacts/clipper-reuse-research-95b08ad7-f0ce-477e-acbd-9e9da46d4319'
xml_thread = 'https://ampcode.com/threads/T-52bd93c4-0eb5-46f3-ae30-0d2ff60a23ff'
xml_doc = 'https://ampcode.com/artifacts/premiere-xml-export-design-6703a309-dcf9-45cc-bfd4-fd84d677159a'


def one(pattern, repl):
    global s
    s, n = re.subn(pattern, lambda m: repl, s, flags=re.S)
    assert n == 1, (pattern, n)


def text(old, new):
    global s
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)


# REF-16 delivered.
m = re.search(r"\| REF-19 +\| One browser journey for Delete[^\n]*\n", s)
assert m
ref16 = (
    "| REF-16 | A slider drag or a held key is one undo step, and an edit that changes nothing is "
    "not a step, so one drag no longer pushes earlier edits out of the 50-step history (#5) | "
    f"[`{r16[:7]}`]({gh}/commit/{r16}) | [CI {run16}]({gh}/actions/runs/{run16}); 119 unit tests "
    "and 37 browser checks; nine of ten deliberately broken versions failed the tests, the tenth "
    "led to one more test case; the 50-step limit now has a browser test |\n"
)
s = s[: m.end()] + ref16 + s[m.end() :]
one(r"\| REF-16 \| Undo takes one step per gesture and skips no-op edits[^\n]*\n", "")
text(
    "`change` and `undo` in `src/App.tsx` (REF-16); `serializeProject` in `src/project.ts` (REF-21);",
    "`serializeProject` in `src/project.ts` and `importFiles` in `src/App.tsx` (REF-21);",
)

# Evidence-only threads.
text(
    "Evidence-only threads:\n",
    "Evidence-only threads:\n"
    f"[reuse research]({reuse_thread}) (what the owner's `sequence-spear-fish` prototype can lend),\n"
    f"[Premiere XML design]({xml_thread}) (proposals CLIP-31a to CLIP-31c),\n",
)

# Backlog: sources, the Premiere rows and the two scoped subsections.
text(
    "Every row is a proposal from the reference backlog, which holds the source links. The default order\n"
    "is numeric, skipping rows with a gate. Nothing here is delivered.",
    "Every row is a proposal. Rows come from the reference backlog, which holds the source links,\n"
    "unless a subsection below names another source. The default order is numeric, skipping rows with a\n"
    "gate. Nothing here is delivered.",
)
one(
    r"\| CLIP-20 \| Background wallpaper, gradient, color, image, inset, shadow +\| REF-1 +\|\n",
    "| CLIP-20 | Background wallpaper, gradient, color, image, inset, shadow; the image part is "
    "scoped [below](#clip-20-still-image-background) | REF-1 |\n",
)
m = re.search(r"\| CLIP-31 +\| Final Cut and After Effects interchange[^\n]*\n", s)
assert m
s = (
    s[: m.end()]
    + "| CLIP-31a | Premiere: prove a synthetic FCP7 XML import contract in a real Premiere | "
    "a real Premiere installation (D-9) |\n"
    "| CLIP-31b | Premiere: export an editable XML sequence with reviewed source paths | "
    "CLIP-31a; a push slot for its `App.tsx` change |\n"
    "| CLIP-31c | Premiere: qualify the file Clipper downloads in a named Premiere build | "
    "CLIP-31b; a real Premiere installation (D-9) |\n"
    + s[m.end() :]
)

sections = f"""### CLIP-20: still-image background

Scope and acceptance for the image part of CLIP-20, added on 2026-11-16. The
[reuse research thread]({reuse_thread}) relayed it as the owner's explicit request; the queue thread
did not see the owner's message itself. Ticket maintenance only: CLIP-20 keeps its place, its REF-1
gate and its other parts (wallpaper, gradient, color, inset, shadow). Not started.

Outcome: import a local still image as the composition background. The file stays in the browser.

Accepted when:

- A background image can be chosen, replaced and removed.
- It fills the stage behind the screen and camera panels with an aspect-preserving cover fit.
- Preview and exported video place it the same way.
- Project save and reopen keep the background together with the media.
- An unsupported or corrupt image fails with a visible message and leaves the previous background
  in place.
- A replaced or removed background releases its object URL and decoded image.
- Checked with landscape, portrait and alpha-bearing images, and with export and save round trips.

First formats: PNG, JPEG and WebP, decoded by the browser.

Outside this ticket: animated images, still images as timeline clips, remote image URLs, and any
change to the original visual direction.

Reuse: adapt the `Image.decode()` and object-URL lifecycle from the owner's prototype,
[`src/routes/+page.svelte` lines 46 to 75]({proto}/src/routes/+page.svelte#L46-L75) (decode first,
swap only on success, revoke the superseded or failed blob URL). The queue thread read those lines.
Do not port its Svelte page or its compositor, which stretches every source to the frame. The
prototype has no license file; reuse rests on it being the owner's own repository. Details are in
the [reuse research]({reuse_doc}).

Facts about `main` that bear on it, read by the queue thread: the stage background is one fixed
color today (`drawFrame` in `src/export.ts`), `Edit` has no background field, and `src/media.ts`
reads video and audio only. Saving the background therefore adds to the project format, which is a
decision for the implementer to raise before code.

### CLIP-31a to CLIP-31c: Premiere XML export

Proposals from the [Premiere XML design]({xml_doc}), written by its
[research thread]({xml_thread}) on 2026-11-16 at the owner's request, relayed by the Space. They
narrow CLIP-31 to Premiere; CLIP-31 itself stays a proposal. Nothing is implemented, and no file
has been opened in Premiere. No compatibility is claimed until CLIP-31c passes.

The design recommends Final Cut Pro 7 XML (`<xmeml version="5">`, a `.xml` file), which Adobe
documents as a direct import. It rejects modern `.fcpxml`, which Adobe documents as needing
conversion first.

| Ticket   | Outcome | Needs | Files |
| -------- | ------- | ----- | ----- |
| CLIP-31a | A synthetic XML fixture and the exact import contract Premiere accepts: cut frames, gaps, independent mono and stereo audio, mute, music gain, file paths, relinking after a move, duplicate file names, and which frame rates must be refused | A real Premiere installation; the design targets Premiere Pro 26.x on macOS and records the exact build | New `tests/interchange/` and `docs/premiere-xml.md` |
| CLIP-31b | One downloaded XML that keeps the proven cuts and audio, with a dialog where the user reviews the path of every used source and acknowledges what is left out | CLIP-31a; a push slot | New `src/premiere-xml.ts`, `src/XmlExportDialog.tsx`, their tests and story, `tests/xml-export.spec.ts`; a small `src/App.tsx` action |
| CLIP-31c | The file Clipper really downloads imports with the right media, cuts, audio and relink behavior in a named Premiere build | CLIP-31b; a real Premiere installation | Extends `tests/interchange/`, `tests/xml-export.spec.ts`, `docs/premiere-xml.md` |

Limits the design states, which the tickets keep:

- The browser never learns a source file's path, only its name. The user supplies a media root and
  per-source paths; the XML references the originals and does not carry them. Moved files are
  relinked in Premiere.
- The first release is cuts and audio only. Panel layout, rounded masks, crops, the cursor, zooms
  and follow framing are left out, and the dialog says so. The imported sequence will not look like
  Clipper's preview.
- Only 30 fps constant-rate video with mono or stereo audio at first. Other rates and variable-rate
  sources are refused with the reason, not relabeled as 30 fps.
- The prototype holds an EDL plan and no exporter code, so what carries over is its rules
  (integer-frame timing, stable source identity, validate before download), not code.
- CLIP-31b does not touch `serializeProject`, `src/media.ts`, `src/export.ts` or the cursor modules,
  and does not change the saved project format.

"""
text(
    "Native-only Screen Studio settings (camera effects, notifications, Dock, licensing, diagnostics) are\n",
    sections
    + "Native-only Screen Studio settings (camera effects, notifications, Dock, licensing, diagnostics) are\n",
)

# Owner decision: who can run Premiere.
m = re.search(r"\| D-8 \|[^\n]*\n", s)
assert m
d9 = (
    "| D-9 | CLIP-31a and CLIP-31c need someone to import files into a real Premiere Pro and report "
    "what it shows. Is Premiere installed on the Mac, and which version? | CLIP-31a to CLIP-31c stay "
    "proposals; no Premiere compatibility is claimed |\n"
)
s = s[: m.end()] + d9 + s[m.end() :]
open(p, 'w').write(s)
