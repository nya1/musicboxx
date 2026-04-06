## Why

Users accumulate songs and playlists only in this browser’s IndexedDB; without export/import they cannot move libraries between devices, back up before clearing site data, or recover after data loss. The Settings page already reserved space for this capability—implementing it closes a major gap in local-first trust and portability.

## What Changes

- Add **export** of the full local database (songs, playlists, playlist–song links, app settings) to a **downloadable file** from Settings, using a **versioned JSON** (or equivalent) payload the app can validate.
- Add **import** from a user-selected file: parse and validate the payload, then apply data to IndexedDB with a clear **merge vs replace** rule (or single supported mode documented in design).
- Replace the **disabled** “Export or import data…” placeholder on **Settings → Library data** with working controls, labels, and basic feedback (success, parse errors, destructive confirmation when replacing data).
- Keep all processing **client-side** (no upload to a server); no new network dependencies for the feature itself.

## Capabilities

### New Capabilities

- `local-database-export-import`: Definition of the export file format (schema version, contained tables), validation rules, import application order (respecting foreign keys and system playlists), and user-visible error handling.

### Modified Capabilities

- `app-settings`: The **Library data** section SHALL describe and offer **working** local export and import actions (not “planned only”); scenarios for offline availability and section structure SHALL be updated accordingly.

## Impact

- **`src/db/`**: Serialization helpers, import transaction(s), possible Dexie bulk APIs; must preserve invariants (e.g. Favorites system playlist, `catalogKey` uniqueness, playlist parent rules).
- **`src/pages/SettingsPage.tsx`** (and small components or hooks as needed): Enabled actions, file input, download trigger, confirmations, accessible labels.
- **Tests**: Unit tests for export/import logic and/or Settings flows; edge cases for corrupt or wrong-version files.
- **Published spec**: `openspec/specs/app-settings/spec.md` updated after implementation via archive workflow; new capability spec for `local-database-export-import`.
