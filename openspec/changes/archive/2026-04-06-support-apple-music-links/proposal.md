## Why

Many listeners discover and share tracks via **Apple Music** (web links from `music.apple.com`, in-app shares, and messages). Musicboxx that only accepts **YouTube** and **Spotify** forces those users to re-find the same title elsewhere. Supporting Apple Music **track** links alongside existing providers keeps one local library aligned with how people actually share music.

## What Changes

- **Parse** common **Apple Music** link shapes (e.g. `music.apple.com` song URLs, album URLs with an `i=` track query parameter) and derive a **canonical Apple Music track identifier** for storage and deduplication.
- **Persist** Apple Music–backed entries in the local catalog with **metadata** where possible using **client-side, public** requests only (no Apple Music API keys or OAuth in the app), with clear fallbacks when metadata is unavailable.
- **Playback / open**: primary action opens the track in **Apple Music** (web or app) externally, consistent with the rule that playback is **not** in-app.
- **UI copy and validation**: add-song and share flows accept Apple Music **track** URLs together with existing supported providers; show clear errors when the payload matches none of them.
- **Web Share Target**: shared payloads that contain a supported Apple Music track link follow the **same** add-song rules as paste (validation, dedupe, default playlist), aligned with existing share-target behavior.
- **Data model**: extend the **multi-provider** catalog to include **Apple Music** (e.g. `provider: 'apple-music'` and a stable track id field). Assume a **fresh PWA** for every user—**no migration** from prior schemas or providers; greenfield schema only.

## Capabilities

### New Capabilities

- `apple-music-links`: Apple Music URL parsing, canonical track id extraction, open-in–Apple Music behavior, metadata/thumbnail strategy without private API keys, and deduplication rules for Apple Music track ids.

### Modified Capabilities

- `song-catalog`: Requirements that the catalog supports **YouTube**, **Spotify**, and **Apple Music** inputs (paste and share), unified persistence, list/detail behavior for Apple Music thumbnails and external open targets, and deduplication per provider id.
- `web-share-target`: Scenarios updated so a supported **Apple Music** track link in `url` or `text` is processed like other supported links (same pipeline outcomes; validation errors when no supported provider is present).

## Impact

- **`src/db/`**: Dexie schema and `Song` type extended for an Apple Music provider and id fields (greenfield assumption—no migration path from older layouts).
- **`src/lib/`**: New parsing module for Apple Music (and integration with a shared “paste/share resolution” layer used by Add + Share Target).
- **`src/pages/`**: `AddSongPage`, `ShareTargetPage`, `SongDetailPage`, library list components—labels, thumbnails, and primary “open” actions for Apple Music.
- **No backend** or **Apple Music developer tokens** in the client for authenticated catalog APIs; metadata must use **public** patterns only, consistent with AGENTS.md.
- **Manifest / share target**: behavior change is in the handler; manifest may still accept arbitrary URLs/text as today.
