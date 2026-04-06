import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../components/Modal';
import { ThemeToggle } from '../components/ThemeToggle';
import { clearLibraryData, db } from '../db';
import {
  downloadLibraryExportFile,
  exportLibrarySnapshot,
  importLibraryReplace,
  validateImportDocument,
  type LibraryExportDocument,
} from '../lib/libraryExportImport';

export function SettingsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<LibraryExportDocument | null>(null);
  const [importWorking, setImportWorking] = useState(false);
  const [exportWorking, setExportWorking] = useState(false);
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [clearDeleteInput, setClearDeleteInput] = useState('');
  const [clearWorking, setClearWorking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const clearConfirmEnabled = clearDeleteInput.trim() === 'delete';

  async function handleExport() {
    setStatusMessage(null);
    setExportWorking(true);
    try {
      const snap = await exportLibrarySnapshot(db);
      downloadLibraryExportFile(snap);
      setStatusMessage({ kind: 'success', text: 'Export downloaded.' });
    } catch (e) {
      setStatusMessage({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Export failed.',
      });
    } finally {
      setExportWorking(false);
    }
  }

  function openImportPicker() {
    setStatusMessage(null);
    fileInputRef.current?.click();
  }

  async function onImportFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setStatusMessage(null);
    try {
      const text = await file.text();
      const raw: unknown = JSON.parse(text);
      const v = validateImportDocument(raw);
      if (!v.ok) {
        setStatusMessage({ kind: 'error', text: v.error });
        return;
      }
      setPendingImport(v.document);
      setImportConfirmOpen(true);
    } catch {
      setStatusMessage({ kind: 'error', text: 'Could not read or parse the file.' });
    }
  }

  function closeImportModal() {
    if (importWorking) return;
    setImportConfirmOpen(false);
    setPendingImport(null);
  }

  async function confirmImport() {
    if (!pendingImport) return;
    setImportWorking(true);
    try {
      await importLibraryReplace(db, pendingImport);
      setImportConfirmOpen(false);
      setPendingImport(null);
      navigate('/', { replace: true });
    } catch (e) {
      setStatusMessage({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Import failed.',
      });
    } finally {
      setImportWorking(false);
    }
  }

  function openClearModal() {
    setStatusMessage(null);
    setClearDeleteInput('');
    setClearModalOpen(true);
  }

  function closeClearModal() {
    if (clearWorking) return;
    setClearModalOpen(false);
    setClearDeleteInput('');
  }

  async function confirmClearLibrary() {
    if (!clearConfirmEnabled) return;
    setClearWorking(true);
    try {
      await clearLibraryData(db);
      setClearModalOpen(false);
      setClearDeleteInput('');
      navigate('/', { replace: true });
    } catch (e) {
      setStatusMessage({
        kind: 'error',
        text: e instanceof Error ? e.message : 'Could not clear library.',
      });
    } finally {
      setClearWorking(false);
    }
  }

  return (
    <div>
      <h1 className="page-title">Settings</h1>
      <p className="muted page-lead">
        App preferences and options for your library on this device.
      </p>

      <section className="mt-lg" aria-labelledby="settings-appearance-heading">
        <h2 id="settings-appearance-heading" className="section-title">
          Appearance
        </h2>
        <div className="settings-appearance-row">
          <span className="settings-appearance-row__label">Theme</span>
          <ThemeToggle />
        </div>
      </section>

      <section className="mt-lg" aria-labelledby="settings-data-heading">
        <h2 id="settings-data-heading" className="section-title">
          Library data
        </h2>
        <p className="muted settings-data-lead">
          Export a JSON backup of your library, or import a file you exported from Musicboxx on this or another
          device. Export first if you need a copy before replacing or clearing data. Clearing removes all songs and
          playlists from this device (except a fresh Favorites playlist). Cloud backup is not available yet.
        </p>
        {statusMessage ? (
          <p
            className={statusMessage.kind === 'error' ? 'form-error' : 'muted'}
            role={statusMessage.kind === 'error' ? 'alert' : 'status'}
          >
            {statusMessage.text}
          </p>
        ) : null}
        <div className="stack settings-data-actions">
          <button type="button" className="btn btn--secondary" disabled>
            Back up library…
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleExport}
            disabled={exportWorking}
            aria-busy={exportWorking}
          >
            {exportWorking ? 'Exporting…' : 'Export library…'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={onImportFileChange}
          />
          <button type="button" className="btn btn--secondary" onClick={openImportPicker}>
            Import library…
          </button>
          <button type="button" className="btn btn--danger" onClick={openClearModal}>
            Clear local library…
          </button>
        </div>
      </section>

      <Modal isOpen={importConfirmOpen} onClose={closeImportModal} title="Replace library data?">
        <div className="stack">
          <p>
            This will <strong>replace</strong> all songs and playlists in this browser with the contents of the
            backup file. This cannot be undone. Export your current library first if you need a copy.
          </p>
          <div className="modal-panel__actions">
            <button type="button" className="btn btn--ghost" onClick={closeImportModal} disabled={importWorking}>
              Cancel
            </button>
            <button type="button" className="btn btn--danger" onClick={confirmImport} disabled={importWorking}>
              {importWorking ? 'Importing…' : 'Replace library'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={clearModalOpen} onClose={closeClearModal} title="Clear local library?">
        <div className="stack">
          <p>
            This will <strong>permanently remove</strong> all songs and playlists stored in this browser. Export your
            library first if you need a backup. Type <strong>delete</strong> below to confirm.
          </p>
          <div className="stack">
            <label className="field__label" htmlFor="settings-clear-confirm">
              Type delete to confirm
            </label>
            <input
              id="settings-clear-confirm"
              type="text"
              className="input"
              value={clearDeleteInput}
              onChange={(e) => setClearDeleteInput(e.target.value)}
              autoComplete="off"
              disabled={clearWorking}
              aria-invalid={clearDeleteInput.length > 0 && !clearConfirmEnabled}
            />
          </div>
          <div className="modal-panel__actions">
            <button type="button" className="btn btn--ghost" onClick={closeClearModal} disabled={clearWorking}>
              Cancel
            </button>
            <button
              type="button"
              className="btn btn--danger"
              onClick={confirmClearLibrary}
              disabled={clearWorking || !clearConfirmEnabled}
            >
              {clearWorking ? 'Clearing…' : 'Clear library'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
