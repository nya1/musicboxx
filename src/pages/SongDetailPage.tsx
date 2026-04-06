import { useLiveQuery } from 'dexie-react-hooks';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { siApplemusic, siGenius, siSpotify, siYoutube } from 'simple-icons';
import {
  addSongToPlaylist,
  db,
  deleteSongFromLibrary,
  formatPlaylistPath,
  getDefaultPlaylistId,
  removeSongFromPlaylist,
} from '../db';
import { SimpleBrandIcon } from '../components/SimpleBrandIcon';
import { SongThumbnail } from '../components/SongThumbnail';
import { geniusSearchUrl } from '../lib/geniusSearch';
import { spotifyOpenUrl } from '../lib/spotify';
import { youtubeWatchUrl } from '../lib/youtube';

type SongDetailLocationState = { from?: string };

function safeLibraryHref(from: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return '/';
  }
  return from;
}

export function SongDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const libraryHref = safeLibraryHref(
    (location.state as SongDetailLocationState | null)?.from
  );
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

  const songRecord = song;

  const openUrl =
    songRecord.provider === 'youtube' && songRecord.videoId
      ? youtubeWatchUrl(songRecord.videoId)
      : songRecord.provider === 'spotify' && songRecord.spotifyTrackId
        ? spotifyOpenUrl(songRecord.spotifyTrackId)
        : songRecord.provider === 'apple-music' && songRecord.appleMusicOpenUrl
          ? songRecord.appleMusicOpenUrl
          : null;
  const openLabel =
    songRecord.provider === 'spotify'
      ? 'Open in Spotify'
      : songRecord.provider === 'apple-music'
        ? 'Open in Apple Music'
        : 'Open in YouTube';
  const openAria =
    songRecord.provider === 'spotify'
      ? `Open ${songRecord.title} on Spotify (opens in a new tab)`
      : songRecord.provider === 'apple-music'
        ? `Open ${songRecord.title} on Apple Music (opens in a new tab)`
        : `Open ${songRecord.title} on YouTube (opens in a new tab)`;
  const geniusUrl = geniusSearchUrl(songRecord.title, songRecord.author);
  const geniusAria = `Find lyrics for ${songRecord.title} on Genius search (opens in a new tab)`;
  const openBrandIcon =
    songRecord.provider === 'spotify'
      ? siSpotify
      : songRecord.provider === 'apple-music'
        ? siApplemusic
        : siYoutube;
  const addable = playlists
    .filter((p) => !memberships.includes(p.id))
    .sort((a, b) =>
      formatPlaylistPath(a, playlists).localeCompare(formatPlaylistPath(b, playlists), undefined, {
        sensitivity: 'base',
      })
    );

  async function onDeleteFromLibrary() {
    if (songRecord.id == null) return;
    const ok = window.confirm(
      `Remove “${songRecord.title}” from your library? This cannot be undone.`
    );
    if (!ok) return;
    await deleteSongFromLibrary(songRecord.id);
    navigate(libraryHref);
  }

  return (
    <div>
      <Link to={libraryHref} className="back-link">
        ← Library
      </Link>
      <article className="song-detail">
        <SongThumbnail
          song={songRecord}
          alt={`Thumbnail for ${songRecord.title}`}
          className="song-detail__cover"
        />
        <h1 className="song-detail__title">{songRecord.title}</h1>
        {songRecord.author ? <p className="song-detail__author muted">{songRecord.author}</p> : null}
        <div className="song-detail__actions stack">
          {openUrl ? (
            <a
              className="btn btn--primary btn--with-brand"
              href={openUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={openAria}
            >
              <SimpleBrandIcon icon={openBrandIcon} />
              {openLabel}
            </a>
          ) : null}
          {geniusUrl ? (
            <a
              className="btn btn--secondary btn--with-brand"
              href={geniusUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={geniusAria}
            >
              <SimpleBrandIcon icon={siGenius} className="simple-brand-icon--genius" />
              Find lyrics on Genius
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
                    aria-label={`Remove ${songRecord.title} from ${label}`}
                    onClick={() => removeSongFromPlaylist(pid, songRecord.id!)}
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
                    aria-label={`Add ${songRecord.title} to ${label}`}
                    onClick={() => addSongToPlaylist(pl.id, songRecord.id!)}
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

      <section className="mt-lg" aria-labelledby="delete-song-heading">
        <h2 id="delete-song-heading" className="section-title">
          Delete from library
        </h2>
        <p className="muted">
          {memberships.length === 0
            ? 'This song is not in any playlist. You can remove it from your library permanently.'
            : 'Remove this track from all playlists and delete it from your library.'}
        </p>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => void onDeleteFromLibrary()}
        >
          Delete from library
        </button>
      </section>
    </div>
  );
}
