## Why

Users often want to read lyrics while a track lives in Musicboxx as a YouTube, Spotify, or Apple Music link. Opening **Genius** in a new tab is a lightweight, provider-agnostic complement to “open playback” and needs no OAuth or lyrics scraping—only the song’s **title** and **author** metadata already stored on each record.

## What Changes

- Add a **secondary** action (song detail, and consistently wherever primary “open in provider” exists if applicable) to **open Genius search** in a new tab.
- Build the search query from **`song.title` and `song.author`** only—**no** branching on `provider` or provider-specific ids.
- Always use Genius **search** (`genius.com/search?q=…`) with a **URL-encoded** query string.
- **Normalize** the query by stripping common generic suffixes/patterns from titles and artist fields (e.g. ` - Topic`, `(Official Video)`, `feat.` / `ft.` / `featuring` segments) so search matches real track pages more often.
- Add a small **pure function** module for “Genius search URL from song fields” plus normalization rules (unit-testable, no network).

## Capabilities

### New Capabilities

- `genius-lyrics-search`: Provider-agnostic “open lyrics on Genius” behavior: search URL construction, query normalization rules, and UI affordance(s) with accessible labeling (e.g. opens in new tab).

### Modified Capabilities

- (none) — existing **`song-catalog`** playback and metadata requirements are unchanged; this is an additive sidecar that uses stored title/author only.

## Impact

- **UI**: `SongDetailPage` (and any other surface that exposes “open in provider” for a single song—e.g. library row—if we align with existing patterns).
- **Library code**: New module under `src/lib/` (e.g. `geniusSearch.ts`) for query normalization + `https://genius.com/search?q=…` composition.
- **Data**: No schema migration; uses existing `title` / `author` on `Song`.
- **PWA / SW**: No change unless a new external origin must be documented (optional); link is ordinary `https` navigation.
- **Dependencies**: None.
