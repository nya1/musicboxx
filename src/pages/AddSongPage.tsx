import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addSongFromVideoId } from '../db';
import { parseYouTubeVideoId } from '../lib/youtube';

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
    const videoId = parseYouTubeVideoId(url);
    if (!videoId) {
      setError('That doesn’t look like a supported YouTube URL or video ID.');
      return;
    }
    setPending(true);
    try {
      const result = await addSongFromVideoId(videoId);
      if (!result.ok) {
        setError('Couldn’t save the song. Check your connection and try again.');
        return;
      }
      if (result.duplicate) {
        setInfo('That video is already in your library. Open it from Library.');
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
        Paste a full YouTube link or an 11-character video ID. We’ll fetch the title when you’re
        online.
      </p>
      <form onSubmit={onSubmit} className="stack" aria-label="Add song from YouTube URL">
        <label className="field">
          <span className="field__label">YouTube URL</span>
          <input
            className="input"
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
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
          {pending ? 'Saving…' : 'Save to Favorites'}
        </button>
      </form>
    </div>
  );
}
