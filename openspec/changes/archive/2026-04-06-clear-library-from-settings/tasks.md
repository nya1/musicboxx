## 1. Database layer

- [x] 1.1 Add `clearLibraryData(database?: MusicboxxDB)` (or equivalent name) in `src/db/index.ts` that runs in a **read-write transaction** over `songs`, `playlists`, `playlistSongs`, and `settings`, clears those tables, then calls **`bootstrapDb`** so Favorites and default-playlist settings are restored.
- [x] 1.2 Add unit tests in `src/db/` (extend `db-helpers.test.ts` or new file) covering successful clear, post-clear playlist/settings invariants, and transactional behavior expectations (e.g. empty songs and user playlists, Favorites present).

## 2. Settings UI

- [x] 2.1 Add a **Clear local library** (or aligned label) control in **Library data** on `SettingsPage`, with copy that warns songs and playlists will be removed and suggests export first.
- [x] 2.2 Add a confirmation **`Modal`** with explanatory copy, a **text input** for the user to type **`delete`** (compare **trimmed** value to lowercase **`delete`**), a destructive confirm action **enabled only** when valid, **Cancel**, and disabled controls while the operation runs; set **success** or **error** status text consistent with existing export/import messaging.
- [x] 2.3 On success, navigate to a sensible route (e.g. home or library, matching import replace behavior) so lists reload from Dexie.

## 3. Tests and verification

- [x] 3.1 Extend `SettingsPage.test.tsx` (or add flow coverage) for the clear action, modal, **typed `delete`** before confirm is enabled, and mocked `clearLibraryData` success/failure paths.
- [x] 3.2 Run `pnpm run test`, `pnpm run build`, and `pnpm run lint` and fix any issues.
