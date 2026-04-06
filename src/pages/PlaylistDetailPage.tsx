import { ListPlus, Music } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChangePlaylistColorModal } from '../components/ChangePlaylistColorModal';
import { CreateSubplaylistModal } from '../components/CreateSubplaylistModal';
import { DeletePlaylistModal } from '../components/DeletePlaylistModal';
import { MovePlaylistModal } from '../components/MovePlaylistModal';
import { PlaylistOverflowMenu } from '../components/PlaylistOverflowMenu';
import { RenamePlaylistModal } from '../components/RenamePlaylistModal';
import {
  db,
  FAVORITES_PLAYLIST_ID,
  getChildPlaylistsSorted,
  getDefaultPlaylistId,
  getDirectMemberSongIds,
  getPlaylistAccentColor,
  getPlaylistAncestors,
  getSongsInPlaylistSubtreeDeduped,
  formatPlaylistSongCountLabel,
  removeSongFromPlaylist,
  setDefaultPlaylist,
  type Playlist,
  type Song,
} from '../db';
import { SongThumbnail } from '../components/SongThumbnail';

export function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const playlistId = id ?? '';
  const navigate = useNavigate();

  /** Parent playlist for the “new sub-playlist” modal (current row or a child row). */
  const [addUnder, setAddUnder] = useState<Playlist | null>(null);
  const [renameTarget, setRenameTarget] = useState<Playlist | null>(null);
  const [moveTarget, setMoveTarget] = useState<Playlist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [colorTarget, setColorTarget] = useState<Playlist | null>(null);

  const data = useLiveQuery(
    async () => {
      if (!playlistId) {
        return {
          playlist: undefined,
          songs: [] as Song[],
          directMemberIds: new Set<number>(),
          children: [] as Playlist[],
          ancestors: [] as Playlist[],
          allPlaylists: [] as Playlist[],
          defaultPlaylistId: FAVORITES_PLAYLIST_ID,
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
          allPlaylists: [] as Playlist[],
          defaultPlaylistId: FAVORITES_PLAYLIST_ID,
        };
      }
      const allPlaylists = await db.playlists.orderBy('createdAt').toArray();
      const [songs, directMemberIds, defaultPlaylistId] = await Promise.all([
        getSongsInPlaylistSubtreeDeduped(playlistId),
        getDirectMemberSongIds(playlistId),
        getDefaultPlaylistId(),
      ]);
      const children = getChildPlaylistsSorted(playlistId, allPlaylists);
      const ancestors = getPlaylistAncestors(playlist, allPlaylists);
      return {
        playlist,
        songs,
        directMemberIds,
        children,
        ancestors,
        allPlaylists,
        defaultPlaylistId,
      };
    },
    [playlistId]
  );

  if (!data) {
    return <p className="muted">Loading…</p>;
  }

  const { playlist, songs, directMemberIds, children, ancestors, allPlaylists, defaultPlaylistId } =
    data;

  if (!playlist) {
    return (
      <div className="empty-state">
        <p>Playlist not found.</p>
        <Link to="/playlists">Back to playlists</Link>
      </div>
    );
  }

  const isDefaultPlaylist = playlist.id === defaultPlaylistId;
  const isFavorites = playlist.id === FAVORITES_PLAYLIST_ID;
  const hasChildren = children.length > 0;
  const songCount = songs.length;
  const hasSongs = songCount > 0;
  const isEmptySubtree = !hasChildren && !hasSongs;
  const songCountLabel = formatPlaylistSongCountLabel(songCount);

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
      <div
        className="page-title-row page-title-row--accent"
        style={
          {
            '--playlist-accent': getPlaylistAccentColor(playlist),
          } as CSSProperties
        }
      >
        <h1 className="page-title page-title--with-action">
          {playlist.name}
          {isDefaultPlaylist ? <span className="badge badge--inline">Default</span> : null}
        </h1>
        <Link
          to={`/add?playlist=${encodeURIComponent(playlist.id)}`}
          className="playlist-row__add playlist-row__add--title"
          aria-label={`Add tracks to ${playlist.name}`}
          title="Add songs"
        >
          <Music size={22} strokeWidth={1.75} aria-hidden />
        </Link>
        <button
          type="button"
          className="playlist-row__add playlist-row__add--title"
          aria-label={`New sub-playlist inside ${playlist.name}`}
          title="New sub-playlist"
          onClick={() => setAddUnder(playlist)}
        >
          <ListPlus size={22} strokeWidth={1.75} aria-hidden />
        </button>
        <PlaylistOverflowMenu
          playlist={playlist}
          allPlaylists={allPlaylists}
          defaultPlaylistId={defaultPlaylistId}
          onRename={() => setRenameTarget(playlist)}
          onSetDefault={() => void setDefaultPlaylist(playlist.id)}
          onAddChild={() => setAddUnder(playlist)}
          onMove={() => setMoveTarget(playlist)}
          onChangeColor={() => setColorTarget(playlist)}
          onDelete={() => setDeleteTarget(playlist)}
        />
      </div>
      <p className="playlist-detail__song-count muted" aria-live="polite">
        {songCountLabel}
      </p>

      {addUnder ? (
        <CreateSubplaylistModal
          isOpen
          onClose={() => setAddUnder(null)}
          parentId={addUnder.id}
          parentName={addUnder.name}
        />
      ) : null}
      {renameTarget ? (
        <RenamePlaylistModal
          isOpen
          onClose={() => setRenameTarget(null)}
          playlistId={renameTarget.id}
          initialName={renameTarget.name}
        />
      ) : null}
      {moveTarget ? (
        <MovePlaylistModal
          isOpen
          onClose={() => setMoveTarget(null)}
          playlist={moveTarget}
          allPlaylists={allPlaylists}
        />
      ) : null}
      {deleteTarget ? (
        <DeletePlaylistModal
          isOpen
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => navigate('/playlists')}
          playlist={deleteTarget}
        />
      ) : null}
      {colorTarget ? (
        <ChangePlaylistColorModal
          isOpen
          onClose={() => setColorTarget(null)}
          playlist={colorTarget}
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
                <div
                  className="playlist-row-wrap"
                  style={
                    {
                      '--playlist-accent': getPlaylistAccentColor(c),
                    } as CSSProperties
                  }
                >
                  <Link to={`/playlist/${c.id}`} className="playlist-row__link">
                    <span className="playlist-row__name">{c.name}</span>
                  </Link>
                  <button
                    type="button"
                    className="playlist-row__add"
                    aria-label={`New sub-playlist inside ${c.name}`}
                    title="New sub-playlist"
                    onClick={() => setAddUnder(c)}
                  >
                    <ListPlus size={22} strokeWidth={1.75} aria-hidden />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            No sub-playlists yet. Use the list-with-plus button next to the title to add one inside this
            playlist.
          </p>
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
                        song={song}
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
