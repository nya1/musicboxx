# song-catalog (delta)

## ADDED Requirements

### Requirement: Paste flow branches on YouTube playlist detection

The system SHALL handle a pasted or submitted URL in the **add a song** flow by **classifying** it as a **YouTube playlist import** (playlist id present), a **single YouTube video**, or **unsupported**, **without** requiring a separate user action to select “import playlist” before paste. Playlist detection SHALL run as part of the same submission handling used for single-video adds.

#### Scenario: Same entrypoint for playlist and video

- **WHEN** the user submits a URL in the add-song flow
- **THEN** the system applies background classification and either proceeds with playlist import per **`youtube-playlist-import`** or with single-video resolution per existing **`song-catalog`** rules

#### Scenario: No dedicated playlist-import button

- **WHEN** the user imports a YouTube playlist
- **THEN** they do so through the **same** paste/submit path as adding a single song, not through a separate menu item whose only purpose is playlist import
