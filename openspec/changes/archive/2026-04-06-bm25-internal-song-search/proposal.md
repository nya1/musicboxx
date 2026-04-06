## Why

Users with larger libraries need to find saved tracks quickly by title, artist, or other stored text without scanning the full list. Keyword relevance ranking (BM25) over locally persisted songs matches how people search for music and scales better than substring-only filters as the catalog grows.

## What Changes

- Add client-side **BM25-style full-text search** over the user’s **IndexedDB** song records (fields such as title, author, and other persisted text per `song-metadata` where useful for matching).
- Surface a **search input on the home screen** (the `/` **Library** route) so queries filter or reorder the visible song list by relevance.
- Add an **npm dependency** that implements BM25 (or equivalent Okapi BM25) text retrieval suitable for in-browser bundling (no server).
- Keep search **fully local**: no network calls for ranking; rebuild or update the search index when songs change.

## Capabilities

### New Capabilities

- `song-search`: Full-text search over local songs using BM25 (via a chosen npm library), index lifecycle (load/rebuild on catalog changes), and the Library home UI (search field + ranked or filtered list behavior).

### Modified Capabilities

None — search is additive; no existing spec requirements are superseded.

## Impact

- **UI**: `LibraryPage` (home) and related styles for the search control and list state.
- **Data**: Song reads for indexing; possible small `lib/` module wrapping the search index and Dexie hooks or effects on song mutations.
- **Dependencies**: One new npm package for BM25-capable search (exact package chosen in `design.md`).
- **Tests**: Unit tests for index build/query and, if practical, a flow test for typing a query on the home screen.
