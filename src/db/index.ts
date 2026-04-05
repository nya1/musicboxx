import Dexie, { type Table } from 'dexie';

export const FAVORITES_PLAYLIST_ID = 'favorites';

export interface Song {
  id?: number;
  videoId: string;
  title: string;
  author?: string;
  createdAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: number;
}

export interface PlaylistSong {
  playlistId: string;
  songId: number;
}

export class MusicboxxDB extends Dexie {
  songs!: Table<Song, number>;
  playlists!: Table<Playlist, string>;
  playlistSongs!: Table<PlaylistSong, [string, number]>;

  constructor() {
    super('musicboxx');
    this.version(1).stores({
      songs: '++id, videoId, createdAt',
      playlists: 'id, name, isSystem, createdAt',
      playlistSongs: '[playlistId+songId], playlistId, songId',
    });
  }
}

export const db = new MusicboxxDB();

export async function bootstrapDb(): Promise<void> {
  const n = await db.playlists.count();
  if (n === 0) {
    await db.playlists.add({
      id: FAVORITES_PLAYLIST_ID,
      name: 'Favorites',
      isSystem: true,
      createdAt: Date.now(),
    });
  }
}

export async function getSongByVideoId(videoId: string): Promise<Song | undefined> {
  return db.songs.where('videoId').equals(videoId).first();
}

export async function addSongToPlaylist(playlistId: string, songId: number): Promise<void> {
  const existing = await db.playlistSongs
    .where('[playlistId+songId]')
    .equals([playlistId, songId])
    .first();
  if (!existing) {
    await db.playlistSongs.add({ playlistId, songId });
  }
}

export async function removeSongFromPlaylist(playlistId: string, songId: number): Promise<void> {
  await db.playlistSongs
    .where('[playlistId+songId]')
    .equals([playlistId, songId])
    .delete();
}

export async function createPlaylist(name: string): Promise<Playlist> {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `pl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const playlist: Playlist = {
    id,
    name: name.trim(),
    isSystem: false,
    createdAt: Date.now(),
  };
  await db.playlists.add(playlist);
  return playlist;
}

export type AddSongResult =
  | { ok: true; song: Song; duplicate: false }
  | { ok: true; song: Song; duplicate: true }
  | { ok: false; error: 'invalid_url' | 'network' };

export async function addSongFromVideoId(
  videoId: string,
  titleHint?: string,
  authorHint?: string
): Promise<AddSongResult> {
  const existing = await getSongByVideoId(videoId);
  if (existing?.id != null) {
    return { ok: true, song: existing as Song, duplicate: true };
  }

  let title = titleHint?.trim() || 'YouTube video';
  let author = authorHint;

  if (!titleHint) {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`
      );
      if (res.ok) {
        const data = (await res.json()) as { title?: string; author_name?: string };
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
      }
    } catch {
      /* keep fallback title */
    }
  }

  const song: Song = {
    videoId,
    title,
    author,
    createdAt: Date.now(),
  };

  const id = await db.transaction('rw', db.songs, db.playlistSongs, async () => {
    const newId = await db.songs.add(song);
    await addSongToPlaylist(FAVORITES_PLAYLIST_ID, newId as number);
    return newId as number;
  });

  return {
    ok: true,
    song: { ...song, id },
    duplicate: false,
  };
}
