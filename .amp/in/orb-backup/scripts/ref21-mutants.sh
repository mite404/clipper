#!/usr/bin/env bash
# REF-21: break the save and relink logic on purpose and expect the tests to fail each time.
# Usage: ref21-mutants.sh <worktree>   (dev server on 5199 must serve that worktree)
set -u
cd "$1"
FILES="src/project.ts src/media.ts src/export.ts src/App.tsx"
for f in $FILES; do cp "$f" "/tmp/$(basename "$f").ref21"; done
restore() { for f in $FILES; do cp "/tmp/$(basename "$f").ref21" "$f"; done; }
run() { # name file perl-substitution
  restore
  perl -0pi -e "$3" "$2"
  if cmp -s "$2" "/tmp/$(basename "$2").ref21"; then echo "NOT APPLIED  $1"; return; fi
  if npx vitest run src/project.test.ts >/dev/null 2>&1 &&
     BASE_URL=http://127.0.0.1:5199 npx playwright test tests/refinements.spec.ts --project editor \
       -g "saves around media|never reads media" --reporter=line >/dev/null 2>&1
  then echo "SURVIVED     $1"; else echo "killed       $1"; fi
}
run "no size refusal"             src/project.ts 's/if \(usedBytes > MAX_MEDIA_BYTES\)/if (false)/'
run "refusal at the limit"        src/project.ts 's/if \(usedBytes > MAX_MEDIA_BYTES\)/if (usedBytes >= MAX_MEDIA_BYTES - 4)/'
run "unused that fits left out"   src/project.ts 's/asset\.size <= spare/asset.size < spare/'
run "unused never checked"        src/project.ts 's/used \|\| asset\.size <= spare \?/true ?/'
run "spare not spent"             src/project.ts 's/if \(!used\) spare -= asset\.size;//'
run "used unreadable left out"    src/project.ts 's/if \(required\) throw error;//'
run "unused unreadable blocks"    src/project.ts 's/if \(required\) throw error;/throw error;/'
run "warning at the limit"        src/project.ts 's/return total > MAX_MEDIA_BYTES/return total >= MAX_MEDIA_BYTES/'
run "no warning"                  src/App.tsx    's/\[\.\.\.failures, librarySizeWarning\(library\)\]/failures/'
run "omitted not reported"        src/App.tsx    's/omitted\.length\n/false\n/'
run "never relinks"               src/media.ts   's/if \(!readable\) return asset;//'
run "relinks any unreadable"      src/media.ts   's/if \(asset\.name !== name\) continue;//'
run "relinks healthy namesake"    src/media.ts   's/if \(!readable\) return asset;/return asset;/'
run "relink skips validation"     src/App.tsx    's/validateSources\(edit, placeAsset\(library, \{ imported, replaces \}\)\);//'
run "relink appends"              src/App.tsx    's/=>\n  replaces\n    \? library\.map/=>\n  false\n    ? library.map/'
run "relink keeps the old asset"  src/App.tsx    's/item\.id === replaces\.id \? imported : item/item/'
run "export error unnamed"        src/export.ts  's/await openMedia\(asset, signal\)/await fetch(asset.url, { signal })/'
restore
