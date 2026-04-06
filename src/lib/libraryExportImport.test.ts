import { describe, it, expect, afterEach } from 'vitest';
import {
  bootstrapDb,
  FAVORITES_PLAYLIST_ID,
  MusicboxxDB,
} from '../db';
import {
  exportLibrarySnapshot,
  importLibraryReplace,
  LIBRARY_EXPORT_SCHEMA_VERSION,
  validateImportDocument,
} from './libraryExportImport';

async function openTestDb(): Promise<MusicboxxDB> {
  const name = `musicboxx-test-${Math.random().toString(36).slice(2)}`;
  const d = new MusicboxxDB(name);
  await d.open();
  await bootstrapDb(d);
  return d;
}

describe('validateImportDocument', () => {
  it('rejects unsupported schema version', () => {
    const r = validateImportDocument({
      schemaVersion: 99,
      exportedAt: new Date().toISOString(),
      songs: [],
      playlists: [],
      playlistSongs: [],
      settings: [],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Unsupported export version/);
  });

  it('rejects broken playlist–song reference', () => {
    const r = validateImportDocument({
      schemaVersion: LIBRARY_EXPORT_SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      songs: [
        {
          id: 1,
          provider: 'youtube',
          catalogKey: 'youtube:x',
          videoId: 'x',
          title: 'T',
          createdAt: 1,
        },
      ],
      playlists: [
        {
          id: FAVORITES_PLAYLIST_ID,
          name: 'Favorites',
          isSystem: true,
          createdAt: 1,
          color: '#f97316',
        },
      ],
      playlistSongs: [{ playlistId: FAVORITES_PLAYLIST_ID, songId: 999 }],
      settings: [{ key: 'defaultPlaylistId', value: FAVORITES_PLAYLIST_ID }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/missing song/);
  });
});

describe('export → import round-trip', () => {
  let dbA: MusicboxxDB | undefined;
  let dbB: MusicboxxDB | undefined;

  afterEach(async () => {
    if (dbA) await dbA.delete();
    if (dbB) await dbB.delete();
    dbA = undefined;
    dbB = undefined;
  });

  it('preserves songs and memberships', async () => {
    dbA = await openTestDb();
    await dbA.transaction('rw', dbA.songs, dbA.playlistSongs, async () => {
      const sid = await dbA!.songs.add({
        provider: 'youtube',
        catalogKey: 'youtube:roundtrip',
        videoId: 'roundtrip',
        title: 'Round trip',
        createdAt: 42,
      });
      await dbA!.playlistSongs.add({
        playlistId: FAVORITES_PLAYLIST_ID,
        songId: sid as number,
      });
    });

    const snap = await exportLibrarySnapshot(dbA);
    const v = validateImportDocument(snap);
    expect(v.ok).toBe(true);
    if (!v.ok) return;

    dbB = await openTestDb();
    await importLibraryReplace(dbB, v.document);

    const songs = await dbB.songs.toArray();
    const links = await dbB.playlistSongs.toArray();
    expect(songs).toHaveLength(1);
    expect(songs[0]?.title).toBe('Round trip');
    expect(links).toHaveLength(1);
    expect(links[0]?.playlistId).toBe(FAVORITES_PLAYLIST_ID);
    expect(links[0]?.songId).toBe(songs[0]?.id);
  });
});
