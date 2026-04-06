import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useParams } from 'react-router-dom';
import {
  addSongToPlaylist,
  db,
  formatPlaylistPath,
  getDefaultPlaylistId,
  removeSongFromPlaylist,
} from '../db';
import { SongThumbnail } from '../components/SongThumbnail';
import { spotifyOpenUrl } from '../lib/spotify';
import { youtubeWatchUrl } from '../lib/youtube';

export function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const songId = id ? parseInt(id, 10) : NaN;

  const bundle = useLiveQuery(
    async () => {
      if (!Number.isFinite(songId)) {
        return { song: undefined, playlists: [], memberships: [] as string[], defaultPlaylistId: '' };
      }
      const song = await db.songs.get(songId);
      const playlists = await db.playlists.orderBy('createdAt').toArray();
      const memberRows = await db.playlistSongs.where('songId').equals(songId).toArray();
      const memberships = memberRows.map((r) => r.playlistId);
      const defaultPlaylistId = await getDefaultPlaylistId();
      return { song, playlists, memberships, defaultPlaylistId };
    },
    [songId]
  );

  if (!bundle) {
    return <p className="muted">Loading…</p>;
  }

  const { song, playlists, memberships, defaultPlaylistId } = bundle;

  if (!song) {
    return (
      <div className="empty-state">
        <p>Song not found.</p>
        <Link to="/">Back to library</Link>
      </div>
    );
  }

  const openUrl =
    song.provider === 'youtube' && song.videoId
      ? youtubeWatchUrl(song.videoId)
      : song.provider === 'spotify' && song.spotifyTrackId
        ? spotifyOpenUrl(song.spotifyTrackId)
        : null;
  const openLabel =
    song.provider === 'spotify' ? 'Open in Spotify' : 'Open in YouTube';
  const openAria =
    song.provider === 'spotify'
      ? `Open ${song.title} on Spotify (opens in a new tab)`
      : `Open ${song.title} on YouTube (opens in a new tab)`;
  const addable = playlists
    .filter((p) => !memberships.includes(p.id))
    .sort((a, b) =>
      formatPlaylistPath(a, playlists).localeCompare(formatPlaylistPath(b, playlists), undefined, {
        sensitivity: 'base',
      })
    );

  return (
    <div>
      <Link to="/" className="back-link">
        ← Library
      </Link>
      <article className="song-detail">
        <SongThumbnail
          song={song}
          alt={`Thumbnail for ${song.title}`}
          className="song-detail__cover"
        />
        <h1 className="song-detail__title">{song.title}</h1>
        {song.author ? <p className="song-detail__author muted">{song.author}</p> : null}
        <div className="song-detail__actions stack">
          {openUrl ? (
            <a
              className="btn btn--primary"
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={openAria}
            >
              {openLabel}
            </a>
          ) : null}
        </div>
      </article>

      <section className="mt-lg" aria-labelledby="in-playlists-heading">
        <h2 id="in-playlists-heading" className="section-title">
          In playlists
        </h2>
        {memberships.length === 0 ? (
          <p className="muted">Not in any playlist.</p>
        ) : (
          <ul className="membership-list" role="list">
            {memberships.map((pid) => {
              const pl = playlists.find((p) => p.id === pid);
              if (!pl) return null;
              const label = formatPlaylistPath(pl, playlists);
              return (
                <li key={pid} className="membership-row">
                  <Link to={`/playlist/${pid}`}>{label}</Link>
                  <button
                    type="button"
                    className="btn btn--ghost btn--small"
                    aria-label={`Remove ${song.title} from ${label}`}
                    onClick={() => removeSongFromPlaylist(pid, song.id!)}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {addable.length > 0 ? (
        <section className="mt-lg" aria-labelledby="add-to-heading">
          <h2 id="add-to-heading" className="section-title">
            Add to playlist
          </h2>
          <ul className="add-to-list" role="list">
            {addable.map((pl) => {
              const label = formatPlaylistPath(pl, playlists);
              return (
                <li key={pl.id}>
                  <button
                    type="button"
                    className="btn btn--secondary btn--block"
                    aria-label={`Add ${song.title} to ${label}`}
                    onClick={() => addSongToPlaylist(pl.id, song.id!)}
                  >
                    Add to {label}
                    {pl.id === defaultPlaylistId ? (
                      <span className="sr-only"> (default)</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <p className="muted mt-lg">This song is already in all of your playlists.</p>
      )}
    </div>
  );
}
