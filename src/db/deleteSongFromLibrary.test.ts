import { describe, it, expect, afterEach } from 'vitest';
import {
  bootstrapDb,
  deleteSongFromLibrary,
  FAVORITES_PLAYLIST_ID,
  MusicboxxDB,
} from './index';

async function openTestDb(): Promise<MusicboxxDB> {
  const name = `musicboxx-delete-song-test-${Math.random().toString(36).slice(2)}`;
  const d = new MusicboxxDB(name);
  await d.open();
  await bootstrapDb(d);
  return d;
}

describe('deleteSongFromLibrary', () => {
  let testDb: MusicboxxDB | undefined;

  afterEach(async () => {
    if (testDb) await testDb.delete();
    testDb = undefined;
  });

  it('deletes the song and its playlist links', async () => {
    testDb = await openTestDb();
    const sid = (await testDb.songs.add({
      provider: 'youtube',
      catalogKey: 'youtube:y',
      videoId: 'y',
      title: 'T',
      createdAt: 1,
    })) as number;
    await testDb.playlistSongs.add({ playlistId: FAVORITES_PLAYLIST_ID, songId: sid });

    await deleteSongFromLibrary(sid, testDb);

    expect(await testDb.songs.get(sid)).toBeUndefined();
    expect(await testDb.playlistSongs.where('songId').equals(sid).count()).toBe(0);
  });

  it('deletes a song that has no playlist links', async () => {
    testDb = await openTestDb();
    const sid = (await testDb.songs.add({
      provider: 'youtube',
      catalogKey: 'youtube:z',
      videoId: 'z',
      title: 'Orphan',
      createdAt: 1,
    })) as number;

    await deleteSongFromLibrary(sid, testDb);

    expect(await testDb.songs.get(sid)).toBeUndefined();
  });
});
