import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addSongFromParsed } from '../db';
import { parseMusicFromInput } from '../lib/music';

export function AddSongPage() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const parsed = parseMusicFromInput(url);
    if (!parsed) {
      setError('That doesn’t look like a supported YouTube or Spotify track link.');
      return;
    }
    setPending(true);
    try {
      const result = await addSongFromParsed(parsed);
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

  return (
    <div>
      <h1 className="page-title">Add song</h1>
      <p className="muted page-lead">
        Paste a full YouTube or Spotify track link (or an 11-character YouTube video ID). We’ll fetch
        the title when you’re online.
      </p>
      <form onSubmit={onSubmit} className="stack" aria-label="Add song from music URL">
        <label className="field">
          <span className="field__label">Track URL</span>
          <input
            className="input"
            type="url"
            inputMode="url"
            placeholder="YouTube or Spotify track link…"
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
        <button type="submit" className="btn btn--primary" disabled={pending}>
          {pending ? 'Saving…' : 'Save to default playlist'}
        </button>
      </form>
    </div>
  );
}
