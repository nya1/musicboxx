import Dexie, { type Table } from 'dexie';

export const FAVORITES_PLAYLIST_ID = 'favorites';

const DEFAULT_PLAYLIST_SETTING_KEY = 'defaultPlaylistId';

export interface AppSetting {
  key: string;
  value: string;
}

export class PlaylistDeleteError extends Error {
  constructor(
    message: string,
    public readonly code: 'system_playlist' | 'has_children'
  ) {
    super(message);
    this.name = 'PlaylistDeleteError';
  }
}

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
  /** Parent playlist; top-level playlists omit this. */
  parentId?: string;
}

export type PlaylistParentErrorCode =
  | 'parent_not_found'
  | 'favorites_cannot_have_parent'
  | 'would_create_cycle'
  | 'self_parent';

export class PlaylistParentError extends Error {
  constructor(
    message: string,
    public readonly code: PlaylistParentErrorCode
  ) {
    super(message);
    this.name = 'PlaylistParentError';
  }
}

export interface PlaylistSong {
  playlistId: string;
  songId: number;
}

export class MusicboxxDB extends Dexie {
  songs!: Table<Song, number>;
  playlists!: Table<Playlist, string>;
  playlistSongs!: Table<PlaylistSong, [string, number]>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('musicboxx');
    this.version(1).stores({
      songs: '++id, videoId, createdAt',
      playlists: 'id, name, isSystem, createdAt',
      playlistSongs: '[playlistId+songId], playlistId, songId',
    });
    this.version(2).stores({
      songs: '++id, videoId, createdAt',
      playlists: 'id, name, isSystem, createdAt, parentId',
      playlistSongs: '[playlistId+songId], playlistId, songId',
    });
    this.version(3)
      .stores({
        songs: '++id, videoId, createdAt',
        playlists: 'id, name, isSystem, createdAt, parentId',
        playlistSongs: '[playlistId+songId], playlistId, songId',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx.table('settings').put({
          key: DEFAULT_PLAYLIST_SETTING_KEY,
          value: FAVORITES_PLAYLIST_ID,
        });
      });
  }
}

export const db = new MusicboxxDB();

const TREE_ROOT_KEY = '__tree_root__';

/** Groups playlists by parent id; root-level uses an internal sentinel key. */
export function buildChildrenMap(playlists: Playlist[]): Map<string, Playlist[]> {
  const map = new Map<string, Playlist[]>();
  for (const p of playlists) {
    const key = p.parentId ?? TREE_ROOT_KEY;
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  return map;
}

/** All playlist ids in the subtree rooted at `rootId`, including `rootId`. In-memory walk. */
export function getDescendantPlaylistIds(rootId: string, playlists: Playlist[]): Set<string> {
  const byParent = buildChildrenMap(playlists);
  const out = new Set<string>();
  function walk(id: string) {
    out.add(id);
    for (const ch of byParent.get(id) ?? []) {
      walk(ch.id);
    }
  }
  walk(rootId);
  return out;
}

/**
 * Validates assigning `parentId` to `playlistId` (existing or about-to-exist row).
 * Rejects missing parent, Favorites gaining a parent, self-parent, and cycles.
 */
export async function validateParentAssignment(
  playlistId: string,
  parentId: string | undefined
): Promise<void> {
  if (parentId === undefined) return;

  const parent = await db.playlists.get(parentId);
  if (!parent) {
    throw new PlaylistParentError('Parent playlist does not exist.', 'parent_not_found');
  }

  if (playlistId === FAVORITES_PLAYLIST_ID) {
    throw new PlaylistParentError('Favorites cannot be nested under another playlist.', 'favorites_cannot_have_parent');
  }

  if (playlistId === parentId) {
    throw new PlaylistParentError('A playlist cannot be its own parent.', 'self_parent');
  }

  const all = await db.playlists.toArray();
  const desc = getDescendantPlaylistIds(playlistId, all);
  if (desc.has(parentId)) {
    throw new PlaylistParentError('That would create a cycle in the playlist hierarchy.', 'would_create_cycle');
  }
}

/**
 * Ancestors from root to immediate parent (does not include `playlist`).
 * Empty if the playlist is top-level.
 */
export function getPlaylistAncestors(playlist: Playlist, allPlaylists: Playlist[]): Playlist[] {
  const map = new Map(allPlaylists.map((p) => [p.id, p]));
  const ancestors: Playlist[] = [];
  let parentId = playlist.parentId;
  const visited = new Set<string>();
  while (parentId != null && !visited.has(parentId)) {
    visited.add(parentId);
    const p = map.get(parentId);
    if (!p) break;
    ancestors.unshift(p);
    parentId = p.parentId ?? undefined;
  }
  return ancestors;
}

/** Human-readable path: `Parent / Child / Leaf` */
export function formatPlaylistPath(playlist: Playlist, allPlaylists: Playlist[]): string {
  const map = new Map(allPlaylists.map((p) => [p.id, p]));
  const parts: string[] = [];
  let current: Playlist | undefined = playlist;
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    parts.unshift(current.name);
    if (current.parentId == null) break;
    current = map.get(current.parentId);
  }
  return parts.join(' / ');
}

export function getChildPlaylistsSorted(parentId: string, playlists: Playlist[]): Playlist[] {
  return playlists
    .filter((p) => p.parentId === parentId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

/**
 * Subtree songs for `playlistId`: direct and nested memberships, deduped by song id.
 * Sort: song `createdAt` descending (stable product rule).
 */
export async function getSongsInPlaylistSubtreeDeduped(playlistId: string): Promise<Song[]> {
  const allPlaylists = await db.playlists.toArray();
  const descendantIds = getDescendantPlaylistIds(playlistId, allPlaylists);
  const ids = [...descendantIds];
  if (ids.length === 0) return [];

  const rows = await db.playlistSongs.where('playlistId').anyOf(ids).toArray();
  const uniqueSongIds = [...new Set(rows.map((r) => r.songId))];
  const songs = await Promise.all(uniqueSongIds.map((sid) => db.songs.get(sid)));
  const valid = songs.filter((s): s is Song => s != null && s.id != null);
  valid.sort((a, b) => b.createdAt - a.createdAt);
  return valid;
}

export async function getDirectMemberSongIds(playlistId: string): Promise<Set<number>> {
  const rows = await db.playlistSongs.where('playlistId').equals(playlistId).toArray();
  return new Set(rows.map((r) => r.songId));
}

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
  const setting = await db.settings.get(DEFAULT_PLAYLIST_SETTING_KEY);
  if (!setting) {
    await db.settings.put({
      key: DEFAULT_PLAYLIST_SETTING_KEY,
      value: FAVORITES_PLAYLIST_ID,
    });
  }
}

/** Playlist id that receives new songs from `addSongFromVideoId` (falls back if setting missing or stale). */
export async function getDefaultPlaylistId(): Promise<string> {
  const row = await db.settings.get(DEFAULT_PLAYLIST_SETTING_KEY);
  const id = row?.value;
  if (id) {
    const pl = await db.playlists.get(id);
    if (pl) return id;
  }
  return FAVORITES_PLAYLIST_ID;
}

export async function setDefaultPlaylist(playlistId: string): Promise<void> {
  const pl = await db.playlists.get(playlistId);
  if (!pl) {
    throw new Error('Playlist not found.');
  }
  await db.settings.put({ key: DEFAULT_PLAYLIST_SETTING_KEY, value: playlistId });
}

export async function renamePlaylist(playlistId: string, name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('Enter a playlist name.');
  }
  const pl = await db.playlists.get(playlistId);
  if (!pl) {
    throw new Error('Playlist not found.');
  }
  await db.playlists.update(playlistId, { name: trimmed });
}

export async function movePlaylist(playlistId: string, newParentId: string | null): Promise<void> {
  const pl = await db.playlists.get(playlistId);
  if (!pl) {
    throw new Error('Playlist not found.');
  }
  const parentId = newParentId ?? undefined;
  await validateParentAssignment(playlistId, parentId);
  if (parentId === undefined) {
    const next: Playlist = { ...pl };
    delete next.parentId;
    await db.playlists.put(next);
  } else {
    await db.playlists.update(playlistId, { parentId });
  }
}

/**
 * Valid parent ids for moving `playlistId` (excluding self and descendants). `null` = top level.
 * Empty for **Favorites** (it cannot be nested under another playlist).
 */
export function getValidMoveParentIds(playlistId: string, allPlaylists: Playlist[]): (string | null)[] {
  if (playlistId === FAVORITES_PLAYLIST_ID) {
    return [];
  }
  const forbidden = getDescendantPlaylistIds(playlistId, allPlaylists);
  const out: (string | null)[] = [];
  out.push(null);
  for (const p of allPlaylists) {
    if (forbidden.has(p.id)) continue;
    if (p.id === playlistId) continue;
    out.push(p.id);
  }
  return out;
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const pl = await db.playlists.get(playlistId);
  if (!pl) {
    throw new Error('Playlist not found.');
  }
  if (pl.isSystem || playlistId === FAVORITES_PLAYLIST_ID) {
    throw new PlaylistDeleteError('This playlist cannot be deleted.', 'system_playlist');
  }
  const all = await db.playlists.toArray();
  const hasChildren = all.some((p) => p.parentId === playlistId);
  if (hasChildren) {
    throw new PlaylistDeleteError(
      'Move or delete sub-playlists first before deleting this playlist.',
      'has_children'
    );
  }

  await db.transaction('rw', db.playlists, db.playlistSongs, db.settings, async () => {
    const row = await db.settings.get(DEFAULT_PLAYLIST_SETTING_KEY);
    if (row?.value === playlistId) {
      await db.settings.put({ key: DEFAULT_PLAYLIST_SETTING_KEY, value: FAVORITES_PLAYLIST_ID });
    }
    await db.playlistSongs.where('playlistId').equals(playlistId).delete();
    await db.playlists.delete(playlistId);
  });
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

export async function createPlaylist(name: string, parentId?: string): Promise<Playlist> {
  const id =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `pl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await validateParentAssignment(id, parentId);
  const playlist: Playlist = {
    id,
    name: name.trim(),
    isSystem: false,
    createdAt: Date.now(),
    ...(parentId !== undefined ? { parentId } : {}),
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

  const defaultPl = await getDefaultPlaylistId();
  const id = await db.transaction('rw', db.songs, db.playlistSongs, async () => {
    const newId = await db.songs.add(song);
    await addSongToPlaylist(defaultPl, newId as number);
    return newId as number;
  });

  return {
    ok: true,
    song: { ...song, id },
    duplicate: false,
  };
}
