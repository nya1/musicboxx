import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { db, FAVORITES_PLAYLIST_ID, removeSongFromPlaylist, type Song } from '../db';
import { SongThumbnail } from '../components/SongThumbnail';

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const playlistId = id ?? '';

  const data = useLiveQuery(
    async () => {
      if (!playlistId) return { playlist: undefined, songs: [] as Song[] };
      const playlist = await db.playlists.get(playlistId);
      const rows = await db.playlistSongs.where('playlistId').equals(playlistId).toArray();
      const loaded = await Promise.all(rows.map((r) => db.songs.get(r.songId)));
      const songs = loaded.filter((s): s is Song => s != null && s.id != null);
      songs.sort((a, b) => b.createdAt - a.createdAt);
      return { playlist, songs };
    },
    [playlistId]
  );

  if (!data) {
    return <p className="muted">Loading…</p>;
  }

  const { playlist, songs } = data;

  if (!playlist) {
    return (
      <div className="empty-state">
        <p>Playlist not found.</p>
        <Link to="/playlists">Back to playlists</Link>
      </div>
    );
  }

  const isFavorites = playlist.id === FAVORITES_PLAYLIST_ID;

  return (
    <div>
      <Link to="/playlists" className="back-link">
        ← Playlists
      </Link>
      <h1 className="page-title">
        {playlist.name}
        {isFavorites ? <span className="badge badge--inline">Default</span> : null}
      </h1>
      {songs.length === 0 ? (
        <div className="empty-state empty-state--compact">
          <p className="muted">
            {isFavorites
              ? 'No songs in Favorites yet. Add one from the Add tab.'
              : 'This playlist is empty. Add songs from a song’s page.'}
          </p>
          {isFavorites ? (
            <Link to="/add" className="btn btn--primary">
              Add a song
            </Link>
          ) : null}
        </div>
      ) : (
        <ul className="song-list" role="list">
          {songs.map((song) => (
            <li key={song.id}>
              <div className="playlist-song-row">
                <Link to={`/song/${song.id}`} className="song-row song-row--grow">
                  <SongThumbnail
                    videoId={song.videoId}
                    alt=""
                    className="song-row__thumb"
                  />
                  <div className="song-row__text">
                    <span className="song-row__title">{song.title}</span>
                    {song.author ? (
                      <span className="song-row__meta muted">{song.author}</span>
                    ) : null}
                  </div>
                </Link>
                <button
                  type="button"
                  className="btn btn--ghost btn--small playlist-song-row__remove"
                  aria-label={`Remove ${song.title} from ${playlist.name}`}
                  onClick={() => song.id != null && removeSongFromPlaylist(playlistId, song.id)}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
