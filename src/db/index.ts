import Dexie, { type Table } from 'dexie';
import { type ParsedMusic, songCatalogKey } from '../lib/music';
import { fetchAppleMusicMetadata } from '../lib/appleMusic';
import { normalizePrimaryArtist } from '../lib/songMetadata';
import { fetchSpotifyOembed } from '../lib/spotify';

export const FAVORITES_PLAYLIST_ID = 'favorites';

/** Warm accent for the seeded Favorites playlist (also appears in the general palette). */
export const FAVORITES_PLAYLIST_COLOR = '#f97316';

/** Curated hex accents for auto-assigned playlist colors (chosen at random on create). */
export const PLAYLIST_ACCENT_PALETTE = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#ea580c',
  '#ca8a04',
  '#65a30d',
  '#16a34a',
  '#0d9488',
  '#0284c7',
  '#2563eb',
] as const;

export const DEFAULT_PLAYLIST_SETTING_KEY = 'defaultPlaylistId';

/** Picks a uniformly random accent from the palette for each new playlist. */
export function pickRandomPlaylistColor(): string {
  const len = PLAYLIST_ACCENT_PALETTE.length;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return PLAYLIST_ACCENT_PALETTE[buf[0] % len];
  }
  return PLAYLIST_ACCENT_PALETTE[Math.floor(Math.random() * len)];
}

const PLAYLIST_COLOR_HEX = /^#[0-9a-fA-F]{6}$/;

export function normalizePlaylistColor(color: string): string {
  return color.trim().toLowerCase();
}

export function isValidPlaylistColor(color: string): boolean {
  return PLAYLIST_COLOR_HEX.test(normalizePlaylistColor(color));
}

/** Fallback when reading legacy rows without `color` (should not occur on greenfield installs). */
export function getPlaylistAccentColor(p: Pick<Playlist, 'color'>): string {
  return p.color ?? '#6b7280';
}

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

export type SongProvider = 'youtube' | 'spotify' | 'apple-music';

export interface Song {
  id?: number;
  provider: SongProvider;
  /** Indexed unique key: `youtube:…`, `spotify:…`, or `apple-music:…`. */
  catalogKey: string;
  videoId?: string;
  spotifyTrackId?: string;
  appleMusicTrackId?: string;
  /** Preserves storefront/locale for “Open in Apple Music”. */
  appleMusicOpenUrl?: string;
  title: string;
  author?: string;
  /** Normalized performer/channel for search; optional enrichment from public metadata. */
  primaryArtist?: string;
  albumTitle?: string;
  durationMs?: number;
  isrc?: string;
  releaseYear?: number;
  /** Spotify / Apple Music metadata cover; YouTube uses img.youtube.com from `videoId`. */
  thumbnailUrl?: string;
  createdAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  isSystem: boolean;
  createdAt: number;
  /** CSS hex accent `#rrggbb`, lowercase after normalize. */
  color: string;
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

  constructor(dbName = 'musicboxx') {
    super(dbName);
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
    this.version(4).stores({
      songs: '++id, videoId, createdAt',
      playlists: 'id, name, isSystem, createdAt, parentId',
      playlistSongs: '[playlistId+songId], playlistId, songId',
      settings: 'key',
    });
    this.version(5)
      .stores({
        songs: '++id, catalogKey, createdAt',
        playlists: 'id, name, isSystem, createdAt, parentId',
        playlistSongs: '[playlistId+songId], playlistId, songId',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx.table('songs').clear();
        await tx.table('playlistSongs').clear();
      });
    this.version(6).stores({
      songs: '++id, catalogKey, createdAt, appleMusicTrackId',
      playlists: 'id, name, isSystem, createdAt, parentId',
      playlistSongs: '[playlistId+songId], playlistId, songId',
      settings: 'key',
    });
    this.version(7).stores({
      songs: '++id, catalogKey, createdAt, appleMusicTrackId, primaryArtist, title',
      playlists: 'id, name, isSystem, createdAt, parentId',
      playlistSongs: '[playlistId+songId], playlistId, songId',
      settings: 'key',
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

export async function bootstrapDb(database: MusicboxxDB = db): Promise<void> {
  const n = await database.playlists.count();
  if (n === 0) {
    await database.playlists.add({
      id: FAVORITES_PLAYLIST_ID,
      name: 'Favorites',
      isSystem: true,
      createdAt: Date.now(),
      color: FAVORITES_PLAYLIST_COLOR,
    });
  }
  const setting = await database.settings.get(DEFAULT_PLAYLIST_SETTING_KEY);
  if (!setting) {
    await database.settings.put({
      key: DEFAULT_PLAYLIST_SETTING_KEY,
      value: FAVORITES_PLAYLIST_ID,
    });
  }
}

/** Playlist id that receives new songs from `addSongFromParsed` (falls back if setting missing or stale). */
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

export async function updatePlaylistColor(playlistId: string, color: string): Promise<void> {
  const normalized = normalizePlaylistColor(color);
  if (!isValidPlaylistColor(normalized)) {
    throw new Error('Use a valid hex color (e.g. #aabbcc).');
  }
  const pl = await db.playlists.get(playlistId);
  if (!pl) {
    throw new Error('Playlist not found.');
  }
  await db.playlists.update(playlistId, { color: normalized });
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

export async function getSongByCatalogKey(catalogKey: string): Promise<Song | undefined> {
  return db.songs.where('catalogKey').equals(catalogKey).first();
}

export async function getSongByVideoId(videoId: string): Promise<Song | undefined> {
  return getSongByCatalogKey(songCatalogKey('youtube', videoId));
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
    color: pickRandomPlaylistColor(),
    ...(parentId !== undefined ? { parentId } : {}),
  };
  await db.playlists.add(playlist);
  return playlist;
}

export type AddSongResult =
  | { ok: true; song: Song; duplicate: false }
  | { ok: true; song: Song; duplicate: true }
  | { ok: false; error: 'invalid_url' | 'network' };

export async function addSongFromParsed(
  parsed: ParsedMusic,
  titleHint?: string,
  authorHint?: string
): Promise<AddSongResult> {
  const idStr = parsed.provider === 'youtube' ? parsed.videoId : parsed.trackId;
  const catalogKey = songCatalogKey(parsed.provider, idStr);
  const existing = await getSongByCatalogKey(catalogKey);
  if (existing?.id != null) {
    return { ok: true, song: existing as Song, duplicate: true };
  }

  let title = titleHint?.trim();
  let author = authorHint;
  let thumbnailUrl: string | undefined;

  if (parsed.provider === 'youtube') {
    const videoId = parsed.videoId;
    if (!title) title = 'YouTube video';
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
      provider: 'youtube',
      catalogKey,
      videoId,
      title,
      author,
      primaryArtist: normalizePrimaryArtist(author),
      createdAt: Date.now(),
    };

    const defaultPl = await getDefaultPlaylistId();
    const newId = await db.transaction('rw', db.songs, db.playlistSongs, async () => {
      const nid = await db.songs.add(song);
      await addSongToPlaylist(defaultPl, nid as number);
      return nid as number;
    });

    return {
      ok: true,
      song: { ...song, id: newId },
      duplicate: false,
    };
  }

  if (parsed.provider === 'spotify') {
    const trackId = parsed.trackId;
    if (!title) title = 'Spotify track';
    if (!titleHint) {
      try {
        const o = await fetchSpotifyOembed(trackId);
        if (o.title) title = o.title;
        if (o.author) author = o.author;
        if (o.thumbnailUrl) thumbnailUrl = o.thumbnailUrl;
      } catch {
        /* keep fallback */
      }
    }

    const song: Song = {
      provider: 'spotify',
      catalogKey,
      spotifyTrackId: trackId,
      title,
      author,
      primaryArtist: normalizePrimaryArtist(author),
      thumbnailUrl,
      createdAt: Date.now(),
    };

    const defaultPl = await getDefaultPlaylistId();
    const newId = await db.transaction('rw', db.songs, db.playlistSongs, async () => {
      const nid = await db.songs.add(song);
      await addSongToPlaylist(defaultPl, nid as number);
      return nid as number;
    });

    return {
      ok: true,
      song: { ...song, id: newId },
      duplicate: false,
    };
  }

  const trackId = parsed.trackId;
  const openUrl = parsed.openUrl;
  let albumTitle: string | undefined;
  let durationMs: number | undefined;
  let isrc: string | undefined;
  let releaseYear: number | undefined;
  if (!title) title = 'Apple Music track';
  if (!titleHint) {
    try {
      const o = await fetchAppleMusicMetadata(trackId);
      if (o.title) title = o.title;
      if (o.author) author = o.author;
      if (o.thumbnailUrl) thumbnailUrl = o.thumbnailUrl;
      albumTitle = o.albumTitle;
      durationMs = o.durationMs;
      isrc = o.isrc;
      releaseYear = o.releaseYear;
    } catch {
      /* keep fallback */
    }
  }

  const song: Song = {
    provider: 'apple-music',
    catalogKey,
    appleMusicTrackId: trackId,
    appleMusicOpenUrl: openUrl,
    title,
    author,
    primaryArtist: normalizePrimaryArtist(author),
    albumTitle,
    durationMs,
    isrc,
    releaseYear,
    thumbnailUrl,
    createdAt: Date.now(),
  };

  const defaultPl = await getDefaultPlaylistId();
  const newId = await db.transaction('rw', db.songs, db.playlistSongs, async () => {
    const nid = await db.songs.add(song);
    await addSongToPlaylist(defaultPl, nid as number);
    return nid as number;
  });

  return {
    ok: true,
    song: { ...song, id: newId },
    duplicate: false,
  };
}

export async function addSongFromVideoId(
  videoId: string,
  titleHint?: string,
  authorHint?: string
): Promise<AddSongResult> {
  return addSongFromParsed({ provider: 'youtube', videoId }, titleHint, authorHint);
}
