# genius-lyrics-search Specification

## Purpose

Define a **provider-agnostic** way to open **Genius** in a new browser tab so the user can find lyrics, using only stored **title** and **author** fields—no branching on music provider and no lyrics scraping inside Musicboxx.

## Requirements

### Requirement: Open Genius search from song detail

The system SHALL provide a **secondary** action on the **song detail** screen to open **Genius** in an external context (e.g. new browser tab). The action SHALL **not** depend on `provider`, YouTube video id, Spotify track id, or Apple Music ids—only on the song’s **`title`** and optional **`author`**.

#### Scenario: User opens Genius from song detail

- **WHEN** the user invokes the Genius lyrics action on the song detail screen for any saved song
- **THEN** the system navigates externally to `https://genius.com/search` with a **`q`** query parameter whose value is the **URL-encoded** search string derived per the “Genius search query string” requirement

#### Scenario: Accessible external navigation

- **WHEN** the Genius action is shown as a link or button
- **THEN** the control SHALL use an accessible name that indicates lyrics on Genius and that the destination opens in a new tab (e.g. via visible text and/or `aria-label` consistent with other external links in the app)

### Requirement: Always use Genius search URL

The external destination SHALL be the Genius **search** page with a **`q`** parameter. The system SHALL **not** require a Genius API, OAuth, or server-side resolution to construct the URL.

#### Scenario: URL shape

- **WHEN** the system builds the Genius URL for a non-empty query string
- **THEN** the path is `/search` on the `genius.com` host with scheme `https`, and the query string includes exactly the encoded search text as `q`

### Requirement: Genius search query string from title and author

The system SHALL build the **plain-text** search string by applying **normalization** to the song’s **`title`** and **`author`** fields separately. When **`author`** is empty or absent after normalization, the string SHALL be **`normalizedTitle`** alone. When **`author`** is non-empty after normalization, the string SHALL be **`${normalizedAuthor} ${normalizedTitle}`** **unless** the normalized title already begins with the normalized artist per the “Avoid duplicating artist” requirement—in which case the string SHALL be **`normalizedTitle`** only. The system SHALL **trim** the final string and **collapse** consecutive internal whitespace to a single space, then use **`encodeURIComponent`** on that string for the `q` parameter.

#### Scenario: Song with title and author (no duplication)

- **WHEN** the song has a non-empty `title` and a non-empty `author` after normalization and the title does **not** already begin with the artist
- **THEN** the search string equals the normalized author followed by a space followed by the normalized title

#### Scenario: Song with title only

- **WHEN** the song has a non-empty `title` but `author` is missing, empty, or becomes empty after normalization
- **THEN** the search string equals the normalized title only

#### Scenario: Title already includes leading artist

- **WHEN** the normalized title already begins with the normalized artist (e.g. YouTube-style `Artist - Song`), so prepending the author would duplicate the artist name
- **THEN** the search string equals the normalized title only

### Requirement: Avoid duplicating artist in the search query

When the normalized **title** already contains the normalized **author** at the **start** in common video-title patterns (e.g. artist followed by a separator such as `-`, `–`, `:`, `|`, or a space before the rest of the title, or the title equals the artist alone), the system SHALL **not** prepend the author again.

#### Scenario: YouTube-style “Artist - Song”

- **WHEN** `author` normalizes to `Artist Name` and `title` normalizes to `Artist Name - Track Name`
- **THEN** the search string is `Artist Name - Track Name` and does not repeat `Artist Name` at the beginning twice

### Requirement: Normalize text for Genius search

Normalization SHALL **trim** leading and trailing whitespace and **collapse** consecutive internal whitespace to a single space. Additionally, the system SHALL remove common **non-essential** substrings that hurt lyric lookup:

- From strings that correspond to the **author** role: a trailing **channel-style** suffix **` - Topic`** (case-insensitive).
- From strings that correspond to the **title** role: parenthetical or bracketed labels such as **`(Official Video)`**, **`(Official Audio)`**, **`(Lyric Video)`**, and **`(Visualizer)`** (case-insensitive), and equivalent **square-bracket** forms when they appear as such boilerplate.
- From the **title**: featured-performer tail clauses introduced by **`feat.`**, **`ft.`**, or **`featuring`** (case-insensitive), including typical parenthetical forms (e.g. trailing `(feat. …)`).

The system SHALL apply these rules in a **documented order** so behavior is stable and testable.

#### Scenario: YouTube-style author channel name

- **WHEN** `author` is `Some Artist - Topic`
- **THEN** normalization yields `Some Artist` for use in the search string

#### Scenario: Official video suffix in title

- **WHEN** `title` is `Song Name (Official Video)`
- **THEN** normalization yields `Song Name` for use in the search string

#### Scenario: Featured artist in title

- **WHEN** `title` is `Song Name (feat. Guest Artist)`
- **THEN** normalization removes the featured-artist tail such that the remaining title is suitable for search (e.g. `Song Name` without the featured segment per the documented rules)

### Requirement: Hide action when query would be empty

If, after normalization and concatenation, the search string is **empty**, the system SHALL **not** offer a working Genius navigation control that opens an empty search (the control MAY be omitted entirely).

#### Scenario: Nothing left to search

- **WHEN** both normalized title and normalized author are empty
- **THEN** the Genius lyrics action is not shown or is not navigable
