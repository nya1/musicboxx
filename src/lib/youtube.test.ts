import { describe, it, expect } from 'vitest';
import {
  parseYouTubeVideoId,
  parseYouTubeVideoIdFromSharePayload,
  youtubeWatchUrl,
  thumbnailUrls,
} from './youtube';

describe('parseYouTubeVideoId', () => {
  const id = 'dQw4w9WgXcQ';

  it('accepts raw 11-character ids', () => {
    expect(parseYouTubeVideoId(id)).toBe(id);
  });

  it('parses common URL shapes', () => {
    expect(parseYouTubeVideoId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYouTubeVideoId(`https://youtu.be/${id}`)).toBe(id);
    expect(parseYouTubeVideoId(`https://m.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYouTubeVideoId(`https://music.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYouTubeVideoId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(parseYouTubeVideoId(`https://www.youtube.com/embed/${id}`)).toBe(id);
    expect(parseYouTubeVideoId(`https://www.youtube.com/live/${id}`)).toBe(id);
  });

  it('returns null for invalid input', () => {
    expect(parseYouTubeVideoId('')).toBeNull();
    expect(parseYouTubeVideoId('short')).toBeNull();
    expect(parseYouTubeVideoId('https://example.com')).toBeNull();
  });
});

describe('parseYouTubeVideoIdFromSharePayload', () => {
  const id = 'dQw4w9WgXcQ';

  it('matches url then text', () => {
    expect(parseYouTubeVideoIdFromSharePayload(`https://youtu.be/${id}`, null)).toBe(id);
    expect(parseYouTubeVideoIdFromSharePayload(null, `see ${id} or https://youtu.be/${id}`)).toBe(
      id
    );
  });
});

describe('youtubeWatchUrl', () => {
  it('builds watch URL', () => {
    expect(youtubeWatchUrl('abc')).toBe('https://www.youtube.com/watch?v=abc');
  });
});

describe('thumbnailUrls', () => {
  it('returns maxres and hq URLs', () => {
    expect(thumbnailUrls('xyz')).toEqual({
      maxres: 'https://img.youtube.com/vi/xyz/maxresdefault.jpg',
      hq: 'https://img.youtube.com/vi/xyz/hqdefault.jpg',
    });
  });
});
