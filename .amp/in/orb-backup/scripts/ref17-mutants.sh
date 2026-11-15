#!/bin/bash
# Proves the export gates fail on broken exports. Run from the code worktree with a dev server at $BASE_URL.
# Each mutant edits a source file, runs the two export tests at 1920 px, then restores the file.
run() { BASE_URL=${BASE_URL:-http://127.0.0.1:5199} npx playwright test tests/export.spec.ts --project editor -g "exact source frame|1920px video" --reporter=line 2>&1 | grep -aE "cameraError|^\[[-0-9n]|Received|passed|failed" | cut -c1-260; }
mutant() { # name file python-replace-old python-replace-new
  echo "== $1"; cp "$2" /tmp/mutant.bak
  python3 - "$2" "$3" "$4" <<'PY'
import sys
p,a,b=sys.argv[1:4]; s=open(p).read(); assert s.count(a)==1,(a,s.count(a)); open(p,'w').write(s.replace(a,b))
PY
  sleep 1; run; cp /tmp/mutant.bak "$2"
}
echo "== baseline"; run
mutant "every clip one frame late" src/export.ts "sourceFrame(clip, clip.start + index) / FPS" "(sourceFrame(clip, clip.start + index) + 1) / FPS"
mutant "camera offset ignored" src/export.ts "sourceFrame(clip, clip.start + index) / FPS" "(clip.track === 'camera' ? index : sourceFrame(clip, clip.start + index)) / FPS"
mutant "camera crop position ignored" src/export.ts "coverRect(mask, layer.image, cropPosition(track, layout))" "coverRect(mask, layer.image, track === 'camera' ? { x: 50, y: 50 } : cropPosition(track, layout))"
mutant "screen crop position ignored" src/export.ts "coverRect(mask, layer.image, cropPosition(track, layout))" "coverRect(mask, layer.image, track === 'screen' ? { x: 50, y: 50 } : cropPosition(track, layout))"
mutant "zoom dropped" src/export.ts "track === 'screen' ? camera : undefined" "undefined"
