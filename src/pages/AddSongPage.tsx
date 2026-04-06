import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { Modal } from '../components/Modal';
import {
  addSongFromParsed,
  db,
  FAVORITES_PLAYLIST_ID,
  formatPlaylistPath,
  getDefaultPlaylistId,
  getInvidiousBaseUrl,
  type Playlist,
} from '../db';
import { InvidiousPlaylistError, fetchInvidiousPlaylistVideos } from '../lib/invidious';
import { type AddMusicInput, parseAddMusicFromInput } from '../lib/music';
import { runYoutubePlaylistImport } from '../lib/youtubePlaylistImport';

function sortPlaylistsForDropdown(playlists: Playlist[]): Playlist[] {
  return [...playlists].sort((a, b) => {
    if (a.id === FAVORITES_PLAYLIST_ID) return -1;
    if (b.id === FAVORITES_PLAYLIST_ID) return 1;
    return a.createdAt - b.createdAt;
  });
}

type PlaylistImportState =
  | { phase: 'idle' }
  | { phase: 'fetching' }
  | {
      phase: 'choose';
      playlistId: string;
      canonicalUrl: string;
      remoteTitle: string;
      videoIds: string[];
    }
  | { phase: 'importing'; current: number; total: number };

export function AddSongPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [importState, setImportState] = useState<PlaylistImportState>({ phase: 'idle' });
  const [importTarget, setImportTarget] = useState<'new' | 'existing'>('new');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [targetPlaylistId, setTargetPlaylistId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const contextPlaylistId = searchParams.get('playlist') ?? undefined;
  const ytFromShare = searchParams.get('ytPlaylist');
  const shareProcessed = useRef(false);

  const playlists = useLiveQuery(() => db.playlists.orderBy('createdAt').toArray());
  const defaultPlaylistId = useLiveQuery(() => getDefaultPlaylistId(), []);

  useEffect(() => {
    if (targetPlaylistId !== null) return;
    if (defaultPlaylistId == null || !playlists) return;
    const fromContext =
      contextPlaylistId && playlists.some((p) => p.id === contextPlaylistId);
    setTargetPlaylistId(fromContext ? contextPlaylistId : defaultPlaylistId);
  }, [targetPlaylistId, defaultPlaylistId, playlists, contextPlaylistId]);

  const startPlaylistFetch = useCallback(async (parsed: Extract<AddMusicInput, { kind: 'youtube-playlist' }>) => {
    setError(null);
    setInfo(null);
    setImportState({ phase: 'fetching' });
    try {
      const base = await getInvidiousBaseUrl();
      const data = await fetchInvidiousPlaylistVideos(base, parsed.playlistId);
      setNewPlaylistName(data.title || 'Imported playlist');
      setImportState({
        phase: 'choose',
        playlistId: parsed.playlistId,
        canonicalUrl: parsed.canonicalUrl,
        remoteTitle: data.title,
        videoIds: data.videoIds,
      });
      setImportTarget('existing');
    } catch (e) {
      setImportState({ phase: 'idle' });
      if (e instanceof InvidiousPlaylistError) {
        setError(e.message);
      } else {
        setError('Couldn’t load that playlist. Try again later.');
      }
    }
  }, []);

  useEffect(() => {
    if (!ytFromShare || shareProcessed.current) return;
    shareProcessed.current = true;
    const list = decodeURIComponent(ytFromShare);
    const canonical = `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`;
    setUrl(canonical);
    setSearchParams((s) => {
      const n = new URLSearchParams(s);
      n.delete('ytPlaylist');
      return n;
    }, { replace: true });
    void startPlaylistFetch({
      kind: 'youtube-playlist',
      playlistId: list,
      canonicalUrl: canonical,
    });
  }, [ytFromShare, setSearchParams, startPlaylistFetch]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = parseAddMusicFromInput(url);
    if (!parsed) {
      setError(
        'That doesn’t look like a supported YouTube, Spotify, or Apple Music track link.'
      );
      return;
    }
    if (parsed.kind === 'youtube-playlist') {
      await startPlaylistFetch(parsed);
      return;
    }
    setPending(true);
    try {
      const defId = await getDefaultPlaylistId();
      const chosen = targetPlaylistId ?? defId;
      const also =
        chosen !== defId ? { alsoAddToPlaylistId: chosen } : undefined;
      const result = await addSongFromParsed(parsed.parsed, undefined, undefined, also);
      if (!result.ok) {
        setError('Couldn’t save the song. Check your connection and try again.');
        return;
      }
      if (result.duplicate) {
        setInfo('That track is already in your library. Open it from Library.');
        setUrl('');
        return;
      }
      setUrl('');
      navigate(`/song/${result.song.id}`);
    } finally {
      setPending(false);
    }
  }

  async function confirmPlaylistImport() {
    if (importState.phase !== 'choose') return;
    const snap = importState;
    const chosenPlaylistId = targetPlaylistId ?? defaultPlaylistId;
    if (!chosenPlaylistId) {
      setError('Pick a playlist in the form above, or wait for playlists to load.');
      return;
    }
    const chosenPlaylist = playlists?.find((p) => p.id === chosenPlaylistId);
    if (!chosenPlaylist) {
      setError('Pick a valid playlist.');
      return;
    }

    const { playlistId, canonicalUrl, remoteTitle, videoIds } = snap;
    setImportState({ phase: 'importing', current: 0, total: videoIds.length });
    setError(null);
    try {
      const { playlist, summary } = await runYoutubePlaylistImport({
        youtubePlaylistId: playlistId,
        canonicalUrl,
        mode: importTarget === 'new' ? 'new' : 'existing',
        prefetched: { title: remoteTitle, videoIds },
        newPlaylistName: importTarget === 'new' ? newPlaylistName : undefined,
        parentIdForNewPlaylist: importTarget === 'new' ? chosenPlaylistId : undefined,
        existingPlaylistId: importTarget === 'existing' ? chosenPlaylistId : undefined,
        onProgress: (done, total) => {
          setImportState({ phase: 'importing', current: done, total });
        },
      });

      setImportState({ phase: 'idle' });
      const parts = [
        `Imported ${String(summary.videosTotal)} videos.`,
        summary.newSongs > 0 ? `${String(summary.newSongs)} new in your library` : null,
        summary.existingInLibrary > 0 ? `${String(summary.existingInLibrary)} already saved` : null,
      ].filter(Boolean);
      setInfo(parts.join(' · '));
      setUrl('');
      navigate(`/playlist/${playlist.id}`);
    } catch (e) {
      setImportState({ phase: 'idle' });
      setError(e instanceof Error ? e.message : 'Import failed.');
    }
  }

  function closeImportModal() {
    if (importState.phase === 'importing') return;
    setImportState({ phase: 'idle' });
  }

  const importModalOpen =
    importState.phase === 'choose' ||
    importState.phase === 'fetching' ||
    importState.phase === 'importing';

  const importBusy =
    importState.phase === 'fetching' ||
    importState.phase === 'importing' ||
    pending;

  function submitButtonLabel(): string {
    if (importState.phase === 'fetching') return 'Loading playlist…';
    if (importBusy) return 'Saving…';
    return 'Add song';
  }

  return (
    <div>
      <h1 className="page-title">Add song</h1>
      <p className="muted page-lead">
        Paste a full YouTube, Spotify, or Apple Music track link, a YouTube playlist link, or an
        11-character YouTube video ID. We’ll fetch the title when you’re online.
      </p>
      <form onSubmit={onSubmit} className="stack" aria-label="Add song from music URL">
        <label className="field">
          <span className="field__label">Track URL</span>
          <input
            className="input"
            type="url"
            inputMode="url"
            placeholder="YouTube, Spotify, or Apple Music track link…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'add-url-error' : undefined}
          />
        </label>
        {error ? (
          <p id="add-url-error" className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="form-info" role="status">
            {info}{' '}
            <Link to="/">View library</Link>
          </p>
        ) : null}
        <label className="field">
          <span className="field__label">Playlist</span>
          <select
            className="input"
            value={targetPlaylistId ?? defaultPlaylistId ?? ''}
            onChange={(e) => setTargetPlaylistId(e.target.value)}
            disabled={importBusy || !playlists || defaultPlaylistId == null}
            aria-describedby="add-playlist-hint"
          >
            {playlists
              ? sortPlaylistsForDropdown(playlists).map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatPlaylistPath(p, playlists)}
                    {p.id === defaultPlaylistId ? ' (default)' : ''}
                  </option>
                ))
              : null}
          </select>
        </label>
        <p id="add-playlist-hint" className="muted">
          New tracks are always added to your default playlist; pick another list to include this
          song there as well.
        </p>
        <button type="submit" className="btn btn--primary" disabled={importBusy}>
          {submitButtonLabel()}
        </button>
      </form>

      <Modal
        isOpen={importModalOpen}
        onClose={closeImportModal}
        title={
          importState.phase === 'importing'
            ? 'Importing playlist…'
            : importState.phase === 'fetching'
              ? 'Loading playlist…'
              : 'Import YouTube playlist'
        }
      >
        {importState.phase === 'fetching' ? (
          <p className="muted">Fetching playlist from Invidious…</p>
        ) : null}
        {importState.phase === 'choose' && (!playlists || defaultPlaylistId == null) ? (
          <p className="muted">Loading playlists…</p>
        ) : null}
        {importState.phase === 'choose' && playlists && defaultPlaylistId != null ? (
          <div className="stack">
            <p className="muted">
              <strong>{importState.remoteTitle || 'Untitled playlist'}</strong> —{' '}
              {importState.videoIds.length} videos
            </p>
            <p className="muted">
              Target folder uses the <strong>Playlist</strong> choice on the Add song form:{' '}
              <strong>
                {formatPlaylistPath(
                  playlists.find((p) => p.id === (targetPlaylistId ?? defaultPlaylistId)) ??
                    playlists[0],
                  playlists
                )}
              </strong>
              .
            </p>
            <fieldset className="stack">
              <legend className="field__label">Add to</legend>
              <label className="field" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="import-target"
                  checked={importTarget === 'existing'}
                  onChange={() => setImportTarget('existing')}
                />
                <span>Add videos to this playlist</span>
              </label>
              <label className="field" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="radio"
                  name="import-target"
                  checked={importTarget === 'new'}
                  onChange={() => setImportTarget('new')}
                />
                <span>Create a new playlist under this folder</span>
              </label>
              {importTarget === 'new' ? (
                <label className="field">
                  <span className="field__label">Name</span>
                  <input
                    className="input"
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    autoComplete="off"
                  />
                </label>
              ) : null}
            </fieldset>
            <div className="modal-panel__actions">
              <button type="button" className="btn btn--ghost" onClick={closeImportModal}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary" onClick={() => void confirmPlaylistImport()}>
                Import
              </button>
            </div>
          </div>
        ) : null}
        {importState.phase === 'importing' ? (
          <div className="stack">
            <p className="muted" role="status">
              Adding songs {importState.current} / {importState.total}…
            </p>
            <div
              className="import-progress"
              style={{
                height: 6,
                borderRadius: 3,
                background: 'var(--border-subtle, #e5e7eb)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${importState.total > 0 ? (importState.current / importState.total) * 100 : 0}%`,
                  background: 'var(--accent, #6366f1)',
                  transition: 'width 0.15s ease',
                }}
              />
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
