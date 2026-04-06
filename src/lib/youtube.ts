const VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

function validateId(raw: string | undefined): string | null {
  if (!raw) return null;
  const id = raw.split(/[?&#]/)[0];
  if (!VIDEO_ID_RE.test(id)) return null;
  return id;
}

/**
 * Extract YouTube video ID from a pasted URL or raw 11-char id.
 */
const PLAYLIST_LIST_PARAM_RE = /^[A-Za-z0-9_-]+$/;

/**
 * If the input is a YouTube URL with a `list=` playlist id, return that id and a canonical playlist URL.
 * Checked before single-video parsing so `watch?v=…&list=…` becomes a playlist import.
 */
export function parseYouTubePlaylistFromInput(input: string): {
  playlistId: string;
  canonicalUrl: string;
} | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const tryUrl = (href: string): { playlistId: string; canonicalUrl: string } | null => {
    try {
      const u = new URL(href);
      const host = u.hostname.replace(/^www\./, '');
      const youtubeHosts = ['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'];
      const isYt = youtubeHosts.some((h) => host === h || host.endsWith(`.${h}`));
      if (!isYt) return null;
      const list = u.searchParams.get('list');
      if (!list || !PLAYLIST_LIST_PARAM_RE.test(list)) return null;
      return {
        playlistId: list,
        canonicalUrl: `https://www.youtube.com/playlist?list=${encodeURIComponent(list)}`,
      };
    } catch {
      return null;
    }
  };

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return tryUrl(trimmed);
  }

  return tryUrl(`https://${trimmed}`);
}

export function parseYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (VIDEO_ID_RE.test(trimmed)) return trimmed;

  try {
    const u = new URL(trimmed);
    const host = u.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') {
      return validateId(u.pathname.split('/').filter(Boolean)[0]);
    }

    const youtubeHosts = ['youtube.com', 'm.youtube.com', 'music.youtube.com'];
    if (youtubeHosts.some((h) => host === h || host.endsWith(`.${h}`))) {
      const v = u.searchParams.get('v');
      if (v) return validateId(v);

      const parts = u.pathname.split('/').filter(Boolean);
      const shortsIdx = parts.indexOf('shorts');
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) {
        return validateId(parts[shortsIdx + 1]);
      }
      const embedIdx = parts.indexOf('embed');
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return validateId(parts[embedIdx + 1]);
      }
      const liveIdx = parts.indexOf('live');
      if (liveIdx >= 0 && parts[liveIdx + 1]) {
        return validateId(parts[liveIdx + 1]);
      }
    }
  } catch {
    return null;
  }

  return null;
}

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"']+/gi;

/**
 * Resolve a YouTube video ID from Web Share Target query params.
 * Prefers `url`; otherwise scans `text` for the first supported YouTube link.
 */
export function parseYouTubeVideoIdFromSharePayload(
  urlParam: string | null | undefined,
  textParam: string | null | undefined
): string | null {
  const tryDecode = (raw: string): string => {
    try {
      return decodeURIComponent(raw.replace(/\+/g, ' '));
    } catch {
      return raw;
    }
  };

  if (urlParam) {
    const fromUrl = parseYouTubeVideoId(tryDecode(urlParam.trim()));
    if (fromUrl) return fromUrl;
  }

  const text = textParam?.trim() ?? '';
  if (!text) return null;

  const fromWhole = parseYouTubeVideoId(text);
  if (fromWhole) return fromWhole;

  URL_IN_TEXT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_IN_TEXT_RE.exec(text)) !== null) {
    const id = parseYouTubeVideoId(m[0]);
    if (id) return id;
  }

  return null;
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export function thumbnailUrls(videoId: string): { maxres: string; hq: string } {
  const base = `https://img.youtube.com/vi/${videoId}`;
  return {
    maxres: `${base}/maxresdefault.jpg`,
    hq: `${base}/hqdefault.jpg`,
  };
}
