import { describe, it, expect } from 'vitest';
import { buildSongSearchIndex, searchSongIds } from './songSearchIndex';
import type { Song } from '../db';

const SONG_COUNT = 1000;

/**
 * Budget for **lookup only** (index already built). This is what repeat typing pays per
 * keystroke when the index is warm; substring scan is O(n) over ~1k short strings.
 */
const MAX_MS_FIND = 50;

function randomAlpha(len: number): string {
  let s = '';
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < len; i++) {
    s += chars[Math.floor(Math.random() * chars.length)]!;
  }
  return s;
}

function generateRandomSongs(count: number): { songs: Song[]; targetId: number; query: string } {
  const targetId = 777;
  const query = 'PerfTargetZk9mUnique';
  const songs: Song[] = [];
  for (let i = 1; i <= count; i++) {
    const title =
      i === targetId ? `Before ${query} After` : `Track ${i} ${randomAlpha(12)}`;
    songs.push({
      id: i,
      provider: 'youtube',
      catalogKey: `youtube:perf${i}`,
      title,
      author: `Artist ${randomAlpha(10)}`,
      primaryArtist: randomAlpha(14),
      albumTitle: `Album ${randomAlpha(10)}`,
      createdAt: 1_700_000_000_000 + i,
    });
  }
  return { songs, targetId, query };
}

describe('song search performance', () => {
  it(`finds a song among ${SONG_COUNT} random rows within ${MAX_MS_FIND}ms (search only, warm index)`, () => {
    const { songs, targetId, query } = generateRandomSongs(SONG_COUNT);

    const idx = buildSongSearchIndex(songs);
    expect(idx).not.toBeNull();
    // Warm the same path we measure (Lunr query + substring pass).
    searchSongIds(idx!, query, songs);

    const t0 = performance.now();
    const hits = searchSongIds(idx!, query, songs);
    const elapsedMs = performance.now() - t0;

    expect(hits.some((h) => h.id === targetId)).toBe(true);
    expect(elapsedMs).toBeLessThan(MAX_MS_FIND);
  });
});
