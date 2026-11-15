#!/bin/bash
# Proves the REF-19 journey fails on broken editor keys. Run from the code worktree with a dev server at $BASE_URL.
run() { BASE_URL=${BASE_URL:-http://127.0.0.1:5199} npx playwright test tests/editor.spec.ts --project editor -g "deletes and restores" --reporter=line 2>&1 | grep -aE "^\s+> |passed|failed" | cut -c1-150; }
mutant() { # name old new (in src/App.tsx)
  echo "== $1"; cp src/App.tsx /tmp/mutant.bak
  python3 - "$2" "$3" <<'PY'
import sys
a,b=sys.argv[1:3]; p='src/App.tsx'; s=open(p).read(); assert s.count(a)==1,(a,s.count(a)); open(p,'w').write(s.replace(a,b))
PY
  sleep 1; run; cp /tmp/mutant.bak src/App.tsx
}
mutant "Delete key ignored" "if (key === 'delete' || key === 'backspace')" "if (key === 'backspace')"
mutant "Backspace key ignored" "if (key === 'delete' || key === 'backspace')" "if (key === 'delete')"
mutant "delete removes a clip while a zoom is selected" "if (selectedZoom) change({ ...edit, zooms: edit.zooms.filter((z) => z.id !== selected) });" "if (selectedZoom) change({ ...edit, clips: edit.clips.slice(1) });"
mutant "undo chord ignored" "if (key === 'z' && !event.altKey && !event.shiftKey)" "if (key === 'y' && !event.altKey && !event.shiftKey)"
# The overlap check appears twice in App.tsx; break the one in addZoom by hand (see REF-19 notes).
mutant "seek not clamped at 0" "Math.max(0, Math.min(duration - 1, Math.round(next)))" "Math.min(duration - 1, Math.round(next))"
mutant "seek not clamped at the end" "Math.max(0, Math.min(duration - 1, Math.round(next)))" "Math.max(0, Math.round(next))"
mutant "Space ignored" "if (key === ' ') setSpeed" "if (key === 'x') setSpeed"
