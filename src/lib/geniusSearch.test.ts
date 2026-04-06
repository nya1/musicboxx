import { describe, it, expect } from 'vitest';
import { geniusSearchUrl } from './geniusSearch';

describe('geniusSearchUrl', () => {
  it('builds a Genius search URL from title and author', () => {
    const u = geniusSearchUrl('Song Title', 'Artist Name');
    expect(u).toBe('https://genius.com/search?q=' + encodeURIComponent('Artist Name Song Title'));
  });

  it('does not duplicate leading artist in title', () => {
    const u = geniusSearchUrl('Artist Name - Song Title', 'Artist Name');
    expect(u).toContain(encodeURIComponent('Artist Name - Song Title'));
    expect(u).not.toMatch(/Artist Name Artist Name/);
  });

  it('strips YouTube Topic suffix and official video markers', () => {
    const u = geniusSearchUrl('Track (Official Video)', 'Band - Topic');
    const q = new URL(u!).searchParams.get('q');
    expect(q).toBeDefined();
    expect(q).not.toMatch(/Topic/i);
    expect(q).not.toMatch(/Official Video/i);
  });

  it('returns null when nothing remains after normalization', () => {
    expect(geniusSearchUrl('   ', null)).toBeNull();
  });
});
