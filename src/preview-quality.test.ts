import { afterEach, describe, expect, it, vi } from 'vitest';
import { isPreviewQuality, savePreviewQuality, savedPreviewQuality } from './preview-quality';

const store = (items: Record<string, string> = {}) => {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items[key] ?? null,
    setItem: (key: string, value: string) => void (items[key] = value),
  });
  return items;
};
afterEach(() => vi.unstubAllGlobals());

describe('preview quality memory', () => {
  it('is Full until a choice is saved, and then the saved one', () => {
    store();
    expect(savedPreviewQuality()).toBe('full');
    savePreviewQuality('quarter');
    expect(savedPreviewQuality()).toBe('quarter');
    savePreviewQuality('half');
    expect(savedPreviewQuality()).toBe('half');
  });

  it.each(['', 'Quarter', '4', 'constructor', 'toString'])('falls back to Full for %j', (value) => {
    store({ 'clipper.previewQuality': value });
    expect(savedPreviewQuality()).toBe('full');
    expect(isPreviewQuality(value)).toBe(false);
  });

  it('survives a blocked store in both directions', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new DOMException('blocked', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
    });
    expect(savedPreviewQuality()).toBe('full');
    expect(() => savePreviewQuality('half')).not.toThrow();
  });
});
