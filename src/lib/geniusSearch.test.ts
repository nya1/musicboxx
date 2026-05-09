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

  it('strips (Official Music Video) from title', () => {
    const u = geniusSearchUrl('Track (Official Music Video)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('strips (Audio) from title', () => {
    const u = geniusSearchUrl('Track (Audio)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('strips (Lyrics) from title', () => {
    const u = geniusSearchUrl('Track (Lyrics)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('strips (Official) from title', () => {
    const u = geniusSearchUrl('Track (Official)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('strips (Music Video) from title', () => {
    const u = geniusSearchUrl('Track (Music Video)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('strips (Performance Video) from title', () => {
    const u = geniusSearchUrl('Track (Performance Video)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('strips bracket variants of video descriptors', () => {
    const u = geniusSearchUrl('Track [Official Music Video]', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('does not strip non-video parentheticals', () => {
    const u = geniusSearchUrl('Track (Remastered 2024)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track (Remastered 2024)');
  });

  it('strips (Visual Video) from title', () => {
    const u = geniusSearchUrl('Track (Visual Video)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('strips (Visual) from title', () => {
    const u = geniusSearchUrl('Track (Visual)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('still strips (Visualizer) correctly alongside new visual patterns', () => {
    const u = geniusSearchUrl('Track (Visualizer)', 'Band');
    expect(new URL(u!).searchParams.get('q')).toBe('Band Track');
  });

  it('returns null when nothing remains after normalization', () => {
    expect(geniusSearchUrl('   ', null)).toBeNull();
  });
});
