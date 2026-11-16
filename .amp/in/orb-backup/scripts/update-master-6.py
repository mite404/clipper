# Usage: python3 update-master-6.py <REF-25 sha> <REF-25 CI run id>
# Records CLIP-10 and REF-25 as delivered, moves the queue on to CLIP-11 and frees the REF tickets
# that waited on CLIP-10.
import re, sys

r25, run25 = sys.argv[1:3]
p = 'docs/master-tickets.md'
s = open(p).read()
gh = 'https://github.com/mite404/clipper'
mac = 'https://ampcode.com/threads/T-01a1dff4-ed93-7367-826e-b99beda09a43'


def c(sha):
    return f"[`{sha[:7]}`]({gh}/commit/{sha})"


def ci(run):
    return f"[CI {run}]({gh}/actions/runs/{run})"


def one(pattern, repl):
    global s
    s, n = re.subn(pattern, lambda m: repl, s, flags=re.S)
    assert n == 1, (pattern, n)


def text(old, new):
    global s
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)


# Delivered rows.
m = re.search(r"\| CLIP-9 +\| Editable zooms generated from recorded left clicks[^\n]*\n", s)
assert m
clip10 = (
    "| CLIP-10 | Smooth follow framing: a zoom can follow the recorded cursor with a dead zone, "
    "the same in preview and export; generated zooms default to Focused | "
    f"{c('c2a6be013164ba289944551f1eaf704c155a9fb1')} | {ci('43778344010')}; the worker reports 112 "
    "unit tests, 35 browser checks including decoded-frame follow cases, and 10 of 10 throttled "
    "playback runs; synthetic fixtures only |\n"
)
s = s[: m.end()] + clip10 + s[m.end() :]
m = re.search(r"\| CAPTURE-1 +\| Manual OpenScreen sidecar checks[^\n]*\n", s)
assert m
ref25 = (
    "| REF-25 | `src/timeline.ts` is now `src/timeline-model.ts`, so no two files differ only by "
    f"case; CI refuses such names | {c(r25)} | {ci(run25)}; with imports resolved as a "
    "case-insensitive disk resolves them, the old tree gives the Mac's TS2305 and TS1149 errors and "
    "the new tree gives none; not yet rerun on the Mac itself |\n"
)
s = s[: m.end()] + ref25 + s[m.end() :]

# Queue: CLIP-11 is next in the reference lane; the REF tickets that waited on CLIP-10 are ready.
one(
    r"\| 1 +\| CLIP-10 \| Smooth follow framing; work in progress[^\n]*\n",
    "| 1 | CLIP-11 | Cursor appearance and behavior: style, idle hide, loop return, shake removal | "
    "Medium | In progress | Reference features | nothing |\n",
)
one(r"\| REF-25 +\| `src/Timeline\.tsx` and `src/timeline\.ts` collide[^\n]*\n", "")
text("Blocked on CLIP-10 (shares `change` in `src/App.tsx`)", "Ready")
text("Blocked on CLIP-10 (shares `src/project.ts`)", "Ready")
one(r"\| CLIP-11 \| Cursor appearance and advanced behavior[^\n]*\n", "")
text("## Feature backlog after CLIP-10", "## Feature backlog after CLIP-11")
text("### Files while CLIP-10 is in flight", "### Files while CLIP-11 is in flight")
one(
    r"\| Reference features +\| new follow module and its test;[^\n]*\n",
    "| Reference features | `src/cursor*.ts`, `src/CursorControls.tsx`, `tests/cursor*.spec.ts`, "
    "their stories and styles; additions to `parseProject` for new cursor settings |\n",
)
one(
    r"\| Queue thread +\| `src/stage\.ts` and its test, the rest of `src/export\.ts`[^\n]*\n",
    "| Queue thread | `change` and `undo` in `src/App.tsx` (REF-16); `serializeProject` in "
    "`src/project.ts` (REF-21); `src/stage.ts`, `src/export.ts`, `src/media.ts`, `src/Timeline.tsx`, "
    "`tests/export.spec.ts`, `tests/performance.spec.ts` |\n",
)
text(
    "| `wip/clip-10-smooth-follow`           | CLIP-10 in progress; the reference-feature thread "
    "keeps it current       |",
    "| `wip/clip-10-smooth-follow` | CLIP-10 before it landed; redundant now |",
)

# Whose word the CLIP-10 numbers rest on.
one(
    r"(- CLIP-9 applies no automatic clock or drift correction)",
    """- Engineering choices in CLIP-10 as shipped, not owner decisions: follow half-lives of 100 and
  300 ms, a dead zone of 20% of the viewport half extent, and Focused as the default for generated
  zooms.
- CLIP-9 applies no automatic clock or drift correction""",
)
text(
    "- CLIP-7, CLIP-8 and CLIP-9 are proven on synthetic sidecars shaped like the real capture, not on",
    "- CLIP-7 to CLIP-10 are proven on synthetic sidecars shaped like the real capture, not on",
)
one(
    r"\| D-7 \| CLIP-8 is on `main`: import the real OpenScreen recording into Clipper on the Mac "
    r"and check the cursor lines up with the video +\|",
    "| D-7 | CLIP-7 to CLIP-10 are on `main`: import a real OpenScreen recording into Clipper on the "
    "Mac, generate zooms, and check that the cursor, the zooms and the follow framing line up with "
    "the video |",
)
open(p, 'w').write(s)

# Owner decisions of 2026-11-16, written in the queue thread: the Mac capture thread is deleted,
# the project is switched to GitHub, and the redundant WIP branch may go.
s = open(p).read()
s, n = re.subn(r"\[([^\]]+)\]\(" + re.escape(mac) + r"\)", lambda m: m.group(1), s)
assert n >= 2, n
text(
    "- The authoritative repository is `https://github.com/mite404/clipper.git`. The Amp-hosted project\n"
    "  repository is still the empty scaffold by the owner's choice, so every new worker must fetch\n"
    "  GitHub explicitly.",
    "- The repository is `https://github.com/mite404/clipper.git`. The Amp project has used it as its\n"
    "  primary repository since 2026-11-16; the Amp-hosted scaffold is gone.",
)
one(r"\| `wip/ref-17-19-export-gate-edit-keys` \|[^\n]*\n", "")
one(
    r"The checkpoint found nothing only on the Amp-hosted repository:.*?so the project is still Amp-hosted\.\n",
    """The checkpoint found nothing only on the Amp-hosted repository: its one ref, `main` at `0b11477`,
was two empty commits that GitHub `main` contains. The owner confirmed the switch on 2026-11-16 and
the project now maps to GitHub. `wip/ref-17-19-export-gate-edit-keys` was deleted with his consent
after both of its commits were on `main`.
""",
)
text(
    "BOOT-1 is on `main` but\ndoes not run for new orbs, because new orbs clone the Amp-hosted scaffold.",
    "BOOT-1 is on `main`.\nWhether it runs for new orbs now that they clone GitHub has not been checked.",
)
one(r"\| D-6 \|[^\n]*\n", "")
text(
    "- The Amp project keeps its Amp-hosted primary repository for now, so new workers fetch GitHub\n"
    "  explicitly.",
    """- The Amp project's primary repository is GitHub. The owner wrote "confirmed" in the queue thread on
  2026-11-16, and `amp projects get` shows the project mapped to `mite404/clipper`.
- D-6, the eight hosted capture images: the owner deleted the Mac capture thread on 2026-11-16. The
  queue thread confirmed that the thread can no longer be read. It cannot check whether Amp's
  storage still holds the eight attachment files.""",
)
one(
    r'  "nothing was uploaded" statements\..*?keep the facts\.\n',
    """  "nothing was uploaded" statements. The owner has since deleted that thread (D-6, settled below),
  so its transcript is gone; this file and `tests/openscreen/README.md` keep the findings.
""",
)
text(
    "and the\nMac capture check (three real",
    "and the\nMac capture check, a thread on the owner's Mac that he has since deleted (three real",
)
text("derived images are\nhosted, see", "derived images were\nhosted, see")
text(
    "  The clock offset between video and sidecar, Retina scale, window capture, cropping and multiple\n"
    "  displays are unmeasured.",
    "  Retina scale, window capture, cropping and multiple displays are unmeasured.",
)
open(p, 'w').write(s)
