## Context

Musicboxx keeps playlists in **IndexedDB** (`Dexie`) with optional `parentId` for a tree. The **Playlists** page (`PlaylistsPage`) renders `PlaylistTreeItems` with a row link, a **Default** badge on **Favorites**, and a **+** button that opens `CreateSubplaylistModal`. New songs from `addSongFromVideoId` are always added to `FAVORITES_PLAYLIST_ID`. There is **no** playlist delete, reparent, or **rename** API in `src/db/index.ts` today (beyond mutating tables ad hoc).

## Goals / Non-Goals

**Goals:**

- Add an accessible **overflow menu** (three dots) per row on the Playlists overview with: **Rename**, **Set as default**, **Create nested playlist**, **Move to…**, **Delete**.
- Persist a **default playlist for new songs**, initially **Favorites**, updatable by the user; reflect the choice in the UI (badge / labeling).
- Implement **move** as **reparenting** (`parentId` change) with existing cycle and Favorites rules.
- Implement **delete** for non-system playlists with clear cascade rules and confirmations.

**Non-Goals:**

- Changing **playlist detail** row actions beyond what already exists (unless trivial reuse of shared components).
- Server sync, sharing, or multi-device defaults.

## Decisions

1. **Where to store “default playlist for new songs”**  
   **Decision:** Single app setting (e.g. `defaultPlaylistId: string`) in a small settings store or a dedicated Dexie table / version bump on `MusicboxxDB`.  
   **Rationale:** Avoid overloading the `Favorites` row; one global default matches current “all new songs go to one list” behavior.  
   **Alternatives:** Per-device implicit default only in memory (rejected: not durable). Store on `Playlist` as `isDefault` flag (rejected: easy to violate “exactly one default” without extra constraints).

2. **Default initialization**  
   **Decision:** On bootstrap / migration, if unset, set `defaultPlaylistId` to `FAVORITES_PLAYLIST_ID`.  
   **Rationale:** Matches current spec and user expectations.

3. **Move UX**  
   **Decision:** Modal (or native `select` + confirm) listing **valid parents**: top-level option + playlists that are not the moved playlist or its descendants (exclude subtree to prevent cycles). **Favorites** only as top-level target (cannot nest under another playlist).  
   **Rationale:** Reuses `validateParentAssignment`; clear mental model of “folder = parent playlist.”

4. **Delete behavior**  
   **Decision:** **Block** delete if the playlist has **child playlists** (user must move or delete children first), **or** offer explicit cascade (higher risk). Prefer **block with message** for v1 to limit data loss. Remove all `playlistSongs` rows for that playlist; do not delete songs from the global catalog.  
   **Rationale:** Safer than recursive delete of entire subtrees without strong confirmation UX.  
   **Alternatives:** Recursive delete (needs strong confirm + copy). Auto-reparent children to parent (more complex rules).

5. **Favorites and system playlists**  
   **Decision:** **Favorites** cannot be deleted or nested under another playlist (existing rules). **Set as default** is allowed for any playlist including Favorites. If deleting is blocked for system playlists, hide or disable **Delete** for `isSystem` / known id.

6. **Overflow vs. +**  
   **Decision:** Keep **+** for quick nested create; menu duplicates **Create nested playlist** by opening the same `CreateSubplaylistModal` with the row’s playlist as parent.

7. **Rename**  
   **Decision:** **Rename** opens a small modal (or inline pattern) with a **single text field** prefilled with the current name; on confirm, persist **`playlist.name`** after **trim**; reject empty or whitespace-only names (same validation as create). Applies to **all** playlists including **Favorites** (same id; only the label changes).  
   **Rationale:** One code path; no special case unless product later forbids renaming system seeds.

## Risks / Trade-offs

- **[Risk]** Users expect “move” to bulk-move **songs** between playlists → **Mitigation:** Label the action “Move to folder” / “Change parent” in UI and spec so it matches **hierarchy** behavior.
- **[Risk]** Changing default away from Favorites confuses existing docs/strings → **Mitigation:** Update empty-state and any “always Favorites” copy; keep Favorites as seeded list.
- **[Risk]** Dexie migration mistakes → **Mitigation:** Bump schema version, test `bootstrapDb` and upgrade path on empty and populated DB.

## Migration Plan

1. Ship Dexie version bump with default-playlist setting and any new indexes if needed.
2. On upgrade, initialize `defaultPlaylistId` to Favorites when missing.
3. No server rollback; PWA users keep local data. Rollback = redeploy previous build (old code may ignore extra settings safely if stored in a new table).

## Open Questions

- Whether **delete** when the playlist has **no children** but **has songs** should show a single confirm listing member count (recommended: yes).
- Exact **aria** pattern for the menu (`menu` + `menuitem` vs. disclosure popover) — follow existing app patterns if any; otherwise use a minimal button + anchored panel with focus trap.
