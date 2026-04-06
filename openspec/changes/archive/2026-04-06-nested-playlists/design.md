## Context

Musicboxx stores playlists in **IndexedDB** (Dexie) as flat `Playlist` rows with a many-to-many `playlistSongs` table. The UI lists playlists and each **playlist detail** loads memberships for **that** `playlistId` only. The product already seeds **Favorites** (`isSystem`) and adds new songs there by default.

This change introduces a **parent/child tree** of playlists while keeping the name **playlist** everywhere. Subtree listing, deduplication, and in-memory tree walks are acceptable per product decisions.

## Goals / Non-Goals

**Goals:**

- Represent a **directed tree** of playlists via an optional **parent** reference on each playlist.
- On playlist **P**’s detail view, list **all songs** that appear in **P or any descendant playlist**, **deduplicated by song**, sorted by each song’s **`createdAt` descending** (implemented).
- Allow **opening playlists that have no songs** in the subtree (including empty leaves and containers that only hold children).
- **Prevent cycles** and invalid parents at write time.

**Non-Goals:**

- **Migrating** or rewriting **existing** local playlist rows from the **previous flat-only** model; upgrading stored data to infer `parentId` or preserve old installs is **out of scope** (treat as new hierarchy behavior only).
- Server sync, collaborative editing, or sharing playlist trees.
- Changing **YouTube** playback model or song catalog rules beyond what’s needed for UI/queries.
- Optimizing for very deep trees beyond **in-memory** descendant collection (acceptable for expected client-side scale).

## Decisions

### 1. Store `parentId` on `Playlist`

- **Choice**: Add `parentId: string | undefined` (or `null`) on `Playlist`; index for queries by parent.
- **Rationale**: One entity (“playlist”) keeps mental model and reuses `playlistSongs`; matches “use playlist as the naming.”
- **Alternatives considered**: Separate `Folder` entity (rejected: duplicates naming and splits UX); materialized path strings (rejected: harder migrations and cycle checks without much benefit at current scale).

### 2. Favorites is top-level only

- **Choice**: The **Favorites** playlist **MUST NOT** have a parent. It **MAY** be chosen as the parent of user-created child playlists.
- **Rationale**: Preserves a stable, obvious default bucket; avoids “where did Favorites go?” if nested under something else.
- **Alternatives considered**: Virtual root object (rejected: extra concept); allow Favorites under a folder (rejected: complicates default-new-song behavior and discoverability).

### 3. Subtree resolution and deduplication

- **Choice**: For playlist `P`, compute `ids = {P} ∪ descendants(P)` via **in-memory** graph walk from all playlists (or cached children map), then load all `playlistSongs` rows where `playlistId ∈ ids`, then **dedupe by `songId`** for the displayed list.
- **Rationale**: Matches agreed performance posture; Dexie has no native recursive query.
- **Alternatives considered**: Materialized subtree song tables (rejected: sync complexity on move/delete).

### 4. Membership semantics unchanged

- **Choice**: `playlistSongs` still means “song is a **direct** member of this playlist node.” Subtree views are **derived**, not new rows.
- **Rationale**: Removing a song from **P** only removes `(P, song)`; it does not remove the same song from a child playlist’s membership—consistent with “organize across playlists” today.

### 5. Cycle prevention

- **Choice**: When setting `parentId` to `X`, reject if `X` is `P` or **any descendant of** `P` (walk upward from `X` to root or downward from `P`—implementation picks one clear algorithm).
- **Rationale**: Keeps the structure a tree.

### 6. UI navigation

- **Choice**: **Playlists** overview shows a **nested list** (indent + left border on deeper levels). Each playlist row is a **link to detail** plus a **`+` control**; **`+`** opens a **modal** titled with the parent name, **name field**, **Cancel**, and **Create**—calling `createPlaylist(name, parentId)` for that row’s playlist. **Top-level** playlists are created only via the **“New playlist”** form at the bottom of the page (`createPlaylist(name)` with no parent)—no parent **dropdown** in the tree.
- **Playlist detail** shows **`+` beside the title** (new child under the current playlist) and **`+` on each sub-playlist row** (same modal pattern). **Child playlists** are listed as links; **songs** use a **single combined deduped subtree list**.
- **Ancestor breadcrumb**: When the current playlist has a **parent**, show a **compact navigation row** (below the back link, above the title) listing **each ancestor** from **root → … → immediate parent** as **individual links** to `/playlist/:id`. **Top-level** playlists (no `parentId`) show **no** breadcrumb strip. Implementation uses **`getPlaylistAncestors(playlist, allPlaylists)`** walking `parentId` upward with cycle protection; styling is secondary/muted (`.playlist-breadcrumb`).
- **Rationale**: Keeps nesting discoverable without cluttering the tree with forms; modal focuses input on one action; breadcrumbs orient users in deep trees without replacing the main **← Playlists** affordance.

*Clarification*: **Remove** on the playlist detail song list applies only to **direct** memberships on the current playlist; songs visible only via descendants show a non-destructive **“In sub-playlist”** hint instead of Remove.

### 7. Dexie schema (no legacy data migration)

- **Choice**: Introduce `parentId` (and indexes) in the schema used by this feature. **Do not** implement a migration path that transforms or backfills rows from the earlier flat-only model—compatibility with old on-disk shapes is explicitly out of scope for this change.
- **Rollback**: Older builds and stored data are not a migration target; document expectations for PWA users (e.g. fresh install / cleared storage if required) as appropriate.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Ambiguous remove** when song shows in subtree but not as direct member | Prefer remove actions only for **direct** members on current playlist; for inherited-only visibility, navigate to child or show clear copy. |
| **Large trees** slow first subtree build | In-memory walk is O(nodes); acceptable; revisit if profiling shows issues. |
| **Existing browsers with old IndexedDB shape** | Out of scope: no legacy migration; acceptable outcomes include requiring cleared storage or only supporting new installs. |
| **Favorites as parent** confuses users | **`+`** on Favorites creates under Favorites; keep **Favorites** visually distinct (**Default** badge). |

## Migration Plan

**None** for this change: there is **no** planned upgrade path from the previous flat playlist storage. Implementation may add a new schema version for `parentId` and indexes without treating legacy rows as data to preserve or convert.

## Open Questions

- *(none — resolved in implementation: subtree song sort by **`createdAt` desc**; nested create via **`+` + modal**; top-level create via bottom form; **reparent** not in v1.)*
