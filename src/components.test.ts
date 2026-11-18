import { describe, expect, it } from 'vitest';
import { clock, timecode } from './components';

describe('timecodes at any length', () => {
  // [frame, timecode, clock], derived by hand at 30 fps.
  const cases: [number, string, string][] = [
    [0, '00:00:00', '00:00'],
    [1, '00:00:01', '00:00'],
    [29 * 30 + 29, '00:29:29', '00:29'],
    [(59 * 60 + 59) * 30 + 29, '59:59:29', '59:59'],
    [60 * 60 * 30, '1:00:00:00', '1:00:00'],
    [(99 * 60 + 59) * 30, '1:39:59:00', '1:39:59'],
    [105 * 60 * 30, '1:45:00:00', '1:45:00'],
    [24 * 60 * 60 * 30, '24:00:00:00', '24:00:00'],
  ];

  it.each(cases)('reads frame %i as %s, and to the second as %s', (frame, full, short) => {
    expect(timecode(frame)).toBe(full);
    expect(clock(frame)).toBe(short);
  });

  it('floors a fractional frame', () => {
    expect(timecode(30.9)).toBe('00:01:00');
    expect(clock(59.9)).toBe('00:01');
  });
});
