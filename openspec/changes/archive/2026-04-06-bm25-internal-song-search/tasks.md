## 1. Dependency and search module

- [x] 1.1 Add the `lunr` package (and `@types/lunr` if needed for TypeScript) to `package.json` and install.
- [x] 1.2 Create a small module (e.g. `src/lib/songSearchIndex.ts`) that builds a Lunr index from `Song[]`, fields `title`, `author`, `primaryArtist`, `albumTitle`, uses stable song `id` as the document reference, and exposes `search(query: string)` returning ordered song ids with scores.

## 2. Library home UI

- [x] 2.1 Add a search input to `LibraryPage` on the home route: accessible label, clear empty-query behavior (full list, newest first per spec).
- [x] 2.2 Wire `useLiveQuery` (or equivalent) so when songs change, the in-memory index is rebuilt or updated and the visible list reflects adds/updates/deletes without reload.
- [x] 2.3 When the query is non-empty, render the song list in relevance order for matches; show a distinct empty state when there are songs but no matches (copy distinct from “no songs yet”).
- [x] 2.4 Reuse existing list row styling (`song-row`, thumbnails, links to `/song/:id`) for consistency.

## 3. Tests and verification

- [x] 3.1 Add unit tests for the index builder and ranking (e.g. two songs, query prefers correct title/artist).
- [x] 3.2 Run `pnpm run test`, `pnpm run build`, and `pnpm run lint` and fix any issues.
