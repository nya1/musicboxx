## Why

The hierarchical **Playlists** overview (`PlaylistsPage`) only exposes a **+** control per row for nested creation. Common playlist operations—choosing which list receives **new songs by default**, **renaming** a list, adding a child via an explicit menu, **reparenting** a playlist (“move to another folder”), or **removing** a playlist—are missing from the row, so users must work around the UI or cannot do these actions at all (e.g. no delete). A compact **overflow menu** (three dots) on each row surfaces these actions in one place and matches familiar PWA patterns.

## What Changes

- Add a **three-dot (overflow) menu** to each playlist row in the **Playlists** overview (the hierarchical list on `/playlists`).
- **Set as default playlist**: Persist which playlist is the **default for new songs** (today new songs are always added to **Favorites**); the UI shows which playlist is default (e.g. badge), and **Favorites** follows the same rules as other playlists when it is not the chosen default.
- **Rename playlist**: Change the playlist’s **display name** from the menu (validated non-empty name), persisted in IndexedDB.
- **Create nested playlist**: Open the **existing** nested-create flow (modal) with the selected row as parent—same behavior as **+**, second entry point.
- **Move playlist to another folder**: Let the user pick a **new parent** (another playlist or top-level “folder”), with validation (no cycles, **Favorites** cannot be nested under another playlist).
- **Delete playlist**: Remove a user playlist and handle **memberships** and **child playlists** per agreed product rules (defined in design/spec); **Favorites** cannot be deleted.

## Capabilities

### New Capabilities

- _(none — behavior extends the existing `playlists` capability.)_

### Modified Capabilities

- `playlists`: Add requirements for the Playlists overview **overflow menu**, **rename playlist**, **user-configurable default playlist for new songs**, **move/reparent** from the overview, and **delete playlist**, including persistence and edge cases (system playlist, hierarchy, empty containers).

## Impact

- **`src/pages/PlaylistsPage.tsx`** (and likely new small components for menu / rename / move / delete / default selection).
- **`src/db/index.ts`** (or related `db` modules): `renamePlaylist` (or equivalent), default-playlist preference storage, `updatePlaylistParent` / move, delete playlist + cascade rules, and **`addSongFromVideoId`** (or callers) to use the configured default instead of hardcoded `FAVORITES_PLAYLIST_ID` only.
- **Dexie schema** may need a new version if settings live outside existing tables (e.g. key/value store) or playlist rows gain fields.
- **Spec delta** under this change: `openspec/changes/playlist-overflow-menu/specs/playlists/spec.md`.
- Copy and **a11y**: menu buttons need clear labels; destructive actions need confirmation where appropriate.
