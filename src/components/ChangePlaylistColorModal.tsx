import { FormEvent, useId, useState } from 'react';
import {
  getPlaylistAccentColor,
  normalizePlaylistColor,
  PLAYLIST_ACCENT_PALETTE,
  updatePlaylistColor,
  type Playlist,
} from '../db';
import { Modal } from './Modal';

type ChangePlaylistColorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
};

function ChangePlaylistColorFormContent({
  playlist,
  onClose,
}: {
  playlist: Playlist;
  onClose: () => void;
}) {
  const [hex, setHex] = useState(() => getPlaylistAccentColor(playlist));
  const [error, setError] = useState<string | null>(null);
  const swatchGroupId = useId();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await updatePlaylistColor(playlist.id, hex);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update color.');
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack">
      <p className="muted" style={{ margin: 0 }}>
        Choose an accent for <strong>{playlist.name}</strong>.
      </p>
      <fieldset className="color-swatch-grid">
        <legend id={swatchGroupId} className="field__label">
          Presets
        </legend>
        <div className="color-swatch-grid__swatches">
          {PLAYLIST_ACCENT_PALETTE.map((c) => (
            <button
              key={c}
              type="button"
              className={`color-swatch${normalizePlaylistColor(hex) === c ? ' color-swatch--selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setHex(c)}
              aria-label={`Color ${c}`}
              aria-pressed={normalizePlaylistColor(hex) === c}
            />
          ))}
        </div>
      </fieldset>
      <label className="field">
        <span className="field__label" id={`${swatchGroupId}-custom`}>
          Custom
        </span>
        <input
          type="color"
          className="input input--color"
          value={normalizePlaylistColor(hex).match(/^#[0-9a-f]{6}$/i) ? normalizePlaylistColor(hex) : '#888888'}
          onChange={(e) => setHex(normalizePlaylistColor(e.target.value))}
          aria-labelledby={`${swatchGroupId}-custom`}
        />
      </label>
      {error ? (
        <p id="playlist-color-error" className="form-error" role="alert">
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

export function ChangePlaylistColorModal({ isOpen, onClose, playlist }: ChangePlaylistColorModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Playlist color">
      <ChangePlaylistColorFormContent key={playlist.id} playlist={playlist} onClose={onClose} />
    </Modal>
  );
}
