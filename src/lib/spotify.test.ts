import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseSpotifyTrackId,
  spotifyOpenUrl,
  fetchSpotifyOembed,
} from './spotify';

describe('parseSpotifyTrackId', () => {
  const id = '3n3Ppam7vgaVa1iaRUc9Lp';

  it('parses open.spotify.com track URLs', () => {
    expect(parseSpotifyTrackId(`https://open.spotify.com/track/${id}`)).toBe(id);
    expect(parseSpotifyTrackId(`https://open.spotify.com/intl-de/track/${id}?si=x`)).toBe(id);
  });

  it('parses spotify:track: URIs', () => {
    expect(parseSpotifyTrackId(`spotify:track:${id}`)).toBe(id);
  });

  it('returns null for invalid input', () => {
    expect(parseSpotifyTrackId('')).toBeNull();
    expect(parseSpotifyTrackId('spotify:album:abc')).toBeNull();
    expect(parseSpotifyTrackId('https://open.spotify.com/album/xyz')).toBeNull();
  });
});

describe('spotifyOpenUrl', () => {
  it('builds open URL', () => {
    expect(spotifyOpenUrl('abc')).toBe('https://open.spotify.com/track/abc');
  });
});

describe('fetchSpotifyOembed', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps JSON fields on success', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Song',
        author_name: 'Artist',
        thumbnail_url: 'https://img',
      }),
    } as Response);

    const r = await fetchSpotifyOembed('3n3Ppam7vgaVa1iaRUc9Lp');
    expect(r).toEqual({
      title: 'Song',
      author: 'Artist',
      thumbnailUrl: 'https://img',
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('open.spotify.com/oembed')
    );
  });

  it('returns fallback title when not ok', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    const r = await fetchSpotifyOembed('3n3Ppam7vgaVa1iaRUc9Lp');
    expect(r.title).toBe('Spotify track');
  });
});
