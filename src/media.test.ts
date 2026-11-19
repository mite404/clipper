import { describe, expect, it } from 'vitest';
import { imageMime } from './media';

const ascii = (text: string) => Array.from(text, (c) => c.charCodeAt(0));

describe('telling an image by its bytes', () => {
  it('knows PNG, JPEG and WebP by their signatures, whatever the file is called', () => {
    expect(imageMime(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0]))).toBe('image/png');
    expect(imageMime(new Uint8Array([255, 216, 255, 224]))).toBe('image/jpeg');
    // RIFF, a 4-byte size, then WEBP.
    expect(imageMime(new Uint8Array([...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WEBPVP8 ')]))).toBe(
      'image/webp',
    );
  });

  it('does not take a WAV for a WebP, though both are RIFF, and a .webp name proves nothing', () => {
    expect(
      imageMime(new Uint8Array([...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WAVEfmt ')])),
    ).toBeNull();
    expect(imageMime(new Uint8Array([...ascii('RIFF'), 1, 2, 3, 4, ...ascii('WEB')]))).toBeNull();
    expect(imageMime(new Uint8Array(ascii('not an image')))).toBeNull();
    expect(imageMime(new Uint8Array([]))).toBeNull();
  });
});
