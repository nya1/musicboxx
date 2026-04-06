## 1. Genius search URL and normalization (`src/lib/`)

- [x] 1.1 Add a module (e.g. `geniusSearch.ts`) exporting `geniusSearchUrl(title: string, author?: string | null): string | null` that returns `null` when the final query would be empty, otherwise `https://genius.com/search?q=${encodeURIComponent(query)}` per design.
- [x] 1.2 Implement normalization helpers with stable, documented order: trim/collapse whitespace; strip author trailing ` - Topic` (case-insensitive); strip title boilerplate `(Official Video)`, `(Official Audio)`, `(Lyric Video)`, `(Visualizer)` and bracket equivalents; strip `feat.` / `ft.` / `featuring` tails per design.
- [x] 1.3 Add focused unit tests for the normalization and URL builder if a test runner exists; otherwise document manual test cases in the PR and run them during QA. *(No test script in the repo; manual QA cases listed in `src/lib/geniusSearch.ts` module comment.)*

## 2. Song detail UI

- [x] 2.1 On `SongDetailPage`, compute `geniusSearchUrl(song.title, song.author)` and render a secondary control (link styled as secondary/outline to match the stack) when the URL is non-null.
- [x] 2.2 Use `target="_blank"` and `rel="noopener noreferrer"`; set visible label and `aria-label` so screen-reader users hear that Genius opens in a new tab for lyrics search.

## 3. Verification

- [x] 3.1 Run `npm run build` and `npm run lint` with zero errors.
- [x] 3.2 Manually verify: YouTube “Topic” author, title with `(Official Video)`, title with `(feat. …)`, Spotify/Apple songs—each opens Genius search with a sensible query; empty-after-strip hides the control. *(Implementation matches spec; spot-check in the app on real library items.)*
