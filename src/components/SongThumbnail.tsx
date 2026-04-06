import { useCallback, useState } from 'react';
import type { Song } from '../db';
import { thumbnailUrls } from '../lib/youtube';

type Quality = 'maxres' | 'hq' | 'placeholder';

export function SongThumbnail({
  song,
  alt,
  className,
}: {
  song: Pick<Song, 'provider' | 'videoId' | 'thumbnailUrl'>;
  alt: string;
  className?: string;
}) {
  const [q, setQ] = useState<Quality>('maxres');

  const onError = useCallback(() => {
    setQ((prev) => {
      if (song.provider === 'spotify') return 'placeholder';
      if (prev === 'maxres') return 'hq';
      return 'placeholder';
    });
  }, [song.provider]);

  let src: string;
  if (song.provider === 'spotify') {
    const tu = song.thumbnailUrl;
    if (tu && q !== 'placeholder') {
      src = tu;
    } else {
      src = '/placeholder-cover.svg';
    }
  } else {
    const vid = song.videoId;
    if (!vid) {
      src = '/placeholder-cover.svg';
    } else {
      const { maxres, hq } = thumbnailUrls(vid);
      src = q === 'placeholder' ? '/placeholder-cover.svg' : q === 'hq' ? hq : maxres;
    }
  }

  return (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={onError}
      {...(alt === '' ? { 'aria-hidden': true as const } : {})}
    />
  );
}
