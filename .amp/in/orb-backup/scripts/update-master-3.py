# Usage: python3 update-master-3.py <REF-10 sha> <REF-10 CI run id>
import re, sys
ref10_sha, ref10_run = sys.argv[1:3]
p='docs/master-tickets.md'; s=open(p).read()
def one(pattern, repl):
    global s
    s, n = re.subn(pattern, lambda m: repl, s)
    assert n == 1, (pattern, n)
gh='https://github.com/mite404/clipper'
def c(sha): return f"[`{sha[:7]}`]({gh}/commit/{sha})"
def ci(run): return f"[CI {run}]({gh}/actions/runs/{run})"
m=re.search(r"\| REF-8 +\| Mouse-marking mode ends[^\n]*\n", s); assert m
rows=f"""| REF-9 | Timecode, playhead and frame buttons match the frame the player holds after a pause (#21) | {c('7661750f49e4283266311365ad93238bfc079584')} | {ci('43767536538')}; reproduced first: readout showed frame 6 while the player held frame 9 |
| REF-10 | Trim grip: a click commits nothing; a release trims the clip as it is then (#15, #38) | {c(ref10_sha)} | {ci(ref10_run)}; both defects reproduced first |
"""
s=s[:m.end()]+rows+s[m.end():]
one(r"\| REF-9 +\| Timecode and frame-step buttons[^\n]*\| Ready[^\n]*\n", "")
one(r"\| REF-10 +\| Trim grip[^\n]*\| Ready[^\n]*\n", "")
one(r"- OpenScreen is the first capture route \(was D-3\)\.",
"""- Left clicks first: get OpenScreen's left-click flow working before right clicks, which are later
  "extra credit". The owner wrote this in the
  [capture research thread](https://ampcode.com/threads/T-6578f0a7-c740-4be3-b2f6-d9f39bdf1ecc)
  on 2026-11-15 at 22:06:51 UTC. He has not decided anything about sample rate, click pairing or
  cursor scaling; those are engineering defaults, listed under the capture acceptance.
- OpenScreen is the first capture route (was D-3).""")
one(r"- Compatibility claim: OpenScreen 2\.2\.2, macOS, full display, scale 1\.",
"""- Engineering defaults for CLIP-9, not owner decisions: a click pairs with the next mouseup and
  duplicate mouseups are ignored. Unpaired clicks at the very end are left out of zoom generation
  as a heuristic, on the unverified guess that they are the click on Stop; an unpaired click
  elsewhere still counts. Raw samples are never altered.
- Cursor bitmaps are drawn at their pixel size. Whether size and hotspot should be divided by
  `scaleFactor` is unknown: OpenScreen 2.2.2 (`d7adf05`) declares the field in
  `src/native/contracts.ts` without drawing semantics, and its macOS renderer draws its own theme
  sprites, not captured bitmaps. The real capture has scale 1 only, so no rule was added.
- Compatibility claim: OpenScreen 2.2.2, macOS, full display, scale 1.""")
open(p,'w').write(s)
