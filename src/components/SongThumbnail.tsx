import { useCallback, useState } from 'react';
import { thumbnailUrls } from '../lib/youtube';

type Quality = 'maxres' | 'hq' | 'placeholder';

export function SongThumbnail({
  videoId,
  alt,
  className,
}: {
  videoId: string;
  alt: string;
  className?: string;
}) {
  const { maxres, hq } = thumbnailUrls(videoId);
  const [q, setQ] = useState<Quality>('maxres');

  const onError = useCallback(() => {
    setQ((prev) => {
      if (prev === 'maxres') return 'hq';
      return 'placeholder';
    });
  }, []);

  const src =
    q === 'placeholder' ? '/placeholder-cover.svg' : q === 'hq' ? hq : maxres;

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
