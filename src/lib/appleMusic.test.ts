import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAppleMusicFromInput, fetchAppleMusicMetadata } from './appleMusic';

describe('parseAppleMusicFromInput', () => {
  it('parses ?i= track id on album URLs', () => {
    const url = 'https://music.apple.com/us/album/name/123?i=4567890123';
    expect(parseAppleMusicFromInput(url)).toEqual({
      trackId: '4567890123',
      openUrl: url,
    });
  });

  it('parses /song/…/numeric id URLs', () => {
    const url = 'https://music.apple.com/us/song/example/9876543210';
    expect(parseAppleMusicFromInput(url)).toEqual({
      trackId: '9876543210',
      openUrl: url,
    });
  });

  it('returns null for non–Apple Music hosts', () => {
    expect(parseAppleMusicFromInput('https://example.com')).toBeNull();
  });
});

describe('fetchAppleMusicMetadata', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('maps iTunes lookup song result', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          {
            kind: 'song',
            trackName: 'Track',
            collectionName: 'Album',
            artistName: 'Artist',
            artworkUrl100: 'https://is1-ssl.mzstatic.com/100x100bb.jpg',
            trackTimeMillis: 180000,
            isrc: 'USXX12345678',
            releaseDate: '2020-01-15T08:00:00Z',
          },
        ],
      }),
    } as Response);

    const r = await fetchAppleMusicMetadata('123');
    expect(r.title).toBe('Track');
    expect(r.author).toBe('Artist');
    expect(r.albumTitle).toBe('Album');
    expect(r.thumbnailUrl).toContain('600x600bb');
    expect(r.durationMs).toBe(180000);
    expect(r.isrc).toBe('USXX12345678');
    expect(r.releaseYear).toBe(2020);
  });

  it('returns fallback when request fails', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response);

    const r = await fetchAppleMusicMetadata('123');
    expect(r.title).toBe('Apple Music track');
  });
});
