/**
 * Build a Genius search URL from song title/author (provider-agnostic).
 *
 * Normalization order (stable; extend with care):
 * 1. Trim and collapse internal whitespace.
 * 2. Author: strip trailing " - Topic" (YouTube auto-channel).
 * 3. Title: remove video/audio descriptor parentheticals and bracket forms.
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
function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function titleAlreadyContainsLeadingArtist(author: string, title: string): boolean {
  const a = collapseWhitespace(author);
  const t = title.trim().toLowerCase();
  if (!a || !t) {
    return false;
  }
  const authorWords = a.split(/\s+/).filter((w) => w.length >= 3);
  for (const word of authorWords) {
    const wordLower = word.toLowerCase();
    const titleWordMatch = new RegExp(`(?:^|\\s)${escapeRegExp(wordLower)}(?:\\s|$)`, 'i');
    const titleLower = t;
    if (titleWordMatch.test(titleLower) || titleLower.includes(wordLower)) {
      return true;
    }
    for (let len = Math.min(4, wordLower.length); len <= wordLower.length; len++) {
      const prefix = wordLower.slice(0, len);
      const maxDist = len <= 5 ? 1 : Math.floor(len / 5);
      let pos = 0;
      while (pos <= titleLower.length - len) {
        const substr = titleLower.slice(pos, pos + len);
        if (levenshtein(prefix, substr) <= maxDist) {
          return true;
        }
        pos++;
      }
    }
  }
  return false;
}

const TOPIC_SUFFIX = /\s+-\s*Topic\s*$/i;

function normalizeAuthorForGenius(author: string): string {
  let s = collapseWhitespace(author);
  s = s.replace(TOPIC_SUFFIX, '');
  return collapseWhitespace(s);
}

const VIDEO_DESC_PAREN =
  /\s*\(\s*(?:(?:Official\s+)?(?:(?:Music\s+)?Video|Audio|Lyric\s+Video|Lyrics|Visualizer|Visual\s+Video|Visual|Performance\s+Video|Live)|Official)\s*\)\s*/gi;
const VIDEO_DESC_BRACKET =
  /\s*\[\s*(?:(?:Official\s+)?(?:(?:Music\s+)?Video|Audio|Lyric\s+Video|Lyrics|Visualizer|Visual\s+Video|Visual|Performance\s+Video|Live)|Official)\s*\]\s*/gi;
const FEAT_PAREN = /\s*\(\s*(?:feat\.|ft\.|featuring)\b[^)]*\)/gi;
const FEAT_TAIL = /\s+(?:feat\.|ft\.|featuring)\b[\s\S]*$/i;

function normalizeTitleForGenius(title: string): string {
  let s = collapseWhitespace(title);
  s = s.replace(VIDEO_DESC_PAREN, '');
  s = s.replace(VIDEO_DESC_BRACKET, '');
  s = s.replace(FEAT_PAREN, '');
  s = s.replace(FEAT_TAIL, '');
  s = s.replace(/\(/g, '[').replace(/\)/g, ']');
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
