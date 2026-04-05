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
