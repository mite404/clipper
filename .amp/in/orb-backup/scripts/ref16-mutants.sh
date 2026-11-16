#!/usr/bin/env bash
# REF-16: break the undo logic on purpose and expect the tests to fail each time.
# Usage: ref16-mutants.sh <worktree>   (dev server on 5199 must serve that worktree)
set -u
cd "$1"
cp src/history.ts /tmp/history.ts.orig
cp src/App.tsx /tmp/App.tsx.orig
restore() { cp /tmp/history.ts.orig src/history.ts; cp /tmp/App.tsx.orig src/App.tsx; }
run() { # name file sed-expr
  restore
  sed -i -E "$3" "$2"
  if cmp -s "$2" "/tmp/$(basename "$2").orig"; then echo "NOT APPLIED  $1"; return; fi
  if npx vitest run src/history.test.ts >/dev/null 2>&1 &&
     BASE_URL=http://127.0.0.1:5199 npx playwright test tests/editor.spec.ts --project editor \
       -g "undoes a slider drag|keeps the last 50" --reporter=line >/dev/null 2>&1
  then echo "SURVIVED     $1"; else echo "killed       $1"; fi
}
run "no pause window"            src/history.ts 's/now - gesture\.at < GESTURE_MS/true/'
run "window from drag start"     src/history.ts 's/\{ \.\.\.gesture, edit: next, at: now \}/{ ...gesture, edit: next }/'
run "gesture survives undo/open" src/history.ts 's/gesture\.edit === current/true/'
run "switches fold like drags"   src/history.ts 's/change\.continuous && //'
run "other values fold in"       src/history.ts 's/ && gesture\.paths\.includes\(change\.path\)//'
run "replaced ids not noticed"   src/history.ts 's/ \|\| before\.some\(\(item, i\) => item\.id !== after\[i\]\.id\)//'
run "no-op edits recorded"       src/history.ts 's/if \(!changes\.length\) return \{ kind: .none. \};//'
run "every change pushes"        src/App.tsx    "s/if \(step\.kind === 'push'\) setHistory/setHistory/"
run "cap 49"                     src/App.tsx    's/previous\.slice\(-49\), edit\]/previous.slice(-48), edit]/'
run "cap 51"                     src/App.tsx    's/previous\.slice\(-49\), edit\]/previous.slice(-50), edit]/'
restore
