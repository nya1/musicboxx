import { FormEvent, useState } from 'react';
import { renamePlaylist } from '../db';
import { Modal } from './Modal';

type RenamePlaylistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  playlistId: string;
  initialName: string;
};

function RenamePlaylistFormContent({
  onClose,
  playlistId,
  initialName,
}: {
  onClose: () => void;
  playlistId: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Enter a playlist name.');
      return;
    }
    try {
      await renamePlaylist(playlistId, trimmed);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not rename playlist.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <label className="field">
        <span className="field__label">Name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Playlist name"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? 'rename-playlist-error' : undefined}
          autoComplete="off"
        />
      </label>
      {error ? (
        <p id="rename-playlist-error" className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="modal-panel__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn--secondary">
          Save
        </button>
      </div>
    </form>
  );
}

export function RenamePlaylistModal({
  isOpen,
  onClose,
  playlistId,
  initialName,
}: RenamePlaylistModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rename playlist">
      <RenamePlaylistFormContent
        key={`${playlistId}-${initialName}`}
        onClose={onClose}
        playlistId={playlistId}
        initialName={initialName}
      />
    </Modal>
  );
}
