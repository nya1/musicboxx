import {
  bootstrapDb,
  DEFAULT_PLAYLIST_SETTING_KEY,
  FAVORITES_PLAYLIST_ID,
  getDescendantPlaylistIds,
  isValidPlaylistColor,
  normalizePlaylistColor,
  type AppSetting,
  type MusicboxxDB,
  type Playlist,
  type PlaylistSong,
  type Song,
  type SongProvider,
} from '../db';

export const LIBRARY_EXPORT_SCHEMA_VERSION = 1 as const;

export type LibraryExportDocument = {
  schemaVersion: typeof LIBRARY_EXPORT_SCHEMA_VERSION;
  exportedAt: string;
  songs: Song[];
  playlists: Playlist[];
  playlistSongs: PlaylistSong[];
  settings: AppSetting[];
};

const PROVIDERS: readonly SongProvider[] = ['youtube', 'spotify', 'apple-music'];

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function err(message: string): { ok: false; error: string } {
  return { ok: false, error: message };
}

function parseSong(x: unknown, index: number): Song | string {
  if (!isRecord(x)) return `Song at index ${index} is not an object.`;
  const id = x.id;
  if (typeof id !== 'number' || !Number.isFinite(id) || id <= 0) {
    return `Song at index ${index} has invalid id.`;
  }
  const provider = x.provider;
  if (typeof provider !== 'string' || !PROVIDERS.includes(provider as SongProvider)) {
    return `Song at index ${index} has invalid provider.`;
  }
  const catalogKey = x.catalogKey;
  if (typeof catalogKey !== 'string' || catalogKey.length === 0) {
    return `Song at index ${index} has invalid catalogKey.`;
  }
  const title = x.title;
  if (typeof title !== 'string') {
    return `Song at index ${index} has invalid title.`;
  }
  const createdAt = x.createdAt;
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) {
    return `Song at index ${index} has invalid createdAt.`;
  }

  const song: Song = {
    id,
    provider: provider as SongProvider,
    catalogKey,
    title,
    createdAt,
  };
  if (x.videoId !== undefined) {
    if (typeof x.videoId !== 'string') return `Song at index ${index} has invalid videoId.`;
    song.videoId = x.videoId;
  }
  if (x.spotifyTrackId !== undefined) {
    if (typeof x.spotifyTrackId !== 'string') return `Song at index ${index} has invalid spotifyTrackId.`;
    song.spotifyTrackId = x.spotifyTrackId;
  }
  if (x.appleMusicTrackId !== undefined) {
    if (typeof x.appleMusicTrackId !== 'string') return `Song at index ${index} has invalid appleMusicTrackId.`;
    song.appleMusicTrackId = x.appleMusicTrackId;
  }
  if (x.appleMusicOpenUrl !== undefined) {
    if (typeof x.appleMusicOpenUrl !== 'string') return `Song at index ${index} has invalid appleMusicOpenUrl.`;
    song.appleMusicOpenUrl = x.appleMusicOpenUrl;
  }
  if (x.author !== undefined) {
    if (typeof x.author !== 'string') return `Song at index ${index} has invalid author.`;
    song.author = x.author;
  }
  if (x.primaryArtist !== undefined) {
    if (typeof x.primaryArtist !== 'string') return `Song at index ${index} has invalid primaryArtist.`;
    song.primaryArtist = x.primaryArtist;
  }
  if (x.albumTitle !== undefined) {
    if (typeof x.albumTitle !== 'string') return `Song at index ${index} has invalid albumTitle.`;
    song.albumTitle = x.albumTitle;
  }
  if (x.durationMs !== undefined) {
    if (typeof x.durationMs !== 'number' || !Number.isFinite(x.durationMs)) {
      return `Song at index ${index} has invalid durationMs.`;
    }
    song.durationMs = x.durationMs;
  }
  if (x.isrc !== undefined) {
    if (typeof x.isrc !== 'string') return `Song at index ${index} has invalid isrc.`;
    song.isrc = x.isrc;
  }
  if (x.releaseYear !== undefined) {
    if (typeof x.releaseYear !== 'number' || !Number.isFinite(x.releaseYear)) {
      return `Song at index ${index} has invalid releaseYear.`;
    }
    song.releaseYear = x.releaseYear;
  }
  if (x.thumbnailUrl !== undefined) {
    if (typeof x.thumbnailUrl !== 'string') return `Song at index ${index} has invalid thumbnailUrl.`;
    song.thumbnailUrl = x.thumbnailUrl;
  }
  return song;
}

function parsePlaylist(x: unknown, index: number): Playlist | string {
  if (!isRecord(x)) return `Playlist at index ${index} is not an object.`;
  const id = x.id;
  if (typeof id !== 'string' || id.length === 0) {
    return `Playlist at index ${index} has invalid id.`;
  }
  const name = x.name;
  if (typeof name !== 'string') {
    return `Playlist at index ${index} has invalid name.`;
  }
  const isSystem = x.isSystem;
  if (typeof isSystem !== 'boolean') {
    return `Playlist at index ${index} has invalid isSystem.`;
  }
  const createdAt = x.createdAt;
  if (typeof createdAt !== 'number' || !Number.isFinite(createdAt)) {
    return `Playlist at index ${index} has invalid createdAt.`;
  }
  const colorRaw = x.color;
  if (typeof colorRaw !== 'string' || !isValidPlaylistColor(colorRaw)) {
    return `Playlist at index ${index} has invalid color.`;
  }
  const color = normalizePlaylistColor(colorRaw);
  const pl: Playlist = { id, name, isSystem, createdAt, color };
  if (x.parentId !== undefined) {
    if (typeof x.parentId !== 'string' || x.parentId.length === 0) {
      return `Playlist at index ${index} has invalid parentId.`;
    }
    pl.parentId = x.parentId;
  }
  return pl;
}

function parsePlaylistSong(x: unknown, index: number): PlaylistSong | string {
  if (!isRecord(x)) return `PlaylistSong at index ${index} is not an object.`;
  const playlistId = x.playlistId;
  if (typeof playlistId !== 'string' || playlistId.length === 0) {
    return `PlaylistSong at index ${index} has invalid playlistId.`;
  }
  const songId = x.songId;
  if (typeof songId !== 'number' || !Number.isFinite(songId) || songId <= 0) {
    return `PlaylistSong at index ${index} has invalid songId.`;
  }
  return { playlistId, songId };
}

function parseSetting(x: unknown, index: number): AppSetting | string {
  if (!isRecord(x)) return `Setting at index ${index} is not an object.`;
  const key = x.key;
  const value = x.value;
  if (typeof key !== 'string' || key.length === 0) {
    return `Setting at index ${index} has invalid key.`;
  }
  if (typeof value !== 'string') {
    return `Setting at index ${index} has invalid value.`;
  }
  return { key, value };
}

/**
 * Reads all local library tables and returns a versioned snapshot (not yet stringified).
 */
export async function exportLibrarySnapshot(database: MusicboxxDB): Promise<LibraryExportDocument> {
  const [songs, playlists, playlistSongs, settings] = await Promise.all([
    database.songs.toArray(),
    database.playlists.toArray(),
    database.playlistSongs.toArray(),
    database.settings.toArray(),
  ]);
  return {
    schemaVersion: LIBRARY_EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    songs,
    playlists,
    playlistSongs,
    settings,
  };
}

export function validateImportDocument(raw: unknown): { ok: true; document: LibraryExportDocument } | { ok: false; error: string } {
  if (!isRecord(raw)) return err('File must contain a JSON object.');
  const schemaVersion = raw.schemaVersion;
  if (schemaVersion !== LIBRARY_EXPORT_SCHEMA_VERSION) {
    return err(
      `Unsupported export version (got ${String(schemaVersion)}, need ${String(LIBRARY_EXPORT_SCHEMA_VERSION)}).`
    );
  }
  const exportedAt = raw.exportedAt;
  if (typeof exportedAt !== 'string' || exportedAt.length === 0) {
    return err('Missing or invalid exportedAt.');
  }

  const songsRaw = raw.songs;
  const playlistsRaw = raw.playlists;
  const playlistSongsRaw = raw.playlistSongs;
  const settingsRaw = raw.settings;
  if (!Array.isArray(songsRaw)) return err('Invalid songs array.');
  if (!Array.isArray(playlistsRaw)) return err('Invalid playlists array.');
  if (!Array.isArray(playlistSongsRaw)) return err('Invalid playlistSongs array.');
  if (!Array.isArray(settingsRaw)) return err('Invalid settings array.');

  const songs: Song[] = [];
  for (let i = 0; i < songsRaw.length; i++) {
    const s = parseSong(songsRaw[i], i);
    if (typeof s === 'string') return err(s);
    songs.push(s);
  }

  const playlists: Playlist[] = [];
  for (let i = 0; i < playlistsRaw.length; i++) {
    const p = parsePlaylist(playlistsRaw[i], i);
    if (typeof p === 'string') return err(p);
    playlists.push(p);
  }

  const playlistSongs: PlaylistSong[] = [];
  for (let i = 0; i < playlistSongsRaw.length; i++) {
    const ps = parsePlaylistSong(playlistSongsRaw[i], i);
    if (typeof ps === 'string') return err(ps);
    playlistSongs.push(ps);
  }

  const settings: AppSetting[] = [];
  for (let i = 0; i < settingsRaw.length; i++) {
    const st = parseSetting(settingsRaw[i], i);
    if (typeof st === 'string') return err(st);
    settings.push(st);
  }

  const songIds = new Set(songs.map((s) => s.id as number));
  if (songIds.size !== songs.length) return err('Duplicate song ids in export.');

  const catalogKeys = new Set(songs.map((s) => s.catalogKey));
  if (catalogKeys.size !== songs.length) return err('Duplicate catalogKey in export.');

  const playlistIds = new Set(playlists.map((p) => p.id));
  if (playlistIds.size !== playlists.length) return err('Duplicate playlist ids in export.');

  const fav = playlists.find((p) => p.id === FAVORITES_PLAYLIST_ID);
  if (!fav) return err('Missing Favorites playlist.');
  if (!fav.isSystem) return err('Favorites playlist must be a system playlist.');
  if (fav.parentId !== undefined) return err('Favorites cannot have a parent playlist.');

  for (const p of playlists) {
    if (p.parentId) {
      if (!playlistIds.has(p.parentId)) return err('Playlist parent reference points to a missing playlist.');
      if (p.id === FAVORITES_PLAYLIST_ID) return err('Favorites cannot have a parent playlist.');
      const desc = getDescendantPlaylistIds(p.id, playlists);
      if (desc.has(p.parentId)) return err('Invalid playlist hierarchy (cycle).');
    }
  }

  for (const row of playlistSongs) {
    if (!playlistIds.has(row.playlistId)) return err('Playlist membership references a missing playlist.');
    if (!songIds.has(row.songId)) return err('Playlist membership references a missing song.');
  }

  for (const row of settings) {
    if (row.key === DEFAULT_PLAYLIST_SETTING_KEY && !playlistIds.has(row.value)) {
      return err('Default playlist setting references a missing playlist.');
    }
  }

  return {
    ok: true,
    document: {
      schemaVersion: LIBRARY_EXPORT_SCHEMA_VERSION,
      exportedAt,
      songs,
      playlists,
      playlistSongs,
      settings,
    },
  };
}

/**
 * Replaces all library tables with the validated snapshot, then runs bootstrap invariants.
 */
export async function importLibraryReplace(database: MusicboxxDB, document: LibraryExportDocument): Promise<void> {
  await database.transaction(
    'rw',
    database.songs,
    database.playlists,
    database.playlistSongs,
    database.settings,
    async () => {
      await database.songs.clear();
      await database.playlists.clear();
      await database.playlistSongs.clear();
      await database.settings.clear();
      await database.songs.bulkPut(document.songs);
      await database.playlists.bulkPut(document.playlists);
      await database.playlistSongs.bulkPut(document.playlistSongs);
      await database.settings.bulkPut(document.settings);
    }
  );
  await bootstrapDb(database);
}

export function formatExportFilename(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `musicboxx-export-${y}-${m}-${d}.json`;
}

export function downloadLibraryExportFile(snapshot: LibraryExportDocument): void {
  const json = JSON.stringify(snapshot, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = globalThis.document.createElement('a');
  a.href = url;
  a.download = formatExportFilename();
  a.rel = 'noopener';
  a.click();
  URL.revokeObjectURL(url);
}
