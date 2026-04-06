import { FormEvent, useState } from 'react';
import { createPlaylist, PlaylistParentError } from '../db';
import { Modal } from './Modal';

type CreateSubplaylistModalProps = {
  isOpen: boolean;
  onClose: () => void;
  parentId: string;
  parentName: string;
};

function CreateSubplaylistFormContent({
  onClose,
  parentId,
}: {
  onClose: () => void;
  parentId: string;
}) {
  const [name, setName] = useState('');
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
      await createPlaylist(trimmed, parentId);
      onClose();
    } catch (err) {
      if (err instanceof PlaylistParentError) {
        setError(err.message);
        return;
      }
      throw err;
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
          aria-describedby={error ? 'subplaylist-modal-error' : undefined}
          autoComplete="off"
        />
      </label>
      {error ? (
        <p id="subplaylist-modal-error" className="form-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="modal-panel__actions">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" className="btn btn--secondary">
          Create
        </button>
      </div>
    </form>
  );
}

export function CreateSubplaylistModal({
  isOpen,
  onClose,
  parentId,
  parentName,
}: CreateSubplaylistModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`New playlist in ${parentName}`}
    >
      <CreateSubplaylistFormContent key={parentId} onClose={onClose} parentId={parentId} />
    </Modal>
  );
}
