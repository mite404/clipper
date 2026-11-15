# Usage: python3 update-master-4.py <REF-11 sha> <run> <REF-12 sha> <run> <REF-13 sha> <run>
# Records CLIP-9, REF-11, REF-12 and REF-13 as delivered and moves the queue on to CLIP-10.
import re, sys

r11, run11, r12, run12, r13, run13 = sys.argv[1:7]
p = 'docs/master-tickets.md'
s = open(p).read()
gh = 'https://github.com/mite404/clipper'


def c(sha):
    return f"[`{sha[:7]}`]({gh}/commit/{sha})"


def ci(run):
    return f"[CI {run}]({gh}/actions/runs/{run})"


def one(pattern, repl):
    global s
    s, n = re.subn(pattern, lambda m: repl, s)
    assert n == 1, (pattern, n)


def text(old, new):
    global s
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)


# Delivered rows: CLIP-9 after CLIP-8, the REF rows after REF-15.
m = re.search(r"\| CLIP-8 +\| Smooth, trim-aware cursor[^\n]*\n", s)
assert m
clip9 = (
    "| CLIP-9 | Editable zooms generated from recorded left clicks; each keeps a source anchor, so it "
    "stays with its footage through splits and ripple edits; manual zooms win collisions and survive "
    f"regeneration | {c('f3b30213dad8ee8d3a367d537b8cd507a6be7513')} | {ci('43771222108')}; 107 unit "
    "tests, preview and decoded-export focus agree, generated zooms survive save and reopen; "
    "synthetic fixtures only |\n"
)
s = s[: m.end()] + clip9 + s[m.end() :]
m = re.search(r"\| REF-15 +\| Export audio mix cost[^\n]*\n", s)
assert m
rows = (
    f"| REF-11 | A multi-file import names every file it could not read; the demo download gives up "
    f"after 15 s and frees what it loaded (#9, #37) | {c(r11)} | {ci(run11)}; both defects "
    "reproduced first |\n"
    f"| REF-12 | The logo no longer reloads the page; the browser is asked to confirm a reload or tab "
    f"close with unsaved edits or a running export; Open project asks before replacing unsaved edits "
    f"(#23) | {c(r12)} | {ci(run12)}; the handler is tested through a `beforeunload` event, the "
    "browser's own prompt was not observed (headless Chromium shows none) |\n"
    f"| REF-13 | CI compares the fallow baseline with the commit `main` held before the push, and no "
    f"run is cancelled by a later push (#4) | {c(r13)} | {ci(run13)}; in a throwaway clone the old "
    "base passed a two-commit push that grew the baseline, the new base failed it |\n"
)
s = s[: m.end()] + rows + s[m.end() :]

# Queue.
one(r"\| 1 +\| CLIP-9 +\| Editable zooms generated[^\n]*\n", "")
one(
    r"\| 2 +\| CLIP-10 \| Smooth follow framing[^\n]*\n",
    "| 1 | CLIP-10 | Smooth follow framing | Large | In progress | Reference features | nothing |\n",
)
for n in (11, 12, 13):
    one(rf"\| REF-{n} +\|[^\n]*\| Ready[^\n]*\n", "")
text("Blocked on CLIP-9 (shares `src/project.ts`)", "Blocked on CLIP-10 (shares `src/project.ts`)")
one(
    r"(\| REF-16 \| Undo takes one step per gesture and skips no-op edits +\| Medium \| )Ready +",
    "| REF-16 | Undo takes one step per gesture and skips no-op edits | Medium | "
    "Blocked on CLIP-10 (shares `change` in `src/App.tsx`) ",
)
text("### Files while CLIP-9 is in flight", "### Files while CLIP-10 is in flight")
text(
    "new zoom-generation module and its test;",
    "new follow module and its test; `src/zoom-generation.ts`, `src/AutoZoomControls.tsx`, "
    "`tests/auto-zoom.spec.ts`; `change` and `openProject` in `src/App.tsx`;",
)

# Capture acceptance: what CLIP-9 shipped, and whose word each rule rests on.
one(
    r"- Engineering defaults for CLIP-9, not owner decisions: a click pairs with the next mouseup and\n"
    r"  duplicate mouseups are ignored\. Unpaired clicks at the very end are left out of zoom generation as\n"
    r"  a heuristic, on the unverified guess that they are the click on Stop; an unpaired click elsewhere\n"
    r"  still counts\. Raw samples are never altered\.\n",
    """- Engineering rules in CLIP-9 as shipped, not owner decisions: a click pairs with the next mouseup,
  and repeated downs collapse into one until a release arrives. An unpaired click in the last 250 ms
  is left out of zoom generation as a heuristic, on the unverified guess that it is the click on
  Stop; an unpaired click elsewhere still counts. Raw samples are never altered.
- CLIP-9 applies no automatic clock or drift correction between video and sidecar. The
  reference-feature thread reports this follows a longer take checked on the Mac; the queue thread
  has not seen that evidence.
""",
)

# Decisions and limits.
text(
    "- Unsaved edits vanish on reload (REF-12 adds a warning; CLIP-38 adds persistence).",
    "- Unsaved edits vanish on reload. The browser asks first (REF-12); CLIP-38 adds persistence. Mute\n"
    "  changes and imported media do not count as unsaved, and after more than 50 edits, undoing all\n"
    "  50 kept steps reads as saved.",
)
text(
    "- CLIP-7 and CLIP-8 are proven on synthetic sidecars shaped like the real capture, not on the\n"
    "  capture itself.",
    "- CLIP-7, CLIP-8 and CLIP-9 are proven on synthetic sidecars shaped like the real capture, not on\n"
    "  the capture itself.",
)
open(p, 'w').write(s)
