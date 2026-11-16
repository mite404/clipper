# Usage: python3 update-master-8.py <REF-21 sha> <REF-21 CI run id>
# Records REF-21 as delivered, adds REF-26 (status bar below the fold) and the engineering choices
# made in REF-16 and REF-21. Follow with: npx prettier --write docs/master-tickets.md
import re, sys

r21, run21 = sys.argv[1:3]
p = 'docs/master-tickets.md'
s = open(p).read()
gh = 'https://github.com/mite404/clipper'


def one(pattern, repl):
    global s
    s, n = re.subn(pattern, lambda m: repl, s, flags=re.S)
    assert n == 1, (pattern, n)


def text(old, new):
    global s
    assert s.count(old) == 1, (old, s.count(old))
    s = s.replace(old, new)


m = re.search(r"\| REF-16 +\| A slider drag or a held key is one undo step[^\n]*\n", s)
assert m
ref21 = (
    "| REF-21 | Save refuses a project its file cannot hold (375 MB of media on the timeline) before "
    "reading any media, and import warns when the library passes that size; media no clip uses is "
    "left out and named when it cannot be read or does not fit; importing a file named like a "
    "source that can no longer be read repairs that source in place; export names the unreadable "
    f"file (#3, #28) | [`{r21[:7]}`]({gh}/commit/{r21}) | [CI {run21}]({gh}/actions/runs/{run21}); "
    "#28 was reproduced in Chromium for the first time: changing an imported file's modification "
    "time made Save fail although no clip used it; 122 unit tests and 39 browser checks, one with "
    "a 400 MB sparse file; seventeen deliberately broken versions all fail the tests |\n"
)
s = s[: m.end()] + ref21 + s[m.end() :]
one(
    r"\| REF-21 \| Save: size precheck with a clear message; unreadable or unused media cannot "
    r"block it[^\n]*\n",
    "| REF-26 | Messages are visible without scrolling: at 1440 by 1000 the page is 1098 px tall, "
    "so the footer status bar, the only place errors and warnings appear, is below the fold | "
    "Small | Ready | found during REF-21 |\n",
)
text(
    "`serializeProject` in `src/project.ts` and `importFiles` in `src/App.tsx` (REF-21);",
    "the footer and its styles (REF-26);",
)
one(
    r"(- Engineering choices in CLIP-10 as shipped, not owner decisions)",
    """- Engineering choices in REF-16 and REF-21 as shipped, not owner decisions. REF-16: changes to the
  same numeric values less than 800 ms apart are one undo step. REF-21: a re-import repairs an
  unreadable source by file name (the other remedy in #28, copying every file into memory at import,
  was not taken); Save still embeds unused library media whenever it fits and can be read, so what a
  reopened library contains is unchanged in the normal case; the limit is 375 MB of source bytes,
  which leaves an unmeasured 36 million characters for the edit and cursor sidecars.
- Engineering choices in CLIP-10 as shipped, not owner decisions""",
)
text(
    "memory, and Save fails outright near 400 MB of media (#3; REF-21, REF-22).",
    "memory. One project file holds 375 MB of media: Save refuses more with a message naming the "
    "limit, and Open has the same ceiling (#3; REF-22 removes it).",
)

# The owner's format choice for interchange, relayed by the Space on 2026-11-16.
one(
    r"(It rejects modern `\.fcpxml`, which Adobe documents as needing\s+conversion first\.\n)",
    """It rejects modern `.fcpxml`, which Adobe documents as needing conversion first.

The owner confirmed FCP7 XML (`.xml`) as the interchange format on 2026-11-16, in the Space, which
relayed it; the queue thread did not see his message. He named Premiere, Avid, Pro Tools, Logic,
Cubase and Resolve as the applications he intends it to work with. That list is an intention, not a
compatibility claim, and nothing has been tested in any of them. CLIP-31a to CLIP-31c stay scoped
to Premiere and to one exporter; AAF, OMF and dialect conversion are separate workflows outside
these tickets.

What each vendor's documentation says, as read by the design thread (the queue thread did not
recheck it). Missing documentation is not proof that an import fails.

| Application | Documented for FCP7 XML | Source |
| --- | --- | --- |
| Premiere Pro | Direct import; modern FCPXML needs conversion | [Adobe](https://helpx.adobe.com/premiere-pro/using/importing-xml-project-files-final.html) |
| DaVinci Resolve | Import, documented separately from FCPXML | [Resolve 21.1 manual](https://documents.blackmagicdesign.com/UserManuals/DaVinci_Resolve_21.1_Reference_Manual.pdf) |
| Avid Media Composer | Not found; the checked documentation covers AAF | [Avid](https://kb.avid.com/pkb/articles/en_US/Knowledge/How-to-export-an-AAF) |
| Pro Tools 2025.12 | Not found; documents AAF and OMF sequence import | [Reference guide](https://resources.avid.com/SupportFiles/PT/Pro_Tools_Reference_Guide_2025.12.pdf) |
| Cubase Pro 15 | Not found; documents AAF and OMF audio import | [Steinberg](https://www.steinberg.help/r/cubase-pro/15.0/en/cubase_nuendo/topics/exchanging_files_with_other_applications/exchanging_files_with_other_applications_aaf_files_c.html) |
| Logic Pro | Unclear: documents Final Cut XML audio exchange without naming the FCP7 dialect | [Apple](https://support.apple.com/guide/logicpro/final-cut-pro-xml-files-lgcp9b2d2456/mac) |
""",
)
one(
    r"(- D-6, the eight hosted capture images:)",
    """- Interchange format: FCP7 XML (`.xml`). The owner confirmed it in the Space on 2026-11-16, relayed
  to the queue thread. Which applications can open it is not settled; see
  [CLIP-31a to CLIP-31c](#clip-31a-to-clip-31c-premiere-xml-export).
- D-6, the eight hosted capture images:""",
)
open(p, 'w').write(s)
