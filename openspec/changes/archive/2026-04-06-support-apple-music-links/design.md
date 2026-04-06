## Context

Musicboxx is a **local-first PWA** with a **multi-provider** song catalog (YouTube and Spotify are already specified). This change adds **Apple Music** track links so paste and Web Share Target flows can save items shared from the Apple Music app or web. Playback stays **external** (no in-app player). The user asked to assume a **fresh PWA** for every user: **no migration** from earlier IndexedDB layouts or single-provider schemas—implementation targets a **greenfield** `Song` shape that includes Apple Music from the start.

## Goals / Non-Goals

**Goals:**

- Accept **Apple Music track** URLs in the same **paste** and **Web Share Target** flows as other providers.
- Extract a **stable Apple Music track id** for deduplication and persistence.
- Resolve **title** (and optionally **artist**) using **only public, unauthenticated** client-side requests—no Apple Music developer token or MusicKit **user** auth in the app.
- Show **cover art** when a public metadata response exposes a usable image URL; otherwise use the same placeholder behavior as other providers.
- **Open** Apple Music entries in an **external** browser/app context using a **canonical** `music.apple.com` URL.

**Non-Goals:**

- In-app playback of Apple Music content.
- Importing **albums** or **playlists** as multiple tracks in one step (future work); initial scope is **single track** URLs that yield one track id.
- **Apple Music API** (`api.music.apple.com`) with developer keys, user tokens, or server proxies.
- **Migrating** existing user databases from older app versions.

## Decisions

1. **Song model: add Apple Music provider**  
   **Decision:** Extend the greenfield model with `provider: 'apple-music'` (or equivalent string) and an **`appleMusicTrackId`** (or generic `externalId` scoped by provider) plus optional **stored open URL** for exact storefront/locale preservation. **Rationale:** Matches existing YouTube/Spotify split; dedupe and UI branching stay explicit. **Alternatives:** Encode everything in one opaque string (harder to validate and index).

2. **No migration**  
   **Decision:** Ship a Dexie schema that assumes **empty** local data or a **reset** acceptable for early adopters; do not author upgrade steps from legacy YouTube-only stores. **Rationale:** User constraint; reduces implementation risk.

3. **Apple Music URL parsing**  
   **Decision:** Support `https://music.apple.com/...` **song** pages where the **track id** appears as the **last path segment** (numeric id), and **album** pages where the track is selected via the **`i`** query parameter (Apple’s standard pattern). Normalize host (ignore `www.`). **Rationale:** Matches common shares. **Alternatives:** Follow redirects from short links—only if a single `fetch` without a backend is reliable; otherwise document unsupported.

4. **Metadata without OAuth**  
   **Decision:** Use whichever **documented public** JSON or embed-style endpoint the implementation can call from the browser **without** API keys (candidates include **iTunes Lookup** / Search where the extracted id maps to catalog results; if CORS or id mismatch prevents use, fall back to title placeholder only). **Rationale:** Aligns with AGENTS.md (no secrets on the client). **Alternatives:** Apple Music authenticated API—rejected.

5. **Thumbnails**  
   **Decision:** When metadata returns an **artwork or thumbnail URL**, use it like Spotify’s oEmbed thumbnail; on miss or load failure, use the **same** bundled/neutral placeholder as other providers.

6. **API surface**  
   **Decision:** Extend the unified **`addSongFromUrl`** / **`ParsedMusicRef`** path so Apple Music is tried alongside YouTube and Spotify in one validation and persistence pipeline.

7. **UI copy**  
   **Decision:** Neutral add-song hints (“supported music link”) or explicitly list **YouTube, Spotify, Apple Music** where space allows; per-row actions **“Open in Apple Music”** when `provider` is Apple Music.

## Risks / Trade-offs

- **[Risk] No first-party Apple Music oEmbed** → Public metadata may be **weaker** than Spotify’s oEmbed. **Mitigation:** Persist with fallback labels and optional later refresh; keep UX honest.
- **[Risk] CORS or id mismatch** for iTunes Lookup vs Music URL ids → **Mitigation:** Fallback title only; still store track id and open URL.
- **[Risk] Regional URLs** → Store **user-provided** or normalized URL for “open” so the correct storefront is preserved when possible.
- **[Trade-off]** The same recording may appear as separate rows across YouTube, Spotify, and Apple Music—no automatic merging.

## Migration Plan

**Not applicable.** Assume **fresh installs** or acceptable **local data reset** when introducing or extending the multi-provider schema.

## Open Questions

- Whether **short redirect** hosts (if any) should be resolved with a **single** `fetch` + `Location` follow without a backend; if not feasible, document as unsupported.
- Exact **fallback strings** and whether to show **truncated track id** in the UI for failed metadata (match Spotify/YouTube patterns).
