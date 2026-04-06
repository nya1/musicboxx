## MODIFIED Requirements

### Requirement: Resolve song title for display

The system SHALL attempt to load a human-readable **title** (and MAY load **channel/author** name) using a **client-side** metadata request appropriate to the song’s provider: **YouTube oEmbed** for YouTube videos, **Spotify oEmbed** (or equivalent public endpoint) for Spotify tracks, and a **public** metadata approach per `apple-music-links` for Apple Music tracks. When the public metadata response includes additional fields described in the **`song-metadata`** capability (e.g. primary artist, album, duration, ISRC, release year), the system SHALL persist those values on the song record when present.

#### Scenario: Metadata succeeds

- **WHEN** the metadata request succeeds for the resolved YouTube video ID, Spotify track id, or Apple Music track id
- **THEN** the song record stores the returned title (and optional author) for list and detail display, and stores any optional extended metadata returned by the same flow per the **`song-metadata`** specification

#### Scenario: Metadata fails

- **WHEN** the metadata request fails or returns no usable title
- **THEN** the system still persists the song with the underlying id and SHALL display a non-empty fallback label (e.g. “YouTube video”, “Spotify track”, “Apple Music track”, or truncated id) until metadata can be refreshed

### Requirement: Persist songs locally

The system SHALL persist all song records in **browser local storage** (IndexedDB or equivalent) so that data survives reloads and PWA restarts on the same origin and profile. Each song record SHALL conform to the **`song-metadata`** capability for extended optional fields: structured fields SHALL be stored when populated by public metadata flows, and missing fields SHALL not block saving the song.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the installed PWA
- **THEN** previously saved songs appear with stored titles, thumbnails, optional `author` display fields, and any persisted extended metadata as defined in **`song-metadata`**
