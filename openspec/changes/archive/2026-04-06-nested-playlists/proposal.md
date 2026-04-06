## Why

Flat playlists do not match how people mentally group music: collections often nest (genre → era → album-style groupings). Users need **hierarchical playlists** so they can drill into a branch or see **everything below** a playlist in one list, without duplicate song rows when the same track appears under multiple descendants.

## What Changes

- Model playlists as a **tree**: each playlist may have an optional **parent playlist** (except where system rules forbid nesting).
- **Playlist detail view** shows **all songs in the subtree** rooted at that playlist: memberships on that playlist **or any descendant**, with **duplicate songs deduplicated** (one row per song).
- Users can **navigate into empty playlists** that still have a role as containers (e.g. holding child playlists only).
- **Playlists index** surfaces the **tree** (nested list with indentation). **Nested** playlists are created via a **`+` control** on each playlist row, which opens a **modal** to enter the new playlist’s name (no parent dropdown on the tree). **Top-level** playlists use a separate **“New playlist”** form at the bottom of the page.
- **Playlist detail** for a **nested** playlist shows a **breadcrumb** (or equivalent compact nav): **links to each ancestor** from root to immediate parent so the user can open upper playlists individually; **top-level** playlists omit this strip.
- **No migration** from the previous flat playlist model: this change does **not** include upgrading or rewriting existing local data; scope is the new hierarchy and behavior going forward (see `design.md`).
- IndexedDB schema gains playlist **parent** linkage as part of the new model; compatibility with older stored shapes is **out of scope** for this proposal.

## Capabilities

### New Capabilities

- *(none — behavior extends the existing playlists domain.)*

### Modified Capabilities

- `playlists`: Add **parent/child relationships** between playlists; define **subtree song listing** (deduped); allow **empty navigable** playlists; preserve **Favorites** and default-new-song behavior with explicit rules; update persistence requirements for the new fields.

## Impact

- **`src/db/`**: Dexie schema / `Playlist` type extended with parent linkage; queries/helpers for **descendant playlist ids** (in-memory tree walk is acceptable), **subtree song resolution** with deduplication by `songId`, and **`getPlaylistAncestors`** (walk `parentId` upward) for playlist-detail breadcrumbs—**without** a migration path from the prior flat-only rows.
- **`src/pages/`**: `PlaylistsPage`, `PlaylistDetailPage`, `SongDetailPage` updated for hierarchy, subtree semantics, and nested-create UX.
- **`src/components/`**: Shared **`Modal`** and **`CreateSubplaylistModal`** for the nested-playlist name flow.
- **Routing**: Existing `playlist/:id` route is sufficient; no nested URL segments required.
- **Specs**: Delta under this change’s `specs/playlists/spec.md`; merged into `openspec/specs/playlists/spec.md` when archived.
