# Usage: python3 update-master-5.py <REF-19 sha> <REF-19 CI run id>
# Records REF-17, REF-19 and the Mac thread's tests/openscreen commit, the preservation branches,
# the wider D-6 (eight hosted images) and the new macOS case-collision ticket REF-25.
import re, sys

r19, run19 = sys.argv[1:3]
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


# Delivered.
m = re.search(r"\| REF-13 +\| CI compares the fallow baseline[^\n]*\n", s)
assert m
rows = (
    f"| REF-17 | Export pixel gate scores the camera and screen panels separately, and a new test "
    f"checks the exact source frame of every exported frame on both tracks (#31) | "
    f"{c('4ed307dccc0b753a676612d8e09d47cb43ef73af')} | {ci('43776617847')}; five deliberately "
    "broken exporters fail it, two of which the old gate passed |\n"
    f"| REF-19 | One browser journey for Delete, Backspace, the undo chord, Space, seek clamping at "
    f"both ends and the overlapping-zoom refusal (#20) | {c(r19)} | {ci(run19)}; eight "
    "deliberately broken editors fail it; the 50-step undo limit is left for REF-16 |\n"
    f"| CAPTURE-1 | Manual OpenScreen sidecar checks under `tests/openscreen/`, not part of CI | "
    f"{c('d72d33c05d1a2213f6d0b6e662fb6907c6a425c1')} | {ci('43776958967')}; pushed by the "
    f"[Mac capture thread]({mac}) at the owner's request, outside the push slot and with the "
    "pre-commit hook skipped (see REF-25); inspected afterwards: four text files, no capture data |\n"
)
s = s[: m.end()] + rows + s[m.end() :]

# Queue.
for n in (17, 19):
    one(rf"\| REF-{n} +\|[^\n]*\| Ready[^\n]*\n", "")
one(
    r"\| 1 +\| CLIP-10 \| Smooth follow framing +\| Large +\| In progress \|",
    "| 1 | CLIP-10 | Smooth follow framing; work in progress is on `wip/clip-10-smooth-follow` | "
    "Large | In progress |",
)
m = re.search(r"\| REF-16 +\| Undo takes one step per gesture[^\n]*\n", s)
assert m
s = (
    s[: m.start()]
    + "| REF-25 | `src/Timeline.tsx` and `src/timeline.ts` collide on a case-insensitive disk, so "
    "typecheck, dead-code and the pre-commit hook fail on macOS; rename one | Small | Blocked on "
    f"CLIP-10 (shares imports in `src/App.tsx`) | [Mac capture thread]({mac}) |\n"
    + s[m.start() :]
)

# Preservation branches and the state of the repository switch.
text(
    "## Status key\n",
    """### Preservation branches

Made on 2026-11-15 before the Amp project's switch to GitHub. They are not for merging and are
deleted only on the owner's word.

| Branch                                | Holds                                                                    |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `wip/clip-10-smooth-follow`           | CLIP-10 in progress; the reference-feature thread keeps it current       |
| `wip/ref-17-19-export-gate-edit-keys` | REF-17 and REF-19 before they landed; redundant now                      |
| `wip/queue-thread-resume-files`       | The queue thread's helper scripts and raw review output, ignored on main |

The checkpoint found nothing only on the Amp-hosted repository: its one ref, `main` at `0b11477`,
is two empty commits that GitHub `main` contains. The owner cancelled the first switch attempt and
asked to hold, so the project is still Amp-hosted.

## Status key
""",
)

# What the Mac thread measured and what it uploaded.
text(
    "(one real\nOpenScreen recording; the video and sidecar were not transferred, but four derived "
    "images are\nhosted, see [Known limits](#known-limits)).",
    "(three real\nOpenScreen recordings; the videos and sidecars were not transferred, but eight "
    "derived images are\nhosted, see [Known limits](#known-limits)).",
)
one(
    r"- CLIP-9 applies no automatic clock or drift correction between video and sidecar\. The\n"
    r"  reference-feature thread reports this follows a longer take checked on the Mac; the queue thread\n"
    r"  has not seen that evidence\.\n",
    """- CLIP-9 applies no automatic clock or drift correction between video and sidecar. The Mac capture
  thread measured no drift over a 139 s take and a median offset of 7 ms, with about one frame of
  jitter; its method and result are in `tests/openscreen/README.md`. The queue thread has read that
  record, not the recording.
""",
)
one(
    r"\| D-6 \|[^\n]*\n",
    "| D-6 | Eight images derived from the real captures are hosted as Amp attachments in the Mac "
    "capture thread, one of them a full-size screen frame | Decided: the owner wrote \"Delete the "
    "eight hosted capture images\" there on 2026-11-15 at 23:56:13 UTC. Not carried out yet: no "
    "agent tool can delete a thread attachment, so the owner removes them through Amp support or by "
    "deleting that thread. The Mac thread reports the 15 local image copies deleted |\n",
)
one(
    r"- Privacy state of that recording:.*?Nothing has been deleted \(D-6\)\.\n",
    """- Privacy state of the recordings: the videos and `.cursor.json` sidecars were read only on the Mac
  and were not uploaded or transferred. Eight derived images did become hosted Amp attachments when
  the Mac capture thread viewed them: three 200x200 crops at click times and one sheet of the three
  cursor bitmaps from the first recording, one full 3440x1440 frame and one half-size frame from
  the second, and two half-size frames from the third. That thread's transcript also holds text
  describing the crops and nine click and mouseup samples. This contradicts the thread's own
  "nothing was uploaded" statements. The owner has decided to delete the hosted images, and they
  still exist until he does it (D-6). Deleting that thread also removes the first-hand record
  behind the capture acceptance above; this file and `tests/openscreen/README.md` keep the facts.
""",
)
open(p, 'w').write(s)
