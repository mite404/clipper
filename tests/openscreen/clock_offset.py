import json, re, statistics, subprocess, sys
import numpy as np

video = sys.argv[1]
samples = json.load(open(video + ".cursor.json"))["samples"]
SW, SH = 172, 72

clicks = [s for s in samples if s["interactionType"] == "click"]
points = sorted({(round(s["cx"] * SW), round(s["cy"] * SH)) for s in clicks})

proc = subprocess.run(
    ["ffmpeg", "-v", "info", "-i", video, "-vf", f"scale={SW}:{SH}:flags=area,showinfo",
     "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
    capture_output=True, check=True)
pts = [float(m) * 1000 for m in re.findall(r"pts_time:([\d.]+)", proc.stderr.decode())]
frames = np.frombuffer(proc.stdout, np.uint8).reshape(-1, SH, SW, 3).astype(int)
assert len(pts) == len(frames), (len(pts), len(frames))


def colour(frame):
    votes = []
    for x, y in points:
        r, g, b = frame[min(y, SH - 1), min(x, SW - 1)]
        votes.append("G" if g > 200 and r < 80 and b < 80 else "M" if r > 200 and b > 200 and g < 80 else "?")
    return max(set(votes), key=votes.count) if votes.count("?") < len(votes) else "?"


states = [colour(f) for f in frames]
flips, last = [], None
for t, c in zip(pts, states):
    if c == "?":
        continue
    if last and c != last:
        flips.append(t)
    last = c

print(f"frames {len(frames)}, click samples {len(clicks)}, colour flips {len(flips)}")
print("flip pts ms:", [round(f) for f in flips])

presses, seen_up = [], True
for s in samples:
    if s["interactionType"] == "click" and seen_up:
        presses.append(s["timeMs"])
    seen_up = s["interactionType"] != "click" if s["interactionType"] in ("click", "mouseup") else seen_up

pairs, unmatched = [], []
for p in presses:
    hit = [f for f in flips if -150 <= f - p < 300]
    (pairs.append((p, hit[0])) if hit else unmatched.append(p))
offsets = [round(f - p) for p, f in pairs]
print(f"presses {len(presses)} (from {len(clicks)} click samples), matched {len(pairs)}, unmatched presses {unmatched}")
for p, f in pairs:
    print(f"press {p:>7}ms  flip {round(f):>7}ms  offset {round(f - p)}")
xs = [p / 1000 for p, _ in pairs]
mx, my = statistics.mean(xs), statistics.mean(offsets)
slope = sum((x - mx) * (y - my) for x, y in zip(xs, offsets)) / sum((x - mx) ** 2 for x in xs)
print(f"median {statistics.median(offsets)}  mean {my:.1f}  sd {statistics.stdev(offsets):.1f}  range {min(offsets)}..{max(offsets)}")
print(f"slope {slope:.3f} ms/s  r {statistics.correlation(xs, offsets):.2f}")
q = len(offsets) // 4
print(f"first quarter median {statistics.median(offsets[:q])}, last quarter median {statistics.median(offsets[-q:])}")
