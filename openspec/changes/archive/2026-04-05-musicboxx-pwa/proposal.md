## Why

Saving YouTube music links is scattered across notes, chats, and browser bookmarks, with no simple way to group them or see them at a glance. Musicboxx is a **local-first PWA** that stores pasted YouTube URLs, shows **static video thumbnails** as covers, and organizes items into **playlists** starting with a built-in **Favorites** list—without building or maintaining an in-app audio/video player.

## What Changes

- Introduce a **responsive mobile-first PWA** named **Musicboxx** for storing and organizing liked YouTube videos as “songs.”
- **Paste a YouTube URL** to add a song (no in-app YouTube search in v1).
- **Resolve metadata** (title, etc.) client-side where possible; use **static thumbnail URLs** derived from the video ID for cover art.
- **Persist all data locally** in the browser (no accounts, no backend for core storage).
- **Seed a default playlist** named **Favorites** on first use; **new songs** are added there by default; users can **create additional playlists** and organize songs.
- **No embedded player**; primary action is **open the link** in YouTube (or system browser).
- **Minimalist, Vercel-like UI**: neutral palette, typography-led hierarchy, restrained chrome, light/dark support as specified in design.

## Capabilities

### New Capabilities

- `song-catalog`: Paste YouTube URLs, parse video IDs (common URL shapes), fetch/display title and related metadata, static thumbnails, duplicate handling, “open in YouTube,” local persistence of song records.
- `playlists`: Default **Favorites** playlist created on first launch; user-created playlists; add/remove songs to playlists; rules for default placement and optional multi-playlist membership as specified in spec.
- `pwa-shell`: Web app manifest, icons, service worker for installability and basic offline shell; mobile-first responsive layout; accessibility baseline for core flows.

### Modified Capabilities

- *(none — greenfield project; no existing `openspec/specs/` capabilities.)*

## Impact

- **New** front-end application (framework TBD in design) and **client-side storage** (e.g. IndexedDB).
- **No server** required for v1 core flows; optional future sync would be a separate change.
- **External dependency**: YouTube oEmbed or equivalent client-accessible metadata (subject to CORS/availability); thumbnails via documented `img.youtube.com` patterns with fallbacks.
