import { parseAppleMusicFromInput } from './appleMusic';
import { parseSpotifyTrackId } from './spotify';
import { parseYouTubeVideoId } from './youtube';

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"']+/gi;

export type ParsedMusic =
  | { provider: 'youtube'; videoId: string }
  | { provider: 'spotify'; trackId: string }
  | { provider: 'apple-music'; trackId: string; openUrl: string };

export function songCatalogKey(provider: ParsedMusic['provider'], id: string): string {
  return `${provider}:${id}`;
}

/**
 * Resolve YouTube, Spotify, or Apple Music from pasted text (URL or raw id where supported).
 */
export function parseMusicFromInput(input: string): ParsedMusic | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const yt = parseYouTubeVideoId(trimmed);
  if (yt) return { provider: 'youtube', videoId: yt };
  const sp = parseSpotifyTrackId(trimmed);
  if (sp) return { provider: 'spotify', trackId: sp };
  const am = parseAppleMusicFromInput(trimmed);
  if (am) return { provider: 'apple-music', trackId: am.trackId, openUrl: am.openUrl };
  return null;
}

function tryDecode(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, ' '));
  } catch {
    return raw;
  }
}

/**
 * Resolve a music link from Web Share Target params (YouTube, Spotify, or Apple Music).
 * Prefers `url`, then whole `text`, then first URL found in `text`.
 */
export function parseMusicFromSharePayload(
  urlParam: string | null | undefined,
  textParam: string | null | undefined
): ParsedMusic | null {
  if (urlParam) {
    const fromUrl = parseMusicFromInput(tryDecode(urlParam.trim()));
    if (fromUrl) return fromUrl;
  }

  const text = textParam?.trim() ?? '';
  if (!text) return null;

  const fromWhole = parseMusicFromInput(text);
  if (fromWhole) return fromWhole;

  URL_IN_TEXT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_IN_TEXT_RE.exec(text)) !== null) {
    const parsed = parseMusicFromInput(m[0]);
    if (parsed) return parsed;
  }

  return null;
}
