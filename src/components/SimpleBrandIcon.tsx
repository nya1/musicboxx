import type { SimpleIcon } from 'simple-icons';

type Props = {
  icon: SimpleIcon;
  /** Pixel size for the square icon box (default 18). */
  size?: number;
  className?: string;
};

/**
 * Renders a [Simple Icons](https://simpleicons.org/) brand mark for inline use in buttons/links.
 */
export function SimpleBrandIcon({ icon, size = 18, className }: Props) {
  return (
    <span
      className={className}
      style={{ width: size, height: size, flexShrink: 0 }}
      aria-hidden
    >
      <svg
        role="presentation"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
      >
        <path d={icon.path} fill={`#${icon.hex}`} />
      </svg>
    </span>
  );
}
