## 1. Data model (greenfield)

- [x] 1.1 Define `Song` with `provider` (`youtube` | `spotify`) and provider-specific ids (e.g. `videoId`, `spotifyTrackId`) as the **initial** catalog shape—no backfill of legacy rows.
- [x] 1.2 Create Dexie stores/indexes for the new shape (optionally new DB name or version that **replaces** the old schema without migration steps).
- [x] 1.3 Implement lookups and dedupe by `(provider, id)` (e.g. `getSongByProviderId` or equivalent).

## 2. Spotify parsing and metadata

- [x] 2.1 Add `src/lib/spotify.ts` (or similar) with `parseSpotifyTrackId` for `open.spotify.com` track paths and `spotify:track:` URIs.
- [x] 2.2 Implement Spotify oEmbed fetch for title, optional artist, and `thumbnail_url` with fallbacks on failure.
- [x] 2.3 Add `addSongFromSpotifyTrackId` or unify `addSongFromParsed` that persists Spotify rows and adds to default playlist.

## 3. Add flow and share target

- [x] 3.1 Generalize `AddSongPage` to try YouTube then Spotify (or unified parser), update validation copy, and navigate on success.
- [x] 3.2 Extend share payload parsing to detect Spotify links in `url`/`text` (reuse or complement `parseYouTubeVideoIdFromSharePayload`); update `ShareTargetPage` error copy.

## 4. UI

- [x] 4.1 `SongDetailPage` (and list cards): show Spotify thumbnail when provider is Spotify; keep YouTube `img.youtube.com` for YouTube.
- [x] 4.2 Per-provider primary action: “Open in YouTube” vs “Open in Spotify” with correct external URLs.
- [x] 4.3 Audit other user-visible strings that assume YouTube-only.

## 5. Verification

- [x] 5.1 Run `npm run build` and `npm run lint`.
- [x] 5.2 Manually test paste and (where available) share with sample YouTube and Spotify track URLs; confirm dedupe and duplicate messaging.
