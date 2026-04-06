# song-catalog Specification

## Purpose
TBD - created by archiving change musicboxx-pwa. Update Purpose after archive.
## Requirements
### Requirement: Paste YouTube URL to add a song

The system SHALL accept a pasted URL from the user that identifies a **YouTube video**, a **Spotify track** (see `spotify-links` capability), or an **Apple Music track** (see `apple-music-links` capability) and SHALL derive a canonical **video ID** for YouTube, a canonical **Spotify track id** for Spotify, or a canonical **Apple Music track id** for Apple Music when the URL matches a supported pattern.

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

#### Scenario: Valid Apple Music track URL

- **WHEN** the user pastes a supported Apple Music track URL per `apple-music-links`
- **THEN** the system extracts the Apple Music track id and proceeds to create or resolve a song record for that id

#### Scenario: Invalid or unsupported URL

- **WHEN** the user submits text that is not a recognized YouTube URL, Spotify track URL/URI, or Apple Music track URL, or does not yield a supported id
- **THEN** the system shows a clear validation error and SHALL NOT create a song record

### Requirement: Resolve song title for display

The system SHALL attempt to load a human-readable **title** (and MAY load **channel/author** name) using a **client-side** metadata request appropriate to the song’s provider: **YouTube oEmbed** for YouTube videos, **Spotify oEmbed** (or equivalent public endpoint) for Spotify tracks, and a **public** metadata approach per `apple-music-links` for Apple Music tracks. When the public metadata response includes additional fields described in the **`song-metadata`** capability (e.g. primary artist, album, duration, ISRC, release year), the system SHALL persist those values on the song record when present.

#### Scenario: Metadata succeeds

- **WHEN** the metadata request succeeds for the resolved YouTube video ID, Spotify track id, or Apple Music track id
- **THEN** the song record stores the returned title (and optional author) for list and detail display, and stores any optional extended metadata returned by the same flow per the **`song-metadata`** specification

#### Scenario: Metadata fails

- **WHEN** the metadata request fails or returns no usable title
- **THEN** the system still persists the song with the underlying id and SHALL display a non-empty fallback label (e.g. “YouTube video”, “Spotify track”, “Apple Music track”, or truncated id) until metadata can be refreshed

### Requirement: Static thumbnail as cover art

The system SHALL display a **static thumbnail image** for each song: for **YouTube**, using URLs derived from the video ID, with a defined fallback order if a higher-resolution image is unavailable; for **Spotify**, using the thumbnail URL from Spotify metadata when present; for **Apple Music**, using artwork from Apple Music metadata resolution when present; and otherwise the same placeholder fallback as other failed thumbnails.

#### Scenario: Thumbnail loads

- **WHEN** a YouTube-backed song is shown in the UI
- **THEN** the UI renders an image sourced from the documented `img.youtube.com` pattern for that video ID

#### Scenario: Spotify thumbnail loads

- **WHEN** a Spotify-backed song is shown in the UI and metadata provides a thumbnail URL
- **THEN** the UI renders that image for the song

#### Scenario: Apple Music thumbnail loads

- **WHEN** an Apple Music–backed song is shown in the UI and metadata provides an image URL
- **THEN** the UI renders that image for the song

#### Scenario: Thumbnail missing

- **WHEN** the preferred thumbnail URL fails to load or is unavailable
- **THEN** the UI falls back to an alternate quality (for YouTube), a neutral placeholder, or a bundled placeholder image without breaking the layout

### Requirement: Deduplicate by video ID

The system SHALL maintain at most **one** song record per **YouTube video ID**, at most **one** song record per **Spotify track id**, and at most **one** song record per **Apple Music track id**. Duplicate detection for YouTube SHALL use the video ID; for Spotify SHALL use the Spotify track id; for Apple Music SHALL use the Apple Music track id.

#### Scenario: Duplicate paste

- **WHEN** the user attempts to add a URL that resolves to a YouTube video ID, Spotify track id, or Apple Music track id that already exists in the catalog
- **THEN** the system does not create a duplicate song record and SHALL inform the user that the song already exists

### Requirement: Open song in YouTube

The system SHALL provide an action to open the song’s playback destination in an **external** context (e.g. new browser tab): for **YouTube** songs, the canonical YouTube watch URL; for **Spotify** songs, the canonical Spotify track URL; for **Apple Music** songs, the canonical Apple Music track URL.

#### Scenario: User opens YouTube song from list or detail

- **WHEN** the user invokes “Open in YouTube” (or equivalent) on a YouTube-backed song
- **THEN** the system navigates to the correct `https://www.youtube.com/watch?v=VIDEO_ID` URL externally

#### Scenario: User opens Spotify song from list or detail

- **WHEN** the user invokes “Open in Spotify” (or equivalent) on a Spotify-backed song
- **THEN** the system navigates to the correct `https://open.spotify.com/track/{TRACK_ID}` URL externally

#### Scenario: User opens Apple Music song from list or detail

- **WHEN** the user invokes “Open in Apple Music” (or equivalent) on an Apple Music–backed song
- **THEN** the system navigates externally to the correct `music.apple.com` URL for that track

### Requirement: Persist songs locally

The system SHALL persist all song records in **browser local storage** (IndexedDB or equivalent) so that data survives reloads and PWA restarts on the same origin and profile. Each song record SHALL conform to the **`song-metadata`** capability for extended optional fields: structured fields SHALL be stored when populated by public metadata flows, and missing fields SHALL not block saving the song.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the installed PWA
- **THEN** previously saved songs appear with stored titles, thumbnails, optional `author` display fields, and any persisted extended metadata as defined in **`song-metadata`**

### Requirement: Add song via system share of a URL

The system SHALL accept a **YouTube, Spotify track, or Apple Music track** URL delivered through the **Web Share Target** flow (installed PWA share from another app) and SHALL apply the **same** URL parsing, validation, deduplication, metadata resolution, and persistence rules as for a pasted URL.

#### Scenario: Share provides a valid YouTube URL

- **WHEN** the user shares content from another application to Musicboxx and the share payload yields a supported YouTube URL
- **THEN** the system extracts the **video ID** and creates or resolves a song record consistent with the “Paste YouTube URL to add a song” requirement

#### Scenario: Share provides a valid Spotify URL

- **WHEN** the user shares content from another application to Musicboxx and the share payload yields a supported Spotify track URL or URI
- **THEN** the system extracts the **Spotify track id** and creates or resolves a song record consistent with the Spotify parsing requirements

#### Scenario: Share provides a valid Apple Music URL

- **WHEN** the user shares content from another application to Musicboxx and the share payload yields a supported Apple Music track URL
- **THEN** the system extracts the **Apple Music track id** and creates or resolves a song record consistent with the Apple Music parsing requirements

#### Scenario: Share provides invalid content

- **WHEN** the share payload does not yield a supported YouTube URL, Spotify track URL/URI, or Apple Music track URL
- **THEN** the system shows a clear validation error and SHALL NOT create a song record

#### Scenario: Share duplicates an existing song

- **WHEN** the share payload resolves to a **video ID**, **Spotify track id**, or **Apple Music track id** that already exists in the catalog
- **THEN** the system does not create a duplicate song record and SHALL inform the user that the song already exists

### Requirement: Paste flow branches on YouTube playlist detection

The system SHALL handle a pasted or submitted URL in the **add a song** flow by **classifying** it as a **YouTube playlist import** (playlist id present), a **single YouTube video**, or **unsupported**, **without** requiring a separate user action to select “import playlist” before paste. Playlist detection SHALL run as part of the same submission handling used for single-video adds.

#### Scenario: Same entrypoint for playlist and video

- **WHEN** the user submits a URL in the add-song flow
- **THEN** the system applies background classification and either proceeds with playlist import per **`youtube-playlist-import`** or with single-video resolution per existing **`song-catalog`** rules

#### Scenario: No dedicated playlist-import button

- **WHEN** the user imports a YouTube playlist
- **THEN** they do so through the **same** paste/submit path as adding a single song, not through a separate menu item whose only purpose is playlist import
