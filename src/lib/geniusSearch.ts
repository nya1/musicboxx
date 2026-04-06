/**
 * Build a Genius search URL from song title/author (provider-agnostic).
 *
 * Normalization order (stable; extend with care):
 * 1. Trim and collapse internal whitespace.
 * 2. Author: strip trailing " - Topic" (YouTube auto-channel).
 * 3. Title: remove (Official Video|Audio|Lyric Video|Visualizer) and bracket forms.
 * 4. Title: remove parenthetical feat./ft./featuring segments, then unparenthesized tails.
 *
 * Manual QA cases: Topic author; title with (Official Video); title with (feat. …);
 * title-only; empty-after-strip (control hidden); title already "Artist - Song" (no duplicate artist).
 */

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function collapseWhitespace(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

/**
 * True when the title already begins with the artist (e.g. YouTube "Artist - Song"),
 * so we should not prepend author again.
 */
function titleAlreadyContainsLeadingArtist(author: string, title: string): boolean {
  const a = author.trim();
  const t = title.trim();
  if (!a || !t) {
    return false;
  }
  return new RegExp(`^${escapeRegExp(a)}(?:\\s*[-–:|]\\s*|\\s+|$)`, 'i').test(t);
}

const TOPIC_SUFFIX = /\s+-\s*Topic\s*$/i;

function normalizeAuthorForGenius(author: string): string {
  let s = collapseWhitespace(author);
  s = s.replace(TOPIC_SUFFIX, '');
  return collapseWhitespace(s);
}

const OFFICIAL_PAREN =
  /\s*\(\s*(?:Official Video|Official Audio|Lyric Video|Visualizer)\s*\)/gi;
const OFFICIAL_BRACKET =
  /\s*\[\s*(?:Official Video|Official Audio|Lyric Video|Visualizer)\s*\]/gi;
const FEAT_PAREN = /\s*\(\s*(?:feat\.|ft\.|featuring)\b[^)]*\)/gi;
const FEAT_TAIL = /\s+(?:feat\.|ft\.|featuring)\b[\s\S]*$/i;

function normalizeTitleForGenius(title: string): string {
  let s = collapseWhitespace(title);
  s = s.replace(OFFICIAL_PAREN, '');
  s = s.replace(OFFICIAL_BRACKET, '');
  s = s.replace(FEAT_PAREN, '');
  s = s.replace(FEAT_TAIL, '');
  return collapseWhitespace(s);
}

export function geniusSearchUrl(title: string, author?: string | null): string | null {
  const a = author ? normalizeAuthorForGenius(author) : '';
  const t = normalizeTitleForGenius(title);
  let query: string;
  if (!a) {
    query = t;
  } else if (titleAlreadyContainsLeadingArtist(a, t)) {
    query = t;
  } else {
    query = [a, t].filter((p) => p.length > 0).join(' ');
  }
  query = collapseWhitespace(query.trim());
  if (!query) {
    return null;
  }
  return `https://genius.com/search?q=${encodeURIComponent(query)}`;
}
