## 1. Data model and Dexie schema

- [x] 1.1 Extend `Song` in `src/db/index.ts` with optional `primaryArtist`, `albumTitle`, `durationMs`, `isrc`, `releaseYear` (types aligned with design).
- [x] 1.2 Bump Dexie version and add indexes on `primaryArtist` and `title` for the `songs` store; omit migration upgrade (fresh DB assumption per user).
- [x] 1.3 Ensure any song creation/update paths tolerate missing extended fields (no required-field validation).

## 2. Metadata fetch and mapping

- [x] 2.1 Extend Apple Music public lookup parsing to expose album, duration, ISRC, release year when present; map into new `Song` fields in `addSongFromParsed` (or shared helper).
- [x] 2.2 Map YouTube oEmbed `author_name` to `primaryArtist` (and keep `author` behavior) when adding YouTube songs.
- [x] 2.3 Map Spotify oEmbed `author_name` to `primaryArtist` where applicable; leave unavailable fields unset.
- [x] 2.4 Centralize trim/normalization for `primaryArtist` in one small helper to match spec.

## 3. Verification

- [x] 3.1 Run `npm run build` and `npm run lint` after changes.
- [x] 3.2 Manually add one song per provider and confirm IndexedDB row contains expected optional fields when APIs return them.

## 4. Specs archive (post-implementation)

- [x] 4.1 After implementation, archive this change per project OpenSpec workflow so `openspec/specs/song-metadata/spec.md` and `song-catalog` updates land in the main spec tree.
