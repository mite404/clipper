import base64, io, json, re, subprocess, sys
import numpy as np
from PIL import Image

video = sys.argv[1]
sidecar = json.load(open(video + ".cursor.json"))
W, H = 3440, 1440
SEARCH = 2
BURNED_IN_MAX_DIFF = 12.0

assets = {}
for a in sidecar["assets"]:
    png = base64.b64decode(a["imageDataUrl"].split(",", 1)[1])
    assets[a["id"]] = (np.asarray(Image.open(io.BytesIO(png)).convert("RGBA")).astype(np.float32), a["hotspotX"], a["hotspotY"])
samples = sidecar["samples"]


def frame_at(t_ms):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-ss", f"{t_ms / 1000:.3f}", "-i", video, "-frames:v", "1", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32)


def cursor_diff(frame, sample):
    rgba, hx, hy = assets[sample["assetId"]]
    mask = rgba[..., 3] == 255
    h, w = mask.shape
    x0, y0 = round(sample["cx"] * W - hx), round(sample["cy"] * H - hy)
    best = float("inf")
    for dy in range(-SEARCH, SEARCH + 1):
        for dx in range(-SEARCH, SEARCH + 1):
            x, y = x0 + dx, y0 + dy
            if x < 0 or y < 0 or x + w > W or y + h > H:
                continue
            crop = frame[y:y + h, x:x + w]
            best = min(best, float(np.abs(crop[mask] - rgba[..., :3][mask]).mean()))
    return best


def composite(frame, sample):
    rgba, hx, hy = assets[sample["assetId"]]
    h, w = rgba.shape[:2]
    x, y = round(sample["cx"] * W - hx), round(sample["cy"] * H - hy)
    out = frame.copy()
    alpha = rgba[..., 3:] / 255
    out[y:y + h, x:x + w] = rgba[..., :3] * alpha + out[y:y + h, x:x + w] * (1 - alpha)
    return out


def ui_change_times(t_ms, cx, cy, before=400, after=800):
    x, y = max(0, round(cx * W) - 120), max(0, round(cy * H) - 120)
    proc = subprocess.run(
        ["ffmpeg", "-v", "info", "-copyts", "-ss", f"{(t_ms - before) / 1000:.3f}", "-t", f"{(before + after) / 1000:.3f}", "-i", video, "-vf", f"crop=240:240:{x}:{y},showinfo", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
        capture_output=True, check=True)
    pts = [float(m) * 1000 for m in re.findall(r"pts_time:([\d.]+)", proc.stderr.decode())]
    frames = np.frombuffer(proc.stdout, np.uint8).reshape(-1, 240, 240).astype(np.float32)
    diffs = [float(np.abs(b - a).mean()) for a, b in zip(frames, frames[1:])]
    return [(round(p - t_ms), round(d, 1)) for p, d in zip(pts[1:], diffs) if d > 1.0]


checked = [s for i, s in enumerate(samples) if s["interactionType"] != "move" or i % 20 == 0]
diffs = []
for s in checked:
    frame = frame_at(s["timeMs"])
    real, control = cursor_diff(frame, s), cursor_diff(composite(frame, s), s)
    assert control < 1.0, f"detector failed positive control at {s['timeMs']}ms: {control}"
    diffs.append(real)
    print(f"{s['timeMs']:>6}ms {s['interactionType']:<8} asset={s['assetId'][:8]} diff={real:6.1f} control={control:.2f}")

print(f"\nchecked {len(checked)} samples, min diff {min(diffs):.1f}, burned-in hits (<{BURNED_IN_MAX_DIFF}): {sum(d < BURNED_IN_MAX_DIFF for d in diffs)}")

print("\nUI change near each click/mouseup (offset ms vs sample timeMs, mean abs frame diff):")
for s in samples:
    if s["interactionType"] != "move":
        print(f"{s['timeMs']:>6}ms {s['interactionType']:<8}", ui_change_times(s["timeMs"], s["cx"], s["cy"]))
