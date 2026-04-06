import { FormEvent, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { CreateSubplaylistModal } from '../components/CreateSubplaylistModal';
import {
  createPlaylist,
  db,
  FAVORITES_PLAYLIST_ID,
  PlaylistParentError,
  type Playlist,
} from '../db';

function PlaylistTreeItems({
  playlists,
  parentId,
  onAddChild,
}: {
  playlists: Playlist[];
  parentId: string | undefined;
  onAddChild: (playlist: Playlist) => void;
}) {
  const items = playlists
    .filter((p) => (p.parentId ?? undefined) === (parentId ?? undefined))
    .sort((a, b) => {
      if (parentId != null) return a.createdAt - b.createdAt;
      if (a.id === FAVORITES_PLAYLIST_ID) return -1;
      if (b.id === FAVORITES_PLAYLIST_ID) return 1;
      return a.createdAt - b.createdAt;
    });

  if (items.length === 0) return null;

  return (
    <ul
      className={parentId == null ? 'playlist-list' : 'playlist-list playlist-list--nested'}
      role="list"
    >
      {items.map((p) => (
        <li key={p.id}>
          <div
            className={`playlist-row-wrap ${p.id === FAVORITES_PLAYLIST_ID ? 'playlist-row-wrap--favorites' : ''}`}
          >
            <Link
              to={`/playlist/${p.id}`}
              className="playlist-row__link"
            >
              <span className="playlist-row__name">{p.name}</span>
              {p.id === FAVORITES_PLAYLIST_ID ? <span className="badge">Default</span> : null}
            </Link>
            <button
              type="button"
              className="playlist-row__add"
              aria-label={`Add playlist inside ${p.name}`}
              onClick={(e) => {
                e.preventDefault();
                onAddChild(p);
              }}
            >
              +
            </button>
          </div>
          <PlaylistTreeItems playlists={playlists} parentId={p.id} onAddChild={onAddChild} />
        </li>
      ))}
    </ul>
  );
}

export function PlaylistsPage() {
  const playlists = useLiveQuery(() => db.playlists.orderBy('createdAt').toArray(), []);
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [subModal, setSubModal] = useState<Playlist | null>(null);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setCreateError('Enter a playlist name.');
      return;
    }
    try {
      await createPlaylist(trimmed);
      setName('');
    } catch (err) {
      if (err instanceof PlaylistParentError) {
        setCreateError(err.message);
        return;
      }
      throw err;
    }
  }

  if (!playlists) {
    return <p className="muted">Loading…</p>;
  }

  const userPlaylists = playlists.filter((p) => !p.isSystem);

  return (
    <div>
      <h1 className="page-title">Playlists</h1>
      {playlists.length <= 1 && userPlaylists.length === 0 ? (
        <p className="muted page-lead">
          You only have <strong>Favorites</strong> right now. Create a playlist to group songs
          further—songs can live in Favorites and other lists at the same time. Use{' '}
          <strong>+</strong> on a playlist to add a nested playlist inside it.
        </p>
      ) : null}
      <PlaylistTreeItems
        playlists={playlists}
        parentId={undefined}
        onAddChild={(p) => setSubModal(p)}
      />
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
      {subModal ? (
        <CreateSubplaylistModal
          isOpen={subModal != null}
          onClose={() => setSubModal(null)}
          parentId={subModal.id}
          parentName={subModal.name}
        />
      ) : null}
    </div>
  );
}
