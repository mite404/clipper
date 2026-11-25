import { describe, expect, it } from 'vitest';
import {
  SPEED_LIMITS,
  SPEED_PRESETS,
  retimeClip,
  sourceAt,
  sourceSpan,
  splitOffset,
  timelineAt,
  validateSpeed,
} from './retime';
import { sourceFrame, type Clip as BaseClip } from './timeline-model';

type Clip = BaseClip & { speed?: number };
const clip = (over: Partial<Clip> = {}): Clip => ({
  id: 'c',
  assetId: 'a',
  track: 'screen',
  start: 100,
  duration: 180,
  offset: 40,
  ...over,
});

describe('sourceAt', () => {
  it("is today's sourceFrame at speed 1, whether the speed is absent or set", () => {
    for (const speed of [undefined, 1]) {
      const c = clip({ speed });
      for (const frame of [100, 101, 150, 279, 280, 99])
        expect(sourceAt(c, frame)).toBe(sourceFrame(c, frame));
    }
  });

  it("runs the source twice as fast at 2x and half as fast at 0.5x, from the clip's first frame", () => {
    expect(sourceAt(clip({ speed: 2 }), 100)).toBe(40);
    expect(sourceAt(clip({ speed: 2 }), 110)).toBe(60);
    expect(sourceAt(clip({ speed: 0.5 }), 100)).toBe(40);
    expect(sourceAt(clip({ speed: 0.5 }), 110)).toBe(45);
    expect(sourceAt(clip({ speed: 4, start: 0, offset: 0 }), 7)).toBe(28);
  });
});

describe('timelineAt', () => {
  it('undoes sourceAt for every preset, at the edges and in the middle', () => {
    for (const speed of SPEED_PRESETS)
      for (const frame of [100, 101, 137, 279]) {
        const c = clip({ speed });
        expect(timelineAt(c, sourceAt(c, frame))).toBeCloseTo(frame, 9);
      }
  });

  it('finds where a source frame plays, as a fractional timeline frame', () => {
    expect(timelineAt(clip({ speed: 2 }), 60)).toBe(110);
    expect(timelineAt(clip({ speed: 0.5 }), 45)).toBe(110);
    expect(timelineAt(clip({ speed: 2 }), 41)).toBe(100.5);
  });
});

describe('sourceSpan and splitOffset', () => {
  it('counts the source frames a clip uses: its length times its speed', () => {
    expect(sourceSpan(clip())).toBe(180);
    expect(sourceSpan(clip({ speed: 2 }))).toBe(360);
    expect(sourceSpan(clip({ speed: 0.25 }))).toBe(45);
  });

  it("puts a split's right half on the same source frames as the whole", () => {
    for (const speed of [undefined, 0.5, 2, 4]) {
      const whole = clip({ speed });
      const elapsed = 30;
      const left = { ...whole, duration: elapsed };
      const right = {
        ...whole,
        start: whole.start + elapsed,
        duration: whole.duration - elapsed,
        offset: splitOffset(whole, elapsed),
      };
      for (const frame of [100, 129, 130, 131, 279])
        expect(sourceAt(frame < 130 ? left : right, frame)).toBe(sourceAt(whole, frame));
    }
    expect(splitOffset(clip({ speed: 2 }), 30)).toBe(100);
    expect(splitOffset(clip(), 30)).toBe(70);
  });
});

describe('retimeClip', () => {
  it('keeps the source range and changes the length: 180 frames at 2x is 90', () => {
    const out = retimeClip(clip(), 2);
    expect([out.start, out.duration, out.offset, out.speed]).toEqual([100, 90, 40, 2]);
    expect(sourceSpan(out)).toBe(180);
  });

  it('goes back to the original length and drops the field at 1x', () => {
    const there = retimeClip(clip(), 2);
    const back = retimeClip(there, 1);
    expect(back).toEqual(clip());
    expect('speed' in back).toBe(false);
    expect('speed' in retimeClip(clip({ speed: 0.5 }), 1)).toBe(false);
  });

  it('retimes from one speed to another through the source range, not through the length', () => {
    const slow = retimeClip(clip(), 0.5); // → 360 frames
    expect(slow.duration).toBe(360);
    expect(retimeClip(slow, 4).duration).toBe(45);
    expect(retimeClip(clip({ speed: 2 }), 0.75).duration).toBe(480);
  });

  it('stays inside the source it had: the last frame shown is before the old end, within half a speed step of it', () => {
    const wrong: string[] = [];
    for (const from of [undefined, 0.5, 2])
      for (const to of SPEED_PRESETS)
        for (const duration of [1, 2, 7, 99, 100, 101, 359]) {
          const before = clip({ duration, speed: from });
          const after = retimeClip(before, to);
          const end = before.offset + sourceSpan(before); // → source frame just past the range
          const inside = sourceAt(after, after.start + after.duration - 1) < end;
          // Under half a frame the one-frame minimum applies, and the span may be larger.
          const small = sourceSpan(before) / to < 0.5;
          const close = small || Math.abs(sourceSpan(after) - sourceSpan(before)) <= to / 2;
          if (!inside || !close || after.duration < 1)
            wrong.push(`${from ?? 1} to ${to} over ${duration}`);
        }
    expect(wrong).toEqual([]);
  });

  describe('with room for only so many frames', () => {
    it('grows a slowdown up to the room and stops, keeping the speed and the in point', () => {
      const out = retimeClip(clip(), 0.5, 300); // → wants 360 frames
      expect([out.start, out.duration, out.offset, out.speed]).toEqual([100, 300, 40, 0.5]);
      expect(sourceSpan(out)).toBe(150); // → the source out point is cut back from 180
      expect(sourceAt(out, out.start + out.duration - 1)).toBeLessThan(clip().offset + 180);
    });

    it('takes the whole slowdown when it fits, including to exactly the room', () => {
      expect(retimeClip(clip(), 0.5, 400).duration).toBe(360);
      expect(retimeClip(clip(), 0.5, 360).duration).toBe(360);
      expect(retimeClip(clip(), 0.5, 359).duration).toBe(359);
      expect(retimeClip(clip(), 0.5, Infinity).duration).toBe(360);
    });

    it('shortens a speed-up whatever the room, leaving a bigger gap', () => {
      expect(retimeClip(clip(), 2, 180).duration).toBe(90);
      expect(retimeClip(clip(), 4, 180).duration).toBe(45);
      expect(retimeClip(clip({ duration: 90, speed: 2 }), 1, 90).duration).toBe(90);
    });

    it('clamps from any starting speed, and keeps one frame when the room is one', () => {
      const slowed = retimeClip(clip({ speed: 2, duration: 90 }), 0.25, 500); // → wants 720
      expect([slowed.duration, slowed.speed, slowed.offset]).toEqual([500, 0.25, 40]);
      expect(retimeClip(clip(), 0.25, 1).duration).toBe(1);
    });

    it('refuses room that is not a whole number of at least one frame', () => {
      for (const room of [0, -5, 2.5, Number.NaN, -Infinity])
        expect(() => retimeClip(clip(), 0.5, room)).toThrow(RangeError);
    });
  });

  it('keeps a linked pair in step: same start, length and offset in, same source frames out', () => {
    const video = clip({ id: 'v', assetId: 'screen-rec', track: 'screen' });
    const audio = clip({ id: 'a', assetId: 'screen-rec', track: 'voice' });
    const wrong: string[] = [];
    for (const speed of SPEED_PRESETS)
      for (const room of [Infinity, 150, 50]) {
        const [v, a] = [retimeClip(video, speed, room), retimeClip(audio, speed, room)];
        if (v.duration !== a.duration || v.speed !== a.speed || v.offset !== a.offset)
          wrong.push(`${speed} in ${room}`);
        for (const frame of [100, 101, 120, 130 + v.duration])
          if (sourceAt(v, frame) !== sourceAt(a, frame))
            wrong.push(`${speed} in ${room} @${frame}`);
      }
    expect(wrong).toEqual([]);
  });

  describe('keeps the true source out point through rounding', () => {
    // A cut [20, 121) is 101 frames from source frame 20; at 2x that rounds to 51 frames.
    const cut = clip({ start: 20, duration: 101, offset: 20 });
    const cutEnd = 121;

    it('never samples past the cut at 2x, even at a 120 fps sample just after the last frame', () => {
      const fast = retimeClip(cut, 2);
      expect(fast.duration).toBe(51);
      expect(sourceSpan(fast)).toBe(101); // → not 51 x 2 = 102
      expect(sourceAt(fast, fast.start + 50)).toBeLessThanOrEqual(cutEnd); // → 120
      expect(sourceAt(fast, fast.start + 50.75)).toBe(cutEnd); // → would be 121.5
      expect(sourceAt(fast, fast.start + 500)).toBe(cutEnd);
    });

    it('keeps every 120 fps sample in [in point, exclusive end], and in-range ones exact', () => {
      const fast = retimeClip(cut, 2); // → 51 frames at 60 fps is 204 samples at 120 fps
      for (let i = 0; i < 204; i++) {
        const at = sourceAt(fast, fast.start + i / 4);
        expect(at).toBeGreaterThanOrEqual(cut.offset);
        expect(at).toBeLessThanOrEqual(cutEnd);
      }
      expect(sourceAt(fast, fast.start + 50.25)).toBe(120.5);
      expect(sourceAt(clip({ start: 0, offset: 20, duration: 1 }), 0.5)).toBe(20.5);
    });

    it('goes back to 101 frames at 1x, not 102', () => {
      const back = retimeClip(retimeClip(cut, 2), 1);
      expect(back.duration).toBe(101);
      expect(back).toEqual(cut);
    });

    it('does not regrow a room-clamped clip past its cut: 5.25 source frames stay 5.25 at 1.5x', () => {
      const six = clip({ duration: 6 });
      const clamped = retimeClip(six, 0.75, 7); // → wants 8
      expect([clamped.duration, clamped.speed]).toEqual([7, 0.75]);
      expect(sourceSpan(clamped)).toBe(5.25);
      const faster = retimeClip(clamped, 1.5);
      expect(faster.duration).toBe(4); // → 3.5 rounds up
      expect(sourceSpan(faster)).toBe(5.25); // → not 4 x 1.5 = 6
      expect(sourceAt(faster, faster.start + 3.9)).toBe(six.offset + 5.25);
    });

    it('returns to the original clip after a round trip through several speeds', () => {
      for (const duration of [101, 7, 99, 359]) {
        const start = clip({ start: 20, duration, offset: 20 });
        let c: ReturnType<typeof retimeClip<Clip>> = start;
        for (const speed of [2, 0.75, 1.5, 0.25, 4, 0.5, 1]) c = retimeClip(c, speed);
        expect(c).toEqual(start);
        expect('sourceEnd' in c).toBe(false);
      }
    });

    it('keeps the exact end through a speed whose product is not exact: 29 frames', () => {
      const c = clip({ start: 0, offset: 0, duration: 29 });
      const direct = retimeClip(c, 2); // → 14.5 rounds to 15
      expect(direct.duration).toBe(15);
      const via = retimeClip(retimeClip(c, 0.29), 2); // → 100 x 0.29 is 28.999999999999996
      expect(via.duration).toBe(15);
      expect(sourceSpan(via)).toBe(29);
    });

    it('keeps an explicit out point and its cut-back after a clamp, then a trim is a new out point', () => {
      const clamped = retimeClip(cut, 0.5, 150); // → wants 202; source 75 of 101
      expect(sourceSpan(clamped)).toBe(75);
      expect(retimeClip(clamped, 1).duration).toBe(75);
    });
  });

  it('keeps a one-frame clip at one frame, however fast', () => {
    expect(retimeClip(clip({ duration: 1 }), 4).duration).toBe(1);
  });

  it('changes nothing but duration and speed, and does not touch its input', () => {
    const source = { ...clip(), id: 'x', track: 'screen', gain: -3 };
    const snapshot = structuredClone(source);
    const out = retimeClip(source, 2);
    expect(source).toEqual(snapshot);
    expect(out).toEqual({ ...snapshot, duration: 90, speed: 2 });
  });

  it('types the result as the preserved fields, with speed optional, since 1x deletes it', () => {
    const out = retimeClip({ ...clip(), speed: 2 }, 1);
    // @ts-expect-error speed may be absent after a reset to 1x, so it cannot be used as a number
    expect(() => out.speed.toFixed()).toThrow(TypeError);
    const d: number = out.duration;
    expect(d).toBe(360); // → 180 frames at 2x span 360 source frames, back at 1x
  });

  it('refuses a speed it cannot play', () => {
    for (const speed of [0, -1, Number.NaN, 0.2, 4.5])
      expect(() => retimeClip(clip(), speed)).toThrow(RangeError);
  });
});

describe('validateSpeed', () => {
  it('returns every preset and both limits unchanged', () => {
    for (const speed of [...SPEED_PRESETS, SPEED_LIMITS.min, SPEED_LIMITS.max, 1.25, 3.3])
      expect(validateSpeed(speed)).toBe(speed);
  });

  it('lists presets in order inside the limits, and includes 1', () => {
    expect([...SPEED_PRESETS]).toEqual([0.25, 0.5, 0.75, 1, 1.5, 2, 4]);
    expect(SPEED_PRESETS[0]).toBe(SPEED_LIMITS.min);
    expect(SPEED_PRESETS.at(-1)).toBe(SPEED_LIMITS.max);
  });

  it('rejects what is not a usable positive finite speed, naming the limits', () => {
    for (const speed of [
      0,
      -2,
      SPEED_LIMITS.min / 2,
      SPEED_LIMITS.max * 1.01,
      Number.NaN,
      Infinity,
    ])
      expect(() => validateSpeed(speed)).toThrow(RangeError);
    expect(() => validateSpeed(0)).toThrow(/from 0\.25 to 4/);
  });
});
