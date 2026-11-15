import re
p='docs/master-tickets.md'; s=open(p).read()
def one(pattern, repl, flags=0):
    global s
    s, n = re.subn(pattern, lambda m: repl, s, flags=flags)
    assert n == 1, (pattern, n)
gh='https://github.com/mite404/clipper'
def c(sha): return f"[`{sha[:7]}`]({gh}/commit/{sha})"
def ci(run): return f"[CI {run}]({gh}/actions/runs/{run})"
# rules
one(r"- `\.fallow-health-baseline\.json` only shrinks\. Put new logic in new modules with small functions\.\n",
"""- `.fallow-health-baseline.json` only shrinks. Put new logic in new modules with small functions.
- A push gate audits the working tree as well as the commit. Push from a clean tree: stash or
  commit work in progress first.
- Author and committer are `Ethan Anderson <150651098+mite404@users.noreply.github.com>` and
  nothing else. Check both with `git log --format='%ae %ce' -1` before every push. A rebase takes
  the committer from `git config`, so set `user.email` in every checkout.
""")
# file ownership
one(r"### Files while CLIP-7 is in flight\n\n(\|[^\n]*\n)+",
"""### Files while CLIP-8 is in flight

| Owner | Paths |
| --- | --- |
| Reference features | new `src/cursor-motion.ts` and its test; `src/cursor.ts`, `src/CursorControls.tsx`, `src/cursor.fixture.ts`, `tests/cursor.spec.ts`; the preview in `src/Composition.tsx`; `drawFrame` in `src/export.ts`; additions to `src/Editor.stories.tsx` and `src/styles.css` |
| Queue thread | `src/stage.ts`, `src/timeline.ts`, their tests, `src/project.ts` and `src/project.test.ts` (REF-4), the rest of `src/export.ts`, `tests/export.spec.ts`, `tests/performance.spec.ts` |
| Shared, keep edits small | `src/App.tsx`, other `tests/**`, `package.json`, `playwright.config.ts`, `.github/workflows/ci.yml`, `README.md` |
""")
# delivered rows
m=re.search(r"\| DOC-1 [^\n]*\n", s); assert m
rows=f"""| REF-5 | Split never mints a duplicate clip ID (#13) | {c('42324e3623a56c6421b99bc9106b088fd28add4f')} | {ci('43762022693')} |
| REF-2 | `covers` and `sourceFrame` helpers for timeline-to-source time (#22) | {c('e2ad4b8b3380a73fac2e269c820c9e6381655759')} | {ci('43762301972')} |
| CLIP-7 | Import, validate and persist OpenScreen pointer sidecars per source asset | {c('e9f99fce4a02be914b6f6d8cb387c152326d737b')} | {ci('43762946342')}; proven on synthetic fixtures only, see [Known limits](#known-limits) |
| REF-1 | One `src/stage.ts` for mask rects, cover crop and zoom projection; preview pan pinned (#1, #17) | {c('4cc07610fb7f027324aab54287f2c1f1c7bc72a0')} | {ci('43763390689')}; preview screenshots byte-identical before and after |
| REF-3 | `drawFrame` seam in the exporter, pooled decode canvases (#26, #25) | {c('64e5578c79f0195a3170538048efe6ce99c4b983')} | {ci('43763669090')}; pooled and unpooled decode matched on 180 frames |
| VERIFY-2 | Retired `control-clipper.sh`; feature files use `verify.mjs`; story tally removed | {c('de27f06c96166824c174dc82a9a8f8c214ca2029')} | {ci('43764263393')}; the three helper defects were reproduced first |
| REF-4 | Zoom limits and overlap rule in `src/timeline.ts`, enforced by the project parser; ramp and pan pinned (#8, #10, #12) | {c('43cb368907755de265ea2a830761754965cb267d')} | {ci('43764564172')} |
"""
s=s[:m.end()]+rows+s[m.end():]
# queue table
one(r"\| Order \| Ticket[^\n]*\n(\|[^\n]*\n)+",
"""| Order | Ticket | What | Risk | Status | Owner | Needs |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | CLIP-8 | Smooth, trim-aware cursor in preview and export | Medium | In progress | Reference features | nothing |
| 2 | REF-6 | Performance gate fails on stalls, not only p95 (#16) | Medium | In progress | Queue thread | nothing |
| 3 | CLIP-9 | Editable zooms generated from recorded clicks, placed through `ZOOM_LIMITS` and `zoomsOverlap` | Medium | Ready | Reference features | nothing; follows CLIP-8 in the same lane |
| 4 | CLIP-10 | Smooth follow framing | Large | Blocked | Reference features | CLIP-8, CLIP-9, REF-6 |
| - | CLIP-7b | Screen Studio `mousemoves`/`mouseclicks` metadata import | Medium | Decision | Reference features | D-4 |
""")
one(r"Medium \| Blocked on CLIP-7 +\|", "Medium | Ready |")
# VERIFY-2 leaves the non-blocking table
one(r"\| VERIFY-2 +\| Retire or repair[^\n]*\n", "")
# decisions: owner action for real-capture check
m=re.search(r"\| D-6 \|[^\n]*\n", s); assert m
s=s[:m.end()]+"| D-7 | After CLIP-8 lands, import the real OpenScreen recording into Clipper on the Mac and check the cursor lines up with the video | Compatibility with real recordings stays unclaimed; work continues on synthetic fixtures |\n"+s[m.end():]
m=re.search(r"\| D-7 \|[^\n]*\n", s); assert m
s=s[:m.end()]+"| D-8 | Three commits on public `main` carry a personal email address instead of the noreply address: `2bb8263` and `de27f06` (author and committer) and `e9f99fc` (committer). Rewrite `main` from `2bb8263` with a force-push to replace it? | Not rewritten: a force-push changes every later commit ID and needs the owner's approval. The old commits would stay fetchable on GitHub by ID until GitHub Support purges them. Both workers have fixed their config |\n"+s[m.end():]
one(r"- No real cursor recording has been imported into Clipper yet\.", "- CLIP-7 is proven on synthetic sidecars shaped like the real capture, not on the capture itself.\n- No real cursor recording has been imported into Clipper yet.")
open(p,'w').write(s)
