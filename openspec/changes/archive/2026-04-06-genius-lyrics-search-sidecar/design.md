## Context

Musicboxx stores each song with **`title`** and optional **`author`** (plus provider-specific ids). Playback opens the native provider in a new tab (`SongDetailPage`). There is no in-app player. Genius hosts community lyrics; its **search** endpoint accepts a free-text query and works without API keys or embedding.

## Goals / Non-Goals

**Goals:**

- Offer a **single, provider-agnostic** control to “find lyrics on Genius” using only `title` / `author`.
- Always use **`https://genius.com/search?q=<encoded query>`** (search, not a guessed deep link).
- **Normalize** title and author strings to remove common **noise** (YouTube/label cruft) before building the query.
- Keep logic in a **small pure module** (easy to test and extend with new strip rules).

**Non-Goals:**

- Scraping or displaying lyrics inside Musicboxx.
- Resolving a canonical Genius song URL (would need API or heuristics beyond search).
- Persisting normalized strings on the song record (normalization is **only** for this outbound search).
- OAuth, Genius API keys, or backend proxy.

## Decisions

1. **Query composition** — Concatenate **normalized author** and **normalized title** with a single space, **author first** when `author` is non-empty after normalization; otherwise use **title only**. Rationale: matches how users search (“Artist Song”) and aligns with typical catalog ordering.

2. **Normalization location** — Implement as **`normalizeGeniusSearchText(input: string): string`** (or separate helpers for title vs. author if rules diverge) applied to each field **before** concatenation. Rationale: “` - Topic`” is an **author**-channel artifact; “(Official Video)” is usually in **title**—separate passes keep rules clear.

3. **Strip rules (initial set)** — Ordered passes (documented in code and spec), including at minimum:
   - Trim outer whitespace; collapse repeated internal spaces.
   - **Author**: remove trailing **` - Topic`** (case-insensitive), common on YouTube auto-generated artist channels.
   - **Title**: remove bracketed/parenthesized **release-type** suffixes such as **`(Official Video)`**, **`(Official Audio)`**, **`(Lyric Video)`**, **`(Visualizer)`** (case-insensitive); remove similar **square-bracket** variants where applicable.
   - **Title**: remove **featured-artist** tail segments: **`feat.`**, **`ft.`**, **`featuring`** (case-insensitive) through end-of-string or through closing parenthesis when the tail is parenthetical (e.g. `Song (feat. Name)`).

   Alternatives considered: **single regex blob** — rejected as hard to maintain; **ML normalization** — rejected (offline PWA, overkill).

4. **Encoding** — Build the final string, then **`encodeURIComponent`** for the `q` parameter. Rationale: correct for UTF-8 titles and special characters.

5. **UI** — **Secondary** button or link on **`SongDetailPage`** next to the existing primary “Open in …” action (library list remains link-to-detail only). Use `target="_blank"` and `rel="noopener noreferrer"`; label e.g. **Find lyrics on Genius** with an accessible description that states it opens Genius search in a new tab.

6. **Empty query** — If after normalization the query is empty (edge case: only noise), **hide** the Genius control or disable it with a clear `aria` state—implementation chooses one; prefer **hide** to avoid useless navigation.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Heuristic stripping removes useful words | Start with conservative patterns; extend iteratively; strip only known boilerplate |
| Genius search returns no good match | Acceptable—user remains on Genius to refine search |
| `author` missing | Fall back to title-only query |
| Duplicated logic vs. future `primaryArtist` | Keep Genius normalization local to this feature until product needs reuse |

## Migration Plan

None. No data migration; ship UI + library module together.

## Open Questions

- Whether to add **Vitest** (or similar) for strip helpers—recommended if the project adds a test script; otherwise manual QA checklist in tasks.
