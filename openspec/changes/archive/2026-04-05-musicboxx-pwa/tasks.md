## 1. Project scaffold

- [x] 1.1 Initialize Vite + React + TypeScript app in repo root (or `apps/web` if monorepo) with lint/format baseline
- [x] 1.2 Add routing shell (e.g. React Router) for home, playlist view, and add-song entry points
- [x] 1.3 Add global CSS tokens for light/dark (CSS variables) matching minimalist Vercel-like neutrals and one accent

## 2. Local data layer

- [x] 2.1 Add IndexedDB layer (e.g. Dexie) with versioned schema: `songs`, `playlists`, `playlistSongs` join
- [x] 2.2 Implement bootstrap: on empty DB create **Favorites** playlist with stable id/flag
- [x] 2.3 Implement song CRUD: insert by `videoId` with dedupe; update title/author on metadata refresh optional
- [x] 2.4 Implement playlist CRUD and membership: add/remove song to playlist; ensure new song joins **Favorites**

## 3. YouTube URL and metadata

- [x] 3.1 Implement URL parser covering `watch?v=`, `youtu.be`, `shorts/`, mobile/music variants that expose `v=` or id path
- [x] 3.2 Implement oEmbed fetch + JSON parse; map title/author; handle failure with fallback label
- [x] 3.3 Implement thumbnail URL builder (`maxresdefault` → `hqdefault`) and image `onError` fallback to placeholder asset

## 4. Core UI — library and add flow

- [x] 4.1 Build “paste URL” flow: input, validate, show errors for invalid URLs
- [x] 4.2 Build song list UI: thumbnail, title, secondary line; tap opens detail or direct “Open in YouTube”
- [x] 4.3 Implement duplicate-paste feedback when `videoId` already exists
- [x] 4.4 Add “Open in YouTube” action wired to `https://www.youtube.com/watch?v=`

## 5. Playlists UI

- [x] 5.1 Playlists index: list all playlists; highlight **Favorites**; create playlist with name validation
- [x] 5.2 Playlist detail: songs in playlist; remove from this playlist; entry to add existing song to playlist where applicable
- [x] 5.3 From song context, allow adding to another playlist without removing from **Favorites** unless user removes explicitly

## 6. PWA shell

- [x] 6.1 Add `manifest.webmanifest` (or Vite-generated) with Musicboxx name, theme colors, display `standalone`, icons
- [x] 6.2 Generate/provide maskable icons (minimal mark) at required sizes
- [x] 6.3 Configure `vite-plugin-pwa` (or equivalent) to precache app shell; verify offline opens shell
- [x] 6.4 Verify mobile viewport meta, tap targets, and single-column layout on a phone-sized breakpoint

## 7. Accessibility and polish

- [x] 7.1 Audit focus order and `aria-label`s on add flow, playlist actions, and external link
- [x] 7.2 Implement system `prefers-color-scheme` plus optional toggle persisted locally
- [x] 7.3 Empty states: no songs, no playlists beyond Favorites, offline metadata failure copy

## 8. Verification

- [ ] 8.1 Manually verify scenarios in `specs/song-catalog/spec.md`, `specs/playlists/spec.md`, and `specs/pwa-shell/spec.md` on mobile + installed PWA
- [x] 8.2 Document `npm` scripts for dev/build/preview in README (only if README already exists or user requests)
