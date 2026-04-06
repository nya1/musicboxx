## Context

Musicboxx stores songs in **IndexedDB** via **Dexie** (`db.songs`). The **home** route (`/`) renders **`LibraryPage`**, which today loads all songs ordered by `createdAt` and lists them. There is no query UI. The **`Song`** model includes text fields suitable for retrieval: `title`, `author`, `primaryArtist`, `albumTitle`, and stable `id` for joining results back to rows.

## Goals / Non-Goals

**Goals:**

- BM25-based (Okapi-style) **full-text search** over the user’s **local** song corpus using a **maintained npm package** (no custom inverted-index implementation).
- A **search input on the Library home** that filters or ranks the visible list by relevance to the query.
- **Rebuild or update** the in-memory search index when the song set changes (add/update/delete) so results stay consistent offline.
- **Accessible** control (label, keyboard, clear affordance) consistent with existing app patterns.

**Non-Goals:**

- Server-side search, sync, or cloud index.
- Searching lyrics or external APIs (see separate `genius-lyrics-search`); this change is **catalog-only**.
- Fuzzy typo tolerance beyond what the chosen library provides (no separate spell-check pipeline).

## Decisions

1. **Search library (npm)**  
   - **Choice**: Use **[Lunr](https://www.npmjs.com/package/lunr)** (`lunr`) for full-text search with **BM25** relevance as implemented by the library.  
   - **Rationale**: Lunr is a standard in-browser FTS option with documented BM25 scoring; fits “BM25 over internal songs” without hand-rolling tokenization/scoring.  
   - **Alternatives**: **Minisearch** — smaller bundle and good DX, but scoring is BM25-*like* rather than Lunr’s established BM25 pipeline; acceptable if bundle size becomes a problem later. **FlexSearch** — different relevance model; not the default pick for BM25-by-name.

2. **Indexed fields**  
   - **Choice**: Build one searchable document per song combining **title**, **author**, **primaryArtist**, and **albumTitle** (omit ids/URLs/thumbnails from the indexed text; keep **song `id`** as the Lunr document ref for lookup).  
   - **Rationale**: Matches user mental model (“artist”, “album”, “track name”) and existing persisted metadata.

3. **Index lifecycle**  
   - **Choice**: Maintain a **Lunr index in memory** (or behind a small module) built from `db.songs.toArray()`; **rebuild** when the library page’s data subscription detects changes (Dexie `useLiveQuery` / dependency on song list). For typical library sizes this is simpler than incremental Lunr updates and keeps correctness obvious.  
   - **Rationale**: Predictable behavior; if rebuild cost becomes visible, optimize later with incremental `Index` updates per the Lunr API.

4. **UI placement**  
   - **Choice**: Add the search field **above the “Library” heading or directly under the page chrome** on **`LibraryPage` only** (index route), full width within `app-main` padding, matching existing input/button styles in `index.css`.  
   - **Rationale**: User asked for home-only; keeps playlists and other routes unchanged.

5. **Empty query behavior**  
   - **Choice**: When the query is empty (or whitespace-only), show the **full list** in existing **newest-first** order (current behavior).  
   - **Rationale**: Familiar default; search is optional.

## Risks / Trade-offs

- **[Risk] Lunr bundle size** → Mitigation: import only what is needed; measure with `pnpm run build`; if unacceptable, revisit Minisearch with an explicit product note on scoring.  
- **[Risk] Rebuild cost on large libraries** → Mitigation: rebuild is async; show list from Dexie immediately and apply ranking when the index is ready; consider debouncing the search input.  
- **[Risk] Tokenization/stopwords** → Mitigation: rely on Lunr’s English pipeline for v1; document non-English limitations under Open Questions.

## Migration Plan

- **Deploy**: No data migration; new dependency + UI. Users get search immediately after update.  
- **Rollback**: Revert dependency and `LibraryPage` changes; IndexedDB unchanged.

## Open Questions

- Whether to show a “no matches” empty state copy distinct from “no songs yet” (likely yes for clarity).  
- Whether non-English catalogs need a different tokenizer in a later iteration.
