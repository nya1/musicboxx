import { FormEvent, useEffect, useId, useState } from 'react';
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

export function ChangePlaylistColorModal({ isOpen, onClose, playlist }: ChangePlaylistColorModalProps) {
  const initial = getPlaylistAccentColor(playlist);
  const [hex, setHex] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const swatchGroupId = useId();

  useEffect(() => {
    if (isOpen) {
      setHex(getPlaylistAccentColor(playlist));
      setError(null);
    }
  }, [isOpen, playlist]);

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
    <Modal isOpen={isOpen} onClose={onClose} title="Playlist color">
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
    </Modal>
  );
}
