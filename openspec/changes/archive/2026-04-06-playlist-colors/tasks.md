## 1. Data model

- [x] 1.1 Add `color: string` (CSS `#RRGGBB`) to the `Playlist` interface in `src/db/index.ts` and include it in the Dexie `playlists` store definition (version bump as needed for this release).
- [x] 1.2 Ensure bootstrap seeds **Favorites** with the product default accent; no upgrade hook to backfill databases from older releases (greenfield assumption).
- [x] 1.3 Implement a small exported helper (e.g. `pickPlaylistColorForNewId` or palette index) used by all playlist creation paths so new playlists get an auto color consistently.

## 2. Persistence API

- [x] 2.1 Ensure `createPlaylist` / nested-create / bootstrap paths set `color` on insert (auto) and that reads return it.
- [x] 2.2 Add `updatePlaylistColor(playlistId, color)` (or extend an existing update) with validation: non-empty string, matches `#` + 6 hex digits (normalize casing if desired).

## 3. Playlists overview UI

- [x] 3.1 Render each playlist row with a visible accent (e.g. left border or leading swatch) using `playlist.color`.
- [x] 3.2 Add **Change color** to the overflow menu; open a dialog with preset swatches and optional `<input type="color">`; on confirm, call `updatePlaylistColor` and refresh UI.

## 4. Playlist detail and polish

- [x] 4.1 Show the same accent on playlist detail in the playlist identity region (header/title).
- [x] 4.2 If playlist detail exposes a playlist-level overflow menu, add **Change color** there mirroring the overview behavior; otherwise skip (per design).
- [x] 4.3 Run `npm run build` and `npm run lint`; fix any a11y issues (focus trap, labels for color control).
