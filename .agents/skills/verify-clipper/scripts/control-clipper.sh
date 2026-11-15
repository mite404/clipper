#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../../.." && pwd)"
PORT="${VERIFY_PORT:-4317}"
SERVICE="clipper-verify-${VERIFY_RUN_ID:-default}"
STATE="${TMPDIR:-/tmp}/$SERVICE.owned"
URL="http://127.0.0.1:$PORT"

doctor() {
  test -f "$STATE" || { echo 'No owned verification instance. Run launch first.' >&2; exit 1; }
  curl -fsS "$URL/" | grep -q "Clipper - the developer's cutting room"
  for file in landscape.mp4 portrait.mp4 voice.wav music.wav; do
    curl -fsSI "$URL/media/$file" >/dev/null
  done
  echo "Clipper doctor OK. Port $PORT serves Clipper and all four media files."
}

case "${1:-}" in
  launch)
    test ! -f "$STATE" || { echo 'Instance already owned. Run doctor or stop.' >&2; exit 1; }
    if curl -s --max-time 1 "$URL/" >/dev/null; then
      echo "Port $PORT is occupied. Choose a different VERIFY_PORT." >&2; exit 1
    fi
    amp orb service start "$SERVICE" --cwd "$ROOT" --port "$PORT" \
      --command 'npm run dev -- --port $PORT --strictPort'
    printf '%s\n' "$PORT" > "$STATE"
    for _ in $(seq 1 30); do
      if curl -fsS "$URL/" >/dev/null 2>&1; then doctor; exit 0; fi
      sleep 1
    done
    echo 'Launch failed. Run stop and inspect amp orb service logs.' >&2; exit 1
    ;;
  doctor) doctor ;;
  stop)
    if test -f "$STATE"; then
      amp orb service stop "$SERVICE"
      rm "$STATE"
    fi
    ;;
  *) echo 'Usage: control-clipper.sh {launch|doctor|stop}. Requires Amp orb services.'; exit 1 ;;
esac
