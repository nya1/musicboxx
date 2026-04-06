# song-metadata Specification

## Purpose

Define **optional structured metadata** persisted on each local **song** record so the app can support future features (e.g. **search lyrics**, richer library filtering) using **client-side** data only, without requiring a backend or OAuth.

## Requirements

### Requirement: Extended optional fields on song records

The system SHALL persist **optional** structured fields on each song in local storage alongside existing provider ids, title, and thumbnails. At minimum the system SHALL support:

- **`primaryArtist`**: a single **normalized** string identifying the primary performer or channel name for search and matching, when derivable from public metadata.
- **`albumTitle`**: album or collection name, when provided by public metadata.
- **`durationMs`**: track length in milliseconds, when provided by public metadata.
- **`isrc`**: International Standard Recording Code string, when provided by public metadata.
- **`releaseYear`**: four-digit release year, when derivable from public metadata.

The system SHALL NOT require any of these fields to be present for a song to be saved or displayed.

#### Scenario: Apple Music metadata includes rich fields

- **WHEN** public metadata for an Apple Music track includes artist name, album, duration, ISRC, or release date/year
- **THEN** the song record persists the corresponding optional fields that are present

#### Scenario: YouTube metadata is minimal

- **WHEN** the user adds a YouTube-backed song and only YouTube oEmbed metadata is available
- **THEN** the song record MAY populate `primaryArtist` from the oEmbed author name when present and SHALL leave other extended fields unset if not available

### Requirement: Preserve existing display fields

The system SHALL continue to persist **`title`**, optional **`author`**, and **`thumbnailUrl`** as today. New fields SHALL complement these values; the system SHALL NOT remove or break list/detail behavior that relies on `title` and `author` when extended fields are absent.

#### Scenario: Legacy-shaped row

- **WHEN** a song is stored with `title` and optional `author` only
- **THEN** the application SHALL still render the song without requiring `primaryArtist` or other extended fields

### Requirement: Normalize primary artist for storage

When public metadata provides a single primary performer or channel name suitable for search, the system SHALL store it in **`primaryArtist`** after **trimming** insignificant whitespace. When multiple artist names are not reliably separable, the system SHALL store the **best single** string the public response provides (e.g. one `artistName` field) rather than inventing splits.

#### Scenario: Spotify oEmbed provides author

- **WHEN** Spotify oEmbed returns `author_name`
- **THEN** the system MAY set both `author` (for display compatibility) and `primaryArtist` (for search) to that value

### Requirement: IndexedDB indexes for future local search

The system SHALL expose **Dexie** (or equivalent) **indexes** on **`primaryArtist`** and **`title`** on the `songs` store so future features can query by artist or title without scanning the full table. Additional indexes MAY be added for `albumTitle` or `isrc` if needed for planned queries.

#### Scenario: Query by primary artist

- **WHEN** a future feature queries songs by `primaryArtist` equality
- **THEN** the schema SHALL support that query via an index defined on `primaryArtist`

### Requirement: No fabricated extended metadata

The system SHALL persist extended optional fields **only** when values are returned by the **documented public client-side metadata** flows for that provider (e.g. YouTube oEmbed, Spotify oEmbed, Apple public lookup). The system SHALL NOT fabricate ISRC, album, or duration.

#### Scenario: Field absent from API

- **WHEN** the public metadata response does not include a given extended field
- **THEN** that field SHALL remain unset on the song record
