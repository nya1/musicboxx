## Context

Musicboxx is a **greenfield** client-only PWA. There is no existing app in the repo yet. The product stores **YouTube links** as catalog items (“songs”), shows **static thumbnails**, and organizes them into **playlists** with a seeded **Favorites** list. Users **paste URLs** (no YouTube Data API / search). Data **never leaves the device** in v1.

## Goals / Non-Goals

**Goals:**

- Ship an **installable**, **mobile-first** PWA with a **minimalist, Vercel-like** visual language (neutral surfaces, typography hierarchy, restrained borders and motion).
- **Reliably parse** common YouTube URL forms into a **stable video ID**.
- **Resolve title** (and optional channel) for display without a custom backend; **derive thumbnail URLs** from the video ID.
- **Persist** songs and playlists in **browser local storage** with a clear schema and migration/versioning strategy for the DB.
- **Open videos in YouTube** (new tab / external) as the primary playback path.

**Non-Goals:**

- In-app **audio/video playback**, background playback, or media session APIs.
- **YouTube search** or server-side API proxy for search.
- **User accounts**, cloud sync, or multi-device merge.
- **Import/export** (unless added later as a small follow-up).
- **Desktop-class** power features (bulk edit, keyboard-first power UX) beyond reasonable defaults.

## Decisions

1. **App stack — Vite + React + TypeScript**  
   - **Rationale**: Fast dev UX, straightforward static hosting (e.g. Vercel), excellent PWA plugin ecosystem.  
   - **Alternatives**: Next.js (heavier for a purely static client); SvelteKit (fine, fewer default conventions in many teams).  

2. **Local persistence — IndexedDB**  
   - **Rationale**: Scales beyond `localStorage` for many rows; supports structured queries for playlists and membership.  
   - **Alternatives**: `localStorage` + JSON (simple but awkward for relations); SQLite WASM (powerful but heavier).  

3. **Schema — normalized songs + playlists + join table**  
   - **Rationale**: Supports **many-to-many** (same song in Favorites and a user playlist). On add, the app **ensures** membership in **Favorites** while allowing additional playlist links.  
   - **Alternatives**: Single playlist per song (simpler, worse UX); embed playlist IDs on song (harder to maintain invariants).  

4. **YouTube metadata — client `fetch` to YouTube oEmbed** (`https://www.youtube.com/oembed?url=...&format=json`)  
   - **Rationale**: No API key; returns title and author for common videos.  
   - **Alternatives**: Server proxy (rejected for v1 non-goals); parse Open Graph via third-party (unnecessary dependency).  
   - **Note**: If oEmbed fails (network, CORS, or rare blocks), UI **still stores** the song using **video ID + fallback title** (e.g. “YouTube video”) and thumbnail from ID.  

5. **Thumbnails — `https://img.youtube.com/vi/{id}/maxresdefault.jpg` with fallback to `hqdefault.jpg`**  
   - **Rationale**: Documented pattern; `maxres` may 404 for shorts/low-res—use `onError` to swap or default placeholder.  

6. **URL parsing — robust client-side extraction**  
   - **Rationale**: Support `youtube.com/watch`, `youtu.be/`, `m.youtube.com`, Music paths when they share `v=` or ID segment, and `/shorts/{id}`.  
   - **Alternatives**: Only support one format (bad UX).  

7. **PWA — `vite-plugin-pwa` (Workbox)**  
   - **Rationale**: Generates SW, precaches shell, aligns with offline “app opens” expectation.  
   - **Scope**: Precache static assets; **do not** claim full offline for oEmbed/thumbnail hosts unless explicitly cached (optional phase-2 tuning).  

8. **Styling — CSS variables + light/dark**  
   - **Rationale**: Matches Vercel-like neutrals without locking to a specific component library; optional Tailwind if team prefers utility-first.  

9. **Duplicate policy — one song row per `videoId`**  
   - **Rationale**: Stable identity; adding the same URL again surfaces existing record (toast or inline message) and optionally focuses playlist assignment.  

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| oEmbed unavailable from browser (CORS or policy changes) | Keep **video ID** as source of truth; show placeholder title; document fallback behavior in spec. |
| YouTube thumbnail URL changes or blocking | Rare; keep **ID-based** construction; add **local placeholder** image in app bundle. |
| IndexedDB cleared by user / browser | Accept data loss for v1; future export is a separate change. |
| Many-to-many UX complexity | MVP: add song → always in **Favorites**; playlists screen to toggle membership for other lists. |

## Migration Plan

- **Initial release**: No production migration. Ship DB schema **version** in IndexedDB; on future changes, implement **small upgrade handlers** (Dexie `version().stores()` or equivalent).
- **Rollback**: Revert deploy; user data remains on device until cleared—no server rollback.

## Open Questions

- Whether to use **Tailwind** vs **vanilla CSS modules** (either fits Vercel-like minimalism; pick during implementation for consistency).
- Exact **icon set** (Lucide vs Phosphor) — minor; keep stroke icons consistent with thin borders.
