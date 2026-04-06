## Why

Users who want a fresh start, fix a corrupted local state, or remove all saved music before handing off a device need a **safe, explicit way to wipe local library data** without hunting for devtools. Export/import already covers backup and restore; **clear/reset** completes the local data story from Settings.

## What Changes

- Add a **Clear library** (or **Reset local data**) control in **Settings → Library data**, with confirmation that requires the user to **type `delete`** into a text field before the destructive action is allowed (in addition to any modal copy).
- Implement **client-side clearing** of IndexedDB-backed data (songs, playlists, playlist links, and related tables) so the app returns to an **empty-but-valid** state (including **system playlists** such as Favorites and default settings), consistent with post-import invariants.
- Surface **success or failure** to the user; operation SHALL **not** depend on network access.

## Capabilities

### New Capabilities

- `library-data-reset`: Requirements for **resetting** the local library—confirmation gate, atomic or safe clear semantics, invariants after reset (usable app, Favorites/system playlist behavior), offline-capable operation, and user-visible outcomes.

### Modified Capabilities

- `app-settings`: Extend the **Library data** section requirement so it includes a **clear/reset local library** action alongside export and import, with the same offline-capable Settings expectations.

## Impact

- **UI**: Settings page (`Library data` section), likely shared confirmation patterns with import.
- **Data**: Dexie/IndexedDB layer—delete or recreate tables / `clear()` plus re-seed invariants (align with how import or first-run establishes Favorites and settings).
- **No** remote APIs or new dependencies; local-first only.
