## ADDED Requirements

### Requirement: Parse Apple Music track URL

The system SHALL accept user or share input that identifies an **Apple Music track** on **`music.apple.com`** and SHALL derive a canonical **Apple Music track id** when the input matches a supported pattern.

#### Scenario: Apple Music song URL

- **WHEN** the user provides a URL whose host is `music.apple.com` (with optional `www.`) and whose path includes `/song/` such that the **last path segment** is a numeric **track id**
- **THEN** the system extracts that track id and proceeds to create or resolve a song record for that id

#### Scenario: Apple Music album URL with track parameter

- **WHEN** the user provides a URL whose host is `music.apple.com` and whose **query string** includes an **`i`** parameter whose value is a numeric **track id** (album view with a selected track)
- **THEN** the system extracts that track id and proceeds to create or resolve a song record for that id

#### Scenario: Invalid or unsupported Apple Music input

- **WHEN** the user submits text that is not a recognized Apple Music track URL or does not yield a track id
- **THEN** the system shows a clear validation error and SHALL NOT create a song record unless the input is also a valid YouTube or Spotify URL handled by other capabilities

### Requirement: Resolve Apple Music track metadata for display

The system SHALL attempt to load a human-readable **title** (and MAY load **artist** name) for a resolved Apple Music track id using a **client-side** request to a **public** metadata source that does **not** require OAuth, Apple Music API keys, or a backend proxy.

#### Scenario: Public metadata succeeds

- **WHEN** a documented public metadata request succeeds for the track id (or associated catalog id returned by the parser)
- **THEN** the song record stores the returned title (and optional artist) for list and detail display

#### Scenario: Public metadata fails

- **WHEN** the metadata request fails or returns no usable title
- **THEN** the system still persists the song with the track id and SHALL display a non-empty fallback label (e.g. “Apple Music track” or truncated id) until metadata can be refreshed

### Requirement: Apple Music artwork for cover art

When metadata includes a **thumbnail or artwork URL**, the system SHALL use it as the **static cover image** for that Apple Music track in list and detail views, with the same fallback behavior as other songs when the image fails to load.

#### Scenario: Artwork from metadata

- **WHEN** the metadata response includes a usable image URL for the track
- **THEN** the UI renders that image for the song until load failure triggers fallback

#### Scenario: Artwork missing or failed

- **WHEN** no image URL is available or the image request fails
- **THEN** the UI uses a bundled placeholder or neutral fallback without breaking the layout

### Requirement: Open Apple Music track externally

The system SHALL provide an action to open the song’s **Apple Music** destination in an **external** context (e.g. new browser tab), using a **canonical** `https://music.apple.com/...` URL appropriate to the stored track (preserving storefront or locale from the original link when the design stores it).

#### Scenario: User opens Apple Music track from list or detail

- **WHEN** the user invokes “Open in Apple Music” (or equivalent) on an Apple Music–backed song
- **THEN** the system navigates externally to the correct Apple Music URL for that track
