## Why

Users often curate music as **YouTube playlists**. Today Musicboxx only adds **single** YouTube videos from pasted URLs. Supporting **bulk import** from a YouTube playlist URL—while keeping data local and using a **public** API—lets people migrate collections quickly. Persisting the **source YouTube playlist reference** enables future features (refresh, deep links) without re-pasting.

## What Changes

- **No separate control** for “import playlist”: users keep using the **same** add-song / paste-URL flow they use for a single video.
- **Background detection:** after the user submits text in that flow, the system **classifies** the input (YouTube **playlist** URL vs **single video** vs unsupported) **without** asking the user to pick a mode first. When the URL contains a playlist id (e.g. `list=`), the system proceeds toward **playlist import** (Invidious fetch) instead of adding one video and only then offers the **choice** of destination (see below).
- **Fetch** playlist items via the **Invidious** HTTP API at `/api/v1/playlists/<youtube_playlist_id>` with default base URL **`https://inv.nadeko.net`** (override in settings if needed).
- When classification yields a **playlist**, prompt the user to either:
  - **Create a new Musicboxx playlist** populated with the imported songs (name derived from remote metadata when available), **or**
  - **Add all songs** to the **current playlist context** (the playlist the user is adding from—e.g. the open playlist detail view—when that context exists).
- For each imported item, create **normal YouTube song records** (same catalog rules as single-paste: dedupe by video id, metadata resolution as today).
- **Persist** an optional **YouTube playlist reference** (canonical URL and/or playlist id) on the Musicboxx playlist record when import creates or targets a playlist, for future use.

## Capabilities

### New Capabilities

- `youtube-playlist-import`: Background classification of pasted YouTube URLs, Invidious client for `/api/v1/playlists/<id>`, import modes (new playlist vs add to current context playlist), error handling for network/API failures, and persisted **source playlist** reference on the local playlist.

### Modified Capabilities

- `song-catalog`: Extend the **paste URL to add a song** behavior so playlist URLs are detected in the **same** flow and branch to playlist import (no separate entrypoint).
- `playlists`: Extend persisted playlist data with an optional **YouTube playlist source** reference; define **current playlist context** for “add all to existing playlist” when the user is viewing a playlist-scoped add flow.

## Impact

- **`src/`** add-song / URL submission paths (e.g. home, playlist detail, any shared “paste link” component): **branch** on background detection instead of a new overflow menu item.
- **`src/db/`** (Dexie schema): optional field(s) on playlist for YouTube playlist id and/or canonical URL; migration if needed.
- **`src/lib/`** (or similar): Invidious client, YouTube playlist id extraction, integration with existing single-video add pipeline.
- **External dependency**: Default Invidious host **`https://inv.nadeko.net`** must be reachable from the client (CORS); optional **configurable base URL** in settings if the default fails; graceful failure messaging.
- **Specs**: new `youtube-playlist-import` spec; deltas `song-catalog` and `playlists`.
