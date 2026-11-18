import { readdirSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { segmentsFrom } from './transcribe';
import { audible, SAMPLE_RATE, WHISPER } from './whisper';

it('trims, orders and clamps Whisper chunks into non-overlapping source segments', () => {
  const chunks = [
    { start: 150.2, end: 155, text: ' second block ' },
    { start: 0, end: 7.74, text: ' And so my fellow Americans' },
    // A stride overlap: the later chunk starts where the earlier one ends.
    { start: 7.5, end: 10.64, text: ' ask not.' },
    { start: 10.64, end: 10.64, text: ' zero length' },
    { start: 11, end: 12, text: '   ' },
    // An open-ended chunk runs past the source; it ends with the source.
    { start: 158, end: 999, text: 'tail' },
  ];
  expect(segmentsFrom(chunks, 160)).toEqual([
    { start: 0, end: 7.74, text: 'And so my fellow Americans' },
    { start: 7.74, end: 10.64, text: 'ask not.' },
    { start: 150.2, end: 155, text: 'second block' },
    { start: 158, end: 160, text: 'tail' },
  ]);
  expect(segmentsFrom([], 10)).toEqual([]);
});

it('names the model in one place', () => {
  const sources = readdirSync('src').filter(
    (file) => /\.tsx?$/.test(file) && !file.includes('.test.'),
  );
  const naming = sources.filter((file) =>
    readFileSync(`src/${file}`, 'utf8').includes('whisper-tiny'),
  );
  expect(naming).toEqual(['whisper.ts']);
  expect(WHISPER.model).toBe('onnx-community/whisper-tiny.en');
});

it('hears a segment only above the quiet floor, so silence yields no hallucinated text', () => {
  const second = (amplitude: number) =>
    Float32Array.from({ length: SAMPLE_RATE }, (_, i) => amplitude * Math.sin(i / 3));
  // -60 dBFS RMS is 0.001; a sine's RMS is its amplitude over √2.
  expect(audible(second(0), 0, 1)).toBe(false);
  expect(audible(second(0.0013), 0, 1)).toBe(false);
  expect(audible(second(0.0016), 0, 1)).toBe(true);
  expect(audible(second(0.3), 0, 1)).toBe(true);
  // Only the segment's own span counts: speech after it does not make it audible.
  const half = Float32Array.from({ length: SAMPLE_RATE * 2 }, (_, i) =>
    i < SAMPLE_RATE ? 0 : 0.3 * Math.sin(i / 3),
  );
  expect(audible(half, 0, 1)).toBe(false);
  expect(audible(half, 1, 2)).toBe(true);
  expect(audible(half, 1.5, 9)).toBe(true);
});
