## 1. Data model and settings

- [x] 1.1 Extend `Playlist` in `src/db/index.ts` with optional `youtubePlaylistId` and `youtubePlaylistUrl` (or single structured field); add Dexie schema version and migration.
- [x] 1.2 Add app setting key for optional Invidious base URL override; default constant **`https://inv.nadeko.net`** in code when unset; wired for read/write where other settings live.

## 2. YouTube playlist URL and Invidious client

- [x] 2.1 Implement playlist id extraction from pasted text/URLs (including `list=` and common variants); integrate with existing URL parsing so single-video and playlist paths share one entry.
- [x] 2.2 Implement `fetchInvidiousPlaylist(baseUrl, playlistId)` calling `GET {base}/api/v1/playlists/{id}`; parse video ids; handle pagination/continuation per API if present; surface network/API errors.
- [x] 2.3 Add unit tests for URL parsing and response parsing (fixtures/mocks).

## 3. Import orchestration

- [x] 3.1 In the **shared add-song submit path**, branch **after** background detection: playlist id present → fetch Invidious → show choice UI (**new playlist** vs **add to context playlist** when context exists).
- [x] 3.2 Resolve **playlist context** from the active route/surface (e.g. playlist detail) for the “add to existing” option; if no context, only offer **create new playlist** (or equivalent).
- [x] 3.3 For each video id, reuse existing “add YouTube song” / catalog logic (dedupe, metadata, playlist membership per mode).
- [x] 3.4 On success, persist YouTube playlist reference on the target Musicboxx playlist; set new playlist name from Invidious title when creating new playlist.
- [x] 3.5 Handle edge cases: empty playlist, all duplicates, partial failures (define behavior and user messaging).

## 4. UI integration (no separate import control)

- [x] 4.1 Wire background detection into **existing** add-URL UI (no new overflow item for playlist-only import); show loading/progress while classifying and fetching.
- [x] 4.2 Modal or inline steps: after playlist fetch, mode choice and progress for long imports.
- [x] 4.3 Optional: settings UI for Invidious base URL with validation and help text.

## 5. Verification

- [x] 5.1 Run `pnpm run test`, `pnpm run build`, and `pnpm run lint`.
- [x] 5.2 Add or extend E2E coverage for paste playlist URL in add flow and validation path (mock network if needed).
