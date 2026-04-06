import { describe, it, expect } from 'vitest';
import {
  buildSongSearchIndex,
  orderSongsBySearchHits,
  searchSongIds,
} from './songSearchIndex';
import type { Song } from '../db';

function song(partial: Partial<Song> & Pick<Song, 'id' | 'provider' | 'title'>): Song {
  return {
    catalogKey: partial.catalogKey ?? 'youtube:test',
    createdAt: partial.createdAt ?? 0,
    ...partial,
  };
}

describe('buildSongSearchIndex / searchSongIds / orderSongsBySearchHits', () => {
  it('ranks a title match when querying a distinctive word', () => {
    const songs: Song[] = [
      song({
        id: 1,
        provider: 'youtube',
        title: 'Unrelated track name',
        author: 'Band A',
        createdAt: 200,
      }),
      song({
        id: 2,
        provider: 'youtube',
        title: 'Alpha Bravo Charlie',
        author: 'Band B',
        createdAt: 100,
      }),
    ];
    const idx = buildSongSearchIndex(songs);
    expect(idx).not.toBeNull();
    const hits = searchSongIds(idx, 'Alpha', songs);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]?.id).toBe(2);
  });

  it('finds a match on primaryArtist when title differs', () => {
    const songs: Song[] = [
      song({
        id: 1,
        provider: 'spotify',
        title: 'Some Song',
        primaryArtist: 'Zephyr Quinn',
        createdAt: 1,
      }),
      song({
        id: 2,
        provider: 'spotify',
        title: 'Other',
        primaryArtist: 'Different Artist',
        createdAt: 2,
      }),
    ];
    const idx = buildSongSearchIndex(songs);
    const hits = searchSongIds(idx, 'Zephyr', songs);
    const ordered = orderSongsBySearchHits(songs, hits);
    expect(ordered.map((s) => s.id)).toContain(1);
    expect(ordered[0]?.id).toBe(1);
  });

  it('returns empty hits for blank query', () => {
    const songs: Song[] = [
      song({ id: 1, provider: 'youtube', title: 'A', createdAt: 1 }),
    ];
    const idx = buildSongSearchIndex(songs);
    expect(searchSongIds(idx, '   ', songs)).toEqual([]);
  });

  it('matches infix substrings when Lunr tokenization would miss (e.g. ing in testing)', () => {
    const songs: Song[] = [
      song({
        id: 1,
        provider: 'youtube',
        title: 'testing',
        createdAt: 1,
      }),
    ];
    const idx = buildSongSearchIndex(songs);
    expect(idx).not.toBeNull();
    const hits = searchSongIds(idx, 'ing', songs);
    expect(hits.some((h) => h.id === 1)).toBe(true);
  });
});
