const NUMERIC_ID_RE = /^\d+$/;

export type ParsedAppleMusic = {
  trackId: string;
  /** Preserve storefront / slug from the user’s link for opening in Apple Music. */
  openUrl: string;
};

/**
 * Extract Apple Music track id from `music.apple.com` song URL or album URL with `?i=` track id.
 */
export function parseAppleMusicFromInput(input: string): ParsedAppleMusic | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'music.apple.com') return null;
    return parseAppleMusicFromUrl(u);
  } catch {
    return null;
  }
}

function parseAppleMusicFromUrl(u: URL): ParsedAppleMusic | null {
  const openUrl = u.toString();
  const i = u.searchParams.get('i');
  if (i && NUMERIC_ID_RE.test(i)) {
    return { trackId: i, openUrl };
  }

  const parts = u.pathname.split('/').filter(Boolean);
  const songIdx = parts.indexOf('song');
  if (songIdx >= 0 && parts.length > 0) {
    const last = parts[parts.length - 1];
    if (NUMERIC_ID_RE.test(last)) {
      return { trackId: last, openUrl };
    }
  }

  return null;
}

export type AppleMusicMetadata = {
  title: string;
  author?: string;
  thumbnailUrl?: string;
};

/**
 * Public iTunes Lookup JSON — no API key. Same catalog ids often match Apple Music web track ids.
 * If the request fails (network/CORS), callers should use a fallback label.
 */
export async function fetchAppleMusicMetadata(trackId: string): Promise<AppleMusicMetadata> {
  const fallback: AppleMusicMetadata = { title: 'Apple Music track' };
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${encodeURIComponent(trackId)}&entity=song`
    );
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      results?: Array<{
        trackName?: string;
        collectionName?: string;
        artistName?: string;
        artworkUrl100?: string;
        kind?: string;
      }>;
    };
    const r = data.results?.[0];
    if (!r) return fallback;

    const title =
      (r.kind === 'song' ? r.trackName : r.trackName ?? r.collectionName)?.trim() ||
      'Apple Music track';
    const author = r.artistName?.trim();
    let thumbnailUrl: string | undefined;
    if (r.artworkUrl100) {
      thumbnailUrl = r.artworkUrl100.replace(/100x100bb/g, '600x600bb');
    }

    return { title, author, thumbnailUrl };
  } catch {
    return fallback;
  }
}
