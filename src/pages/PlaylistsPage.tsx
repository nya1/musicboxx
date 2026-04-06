import { ChevronDown, ChevronRight } from 'lucide-react';
import { FormEvent, useState, type CSSProperties } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { ChangePlaylistColorModal } from '../components/ChangePlaylistColorModal';
import { CreateSubplaylistModal } from '../components/CreateSubplaylistModal';
import { DeletePlaylistModal } from '../components/DeletePlaylistModal';
import { MovePlaylistModal } from '../components/MovePlaylistModal';
import { PlaylistOverflowMenu } from '../components/PlaylistOverflowMenu';
import { RenamePlaylistModal } from '../components/RenamePlaylistModal';
import {
  createPlaylist,
  db,
  FAVORITES_PLAYLIST_ID,
  formatPlaylistSongCountLabel,
  getDefaultPlaylistId,
  getPlaylistAccentColor,
  getPlaylistSubtreeSongCounts,
  PlaylistParentError,
  setDefaultPlaylist,
  type Playlist,
} from '../db';

function PlaylistTreeItems({
  playlists,
  songCounts,
  parentId,
  defaultPlaylistId,
  expandedIds,
  onToggleExpand,
  onAddChild,
  onRename,
  onMove,
  onDelete,
  onSetDefault,
  onChangeColor,
}: {
  playlists: Playlist[];
  songCounts: Map<string, number>;
  parentId: string | undefined;
  defaultPlaylistId: string;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onAddChild: (playlist: Playlist) => void;
  onRename: (playlist: Playlist) => void;
  onMove: (playlist: Playlist) => void;
  onDelete: (playlist: Playlist) => void;
  onSetDefault: (playlist: Playlist) => void;
  onChangeColor: (playlist: Playlist) => void;
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
      {items.map((p) => {
        const hasNested = playlists.some(
          (c) => (c.parentId ?? undefined) === p.id
        );
        const expanded = expandedIds.has(p.id);
        return (
        <li key={p.id}>
          <div
            className="playlist-row-wrap"
            style={
              {
                '--playlist-accent': getPlaylistAccentColor(p),
              } as CSSProperties
            }
          >
            {hasNested ? (
              <button
                type="button"
                className="playlist-row-expand"
                aria-expanded={expanded}
                aria-label={expanded ? `Collapse ${p.name}` : `Expand ${p.name}`}
                onClick={(e) => {
                  e.preventDefault();
                  onToggleExpand(p.id);
                }}
              >
                {expanded ? (
                  <ChevronDown size={20} strokeWidth={2} aria-hidden />
                ) : (
                  <ChevronRight size={20} strokeWidth={2} aria-hidden />
                )}
              </button>
            ) : (
              <span className="playlist-row-expand playlist-row-expand--spacer" aria-hidden />
            )}
            <Link to={`/playlist/${p.id}`} className="playlist-row__link">
              <span className="playlist-row__link-text">
                <span className="playlist-row__name">{p.name}</span>
                <span className="playlist-row__count muted">
                  {formatPlaylistSongCountLabel(songCounts.get(p.id) ?? 0)}
                </span>
              </span>
              {p.id === defaultPlaylistId ? <span className="badge">Default</span> : null}
            </Link>
            <PlaylistOverflowMenu
              playlist={p}
              allPlaylists={playlists}
              defaultPlaylistId={defaultPlaylistId}
              onRename={() => onRename(p)}
              onSetDefault={() => onSetDefault(p)}
              onAddChild={() => onAddChild(p)}
              onMove={() => onMove(p)}
              onChangeColor={() => onChangeColor(p)}
              onDelete={() => onDelete(p)}
            />
          </div>
          {hasNested && expanded ? (
            <PlaylistTreeItems
              playlists={playlists}
              songCounts={songCounts}
              parentId={p.id}
              defaultPlaylistId={defaultPlaylistId}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
              onSetDefault={onSetDefault}
              onChangeColor={onChangeColor}
            />
          ) : null}
        </li>
      );
      })}
    </ul>
  );
}

export function PlaylistsPage() {
  const playlistBundle = useLiveQuery(async () => {
    const [playlists, rows] = await Promise.all([
      db.playlists.orderBy('createdAt').toArray(),
      db.playlistSongs.toArray(),
    ]);
    const songCounts = getPlaylistSubtreeSongCounts(playlists, rows);
    return { playlists, songCounts };
  });
  const defaultPlaylistId =
    useLiveQuery(() => getDefaultPlaylistId(), []) ?? FAVORITES_PLAYLIST_ID;
  const [name, setName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [subModal, setSubModal] = useState<Playlist | null>(null);
  const [renameTarget, setRenameTarget] = useState<Playlist | null>(null);
  const [moveTarget, setMoveTarget] = useState<Playlist | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Playlist | null>(null);
  const [colorTarget, setColorTarget] = useState<Playlist | null>(null);
  const [expandedPlaylistIds, setExpandedPlaylistIds] = useState<Set<string>>(
    () => new Set()
  );

  function togglePlaylistExpanded(id: string) {
    setExpandedPlaylistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

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

  async function onSetDefault(p: Playlist) {
    await setDefaultPlaylist(p.id);
  }

  if (!playlistBundle) {
    return <p className="muted">Loading…</p>;
  }

  const { playlists, songCounts } = playlistBundle;
  const userPlaylists = playlists.filter((p) => !p.isSystem);

  return (
    <div>
      <h1 className="page-title">Playlists</h1>
      {playlists.length <= 1 && userPlaylists.length === 0 ? (
        <p className="muted page-lead">
          You only have <strong>Favorites</strong> right now. Create a playlist to group songs
          further—songs can live in Favorites and other lists at the same time. Use the{' '}
          <strong>⋯</strong> menu on a playlist to add a nested playlist inside it.
        </p>
      ) : null}
      <PlaylistTreeItems
        playlists={playlists}
        songCounts={songCounts}
        parentId={undefined}
        defaultPlaylistId={defaultPlaylistId}
        expandedIds={expandedPlaylistIds}
        onToggleExpand={togglePlaylistExpanded}
        onAddChild={(p) => setSubModal(p)}
        onRename={(p) => setRenameTarget(p)}
        onMove={(p) => setMoveTarget(p)}
        onDelete={(p) => setDeleteTarget(p)}
        onSetDefault={onSetDefault}
        onChangeColor={(p) => setColorTarget(p)}
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
          allPlaylists={playlists}
        />
      ) : null}
      {deleteTarget ? (
        <DeletePlaylistModal
          isOpen
          onClose={() => setDeleteTarget(null)}
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
    </div>
  );
}
