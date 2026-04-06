## Context

Musicboxx stores **playlists** and **songs** in **IndexedDB** (Dexie). YouTube songs use `catalogKey` / `videoId` and existing **oEmbed** metadata flows. Users add songs by **pasting a URL** in the existing UI. There is **no** bulk import from YouTube today.

**Constraints:** Client-only app; **no** YouTube Data API keys. **Invidious** exposes public JSON including `GET /api/v1/playlists/:plid` for playlist metadata and listed videos. The **default** instance is **`https://inv.nadeko.net`** (no trailing slash in stored base; requests use `{base}/api/v1/...`). If CORS or availability fails, users may override the base URL in settings.

## Goals / Non-Goals

**Goals:**

- Let users paste a **YouTube playlist URL** into the **same** field/flow as a single video URL; **detect** playlist vs video **in the background** (no separate “import playlist” button or menu item).
- **Fetch** items via Invidious `/api/v1/playlists/<youtube_playlist_id>` and add **each** video as a normal YouTube **song** (reuse existing dedupe and metadata resolution).
- When the URL is a **playlist**, ask whether to **create a new local playlist** (with optional title from API) or **add all tracks** to the **current playlist context** (e.g. user is on that playlist’s detail when pasting).
- Persist a **canonical YouTube playlist reference** (at minimum **playlist id**; optionally **canonical share URL**) on the affected Musicboxx playlist row for future features.

**Non-Goals:**

- **OAuth**, official YouTube APIs, or server-side proxies (unless the project later adds a backend).
- **Syncing** or **refreshing** playlist contents on a schedule (only store reference for future work).
- **Spotify/Apple** playlist import (only YouTube in this change).
- A **dedicated** overflow or toolbar action whose only purpose is playlist import.

## Decisions

1. **Invidious as the catalog source**  
   **Choice:** Use Invidious `GET {base}/api/v1/playlists/{playlistId}` for playlist metadata and video list.  
   **Rationale:** Matches user request; no API key; aligns with “public client-side” patterns.  
   **Alternatives:** RSS/yt-dlp (not viable in-browser); scraping (fragile, disallowed).

2. **Playlist id extraction**  
   **Choice:** Parse standard YouTube playlist URLs (`list=` query param, `/playlist?list=`, embed patterns) and reject ambiguous input with a clear error.  
   **Rationale:** Keeps UX aligned with paste-a-URL elsewhere in the app.

3. **Unified paste flow; background classification**  
   **Choice:** The add-song submission handler **parses** the URL first. If a **playlist id** is present, **do not** run the single-video path only; run playlist detection and (if confirmed playlist import) Invidious fetch. The user never selects “I am pasting a playlist” up front—**classification is automatic** from the URL shape.  
   **Rationale:** Matches “no different button”; one mental model for “paste a YouTube link.”  
   **Alternatives:** Separate menu entry—rejected.

4. **Import target (“current playlist”)**  
   **Choice:** “Add to current playlist” applies when there is an **explicit playlist context** in the UI (e.g. **playlist detail** for playlist **P**). That **P** is the default target for the “add all to existing playlist” option. If there is **no** such context (e.g. paste from a global add surface only), the UI offers **create new playlist** or equivalent—**not** silently picking an arbitrary list.  
   **Rationale:** Replaces the old “overflow row started the flow” model without a dedicated button.

5. **Where to store the YouTube reference**  
   **Choice:** Add optional fields on **`Playlist`**, e.g. `youtubePlaylistId?: string` and `youtubePlaylistUrl?: string` (normalized canonical URL). Set when import completes for the **target** playlist.

6. **Dexie migration**  
   **Choice:** New schema version adding optional indexed fields only if needed for queries; otherwise optional non-indexed fields on `playlists` without new indexes.  
   **Rationale:** Minimal migration surface.

7. **Invidious base URL**  
   **Choice:** Default **`https://inv.nadeko.net`**, plus optional **settings** override when CORS or instance availability fails.  
   **Rationale:** Product-chosen public instance; users can still point elsewhere.

8. **Pagination**  
   **Choice:** If the Invidious response indicates more pages or a continuation, **fetch until** all videos are retrieved or a **reasonable cap** is reached with user-visible messaging.  
   **Rationale:** Large playlists must not silently truncate without notice.

## Risks / Trade-offs

- **[Risk] Invidious instance unavailable or CORS-blocked** → **Mitigation:** Clear error copy; optional user-configurable base URL; document that import depends on third-party availability.
- **[Risk] API shape differs across instances** → **Mitigation:** Target documented Invidious API; defensive parsing; fail with readable errors.
- **[Risk] Rate limits / large playlists** → **Mitigation:** Sequential or batched requests with progress; optional cap with “partial import” warning.
- **[Trade-off] Third-party dependency** → Acceptable for a **local-first** app that already uses public metadata endpoints; **no** user data sent to Invidious beyond the playlist id request.

## Migration Plan

1. Ship Dexie migration adding optional playlist fields.
2. No backfill required for existing playlists.
3. Rollback: revert app version; older clients ignore unknown fields if present (forward-compatible JSON); if downgrade removes fields, data loss only for new fields (acceptable for optional metadata).

## Open Questions

- Whether **“new playlist”** should inherit **parent** from the current navigation context (nested folders)—deferred unless product wants parity with nested create.
