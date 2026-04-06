import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchInvidiousPlaylistVideos, InvidiousPlaylistError } from './invidious';

describe('fetchInvidiousPlaylistVideos', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('aggregates video ids and title', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          title: 'My list',
          videos: [{ videoId: 'a' }, { videoId: 'b' }],
          continuation: null,
        }),
        { status: 200 }
      )
    );

    const r = await fetchInvidiousPlaylistVideos('https://inv.example.com', 'PLx');
    expect(r.title).toBe('My list');
    expect(r.videoIds).toEqual(['a', 'b']);
  });

  it('follows continuation once', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            title: 'T',
            videos: [{ videoId: 'one' }],
            continuation: 'tok',
          }),
          { status: 200 }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            videos: [{ videoId: 'two' }],
            continuation: null,
          }),
          { status: 200 }
        )
      );

    const r = await fetchInvidiousPlaylistVideos('https://inv.example.com', 'PLx');
    expect(r.videoIds).toEqual(['one', 'two']);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('throws InvidiousPlaylistError on API error field', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'nope', videos: [] }), { status: 200 })
    );

    await expect(fetchInvidiousPlaylistVideos('https://inv.example.com', 'PLx')).rejects.toThrow(
      InvidiousPlaylistError
    );
  });
});
