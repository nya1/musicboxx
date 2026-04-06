# song-catalog Specification

## Purpose
TBD - created by archiving change musicboxx-pwa. Update Purpose after archive.
## Requirements
### Requirement: Paste YouTube URL to add a song

The system SHALL accept a pasted YouTube URL from the user and SHALL derive a canonical **video ID** when the URL matches a supported pattern.

#### Scenario: Valid watch URL

- **WHEN** the user pastes a URL of the form `https://www.youtube.com/watch?v=VIDEO_ID` (with optional query parameters)
- **THEN** the system extracts `VIDEO_ID` and proceeds to create or resolve a song record for that ID

#### Scenario: Short youtu.be URL

- **WHEN** the user pastes `https://youtu.be/VIDEO_ID`
- **THEN** the system extracts `VIDEO_ID` and proceeds to create or resolve a song record for that ID

#### Scenario: Shorts URL

- **WHEN** the user pastes a URL of the form `https://www.youtube.com/shorts/VIDEO_ID`
- **THEN** the system extracts `VIDEO_ID` and proceeds to create or resolve a song record for that ID

#### Scenario: Invalid or unsupported URL

- **WHEN** the user submits text that is not a recognized YouTube URL or does not yield a video ID
- **THEN** the system shows a clear validation error and SHALL NOT create a song record

### Requirement: Resolve song title for display

The system SHALL attempt to load a human-readable **title** (and MAY load **channel/author** name) for the video ID using a client-side metadata request (e.g. YouTube oEmbed).

#### Scenario: Metadata succeeds

- **WHEN** the metadata request succeeds for the resolved video ID
- **THEN** the song record stores the returned title (and optional author) for list and detail display

#### Scenario: Metadata fails

- **WHEN** the metadata request fails or returns no usable title
- **THEN** the system still persists the song with the video ID and SHALL display a non-empty fallback label (e.g. “YouTube video” or truncated ID) until metadata can be refreshed

### Requirement: Static thumbnail as cover art

The system SHALL display a **static thumbnail image** for each song using URLs derived from the video ID, with a defined fallback order if a higher-resolution image is unavailable.

#### Scenario: Thumbnail loads

- **WHEN** a song is shown in the UI
- **THEN** the UI renders an image sourced from the documented `img.youtube.com` pattern for that video ID

#### Scenario: Thumbnail missing

- **WHEN** the preferred thumbnail URL fails to load
- **THEN** the UI falls back to an alternate quality or a bundled placeholder image without breaking the layout

### Requirement: Deduplicate by video ID

The system SHALL maintain at most **one** song record per YouTube video ID.

#### Scenario: Duplicate paste

- **WHEN** the user attempts to add a URL that resolves to a video ID that already exists
- **THEN** the system does not create a duplicate song record and SHALL inform the user that the song already exists

### Requirement: Open song in YouTube

The system SHALL provide an action to open the song’s canonical YouTube watch URL in an external context (e.g. new browser tab).

#### Scenario: User opens from list or detail

- **WHEN** the user invokes “Open in YouTube” (or equivalent) on a song
- **THEN** the system navigates to the correct `https://www.youtube.com/watch?v=VIDEO_ID` URL externally

### Requirement: Persist songs locally

The system SHALL persist all song records in **browser local storage** (IndexedDB or equivalent) so that data survives reloads and PWA restarts on the same origin and profile.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the installed PWA
- **THEN** previously saved songs appear with stored metadata and thumbnails as defined in this spec

### Requirement: Add song via system share of a URL

The system SHALL accept a **YouTube URL** delivered through the **Web Share Target** flow (installed PWA share from another app) and SHALL apply the **same** URL parsing, validation, deduplication, metadata resolution, and persistence rules as for a pasted URL.

#### Scenario: Share provides a valid YouTube URL

- **WHEN** the user shares content from another application to Musicboxx and the share payload yields a supported YouTube URL
- **THEN** the system extracts the **video ID** and creates or resolves a song record consistent with the “Paste YouTube URL to add a song” requirement

#### Scenario: Share provides invalid content

- **WHEN** the share payload does not yield a supported YouTube URL
- **THEN** the system shows a clear validation error and SHALL NOT create a song record

#### Scenario: Share duplicates an existing song

- **WHEN** the share payload resolves to a **video ID** that already exists in the catalog
- **THEN** the system does not create a duplicate song record and SHALL inform the user that the song already exists

