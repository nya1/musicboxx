import { useEffect, useId, useRef, useState } from 'react';
import { FolderInput, ListPlus, Palette, Pencil, Star, Trash2 } from 'lucide-react';
import { FAVORITES_PLAYLIST_ID, getChildPlaylistsSorted, type Playlist } from '../db';

const iconProps = {
  className: 'playlist-overflow__icon',
  size: 18,
  strokeWidth: 1.75,
  'aria-hidden': true as const,
};

type PlaylistOverflowMenuProps = {
  playlist: Playlist;
  allPlaylists: Playlist[];
  defaultPlaylistId: string;
  onRename: () => void;
  onSetDefault: () => void;
  onAddChild: () => void;
  onMove: () => void;
  onChangeColor: () => void;
  onDelete: () => void;
};

export function PlaylistOverflowMenu({
  playlist,
  allPlaylists,
  defaultPlaylistId,
  onRename,
  onSetDefault,
  onAddChild,
  onMove,
  onChangeColor,
  onDelete,
}: PlaylistOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const btnId = useId();
  const menuId = useId();

  const isFavorites = playlist.id === FAVORITES_PLAYLIST_ID;
  const isSystem = playlist.isSystem;
  const hasChildren = getChildPlaylistsSorted(playlist.id, allPlaylists).length > 0;
  const canDelete = !isSystem;
  const canMove = !isFavorites;
  const deleteEnabled = canDelete && !hasChildren;
  const deleteTitle = !canDelete
    ? 'This playlist cannot be deleted.'
    : hasChildren
      ? 'Move or delete sub-playlists first.'
      : undefined;

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function run(closeAfter: () => void) {
    closeAfter();
    setOpen(false);
  }

  return (
    <div className="playlist-overflow" ref={wrapRef}>
      <button
        id={btnId}
        type="button"
        className="playlist-overflow__trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        aria-label={`More actions for ${playlist.name}`}
      >
        ⋯
      </button>
      {open ? (
        <div
          id={menuId}
          className="playlist-overflow__menu"
          role="menu"
          aria-labelledby={btnId}
        >
          <button
            type="button"
            role="menuitem"
            className="playlist-overflow__item"
            onClick={() => run(onRename)}
          >
            <Pencil {...iconProps} />
            <span>Rename</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="playlist-overflow__item"
            onClick={() => run(onChangeColor)}
          >
            <Palette {...iconProps} />
            <span>Change color</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="playlist-overflow__item"
            onClick={() => run(onSetDefault)}
            disabled={playlist.id === defaultPlaylistId}
          >
            <Star {...iconProps} />
            <span>Set as default</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="playlist-overflow__item"
            onClick={() => run(onAddChild)}
          >
            <ListPlus {...iconProps} />
            <span>Create nested playlist</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="playlist-overflow__item"
            onClick={() => run(onMove)}
            disabled={!canMove}
          >
            <FolderInput {...iconProps} />
            <span>Move to folder</span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="playlist-overflow__item playlist-overflow__item--danger"
            onClick={() => run(onDelete)}
            disabled={!deleteEnabled}
            title={deleteTitle}
          >
            <Trash2 {...iconProps} />
            <span>Delete</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
