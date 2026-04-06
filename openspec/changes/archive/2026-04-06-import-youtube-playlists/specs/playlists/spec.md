# playlists (delta)

## ADDED Requirements

### Requirement: Playlist context for YouTube playlist import

When the **`youtube-playlist-import`** flow offers **add all songs to an existing playlist**, the **target playlist** SHALL be the **current playlist context** when the user initiated the add from a **playlist-scoped** surface (e.g. viewing **playlist detail** for that playlist). The system SHALL NOT add a dedicated **overflow** or **toolbar** control whose sole purpose is to start playlist import; entry SHALL remain the **same** paste/add flow as single songs.

#### Scenario: Import merge target from playlist detail

- **WHEN** the user pastes a YouTube playlist URL while the UI has an active **playlist context** for playlist **P** (e.g. playlist detail for **P**)
- **AND** the user chooses to add imported songs to the existing playlist
- **THEN** the target playlist is **P**

### Requirement: Playlist record stores optional YouTube playlist source

The system SHALL persist optional **YouTube playlist source** fields on a **Musicboxx playlist** record when populated by **import** from a YouTube playlist: at minimum the **YouTube playlist id** and a **canonical YouTube playlist URL** string for future use. These fields SHALL be optional and SHALL NOT be required for playlists created without YouTube import.

#### Scenario: Import stores reference

- **WHEN** a YouTube playlist import completes successfully for a given Musicboxx playlist
- **THEN** that playlist’s stored record includes the YouTube playlist id and canonical URL reference

#### Scenario: Playlists without import

- **WHEN** a playlist is created or edited without YouTube import
- **THEN** those optional fields may be absent
