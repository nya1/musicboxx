## Context

Musicboxx persists the library in **IndexedDB** via **Dexie** (`musicboxx` database): tables `songs`, `playlists`, `playlistSongs`, `settings`. `bootstrapDb()` ensures the **Favorites** system playlist and default-playlist setting exist. Settings already has a **Library data** section with disabled placeholders; this change implements real **export** and **import** entirely in the browser, consistent with the product’s local-first and no-server constraints.

## Goals / Non-Goals

**Goals:**

- Let users **download** a single file containing all library data needed to restore the app on the same or another profile/browser (same origin not required for the file—user moves the file manually).
- Let users **restore** from such a file, with predictable behavior and clear confirmation before overwriting data.
- Use a **versioned** JSON format so future schema changes can be handled explicitly.
- Keep **Settings** as the home for these actions; no new top-level nav item.

**Non-Goals:**

- Cloud backup, sync, or multi-device real-time merge.
- **Partial** import (pick playlists) or **merge** with duplicate resolution in v1—see Decisions.
- Encryption-at-rest of the export file (users may store the file on encrypted disk; the app does not add a password field in this change).

## Decisions

1. **Payload format: JSON**  
   - **What**: Top-level object with `schemaVersion` (number), `exportedAt` (ISO 8601 string), and arrays/objects mirroring Dexie tables: `songs`, `playlists`, `playlistSongs`, `settings`.  
   - **Why**: Easy to validate, diff, and test; no extra binary dependencies.  
   - **Alternatives**: SQLite blob (heavy in browser), CSV (poor fit for nested relations).

2. **Import mode: full replace after explicit confirmation**  
   - **What**: Import **clears** `songs`, `playlists`, `playlistSongs`, and `settings`, then writes the payload in a **single Dexie transaction**, re-applying rows with **explicit primary keys** where applicable (`songs.id`, `playlists.id`, composite keys for `playlistSongs`). Then call **`bootstrapDb()`** (or equivalent) so invariants (Favorites, default setting) hold if the payload omitted something.  
   - **Why**: Avoids complex merge rules, duplicate `catalogKey` handling, and partial broken trees in v1.  
   - **Alternatives**: Merge/upsert (more scenarios, more bugs).

3. **Song and playlist IDs preserved on import**  
   - **What**: Export includes stable numeric `song.id` and string `playlist.id`; import uses `bulkPut` / `put` with those keys so `playlistSongs` references remain valid.  
   - **Why**: Keeps join table consistent without remapping.  
   - **Alternatives**: Remap IDs (more code, error-prone).

4. **Validation before write**  
   - **What**: Parse JSON, check `schemaVersion` is supported, validate required fields and referential integrity (every `playlistSongs` references existing `playlistId` and `songId`, parent playlist ids exist, Favorites playlist constraints, etc.). On failure, show an error and **do not** mutate the DB.  
   - **Why**: Prevents half-applied corrupt state.

5. **UX on Settings**  
   - **Export**: Button triggers download (e.g. `musicboxx-export-YYYY-MM-DD.json` or similar) via object URL; no server round trip.  
   - **Import**: File picker (`<input type="file" accept` JSON or broad), then confirm dialog warning that current data will be replaced, then run import.  
   - **Accessibility**: Buttons and file input have discernible names; status/error messages exposed (e.g. `role="status"` or live region pattern consistent with the app).

6. **Module placement**  
   - **What**: New module(s) under `src/lib/` or `src/db/` for `exportDatabase()` / `importDatabase()` (names TBD) callable from `SettingsPage`.  
   - **Why**: Keeps Dexie transactions testable without full UI.

## Risks / Trade-offs

- **Large libraries** → JSON stringify/parse may block the main thread briefly; **Mitigation**: acceptable for typical personal libraries; document that very large exports may cause a short freeze (future: worker if needed).  
- **User replaces data by mistake** → **Mitigation**: strong confirmation copy; export before import encouraged in UI microcopy.  
- **Schema drift** → **Mitigation**: `schemaVersion`; reject unknown versions with a clear message.  
- **PWA / iOS Safari** → **Mitigation**: use standard download and file-input APIs; verify in manual QA.

## Migration Plan

- No server deploy or database migration on a backend.  
- **Rollout**: Ship client change; existing users keep data until they use import.  
- **Rollback**: Revert code; user export files remain valid for prior app versions only if version handling is backward compatible—preserve forward-only increases to `schemaVersion` in later changes.

## Open Questions

- Whether to include a **minimum** export of empty-but-valid payload for testing (likely yes in unit tests only).  
- Exact **filename** pattern and whether to include app version string in metadata (optional field in JSON).
