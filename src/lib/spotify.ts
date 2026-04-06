/** Spotify track ids are 22-character base62 strings. */
const SPOTIFY_TRACK_ID_RE = /^[0-9A-Za-z]{22}$/;

/**
 * Extract Spotify track id from open.spotify.com URL or `spotify:track:` URI.
 */
export function parseSpotifyTrackId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('spotify:')) {
    const parts = trimmed.split(':');
    if (parts.length >= 3 && parts[1] === 'track') {
      const id = parts[2]?.split(/[?&#]/)[0];
      if (id && SPOTIFY_TRACK_ID_RE.test(id)) return id;
    }
    return null;
  }

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'open.spotify.com' || host === 'spotify.com') {
      const parts = u.pathname.split('/').filter(Boolean);
      const ti = parts.indexOf('track');
      if (ti >= 0 && parts[ti + 1]) {
        const id = parts[ti + 1].split(/[?&#]/)[0];
        if (id && SPOTIFY_TRACK_ID_RE.test(id)) return id;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function spotifyOpenUrl(trackId: string): string {
  return `https://open.spotify.com/track/${trackId}`;
}

export type SpotifyOembedResult = {
  title: string;
  author?: string;
  thumbnailUrl?: string;
};

/**
 * Public oEmbed — no API key (see https://developer.spotify.com/documentation/embeds/guides/oembed/).
 */
export async function fetchSpotifyOembed(trackId: string): Promise<SpotifyOembedResult> {
  const pageUrl = spotifyOpenUrl(trackId);
  const res = await fetch(
    `https://open.spotify.com/oembed?url=${encodeURIComponent(pageUrl)}`
  );
  if (!res.ok) {
    return { title: 'Spotify track' };
  }
  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };
  return {
    title: data.title?.trim() || 'Spotify track',
    author: data.author_name?.trim(),
    thumbnailUrl: data.thumbnail_url?.trim(),
  };
}
