## 1. Data model (greenfield)

- [x] 1.1 Extend the catalog `Song` type and Dexie schema with an **`apple-music`** provider value, **Apple Music track id** field(s), and optional **stored open URL** for storefront-safe links—assume **no migration** from prior single-provider databases.
- [x] 1.2 Add indexes and helpers for dedupe and lookup by **`(provider, id)`**, including Apple Music track ids.

## 2. Apple Music parsing and metadata

- [x] 2.1 Add `src/lib/appleMusic.ts` (or similar) with `parseAppleMusicTrackId` for `music.apple.com` **song** URLs (numeric id as last `/song/...` segment) and **album** URLs with **`i=`** track id query parameter.
- [x] 2.2 Implement **public** metadata resolution (no OAuth or Apple Music API keys): title, optional artist, and artwork URL when available, with fallbacks on failure per spec.
- [x] 2.3 Integrate Apple Music into the unified **`addSongFromUrl`** / parsed-ref pipeline so new rows persist and attach to the default playlist like other providers.

## 3. Add flow and share target

- [x] 3.1 Update **`AddSongPage`** validation and copy so paste tries YouTube, Spotify, and Apple Music; surface clear errors when none match.
- [x] 3.2 Extend share payload parsing (e.g. alongside `parseYouTubeVideoIdFromSharePayload`) to detect Apple Music links in `url` / `text`; update **`ShareTargetPage`** error copy accordingly.

## 4. UI

- [x] 4.1 **`SongDetailPage`** and list rows: show Apple Music artwork when present; placeholder when missing or on image error.
- [x] 4.2 Per-provider primary action: **“Open in Apple Music”** with the stored or canonical **`music.apple.com`** URL for Apple Music rows.
- [x] 4.3 Audit user-visible strings that still imply YouTube/Spotify-only where the product now supports Apple Music.

## 5. Verification

- [x] 5.1 Run `npm run build` and `npm run lint`.
- [x] 5.2 Manually test paste and (where available) share with sample **Apple Music** track URLs (song page and album `?i=` link); confirm dedupe and duplicate messaging.
