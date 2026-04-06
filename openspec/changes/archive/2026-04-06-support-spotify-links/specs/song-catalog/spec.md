## MODIFIED Requirements

### Requirement: Paste YouTube URL to add a song

The system SHALL accept a pasted URL from the user that identifies a **YouTube video** or a **Spotify track** (see `spotify-links` capability) and SHALL derive a canonical **video ID** for YouTube or a canonical **Spotify track id** for Spotify when the URL matches a supported pattern.

#### Scenario: Valid watch URL

- **WHEN** the user pastes a URL of the form `https://www.youtube.com/watch?v=VIDEO_ID` (with optional query parameters)
- **THEN** the system extracts `VIDEO_ID` and proceeds to create or resolve a song record for that ID

#### Scenario: Short youtu.be URL

- **WHEN** the user pastes `https://youtu.be/VIDEO_ID`
- **THEN** the system extracts `VIDEO_ID` and proceeds to create or resolve a song record for that ID

#### Scenario: Shorts URL

- **WHEN** the user pastes a URL of the form `https://www.youtube.com/shorts/VIDEO_ID`
- **THEN** the system extracts `VIDEO_ID` and proceeds to create or resolve a song record for that ID

#### Scenario: Valid Spotify track URL

- **WHEN** the user pastes a supported Spotify track URL or `spotify:track:` URI
- **THEN** the system extracts the Spotify track id and proceeds to create or resolve a song record for that id

#### Scenario: Invalid or unsupported URL

- **WHEN** the user submits text that is not a recognized YouTube URL or Spotify track URL/URI, or does not yield a supported id
- **THEN** the system shows a clear validation error and SHALL NOT create a song record

### Requirement: Resolve song title for display

The system SHALL attempt to load a human-readable **title** (and MAY load **channel/author** name) using a **client-side** metadata request appropriate to the song’s provider: **YouTube oEmbed** for YouTube videos and **Spotify oEmbed** (or equivalent public endpoint) for Spotify tracks.

#### Scenario: Metadata succeeds

- **WHEN** the metadata request succeeds for the resolved YouTube video ID or Spotify track id
- **THEN** the song record stores the returned title (and optional author) for list and detail display

#### Scenario: Metadata fails

- **WHEN** the metadata request fails or returns no usable title
- **THEN** the system still persists the song with the underlying id and SHALL display a non-empty fallback label (e.g. “YouTube video”, “Spotify track”, or truncated id) until metadata can be refreshed

### Requirement: Static thumbnail as cover art

The system SHALL display a **static thumbnail image** for each song: for **YouTube**, using URLs derived from the video ID, with a defined fallback order if a higher-resolution image is unavailable; for **Spotify**, using the thumbnail URL from Spotify metadata when present, and otherwise the same placeholder fallback as other failed thumbnails.

#### Scenario: Thumbnail loads

- **WHEN** a YouTube-backed song is shown in the UI
- **THEN** the UI renders an image sourced from the documented `img.youtube.com` pattern for that video ID

#### Scenario: Spotify thumbnail loads

- **WHEN** a Spotify-backed song is shown in the UI and metadata provides a thumbnail URL
- **THEN** the UI renders that image for the song

#### Scenario: Thumbnail missing

- **WHEN** the preferred thumbnail URL fails to load or is unavailable
- **THEN** the UI falls back to an alternate quality (for YouTube), a neutral placeholder, or a bundled placeholder image without breaking the layout

### Requirement: Deduplicate by video ID

The system SHALL maintain at most **one** song record per **YouTube video ID** and at most **one** song record per **Spotify track id**. Duplicate detection for YouTube SHALL use the video ID; for Spotify SHALL use the Spotify track id.

#### Scenario: Duplicate paste

- **WHEN** the user attempts to add a URL that resolves to a YouTube video ID or Spotify track id that already exists in the catalog
- **THEN** the system does not create a duplicate song record and SHALL inform the user that the song already exists

### Requirement: Open song in YouTube

The system SHALL provide an action to open the song’s playback destination in an **external** context (e.g. new browser tab): for **YouTube** songs, the canonical YouTube watch URL; for **Spotify** songs, the canonical Spotify track URL.

#### Scenario: User opens YouTube song from list or detail

- **WHEN** the user invokes “Open in YouTube” (or equivalent) on a YouTube-backed song
- **THEN** the system navigates to the correct `https://www.youtube.com/watch?v=VIDEO_ID` URL externally

#### Scenario: User opens Spotify song from list or detail

- **WHEN** the user invokes “Open in Spotify” (or equivalent) on a Spotify-backed song
- **THEN** the system navigates to the correct `https://open.spotify.com/track/{TRACK_ID}` URL externally

### Requirement: Add song via system share of a URL

The system SHALL accept a **YouTube or Spotify track** URL delivered through the **Web Share Target** flow (installed PWA share from another app) and SHALL apply the **same** URL parsing, validation, deduplication, metadata resolution, and persistence rules as for a pasted URL.

#### Scenario: Share provides a valid YouTube URL

- **WHEN** the user shares content from another application to Musicboxx and the share payload yields a supported YouTube URL
- **THEN** the system extracts the **video ID** and creates or resolves a song record consistent with the “Paste YouTube URL to add a song” requirement

#### Scenario: Share provides a valid Spotify URL

- **WHEN** the user shares content from another application to Musicboxx and the share payload yields a supported Spotify track URL or URI
- **THEN** the system extracts the **Spotify track id** and creates or resolves a song record consistent with the Spotify parsing requirements

#### Scenario: Share provides invalid content

- **WHEN** the share payload does not yield a supported YouTube URL or Spotify track URL/URI
- **THEN** the system shows a clear validation error and SHALL NOT create a song record

#### Scenario: Share duplicates an existing song

- **WHEN** the share payload resolves to a **video ID** or **Spotify track id** that already exists in the catalog
- **THEN** the system does not create a duplicate song record and SHALL inform the user that the song already exists
