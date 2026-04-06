import { describe, it, expect } from 'vitest';
import { parseYouTubePlaylistFromInput, parseYouTubeVideoId } from './youtube';

describe('parseYouTubePlaylistFromInput', () => {
  it('extracts list id from watch URL', () => {
    const r = parseYouTubePlaylistFromInput(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc123xyz'
    );
    expect(r).toEqual({
      playlistId: 'PLabc123xyz',
      canonicalUrl: 'https://www.youtube.com/playlist?list=PLabc123xyz',
    });
  });

  it('extracts from playlist-only URL', () => {
    const r = parseYouTubePlaylistFromInput('https://www.youtube.com/playlist?list=PLsolo');
    expect(r?.playlistId).toBe('PLsolo');
  });

  it('returns null when no list param', () => {
    expect(parseYouTubePlaylistFromInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull();
  });
});

describe('parseYouTubeVideoId with list in URL', () => {
  it('still returns video id from watch URL', () => {
    expect(
      parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabc')
    ).toBe('dQw4w9WgXcQ');
  });
});
