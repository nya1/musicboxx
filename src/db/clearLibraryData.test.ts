import { describe, it, expect, afterEach } from 'vitest';
import {
  bootstrapDb,
  clearLibraryData,
  DEFAULT_PLAYLIST_SETTING_KEY,
  FAVORITES_PLAYLIST_ID,
  MusicboxxDB,
} from './index';

async function openTestDb(): Promise<MusicboxxDB> {
  const name = `musicboxx-clear-test-${Math.random().toString(36).slice(2)}`;
  const d = new MusicboxxDB(name);
  await d.open();
  await bootstrapDb(d);
  return d;
}

describe('clearLibraryData', () => {
  let testDb: MusicboxxDB | undefined;

  afterEach(async () => {
    if (testDb) await testDb.delete();
    testDb = undefined;
  });

  it('removes songs and user playlists and restores Favorites and default setting', async () => {
    testDb = await openTestDb();
    const userPlId = 'user-pl-1';
    await testDb.playlists.add({
      id: userPlId,
      name: 'Mine',
      isSystem: false,
      createdAt: 1,
      color: '#6366f1',
    });
    const sid = await testDb.songs.add({
      provider: 'youtube',
      catalogKey: 'youtube:x',
      videoId: 'x',
      title: 'T',
      createdAt: 1,
    });
    await testDb.playlistSongs.add({ playlistId: FAVORITES_PLAYLIST_ID, songId: sid as number });
    await testDb.playlistSongs.add({ playlistId: userPlId, songId: sid as number });
    await testDb.settings.put({ key: DEFAULT_PLAYLIST_SETTING_KEY, value: userPlId });

    await clearLibraryData(testDb);

    const songs = await testDb.songs.toArray();
    const playlists = await testDb.playlists.toArray();
    const links = await testDb.playlistSongs.toArray();
    const def = await testDb.settings.get(DEFAULT_PLAYLIST_SETTING_KEY);

    expect(songs).toHaveLength(0);
    expect(links).toHaveLength(0);
    expect(playlists).toHaveLength(1);
    expect(playlists[0]?.id).toBe(FAVORITES_PLAYLIST_ID);
    expect(playlists[0]?.isSystem).toBe(true);
    expect(def?.value).toBe(FAVORITES_PLAYLIST_ID);
  });

  it('leaves only Favorites when library was already empty', async () => {
    testDb = await openTestDb();
    await clearLibraryData(testDb);
    const playlists = await testDb.playlists.toArray();
    expect(playlists.map((p) => p.id)).toEqual([FAVORITES_PLAYLIST_ID]);
  });
});
