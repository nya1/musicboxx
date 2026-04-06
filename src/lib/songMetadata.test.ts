import { describe, it, expect } from 'vitest';
import { normalizePrimaryArtist } from './songMetadata';

describe('normalizePrimaryArtist', () => {
  it('trims and keeps non-empty strings', () => {
    expect(normalizePrimaryArtist('  Taylor Swift  ')).toBe('Taylor Swift');
  });

  it('returns undefined for missing or blank', () => {
    expect(normalizePrimaryArtist(undefined)).toBeUndefined();
    expect(normalizePrimaryArtist('')).toBeUndefined();
    expect(normalizePrimaryArtist('   ')).toBeUndefined();
  });
});
