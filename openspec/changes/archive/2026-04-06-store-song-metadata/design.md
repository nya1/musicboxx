## Context

Musicboxx persists songs in **IndexedDB** via **Dexie** (`Song` in `src/db/index.ts`). Rows already include `title`, optional `author` (YouTube channel / Spotify “author” / Apple artist), `thumbnailUrl`, and provider ids. Public metadata today is **minimal** (oEmbed, iTunes lookup): enough for lists and thumbnails, but not a consistent **structured** snapshot (album, duration, ISRC, normalized artist string) for future features like **lyrics search** or richer browsing.

**Constraints:** client-only app, **no OAuth** and no streaming API keys for catalog features; only **public** endpoints as today. User explicitly scoped **no migration**: ship a new Dexie schema version and assume **fresh PWA installs** (no upgrade path for existing DBs).

## Goals / Non-Goals

**Goals:**

- Extend the **persisted `Song` model** with **optional** structured fields: at minimum a **normalized primary artist** string, plus provider-available fields such as **album name**, **duration**, **ISRC**, and **release year** when public APIs return them.
- **Populate** those fields during the same metadata fetch paths used when adding a song (YouTube oEmbed, Spotify oEmbed, Apple iTunes lookup), without new proprietary APIs.
- Add **Dexie indexes** on fields needed for future **local** search/filter (e.g. primary artist, title—align with existing `catalogKey` / `createdAt` patterns).
- Keep **current UI** working from `title` / `author` / thumbnails; extended fields are **persistence-first** (surfacing in UI can be a follow-up).

**Non-Goals:**

- **Data migration** from older DB versions (explicitly out of scope).
- **Lyrics fetching or search UI** in this change (only the **metadata foundation**).
- **Background refresh** jobs or periodic re-fetch of metadata (optional future work).
- **Guaranteeing** ISRC/album on every track—many responses will omit fields; persistence MUST tolerate gaps.

## Decisions

1. **Single table, extended `Song` type**  
   **Choice:** Add optional columns on the existing `songs` store rather than a separate `song_metadata` table.  
   **Rationale:** One row per catalog item keeps joins and deduplication simple; Dexie upgrades are already versioned on `MusicboxxDB`.  
   **Alternative:** Separate table keyed by `songId`—rejected for this phase as unnecessary complexity for 1:1 data.

2. **Field naming and overlap with `author`**  
   **Choice:** Introduce a explicit **`primaryArtist`** (or similarly named) field for **normalized** “performer for search,” while retaining **`author`** for backward-compatible display strings from oEmbed. Population logic MAY set both from the same API response when appropriate (e.g. Spotify `author_name` → `author` and `primaryArtist`).  
   **Rationale:** Clear separation between “what the embed said” and “canonical string for future search” without a breaking rename of `author`.  
   **Alternative:** Rename `author` only—rejected due to ripple through UI and specs without user benefit in this slice.

3. **Apple Music / iTunes lookup as enrichment**  
   **Choice:** Extend `fetchAppleMusicMetadata` (or a thin wrapper) to return extra fields already present in the lookup JSON (`collectionName`, `trackTimeMillis`, `isrc`, `releaseDate` / year) and map into `Song`.  
   **Rationale:** Same public endpoint already used; no new dependencies.

4. **YouTube / Spotify enrichment**  
   **Choice:** YouTube oEmbed provides limited fields—persist **`primaryArtist`** from `author_name` when present; leave album/ISRC unset unless a future source adds them. Spotify oEmbed may remain thin; if duration/ISRC are unavailable from public oEmbed, store **only** what is returned (title/author/thumbnail). Optional: document that **Spotify** extended fields may stay sparse until a future enhancement.  
   **Rationale:** Avoid scraping or private APIs; stay within current product constraints.

5. **Dexie indexes**  
   **Choice:** Add indexed fields for **`primaryArtist`** and ensure **`title`** remains queryable (add explicit index if not already covered for substring-free equality queries). Exact index set to be implemented per Dexie query needs; minimum: `primaryArtist`, `title` for future `where()` filters.  
   **Rationale:** Enables efficient local search later without full table scans.

6. **Schema version**  
   **Choice:** Bump Dexie version with new indexes and new optional properties; **no** `upgrade` migration that copies old rows—user accepts **empty DB** for existing dev profiles or manual clear. Document in tasks for implementers.

## Risks / Trade-offs

- **[Risk] Sparse metadata** — Many songs will lack ISRC/album, especially YouTube.  
  **Mitigation:** All new fields optional; features like lyrics MUST handle missing ISRC by falling back to artist+title matching.

- **[Risk] iTunes lookup id mismatch** — Rare edge cases where Apple Music web id does not match iTunes catalog.  
  **Mitigation:** Keep existing fallback titles; extended fields remain empty on lookup failure.

- **[Risk] Duplicate “artist” strings** — `author` vs `primaryArtist` could diverge if we change normalization later.  
  **Mitigation:** Single mapping function at write time; document normalization rules in code and spec.

- **[Trade-off] No migration** — Developers with old IndexedDB lose data on version bump unless they clear manually.  
  **Mitigation:** Acceptable per user request; call out in implementation notes.

## Migration Plan

**Not applicable** for end users: assume **fresh PWA** and **no** migration. For local development, developers may need to **clear site data** or bump with a dev-only reset once the new version ships.

## Open Questions

- Whether to add a **`metadataFetchedAt`** timestamp later for refresh workflows (deferred).
- Whether **Spotify** should get a second public source for duration/ISRC in a future change (out of scope here).
