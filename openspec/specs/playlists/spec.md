# playlists Specification

## Purpose
TBD - created by archiving change musicboxx-pwa. Update Purpose after archive.
## Requirements
### Requirement: Seed default Favorites playlist

The system SHALL ensure a playlist named **Favorites** exists on first run (empty until the user adds songs).

#### Scenario: First launch

- **WHEN** the application runs for the first time with no existing local data
- **THEN** a playlist with the name “Favorites” exists and is treated as the default playlist

### Requirement: New songs belong to Favorites by default

The system SHALL add every newly created song to the **Favorites** playlist membership.

#### Scenario: Add song after first launch

- **WHEN** a new song record is successfully created from a pasted URL
- **THEN** that song is a member of the **Favorites** playlist

### Requirement: User-created playlists

The system SHALL allow the user to create additional playlists with a user-provided name.

#### Scenario: Create playlist

- **WHEN** the user creates a playlist with a non-empty name
- **THEN** a new playlist appears in the playlist list and can receive song assignments

#### Scenario: Reject empty name

- **WHEN** the user attempts to create a playlist with an empty or whitespace-only name
- **THEN** the system rejects the action with a clear validation message

### Requirement: Organize songs across playlists

The system SHALL allow a song to be associated with **one or more** playlists (many-to-many), including **Favorites** and user playlists.

#### Scenario: Add song to another playlist

- **WHEN** the user adds an existing song to a user-created playlist
- **THEN** the song remains in **Favorites** unless the user explicitly removes it from **Favorites**

#### Scenario: Remove song from a playlist

- **WHEN** the user removes a song from a specific playlist
- **THEN** the song is removed only from that playlist’s membership and remains stored in the catalog unless the user deletes the song globally (if such an action exists)

### Requirement: Persist playlists locally

The system SHALL persist playlists and playlist–song memberships in **browser local storage** together with songs.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the PWA
- **THEN** playlists, their names, and memberships are restored

