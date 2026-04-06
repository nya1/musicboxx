## 1. Export and import core

- [x] 1.1 Define export JSON shape, **`schemaVersion`** constant, and TypeScript types (aligned with `src/db/index.ts` tables).
- [x] 1.2 Implement **`exportLibrarySnapshot()`** (or equivalent) that reads all `songs`, `playlists`, `playlistSongs`, and `settings` and returns or serializes the versioned document.
- [x] 1.3 Implement **`validateImportDocument()`** with schema version check and referential integrity (playlist/song links, parent ids, system playlist rules as applicable).
- [x] 1.4 Implement **`importLibraryReplace()`** in a single Dexie transaction: clear target tables, **`bulkPut`** / **`put`** rows with preserved keys, then **`bootstrapDb()`** (or equivalent) so Favorites and default settings hold.
- [x] 1.5 Add focused unit tests for validation (good file, bad version, broken references) and round-trip **export → import** on a seeded in-memory or test DB.

## 2. Settings UI

- [x] 2.1 Replace disabled **Library data** placeholders on **`SettingsPage`** with **Export** (download) and **Import** (file picker) actions, accessible names, and brief helper text (recommend export before import).
- [x] 2.2 Add **confirmation** dialog (or modal pattern consistent with the app) before import replace; wire success and error feedback (including parse/validation failures).
- [x] 2.3 Trigger **post-import** UI refresh so lists reflect new data without a full reload (e.g. navigate home, invalidate hooks, or `location.reload()` only if unavoidable and documented).

## 3. Quality gate

- [x] 3.1 Add or extend **`SettingsPage`** tests for presence of export/import controls and basic interaction where practical.
- [x] 3.2 Run **`pnpm run test`**, **`pnpm run build`**, and **`pnpm run lint`** and fix any issues.
