## Context

The **current codebase** stores songs in a YouTube-centric shape; this change is specified as if the catalog is designed **greenfield**: **no migration** from legacy rows and **no** requirement to preserve an older IndexedDB layout. The target design stores **YouTube** and **Spotify** tracks in one local library with a **provider** field and appropriate ids. The product has **no in-app player**; playback remains **external** (YouTube or Spotify). Spotify shares require parsing, **canonical track identifiers**, **public** metadata (no Spotify OAuth in the client), and **opening Spotify** for playback.

## Goals / Non-Goals

**Goals:**

- Accept **Spotify track** links (and optionally `spotify:` URIs) in the same **paste** and **Web Share Target** flows as YouTube.
- Persist a **mixed** library with **deduplication** per logical track (Spotify track id vs YouTube video id).
- Resolve **title** (and optional **artist**) for Spotify via a **documented public** client-side request (Spotify **oEmbed**).
- Show **cover art** for Spotify entries when oEmbed provides a thumbnail URL; otherwise fall back to the existing placeholder behavior.
- **Open** Spotify tracks in an **external** context (browser or app), parallel to “Open in YouTube.”

**Non-Goals:**

- In-app playback of Spotify or YouTube audio/video.
- Spotify **album** or **playlist** URLs as first-class multi-track imports (may be future work); initial scope is **single track** unless implementation reuses the same id extraction trivially.
- Server-side APIs, OAuth, or **Spotify Web API** with client secrets.
- Replacing YouTube as the primary provider or **merging** the same musical work across Spotify and YouTube automatically.

## Decisions

1. **Song model: provider + stable ids**  
   **Decision:** Introduce an explicit **`provider`** (`'youtube' | 'spotify'`) and provider-specific id fields (e.g. `videoId` for YouTube; `spotifyTrackId` or a generic `externalId` paired with `provider`). **Rationale:** Clear indexing for dedupe and UI branching; avoids overloading `videoId` with non-YouTube values. **Alternatives considered:** Separate tables per provider (more joins); encode provider in a single string id (harder to query and validate).

2. **Greenfield IndexedDB schema**  
   **Decision:** Define the initial (or replacement) Dexie schema with `provider` and indexes needed for both providers. **Do not** plan **backfill** or **versioned migration** from a prior YouTube-only database—assume deploys target **empty** or **throwaway** local data. **Rationale:** Matches the user’s constraint; keeps implementation simple.

3. **Spotify URL parsing**  
   **Decision:** Support `https://open.spotify.com/track/{id}` (with optional locale/query segments) and `spotify:track:{id}`. **Rationale:** Covers typical shares. **Alternatives:** Regex-only vs `URL` parsing—prefer `URL` + path segments for clarity.

4. **Metadata for Spotify**  
   **Decision:** Use **`https://open.spotify.com/oembed?url={encodedTrackUrl}`** (GET, no auth) for title and thumbnail. **Rationale:** Documented public endpoint, aligns with YouTube oEmbed usage. **Alternatives:** Open Graph scraping (fragile); Web API (requires OAuth).

5. **Thumbnail for Spotify**  
   **Decision:** Use **oEmbed `thumbnail_url`** when present; otherwise same **placeholder** path as failed YouTube thumbnails. **Rationale:** Single fallback pattern in UI.

6. **API surface**  
   **Decision:** Generalize add flow to something like **`addSongFromUrl`** or **`addSongFromParsed(ParsedMusicRef)`** used by both pages; keep thin wrappers if needed for tests. **Rationale:** One validation and persistence path for paste and share.

7. **Share target**  
   **Decision:** Extend **`parseYouTubeVideoIdFromSharePayload`** into a **multi-provider** resolver (or add a parallel Spotify parser and try both) so the first matching supported link wins. **Rationale:** Same behavior as manual paste; minimal manifest change.

8. **UI copy**  
   **Decision:** Replace YouTube-only strings with **neutral** labels where shared (“Paste a **YouTube or Spotify** track link”) and **per-song** actions (“Open in YouTube” vs “Open in Spotify”). **Rationale:** Honest UX for a mixed library.

## Risks / Trade-offs

- **[Risk] oEmbed rate limits or CORS** → Spotify oEmbed is widely used from browsers; if blocked, **Mitigation:** fall back to generic title (“Spotify track”) and placeholder art, same as failed YouTube metadata.
- **[Risk] Spotify link shapes outside track** (album, playlist) → **Mitigation:** validation error with clear message; scope stays **track** unless spec expanded.
- **[Trade-off]** No cross-service **entity resolution**—the same song may exist as both a YouTube and Spotify row; users accept duplicates manually.

## Migration Plan

**Not applicable.** This change assumes **no** existing production IndexedDB data to migrate. If the app ships before real users rely on persistence, clearing the database or bumping the **database name** to reset local state is acceptable when introducing the new schema.

## Open Questions

- Whether to support **Spotify short links** or redirects (`spotify.link`)—resolve if feasible with a **HEAD** or single **fetch** without bloating the client; otherwise document as unsupported.
- Exact **button labels** on list vs detail for consistency with the minimal UI style guide.
