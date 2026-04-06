## 1. Data model

- [x] 1.1 Add optional `parentId` to `Playlist` and new Dexie indexes (e.g. `parentId`) as needed for the hierarchy—**without** migrating or backfilling data from the prior flat-only model
- [x] 1.2 Implement `validateParentAssignment(playlistId, parentId)` (or equivalent) to reject cycles and invalid parents (e.g. parent must exist; **Favorites** must not gain a parent)
- [x] 1.3 Extend `createPlaylist` to accept optional `parentId` and persist it after validation

## 2. Subtree and tree helpers

- [x] 2.1 Build an in-memory children map or adjacency from `db.playlists` and implement **descendant id** collection for a given playlist (include self)
- [x] 2.2 Implement **deduped subtree songs**: load `playlistSongs` for all ids in the descendant set, merge, dedupe by `songId`, apply a single stable sort (document choice in code or design follow-up)
- [x] 2.3 Add helpers to list **direct child playlists** of a playlist for navigation links

## 3. Playlists overview UI

- [x] 3.1 Replace or augment the flat list so **child playlists** render under their parent (indent, nested list, or grouped—match existing visual language)
- [x] 3.2 Update **create playlist** flow: **top-level** via bottom-of-page form; **nested** via **`+`** on each playlist row (overview + detail) opening a **modal** for the name (`CreateSubplaylistModal`, `Modal`)
- [x] 3.3 Keep **Favorites** visually distinct (existing badge) and enforce UI rules consistent with spec (cannot set parent on Favorites)

## 4. Playlist detail UI

- [x] 4.1 Load **deduped subtree** songs for the route’s playlist id instead of direct memberships only
- [x] 4.2 Show **child playlists** (links) so empty containers remain navigable; handle **empty subtree** with existing empty-state patterns where appropriate
- [x] 4.3 Define **remove song** behavior: removing from playlist **P** removes **direct** membership on **P** only; if the song is only visible via descendants, either hide remove or route user to the child playlist (align with `design.md` risk mitigation)
- [x] 4.4 **Ancestor breadcrumb** on nested playlist detail: `getPlaylistAncestors`, nav links + separators in `PlaylistDetailPage`, `.playlist-breadcrumb` styles

## 5. Related flows

- [x] 5.1 Update **song detail** “add to playlist” to list playlists in a way consistent with hierarchy (flat picklist is acceptable if parents are labeled; tree pick is optional)
- [x] 5.2 Audit other `playlistId` reads (share target, imports, etc.) for assumptions of flat playlists; adjust only where behavior must match the new model

## 6. Verification

- [x] 6.1 Manually verify: nested create, navigate empty parent, subtree dedupe, cycle prevention, reload persistence
- [x] 6.2 Run `npm run build` and `npm run lint`
