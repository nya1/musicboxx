import lunr from 'lunr';
import type { Song } from '../db';

export type SongSearchHit = { id: number; score: number };

/** Documents must include `id` for Lunr ref matching. */
type SongSearchDoc = {
  id: string;
  title: string;
  author: string;
  primaryArtist: string;
  albumTitle: string;
};

/** Lowercase text from the same fields Lunr indexes; used for substring / infix matches. */
export function songSearchableText(song: Song): string {
  return [song.title, song.author, song.primaryArtist, song.albumTitle]
    .filter((x): x is string => typeof x === 'string' && x.length > 0)
    .join(' ')
    .toLowerCase();
}

/** Below typical Lunr BM25 scores so whole-token matches stay ahead of in-string matches. */
const SUBSTRING_MATCH_SCORE = 0.05;

function mergeSearchHits(lunrHits: SongSearchHit[], substringHits: SongSearchHit[]): SongSearchHit[] {
  const map = new Map<number, SongSearchHit>();
  for (const h of lunrHits) {
    map.set(h.id, h);
  }
  for (const h of substringHits) {
    if (!map.has(h.id)) {
      map.set(h.id, h);
    }
  }
  return Array.from(map.values());
}

function substringSearchHits(songs: Song[], needleLower: string): SongSearchHit[] {
  if (!needleLower) return [];
  const out: SongSearchHit[] = [];
  for (const s of songs) {
    if (typeof s.id !== 'number') continue;
    if (songSearchableText(s).includes(needleLower)) {
      out.push({ id: s.id, score: SUBSTRING_MATCH_SCORE });
    }
  }
  return out;
}

export function buildSongSearchIndex(songs: Song[]): lunr.Index | null {
  const withIds = songs.filter((s): s is Song & { id: number } => typeof s.id === 'number');
  if (withIds.length === 0) return null;

  return lunr(function (this: lunr.Builder) {
    this.ref('id');
    this.field('title');
    this.field('author');
    this.field('primaryArtist');
    this.field('albumTitle');

    for (const song of withIds) {
      const doc: SongSearchDoc = {
        id: String(song.id),
        title: song.title ?? '',
        author: song.author ?? '',
        primaryArtist: song.primaryArtist ?? '',
        albumTitle: song.albumTitle ?? '',
      };
      this.add(doc);
    }
  });
}

/**
 * BM25 search via Lunr plus case-insensitive substring matching on the same fields.
 * Lunr matches whole stemmed tokens only, so queries like `ing` would not match a single
 * token `testing`; substring pass fixes infix/partial word matches.
 */
export function searchSongIds(index: lunr.Index | null, query: string, songs: Song[]): SongSearchHit[] {
  const q = query.trim();
  if (!q || songs.length === 0) return [];

  let lunrHits: SongSearchHit[] = [];
  if (index) {
    try {
      lunrHits = index.search(q).map((r) => ({
        id: parseInt(r.ref, 10),
        score: r.score,
      }));
    } catch {
      lunrHits = [];
    }
  }

  const substringHits = substringSearchHits(songs, q.toLowerCase());
  return mergeSearchHits(lunrHits, substringHits);
}

/**
 * Order songs by Lunr hits (relevance). Secondary sort: higher `createdAt` first when scores tie.
 */
export function orderSongsBySearchHits(songs: Song[], hits: SongSearchHit[]): Song[] {
  if (hits.length === 0) return [];
  const byId = new Map(songs.map((s) => [s.id!, s]));
  const sortedHits = [...hits].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const sa = byId.get(a.id)?.createdAt ?? 0;
    const sb = byId.get(b.id)?.createdAt ?? 0;
    return sb - sa;
  });
  const out: Song[] = [];
  for (const h of sortedHits) {
    const song = byId.get(h.id);
    if (song) out.push(song);
  }
  return out;
}
