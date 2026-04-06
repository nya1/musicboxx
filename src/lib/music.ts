import { parseAppleMusicFromInput } from './appleMusic';
import { parseSpotifyTrackId } from './spotify';
import { parseYouTubePlaylistFromInput, parseYouTubeVideoId } from './youtube';

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"']+/gi;

export type ParsedMusic =
  | { provider: 'youtube'; videoId: string }
  | { provider: 'spotify'; trackId: string }
  | { provider: 'apple-music'; trackId: string; openUrl: string };

/** Single track or a YouTube playlist link (background detection — no separate control). */
export type AddMusicInput =
  | { kind: 'track'; parsed: ParsedMusic }
  | { kind: 'youtube-playlist'; playlistId: string; canonicalUrl: string };

export function songCatalogKey(provider: ParsedMusic['provider'], id: string): string {
  return `${provider}:${id}`;
}

/**
 * Same paste box as single tracks: playlist URLs are detected first, then Spotify/Apple/YouTube video.
 */
export function parseAddMusicFromInput(input: string): AddMusicInput | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const pl = parseYouTubePlaylistFromInput(trimmed);
  if (pl) return { kind: 'youtube-playlist', ...pl };
  const track = parseMusicFromInput(trimmed);
  if (track) return { kind: 'track', parsed: track };
  return null;
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

/**
 * Web Share Target: same classification order as {@link parseAddMusicFromInput}.
 */
export function parseAddMusicFromSharePayload(
  urlParam: string | null | undefined,
  textParam: string | null | undefined
): AddMusicInput | null {
  if (urlParam) {
    const fromUrl = parseAddMusicFromInput(tryDecode(urlParam.trim()));
    if (fromUrl) return fromUrl;
  }

  const text = textParam?.trim() ?? '';
  if (!text) return null;

  const fromWhole = parseAddMusicFromInput(text);
  if (fromWhole) return fromWhole;

  URL_IN_TEXT_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = URL_IN_TEXT_RE.exec(text)) !== null) {
    const parsed = parseAddMusicFromInput(m[0]);
    if (parsed) return parsed;
  }

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
 * Legacy single-track share parsing. YouTube **playlist** URLs return `null` — use
 * {@link parseAddMusicFromSharePayload} for full classification.
 */
export function parseMusicFromSharePayload(
  urlParam: string | null | undefined,
  textParam: string | null | undefined
): ParsedMusic | null {
  const r = parseAddMusicFromSharePayload(urlParam, textParam);
  if (!r || r.kind === 'youtube-playlist') return null;
  return r.parsed;
}
