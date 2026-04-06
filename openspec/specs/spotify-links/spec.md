# spotify-links Specification

## Purpose

Spotify track URLs and URIs: parsing, public oEmbed metadata, cover thumbnails, and opening tracks on Spotify externally.

## Requirements

### Requirement: Parse Spotify track URL or URI

The system SHALL accept user or share input that identifies a **Spotify track** and SHALL derive a canonical **Spotify track id** when the input matches a supported pattern.

#### Scenario: Open Spotify track URL

- **WHEN** the user provides a URL whose host is `open.spotify.com` (with optional `www.`) and whose path contains `/track/` followed by a base-62 track id (with optional query string or locale prefix segments)
- **THEN** the system extracts the track id and proceeds to create or resolve a song record for that id

#### Scenario: Spotify URI

- **WHEN** the user provides a URI of the form `spotify:track:TRACK_ID`
- **THEN** the system extracts `TRACK_ID` and proceeds to create or resolve a song record for that id

#### Scenario: Invalid or unsupported Spotify input

- **WHEN** the user submits text that is not a recognized Spotify track URL or URI or does not yield a track id
- **THEN** the system shows a clear validation error and SHALL NOT create a song record unless the input is also a valid YouTube URL handled by the song-catalog rules

### Requirement: Resolve Spotify track metadata for display

The system SHALL attempt to load a human-readable **title** (and MAY load **artist** or show name) for a resolved Spotify track id using a **client-side** request to Spotify’s **public oEmbed** endpoint for the track’s open URL, **without** OAuth or API keys.

#### Scenario: Spotify oEmbed succeeds

- **WHEN** the oEmbed request succeeds for the track’s canonical `https://open.spotify.com/track/{id}` URL
- **THEN** the song record stores the returned title (and optional artist/author) for list and detail display

#### Scenario: Spotify oEmbed fails

- **WHEN** the oEmbed request fails or returns no usable title
- **THEN** the system still persists the song with the track id and SHALL display a non-empty fallback label (e.g. “Spotify track” or truncated id) until metadata can be refreshed

### Requirement: Spotify thumbnail for cover art

When metadata includes a **thumbnail URL**, the system SHALL use it as the **static cover image** for that Spotify track in list and detail views, with the same fallback behavior as other songs when the image fails to load.

#### Scenario: Thumbnail from oEmbed

- **WHEN** the Spotify oEmbed response includes a `thumbnail_url` (or equivalent documented field)
- **THEN** the UI renders that image for the song until load failure triggers fallback

#### Scenario: Thumbnail missing or failed

- **WHEN** no thumbnail URL is available or the image request fails
- **THEN** the UI uses a bundled placeholder or neutral fallback without breaking the layout

### Requirement: Open Spotify track externally

The system SHALL provide an action to open the song’s canonical Spotify track URL **on Spotify** (web or app) in an external context (e.g. new browser tab), for songs whose provider is Spotify.

#### Scenario: User opens Spotify track from list or detail

- **WHEN** the user invokes “Open in Spotify” (or equivalent) on a Spotify-backed song
- **THEN** the system navigates to the correct `https://open.spotify.com/track/{TRACK_ID}` URL externally
