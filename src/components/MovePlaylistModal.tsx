import { FormEvent, useState } from 'react';
import {
  formatPlaylistPath,
  getValidMoveParentIds,
  movePlaylist,
  PlaylistParentError,
  type Playlist,
} from '../db';
import { Modal } from './Modal';

type MovePlaylistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  allPlaylists: Playlist[];
};

function MovePlaylistFormContent({
  onClose,
  playlist,
  allPlaylists,
}: {
  onClose: () => void;
  playlist: Playlist;
  allPlaylists: Playlist[];
}) {
  const validIds = getValidMoveParentIds(playlist.id, allPlaylists);
  const currentKey = playlist.parentId ?? '';
  const [selected, setSelected] = useState(currentKey);
  const [error, setError] = useState<string | null>(null);

  function labelFor(id: string | null): string {
    if (id === null) return 'Top level';
    const p = allPlaylists.find((x) => x.id === id);
    return p ? formatPlaylistPath(p, allPlaylists) : id;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const newParentId = selected === '' ? null : selected;
    const prevParent = playlist.parentId ?? null;
    const nextKey = newParentId ?? '';
    const prevKey = prevParent ?? '';
    if (nextKey === prevKey) {
      onClose();
      return;
    }
    try {
      await movePlaylist(playlist.id, newParentId);
      onClose();
    } catch (err) {
      if (err instanceof PlaylistParentError) {
        setError(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not move playlist.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <label className="field">
        <span className="field__label">Parent folder</span>
        <select
          className="input"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'move-playlist-error' : undefined}
        >
          {validIds.map((id) => (
            <option key={id === null ? '__root__' : id} value={id ?? ''}>
              {labelFor(id)}
            </option>
          ))}
        </select>
      </label>
      {error ? (
        <p id="move-playlist-error" className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="modal-panel__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn--secondary">
          Move
        </button>
      </div>
    </form>
  );
}

export function MovePlaylistModal({
  isOpen,
  onClose,
  playlist,
  allPlaylists,
}: MovePlaylistModalProps) {
  const validIds = getValidMoveParentIds(playlist.id, allPlaylists);
  const contentKey = `${playlist.id}-${playlist.parentId ?? ''}`;

  if (validIds.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Move to folder">
        <p className="muted">This playlist cannot be moved.</p>
        <div className="modal-panel__actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Move “${playlist.name}”`}>
      <MovePlaylistFormContent
        key={contentKey}
        onClose={onClose}
        playlist={playlist}
        allPlaylists={allPlaylists}
      />
    </Modal>
  );
}
