# Usage: python3 update-master-2.py <REF-8 sha> <REF-8 CI run id>
import re, sys
ref8_sha, ref8_run = sys.argv[1:3]
p='docs/master-tickets.md'; s=open(p).read()
def one(pattern, repl):
    global s
    s, n = re.subn(pattern, lambda m: repl, s)
    assert n == 1, (pattern, n)
gh='https://github.com/mite404/clipper'
def c(sha): return f"[`{sha[:7]}`]({gh}/commit/{sha})"
def ci(run): return f"[CI {run}]({gh}/actions/runs/{run})"
m=re.search(r"\| REF-4 +\| Zoom limits[^\n]*\n", s); assert m
rows=f"""| REF-6 | Playback gate fails on a stall: worst frame and worst long task bounded at 500 ms (#16) | {c('7fa2e4379593254a8d77c9d54512a8d2b7d1d003')} | {ci('43765213526')}; an injected 2-second freeze failed all five repetitions |
| REF-7 | Ctrl, Cmd and Alt chords no longer split, delete, seek or drive the transport (#7) | {c('de0d0591b58bd3e6fa6e5245beeb5388c5601896')} | {ci('43765744937')} |
| CLIP-8 | Smooth, trim-aware cursor in preview and export, with raw mode, size and visibility | {c('1195cdaea0d94d99b9181c896a6b2264473216c0')} | {ci('43766525052')}; decoded cursor pixels checked across a cut, source offset, crop, swap and zoom; synthetic fixtures only |
| REF-8 | Mouse-marking mode ends when its zoom is removed, undone or deselected (#6) | {c(ref8_sha)} | {ci(ref8_run)} |
"""
s=s[:m.end()]+rows+s[m.end():]
one(r"\| Order \| Ticket[^\n]*\n(\|[^\n]*\n)+",
"""| Order | Ticket | What | Risk | Status | Owner | Needs |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | CLIP-9 | Editable zooms generated from recorded clicks, placed through `ZOOM_LIMITS` and `zoomsOverlap`; generated zooms carry an optional source anchor | Medium | In progress | Reference features | nothing |
| 2 | CLIP-10 | Smooth follow framing | Large | Blocked | Reference features | CLIP-9 |
| - | CLIP-7b | Screen Studio `mousemoves`/`mouseclicks` metadata import | Medium | Decision | Reference features | D-4 |
""")
one(r"\| REF-7 +\| Modified keys[^\n]*\n", "")
one(r"\| REF-8 +\| Mouse-marking mode ends[^\n]*\| Ready[^\n]*\n", "")
one(r"(?<=Medium \| )Ready( +\| #3, #28)", "Blocked on CLIP-9 (shares `src/project.ts`) | #3, #28")
one(r"### Files while CLIP-8 is in flight\n\n(\|[^\n]*\n)+",
"""### Files while CLIP-9 is in flight

| Owner | Paths |
| --- | --- |
| Reference features | new zoom-generation module and its test; `src/timeline.ts`, `src/project.ts` and their tests; `src/cursor*.ts`, `src/CursorControls.tsx`, `tests/cursor*.spec.ts`; the preview in `src/Composition.tsx`; `drawFrame` in `src/export.ts`; additions to `src/Editor.stories.tsx` and `src/styles.css` |
| Queue thread | `src/stage.ts` and its test, the rest of `src/export.ts`, `src/media.ts`, `src/Timeline.tsx`, `tests/export.spec.ts`, `tests/performance.spec.ts` |
| Shared, keep edits small | `src/App.tsx`, other `tests/**`, `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `README.md` |
""")
one(r"\| D-7 \| After CLIP-8 lands, import", "| D-7 | CLIP-8 is on `main`: import")
one(r"- CLIP-7 is proven on synthetic sidecars", "- CLIP-7 and CLIP-8 are proven on synthetic sidecars")
open(p,'w').write(s)
