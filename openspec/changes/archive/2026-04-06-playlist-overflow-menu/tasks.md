## 1. Data layer and persistence

- [x] 1.1 Add persisted **default playlist id** (Dexie version bump + migration defaulting to `FAVORITES_PLAYLIST_ID`), with read helpers used by the rest of the app.
- [x] 1.2 Add `setDefaultPlaylist(playlistId)` (validate playlist exists; allow any non-deleted playlist including Favorites).
- [x] 1.3 Update **`addSongFromVideoId`** (and any other “new song” entry points) to add new songs to the **configured default** playlist instead of always `FAVORITES_PLAYLIST_ID`.
- [x] 1.4 Add **`movePlaylist(playlistId, newParentId | null)`** reusing **`validateParentAssignment`**; reject when target would nest **Favorites** under another playlist.
- [x] 1.5 Add **`deletePlaylist(playlistId)`**: block system / **Favorites**; block when **child playlists** exist; remove **`playlistSongs`** rows for that playlist only; leave **`songs`** table unchanged.
- [x] 1.6 Add **`renamePlaylist(playlistId, name)`** (trim, reject empty; `db.playlists.update`).

## 2. Playlists overview UI

- [x] 2.1 Add an accessible **overflow menu** (⋯) per row in **`PlaylistTreeItems`** with items: **Rename**, **Set as default**, **Create nested playlist**, **Move to folder**, **Delete** (disable/hide ineligible actions).
- [x] 2.2 Implement **Rename** (modal or dialog): prefilled name, validation, call **`renamePlaylist`**.
- [x] 2.3 Show the **Default** badge on whichever playlist is the configured default (not hardcoded only to **Favorites**).
- [x] 2.4 Wire **Create nested playlist** to open **`CreateSubplaylistModal`** with the row’s playlist as parent (same as **+**).
- [x] 2.5 Implement **Move to folder** UI (modal or picker): top-level + allowed parent playlists; on confirm call **`movePlaylist`**; surface validation errors.
- [x] 2.6 Implement **Delete** with confirmation when needed; call **`deletePlaylist`**; show clear errors when blocked (children, system playlist).

## 3. Verification

- [x] 3.1 Run **`npm run build`** and **`npm run lint`**; manually smoke-test overview menu, rename, default switching, move, and delete on a dev build.
