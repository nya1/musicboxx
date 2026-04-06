## Context

Musicboxx stores **songs**, **playlists**, **playlist–song links**, and **app settings** (e.g. default playlist id) in **IndexedDB** via **Dexie**. **Theme** preference lives in **localStorage** (`musicboxx-theme`), not in the library tables. **Favorites** is a system playlist seeded by **`bootstrapDb()`** when the playlist table is empty; **`bootstrapDb()`** also ensures **`defaultPlaylistId`** exists in **`settings`**.

Today, Settings exposes **export** and **import** (`local-database-export-import`); there is no user-facing **reset/clear** path.

## Goals / Non-Goals

**Goals:**

- Provide a **destructive but intentional** reset: empty user library data and return to a **known-good** empty library (Favorites + valid defaults), in one coherent operation.
- **Confirm** before any write that wipes data: user must **type `delete`** in a dedicated textbox so accidental taps cannot complete the action (stronger than import’s button-only confirm).
- **Single transaction** (or equivalent) so a failed mid-clear does not leave an undefined mix of old/new rows.
- **Offline-capable**; **no** remote calls for the clear itself.
- **Observable** success or failure in the UI.

**Non-Goals:**

- Clearing **theme** or other **non-IndexedDB** preferences (unless product later expands “reset app” scope).
- Selective deletion (single playlist only, “clear songs but keep playlists”) — out of scope unless specified later.
- Server-side backup or sync.

## Decisions

1. **Data path: clear library tables, then re-seed invariants**  
   **Rationale:** Matches **`bootstrapDb()`** and post-import expectations: after reset, **Favorites** exists, **default playlist** points at Favorites, no orphan **`playlistSongs`**.  
   **Alternatives:** `db.delete()` / reopen — heavier, worse UX and more risk with SW/PWA; **rejected** unless we discover Dexie edge cases.

2. **Implementation shape: `clearLibraryData()` (or similar) in `src/db/`**  
   Inside a **`rw`** transaction on **`songs`**, **`playlists`**, **`playlistSongs`**, **`settings`**: clear user-data tables, then call **`bootstrapDb(db)`** (or inline the same seeding inside the transaction if Dexie requires it — prefer one transaction if possible).  
   **Rationale:** Centralizes rules; Settings only triggers the operation and shows outcomes.

3. **UI: destructive control in Settings → Library data**  
   Label along the lines of **Clear local library** or **Reset library data**, with a **modal** (reuse import’s **`Modal`**). Inside the modal: explanatory copy, a **text input** whose **trimmed** value MUST equal **`delete`** (all lowercase) before the destructive submit control is enabled, and **Cancel**. Copy SHALL state that **songs and playlists** (except the restocked system playlist) are removed.

4. **In-memory caches / search index**  
   If the app holds derived state (e.g. search index), reset MUST **invalidate or rebuild** it after a successful clear so Library/Playlists views do not show stale data. **Rationale:** Avoids ghost entries without full reload.

## Risks / Trade-offs

- **[Risk] User mis-taps and wipes data** → **Mitigation:** Required **type `delete`** gate plus modal copy; destructive button stays disabled until the input matches.  
- **[Risk] Transaction failure mid-clear** → **Mitigation:** Dexie transaction rollback leaves prior state; surface error.  
- **[Risk] Stale React/query caches** → **Mitigation:** Document explicit refresh hooks (subscriptions, context, or `window.location.reload()` only if unavoidable — prefer targeted invalidation).

## Migration Plan

No server migration. Ship with the feature flag-free app update; first use runs against existing DB.

## Open Questions

- None for confirmation UX: **modal + type `delete`** is specified above.
