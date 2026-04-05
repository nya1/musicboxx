import { useLiveQuery } from 'dexie-react-hooks';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { SongThumbnail } from '../components/SongThumbnail';

export function LibraryPage() {
  const songs = useLiveQuery(() => db.songs.orderBy('createdAt').reverse().toArray(), []);

  if (!songs) {
    return <p className="muted">Loading…</p>;
  }

  if (songs.length === 0) {
    return (
      <div className="empty-state">
        <h1 className="empty-state__title">No songs yet</h1>
        <p className="empty-state__body muted">
          Paste a YouTube link on the Add tab. Titles load when you’re online; songs still save if
          metadata can’t be fetched.
        </p>
        <Link to="/add" className="btn btn--primary">
          Add a song
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Library</h1>
      <ul className="song-list" role="list">
        {songs.map((song) => (
          <li key={song.id}>
            <Link to={`/song/${song.id}`} className="song-row">
              <SongThumbnail
                videoId={song.videoId}
                alt=""
                className="song-row__thumb"
              />
              <div className="song-row__text">
                <span className="song-row__title">{song.title}</span>
                {song.author ? (
                  <span className="song-row__meta muted">{song.author}</span>
                ) : (
                  <span className="song-row__meta muted">YouTube</span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
