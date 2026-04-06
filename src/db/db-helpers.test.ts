import { describe, it, expect } from 'vitest';
import {
  FAVORITES_PLAYLIST_ID,
  buildChildrenMap,
  getDescendantPlaylistIds,
  getPlaylistAncestors,
  formatPlaylistPath,
  getPlaylistSubtreeSongCounts,
  getValidMoveParentIds,
  getChildPlaylistsSorted,
  normalizePlaylistColor,
  isValidPlaylistColor,
  getPlaylistAccentColor,
  type Playlist,
  type PlaylistSong,
} from './index';

function pl(
  id: string,
  name: string,
  opts: Partial<Pick<Playlist, 'parentId' | 'createdAt' | 'isSystem' | 'color'>> = {}
): Playlist {
  return {
    id,
    name,
    isSystem: false,
    createdAt: opts.createdAt ?? 0,
    color: opts.color ?? '#6366f1',
    ...opts,
  };
}

describe('normalizePlaylistColor / isValidPlaylistColor', () => {
  it('normalizes hex to lowercase', () => {
    expect(normalizePlaylistColor('#ABCDEF')).toBe('#abcdef');
  });

  it('validates 6-digit hex', () => {
    expect(isValidPlaylistColor('#00ff00')).toBe(true);
    expect(isValidPlaylistColor('#00f')).toBe(false);
    expect(isValidPlaylistColor('red')).toBe(false);
  });
});

describe('getPlaylistAccentColor', () => {
  it('falls back when color missing', () => {
    expect(getPlaylistAccentColor({} as Playlist)).toBe('#6b7280');
  });
});

describe('buildChildrenMap', () => {
  it('groups by parent with sentinel for roots', () => {
    const a = pl('a', 'A');
    const b = pl('b', 'B', { parentId: 'a' });
    const map = buildChildrenMap([a, b]);
    expect(map.get('__tree_root__')?.map((p) => p.id)).toEqual(['a']);
    expect(map.get('a')?.map((p) => p.id)).toEqual(['b']);
  });
});

describe('getDescendantPlaylistIds', () => {
  it('includes nested descendants', () => {
    const a = pl('a', 'A');
    const b = pl('b', 'B', { parentId: 'a' });
    const c = pl('c', 'C', { parentId: 'b' });
    const ids = getDescendantPlaylistIds('a', [a, b, c]);
    expect([...ids].sort()).toEqual(['a', 'b', 'c']);
  });
});

describe('getPlaylistAncestors', () => {
  it('returns chain from root to parent', () => {
    const root = pl('r', 'Root');
    const mid = pl('m', 'Mid', { parentId: 'r' });
    const leaf = pl('l', 'Leaf', { parentId: 'm' });
    const anc = getPlaylistAncestors(leaf, [root, mid, leaf]);
    expect(anc.map((p) => p.id)).toEqual(['r', 'm']);
  });
});

describe('formatPlaylistPath', () => {
  it('joins names with slashes', () => {
    const root = pl('r', 'Root');
    const child = pl('c', 'Child', { parentId: 'r' });
    expect(formatPlaylistPath(child, [root, child])).toBe('Root / Child');
  });
});

describe('getPlaylistSubtreeSongCounts', () => {
  it('dedupes the same song id across playlist and child', () => {
    const a = pl('a', 'A');
    const b = pl('b', 'B', { parentId: 'a' });
    const rows: PlaylistSong[] = [
      { playlistId: 'a', songId: 1 },
      { playlistId: 'b', songId: 1 },
    ];
    const counts = getPlaylistSubtreeSongCounts([a, b], rows);
    expect(counts.get('a')).toBe(1);
    expect(counts.get('b')).toBe(1);
  });

  it('includes child-only songs in parent count', () => {
    const a = pl('a', 'A');
    const b = pl('b', 'B', { parentId: 'a' });
    const rows: PlaylistSong[] = [{ playlistId: 'b', songId: 2 }];
    const counts = getPlaylistSubtreeSongCounts([a, b], rows);
    expect(counts.get('a')).toBe(1);
    expect(counts.get('b')).toBe(1);
  });
});

describe('getChildPlaylistsSorted', () => {
  it('sorts by createdAt ascending', () => {
    const parent = pl('p', 'Parent', { createdAt: 0 });
    const older = pl('o', 'Old', { parentId: 'p', createdAt: 1 });
    const newer = pl('n', 'New', { parentId: 'p', createdAt: 2 });
    const sorted = getChildPlaylistsSorted('p', [parent, older, newer]);
    expect(sorted.map((p) => p.id)).toEqual(['o', 'n']);
  });
});

describe('getValidMoveParentIds', () => {
  it('returns empty for Favorites', () => {
    const fav = pl(FAVORITES_PLAYLIST_ID, 'Favorites', { isSystem: true });
    expect(getValidMoveParentIds(FAVORITES_PLAYLIST_ID, [fav])).toEqual([]);
  });

  it('excludes self and descendants', () => {
    const a = pl('a', 'A');
    const b = pl('b', 'B', { parentId: 'a' });
    const c = pl('c', 'C', { parentId: 'b' });
    const d = pl('d', 'D');
    const valid = getValidMoveParentIds('a', [a, b, c, d]);
    expect(valid).not.toContain('a');
    expect(valid).not.toContain('b');
    expect(valid).not.toContain('c');
    expect(valid).toContain(null);
    expect(valid).toContain('d');
  });
});
