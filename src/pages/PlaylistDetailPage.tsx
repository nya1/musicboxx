import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import { CreateSubplaylistModal } from '../components/CreateSubplaylistModal';
import {
  db,
  FAVORITES_PLAYLIST_ID,
  getChildPlaylistsSorted,
  getDirectMemberSongIds,
  getPlaylistAncestors,
  getSongsInPlaylistSubtreeDeduped,
  removeSongFromPlaylist,
  type Playlist,
  type Song,
} from '../db';
import { SongThumbnail } from '../components/SongThumbnail';

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const playlistId = id ?? '';

  /** Parent playlist for the “new sub-playlist” modal (current row or a child row). */
  const [addUnder, setAddUnder] = useState<Playlist | null>(null);

  const data = useLiveQuery(
    async () => {
      if (!playlistId) {
        return {
          playlist: undefined,
          songs: [] as Song[],
          directMemberIds: new Set<number>(),
          children: [] as Playlist[],
          ancestors: [] as Playlist[],
        };
      }
      const playlist = await db.playlists.get(playlistId);
      if (!playlist) {
        return {
          playlist: undefined,
          songs: [] as Song[],
          directMemberIds: new Set<number>(),
          children: [] as Playlist[],
          ancestors: [] as Playlist[],
        };
      }
      const allPlaylists = await db.playlists.orderBy('createdAt').toArray();
      const [songs, directMemberIds] = await Promise.all([
        getSongsInPlaylistSubtreeDeduped(playlistId),
        getDirectMemberSongIds(playlistId),
      ]);
      const children = getChildPlaylistsSorted(playlistId, allPlaylists);
      const ancestors = getPlaylistAncestors(playlist, allPlaylists);
      return { playlist, songs, directMemberIds, children, ancestors };
    },
    [playlistId]
  );

  if (!data) {
    return <p className="muted">Loading…</p>;
  }

  const { playlist, songs, directMemberIds, children, ancestors } = data;

  if (!playlist) {
    return (
      <div className="empty-state">
        <p>Playlist not found.</p>
        <Link to="/playlists">Back to playlists</Link>
      </div>
    );
  }

  const isFavorites = playlist.id === FAVORITES_PLAYLIST_ID;
  const hasChildren = children.length > 0;
  const hasSongs = songs.length > 0;
  const isEmptySubtree = !hasChildren && !hasSongs;

  return (
    <div>
      <Link to="/playlists" className="back-link">
        ← Playlists
      </Link>
      {ancestors.length > 0 ? (
        <nav className="playlist-breadcrumb" aria-label="Parent playlists">
          {ancestors.map((a, index) => (
            <span key={a.id} className="playlist-breadcrumb__item">
              {index > 0 ? (
                <span className="playlist-breadcrumb__sep" aria-hidden>
                  /
                </span>
              ) : null}
              <Link to={`/playlist/${a.id}`} className="playlist-breadcrumb__link">
                {a.name}
              </Link>
            </span>
          ))}
        </nav>
      ) : null}
      <div className="page-title-row">
        <h1 className="page-title page-title--with-action">
          {playlist.name}
          {isFavorites ? <span className="badge badge--inline">Default</span> : null}
        </h1>
        <button
          type="button"
          className="playlist-row__add playlist-row__add--title"
          aria-label={`Add playlist inside ${playlist.name}`}
          onClick={() => setAddUnder(playlist)}
        >
          +
        </button>
      </div>

      {addUnder ? (
        <CreateSubplaylistModal
          isOpen
          onClose={() => setAddUnder(null)}
          parentId={addUnder.id}
          parentName={addUnder.name}
        />
      ) : null}

      <section className="stack mt-lg" aria-labelledby="sub-playlists-heading">
        <h2 id="sub-playlists-heading" className="section-title">
          Sub-playlists
        </h2>
        {hasChildren ? (
          <ul className="playlist-list" role="list">
            {children.map((c) => (
              <li key={c.id}>
                <div className="playlist-row-wrap">
                  <Link to={`/playlist/${c.id}`} className="playlist-row__link">
                    <span className="playlist-row__name">{c.name}</span>
                  </Link>
                  <button
                    type="button"
                    className="playlist-row__add"
                    aria-label={`Add playlist inside ${c.name}`}
                    onClick={() => setAddUnder(c)}
                  >
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No sub-playlists yet. Use + to add one inside this playlist.</p>
        )}
      </section>

      <section className="mt-lg" aria-labelledby="songs-heading">
        <h2 id="songs-heading" className="section-title">
          Songs
        </h2>
        {isEmptySubtree ? (
          <div className="empty-state empty-state--compact">
            <p className="muted">
              {isFavorites
                ? 'No songs in Favorites yet. Add one from the Add tab.'
                : 'No songs in this playlist or its sub-playlists yet. Add songs from a song’s page.'}
            </p>
            {isFavorites ? (
              <Link to="/add" className="btn btn--primary">
                Add a song
              </Link>
            ) : null}
          </div>
        ) : !hasSongs ? (
          <p className="muted">No songs in this playlist or its sub-playlists yet.</p>
        ) : (
          <ul className="song-list" role="list">
            {songs.map((song) => {
              const canRemoveDirect = song.id != null && directMemberIds.has(song.id);
              return (
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
                    {canRemoveDirect ? (
                      <button
                        type="button"
                        className="btn btn--ghost btn--small playlist-song-row__remove"
                        aria-label={`Remove ${song.title} from ${playlist.name}`}
                        onClick={() => song.id != null && removeSongFromPlaylist(playlistId, song.id)}
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="muted playlist-song-row__inherited" title="Only in a sub-playlist">
                        In sub-playlist
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
