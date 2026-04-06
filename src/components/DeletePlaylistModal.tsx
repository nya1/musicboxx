import { useState } from 'react';
import { deletePlaylist, PlaylistDeleteError, type Playlist } from '../db';
import { Modal } from './Modal';

type DeletePlaylistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
};

function DeletePlaylistContent({
  onClose,
  playlist,
}: {
  onClose: () => void;
  playlist: Playlist;
}) {
  const [error, setError] = useState<string | null>(null);

  async function onConfirm() {
    setError(null);
    try {
      await deletePlaylist(playlist.id);
      onClose();
    } catch (err) {
      if (err instanceof PlaylistDeleteError) {
        setError(err.message);
        return;
      }
      setError(err instanceof Error ? err.message : 'Could not delete playlist.');
    }
  }

  return (
    <div className="stack">
      <p>
        Delete <strong>{playlist.name}</strong>? Songs stay in your library and in other playlists;
        only this playlist’s membership is removed.
      </p>
      {error ? (
        <p className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="modal-panel__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>
          Delete
        </button>
      </div>
    </div>
  );
}

export function DeletePlaylistModal({ isOpen, onClose, playlist }: DeletePlaylistModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete playlist">
      <DeletePlaylistContent key={playlist.id} onClose={onClose} playlist={playlist} />
    </Modal>
  );
}
