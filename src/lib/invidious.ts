/** Default Invidious instance for YouTube playlist metadata (see OpenSpec import-youtube-playlists). */
export const DEFAULT_INVIDIOUS_BASE_URL = 'https://inv.nadeko.net';

/** Dexie `settings` key for optional override (empty = use default). */
export const INVIDIOUS_BASE_URL_SETTING_KEY = 'invidiousBaseUrl';

const TRAILING_SLASH = /\/+$/;

export function normalizeInvidiousBaseUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return DEFAULT_INVIDIOUS_BASE_URL;
  try {
    const u = new URL(t.includes('://') ? t : `https://${t}`);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error('Use http or https.');
    }
    return `${u.protocol}//${u.host}`;
  } catch {
    throw new Error('Enter a valid Invidious URL (e.g. https://inv.nadeko.net).');
  }
}

export class InvidiousPlaylistError extends Error {
  constructor(
    message: string,
    public readonly code: 'network' | 'http' | 'api' | 'empty'
  ) {
    super(message);
    this.name = 'InvidiousPlaylistError';
  }
}

export type InvidiousPlaylistPayload = {
  title: string;
  videoIds: string[];
};

type InvidiousPlaylistJson = {
  title?: string;
  videos?: unknown[];
  continuation?: string | null;
  error?: string;
};

function videoIdFromEntry(v: unknown): string | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  const id = o.videoId ?? o.video_id;
  if (typeof id === 'string' && id.length > 0) return id;
  return null;
}

/**
 * Fetches all pages of a playlist from Invidious `GET /api/v1/playlists/:id` (with continuation).
 */
export async function fetchInvidiousPlaylistVideos(
  baseUrl: string,
  playlistId: string
): Promise<InvidiousPlaylistPayload> {
  const base = baseUrl.replace(TRAILING_SLASH, '');
  const videoIds: string[] = [];
  let title = '';
  let continuation: string | null = null;

  for (let page = 0; page < 500; page++) {
    const url = new URL(`${base}/api/v1/playlists/${encodeURIComponent(playlistId)}`);
    if (continuation) {
      url.searchParams.set('continuation', continuation);
    }

    let res: Response;
    try {
      res = await fetch(url.toString());
    } catch {
      throw new InvidiousPlaylistError('Could not reach Invidious. Check your connection.', 'network');
    }

    if (!res.ok) {
      throw new InvidiousPlaylistError(
        `Invidious returned ${String(res.status)}. Try another instance in Settings.`,
        'http'
      );
    }

    let data: InvidiousPlaylistJson;
    try {
      data = (await res.json()) as InvidiousPlaylistJson;
    } catch {
      throw new InvidiousPlaylistError('Invidious returned invalid JSON.', 'api');
    }

    if (typeof data.error === 'string' && data.error.length > 0) {
      throw new InvidiousPlaylistError(data.error, 'api');
    }

    if (typeof data.title === 'string' && data.title.length > 0) {
      title = data.title;
    }

    const videos = Array.isArray(data.videos) ? data.videos : [];
    for (const v of videos) {
      const vid = videoIdFromEntry(v);
      if (vid) videoIds.push(vid);
    }

    const next =
      typeof data.continuation === 'string' && data.continuation.length > 0 ? data.continuation : null;
    if (!next) break;
    continuation = next;
  }

  if (videoIds.length === 0) {
    throw new InvidiousPlaylistError('This playlist has no videos, or Invidious could not read it.', 'empty');
  }

  return {
    title: title || 'Imported playlist',
    videoIds,
  };
}
