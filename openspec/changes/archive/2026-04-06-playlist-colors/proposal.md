## Why

In the Playlists overview and elsewhere, rows look visually similar—only text differentiates them—so scanning a long hierarchy is harder than it needs to be. Giving each playlist a **distinct accent color** makes lists easier to recognize at a glance and adds a bit of personality without changing core behavior.

## What Changes

- Persist a **per-playlist color** (user-visible accent) on each playlist record, stored locally with other playlist data.
- **Auto-assign** a color when a playlist is **created** (user or nested create), using a deterministic or random-but-stable scheme so new lists feel varied without user effort.
- **Seed** a sensible color for **Favorites** when the library is first initialized so the default playlist matches the same model as user-created lists.
- Let the user **change the color** from the **playlist overflow menu** (same surface as Rename, Move, etc. on the Playlists overview); optional parity on **playlist detail** if that surface already exposes a comparable menu—otherwise overview-only is enough for v1.
- **Surface** the color in the UI where playlists are listed (e.g. row accent, icon, or left border) and consistently on **playlist detail** so the chosen color is visible in context.

## Capabilities

### New Capabilities

- _(none — extends the existing `playlists` capability.)_

### Modified Capabilities

- `playlists`: Add requirements for **per-playlist accent color** (persistence, auto-generation on create, seed for **Favorites** on first run), **editing color** from the playlist overflow menu, and **visible use** of that color in the playlist overview and detail views. **No** migration from older app versions without colors is required—assume a greenfield install.

## Impact

- **`src/db/index.ts`**: `Playlist` type includes `color`; Dexie schema includes the field; bootstrap and playlist create paths set colors (no legacy data migration).
- **`src/pages/PlaylistsPage.tsx`** (and playlist row / tree components): show accent; overflow menu gains **Change color** (or equivalent) with a simple picker.
- **Playlist detail** page/components: reflect the same accent where the playlist identity is shown.
- **Spec delta**: `openspec/changes/playlist-colors/specs/playlists/spec.md`.
