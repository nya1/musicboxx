import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { addSongFromParsed } from '../db';
import { parseMusicFromSharePayload } from '../lib/music';

/**
 * Handles Web Share Target GET launches (see manifest `share_target`).
 * Query params: `title`, `text`, `url` (per user agent).
 */
export function ShareTargetPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shareQueryKey = searchParams.toString();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [duplicateSongId, setDuplicateSongId] = useState<number | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(shareQueryKey);
    const url = params.get('url');
    const text = params.get('text');
    let cancelled = false;

    async function run() {
      const parsed = parseMusicFromSharePayload(url, text);
      if (!parsed) {
        setError('That doesn’t look like a supported YouTube or Spotify track link.');
        setPending(false);
        return;
      }

      const result = await addSongFromParsed(parsed);
      if (cancelled) return;

      if (!result.ok) {
        setError('Couldn’t save the song. Check your connection and try again.');
        setPending(false);
        return;
      }

      if (result.duplicate && result.song.id != null) {
        setInfo('That track is already in your library. Open it from Library.');
        setDuplicateSongId(result.song.id);
        setPending(false);
        return;
      }

      if (result.song.id != null) {
        navigate(`/song/${result.song.id}`, { replace: true });
        return;
      }

      setError('Couldn’t save the song. Try again from Add song.');
      setPending(false);
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [shareQueryKey, navigate]);

  return (
    <div>
      <h1 className="page-title">Add from share</h1>
      {pending ? (
        <p className="muted page-lead" role="status">
          Saving…
        </p>
      ) : null}
      {error ? (
        <>
          <p className="muted page-lead">
            We couldn’t add a song from this share. You can paste the link on Add song instead.
          </p>
          <p className="form-error" role="alert">
            {error}
          </p>
          <p>
            <Link to="/add">Go to Add song</Link>
          </p>
        </>
      ) : null}
      {info ? (
        <>
          <p className="form-info" role="status">
            {info}{' '}
            <Link to="/">View library</Link>
            {duplicateSongId != null ? (
              <>
                {' · '}
                <Link to={`/song/${duplicateSongId}`}>Open song</Link>
              </>
            ) : null}
          </p>
        </>
      ) : null}
    </div>
  );
}
