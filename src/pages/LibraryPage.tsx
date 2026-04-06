import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../db';
import { SongThumbnail } from '../components/SongThumbnail';
import {
  buildSongSearchIndex,
  orderSongsBySearchHits,
  searchSongIds,
} from '../lib/songSearchIndex';

export function LibraryPage() {
  const songs = useLiveQuery(() => db.songs.orderBy('createdAt').reverse().toArray(), []);
  const [query, setQuery] = useState('');

  const index = useMemo(() => (songs ? buildSongSearchIndex(songs) : null), [songs]);

  const displaySongs = useMemo(() => {
    if (!songs) return [];
    const q = query.trim();
    if (!q) return songs;
    const hits = searchSongIds(index, q, songs);
    return orderSongsBySearchHits(songs, hits);
  }, [songs, index, query]);

  if (!songs) {
    return <p className="muted">Loading…</p>;
  }

  const trimmedQuery = query.trim();
  const noMatches = songs.length > 0 && trimmedQuery.length > 0 && displaySongs.length === 0;

  return (
    <div>
      <h1 className="page-title">Library</h1>
      <div className="stack library-search">
        <label className="field__label" htmlFor="library-search">
          Search songs
        </label>
        <input
          id="library-search"
          type="search"
          className="input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
          placeholder="Title, artist, album…"
        />
      </div>

      {songs.length === 0 ? (
        <div className="empty-state">
          <h1 className="empty-state__title">No songs yet</h1>
          <p className="empty-state__body muted">
            Paste a YouTube, Spotify, or Apple Music track link on the Add tab. Titles load when you’re
            online; songs still save if metadata can’t be fetched.
          </p>
          <Link to="/add" className="btn btn--primary">
            Add a song
          </Link>
        </div>
      ) : noMatches ? (
        <p className="muted">No matching songs. Try different words.</p>
      ) : (
        <ul className="song-list" role="list">
          {displaySongs.map((song) => (
            <li key={song.id}>
              <Link to={`/song/${song.id}`} className="song-row">
                <SongThumbnail song={song} alt="" className="song-row__thumb" />
                <div className="song-row__text">
                  <span className="song-row__title">{song.title}</span>
                  {song.author ? (
                    <span className="song-row__meta muted">{song.author}</span>
                  ) : (
                    <span className="song-row__meta muted">
                      {song.provider === 'spotify'
                        ? 'Spotify'
                        : song.provider === 'apple-music'
                          ? 'Apple Music'
                          : 'YouTube'}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
