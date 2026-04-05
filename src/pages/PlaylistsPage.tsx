import { FormEvent, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { createPlaylist, db, FAVORITES_PLAYLIST_ID } from '../db';

export function PlaylistsPage() {
  const playlists = useLiveQuery(() => db.playlists.orderBy('createdAt').toArray(), []);
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setCreateError('Enter a playlist name.');
      return;
    }
    await createPlaylist(trimmed);
    setName('');
  }

  if (!playlists) {
    return <p className="muted">Loading…</p>;
  }

  const userPlaylists = playlists.filter((p) => !p.isSystem);
  const favorites = playlists.find((p) => p.id === FAVORITES_PLAYLIST_ID);

  return (
    <div>
      <h1 className="page-title">Playlists</h1>
      {playlists.length <= 1 && userPlaylists.length === 0 ? (
        <p className="muted page-lead">
          You only have <strong>Favorites</strong> right now. Create a playlist to group songs
          further—songs can live in Favorites and other lists at the same time.
        </p>
      ) : null}
      <ul className="playlist-list" role="list">
        {favorites ? (
          <li>
            <Link
              to={`/playlist/${favorites.id}`}
              className="playlist-row playlist-row--favorites"
            >
              <span className="playlist-row__name">{favorites.name}</span>
              <span className="badge">Default</span>
            </Link>
          </li>
        ) : null}
        {playlists
          .filter((p) => p.id !== FAVORITES_PLAYLIST_ID)
          .map((p) => (
            <li key={p.id}>
              <Link to={`/playlist/${p.id}`} className="playlist-row">
                <span className="playlist-row__name">{p.name}</span>
              </Link>
            </li>
          ))}
      </ul>
      <form onSubmit={onCreate} className="stack mt-lg" aria-label="Create playlist">
        <h2 className="section-title">New playlist</h2>
        <label className="field">
          <span className="field__label">Name</span>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Running"
            aria-invalid={createError ? true : undefined}
            aria-describedby={createError ? 'playlist-name-error' : undefined}
          />
        </label>
        {createError ? (
          <p id="playlist-name-error" className="form-error" role="alert">
            {createError}
          </p>
        ) : null}
        <button type="submit" className="btn btn--secondary">
          Create playlist
        </button>
      </form>
    </div>
  );
}
