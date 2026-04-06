import { describe, it, expect } from 'vitest';
import {
  parseAddMusicFromInput,
  parseMusicFromInput,
  parseMusicFromSharePayload,
  songCatalogKey,
} from './music';

describe('songCatalogKey', () => {
  it('joins provider and id', () => {
    expect(songCatalogKey('youtube', 'abc')).toBe('youtube:abc');
    expect(songCatalogKey('spotify', '22charbase62string0000')).toBe(
      'spotify:22charbase62string0000'
    );
  });
});

describe('parseMusicFromInput', () => {
  it('parses YouTube watch URLs and raw ids', () => {
    expect(parseMusicFromInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
    expect(parseMusicFromInput('dQw4w9WgXcQ')).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('parses Spotify URLs and URIs', () => {
    const id = '3n3Ppam7vgaVa1iaRUc9Lp';
    expect(
      parseMusicFromInput(`https://open.spotify.com/track/${id}?si=foo`)
    ).toEqual({ provider: 'spotify', trackId: id });
    expect(parseMusicFromInput(`spotify:track:${id}`)).toEqual({
      provider: 'spotify',
      trackId: id,
    });
  });

  it('parses Apple Music song URLs', () => {
    const url =
      'https://music.apple.com/us/album/example/1234567890?i=9876543210';
    expect(parseMusicFromInput(url)).toEqual({
      provider: 'apple-music',
      trackId: '9876543210',
      openUrl: url,
    });
  });

  it('returns null for empty or unsupported input', () => {
    expect(parseMusicFromInput('')).toBeNull();
    expect(parseMusicFromInput('   ')).toBeNull();
    expect(parseMusicFromInput('https://example.com')).toBeNull();
  });
});

describe('parseAddMusicFromInput', () => {
  it('prefers YouTube playlist when list= is present', () => {
    expect(
      parseAddMusicFromInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLtest123')
    ).toEqual({
      kind: 'youtube-playlist',
      playlistId: 'PLtest123',
      canonicalUrl: 'https://www.youtube.com/playlist?list=PLtest123',
    });
  });

  it('falls back to single track when no playlist', () => {
    expect(parseAddMusicFromInput('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toEqual({
      kind: 'track',
      parsed: { provider: 'youtube', videoId: 'dQw4w9WgXcQ' },
    });
  });
});

describe('parseMusicFromSharePayload', () => {
  it('prefers url param', () => {
    expect(
      parseMusicFromSharePayload(
        'https://youtu.be/dQw4w9WgXcQ',
        'ignored text'
      )
    ).toEqual({ provider: 'youtube', videoId: 'dQw4w9WgXcQ' });
  });

  it('decodes url param', () => {
    const encoded = encodeURIComponent('https://youtu.be/dQw4w9WgXcQ');
    expect(parseMusicFromSharePayload(encoded, null)).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('parses whole text when url is missing', () => {
    expect(
      parseMusicFromSharePayload(null, 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp')
    ).toEqual({
      provider: 'spotify',
      trackId: '3n3Ppam7vgaVa1iaRUc9Lp',
    });
  });

  it('extracts first supported URL from shared text', () => {
    const text = 'Check this https://youtu.be/dQw4w9WgXcQ and also https://example.com';
    expect(parseMusicFromSharePayload(null, text)).toEqual({
      provider: 'youtube',
      videoId: 'dQw4w9WgXcQ',
    });
  });

  it('returns null when nothing matches', () => {
    expect(parseMusicFromSharePayload(null, 'no links here')).toBeNull();
    expect(parseMusicFromSharePayload(null, '')).toBeNull();
  });

  it('returns null for YouTube playlist URLs (use parseAddMusicFromSharePayload)', () => {
    expect(
      parseMusicFromSharePayload(
        'https://www.youtube.com/playlist?list=PLonlyPlaylist',
        null
      )
    ).toBeNull();
  });
});
