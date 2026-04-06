import {
  addOrMergeYoutubeVideoToPlaylist,
  createPlaylist,
  db,
  type Playlist,
} from '../db';

export type YoutubePlaylistImportSummary = {
  targetPlaylistId: string;
  videosTotal: number;
  newSongs: number;
  existingInLibrary: number;
  linksAdded: number;
};

/**
 * Imports videos into a new or existing playlist. Call after {@link fetchInvidiousPlaylistVideos}.
 */
export async function runYoutubePlaylistImport(options: {
  youtubePlaylistId: string;
  canonicalUrl: string;
  mode: 'new' | 'existing';
  prefetched: { title: string; videoIds: string[] };
  newPlaylistName?: string;
  existingPlaylistId?: string;
  onProgress?: (done: number, total: number) => void;
}): Promise<{ summary: YoutubePlaylistImportSummary; playlist: Playlist }> {
  const { title, videoIds } = options.prefetched;

  const yt = {
    youtubePlaylistId: options.youtubePlaylistId,
    youtubePlaylistUrl: options.canonicalUrl,
  };

  let playlist: Playlist;

  if (options.mode === 'new') {
    const name =
      (options.newPlaylistName?.trim() || title.trim() || 'Imported playlist').trim();
    playlist = await createPlaylist(name, undefined, yt);
  } else {
    const id = options.existingPlaylistId;
    if (!id) throw new Error('Missing playlist id.');
    const existing = await db.playlists.get(id);
    if (!existing) throw new Error('Playlist not found.');
    await db.playlists.update(id, yt);
    playlist = { ...existing, ...yt };
  }

  const targetId = playlist.id;
  let newSongs = 0;
  let existingInLibrary = 0;
  let linksAdded = 0;
  const total = videoIds.length;

  for (let i = 0; i < videoIds.length; i++) {
    const vid = videoIds[i];
    options.onProgress?.(i + 1, total);
    const r = await addOrMergeYoutubeVideoToPlaylist(vid, targetId);
    if (r.newSong) newSongs++;
    else existingInLibrary++;
    if (r.addedLink) linksAdded++;
  }

  return {
    playlist,
    summary: {
      targetPlaylistId: targetId,
      videosTotal: videoIds.length,
      newSongs,
      existingInLibrary,
      linksAdded,
    },
  };
}
