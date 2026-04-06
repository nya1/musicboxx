## Why

Many people save and share music via **Spotify** (open links, `spotify:` URIs, in-app shares). Musicboxx today only accepts **YouTube** URLs, so those links are rejected or ignored. Supporting Spotify alongside YouTube lets users keep one local library without manually re-finding tracks on YouTube.

## What Changes

- **Parse** common Spotify link shapes (e.g. `open.spotify.com` track URLs, optional `spotify:track:` URIs) and derive a **canonical track identifier** for storage and deduplication.
- **Persist** Spotify-backed entries in the local catalog with **metadata** where possible (client-side fetch such as Spotify’s public oEmbed or equivalent), with sensible fallbacks when metadata is unavailable.
- **Playback / open**: primary action opens the track in **Spotify** (web or app), consistent with the product rule that playback is **external** (no in-app media player).
- **UI copy and validation**: “Add song” and share flows accept Spotify as well as YouTube; clear errors when the pasted or shared text is neither.
- **Web Share Target**: shared payloads that contain a supported Spotify link follow the **same** add-song rules as paste (validation, dedupe, default playlist), aligned with existing share-target behavior for YouTube.
- **Data model**: define the song record **from scratch** for a **multi-provider** catalog (e.g. `provider` plus provider-specific id fields). Assume **no existing user data** and **no migration** from a prior YouTube-only schema—implementation may replace the current `Song` shape outright.

## Capabilities

### New Capabilities

- `spotify-links`: Spotify URL and URI parsing, canonical id, open-in-Spotify behavior, metadata/thumbnail strategy for Spotify entries, and deduplication rules for Spotify track ids.

### Modified Capabilities

- `song-catalog`: Requirements that the catalog supports **both** YouTube and Spotify inputs (paste and share), unified persistence, list/detail behavior for non-YouTube thumbnails and “open externally” targets, and deduplication per provider id.
- `web-share-target`: Scenarios updated so a supported **Spotify** link in `url` or `text` is processed like a supported YouTube link (same pipeline outcomes; validation errors when neither is present).

## Impact

- **`src/db/`**: Dexie schema and `Song` type authored for YouTube + Spotify from the start; `addSongFromVideoId`-style APIs may be replaced or generalized (e.g. `addSongFromParsed`).
- **`src/lib/`**: New parsing module for Spotify (and possibly a small shared “paste/share resolution” layer used by Add + Share Target).
- **`src/pages/`**: `AddSongPage`, `ShareTargetPage`, `SongDetailPage`, library list components—labels, thumbnails, and primary “open” actions per provider.
- **No backend or API keys** in the client for Spotify **OAuth**; metadata must use **public** endpoints only (oEmbed/embed patterns), consistent with AGENTS.md.
- **Manifest / share target**: likely unchanged if the share target already accepts arbitrary URLs/text; behavior change is in the handler, not necessarily the manifest.
