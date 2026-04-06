# youtube-playlist-import Specification

## Purpose

Import **YouTube playlist** content into Musicboxx using the **Invidious** HTTP API (`/api/v1/playlists/<youtube_playlist_id>`), create or update **local playlists** and **song** records, and persist a **source YouTube playlist reference** for future features. Classification of **playlist vs single video** happens in the **same** add-URL flow as single songs—**no** separate button or menu item dedicated to playlist import.

## ADDED Requirements

### Requirement: Background detection of YouTube playlist URLs

The system SHALL classify user-submitted text in the **standard add-song / paste-URL flow** **without** requiring the user to choose “playlist” vs “video” beforehand. When the parsed input contains a **YouTube playlist id** (e.g. via `list=` or equivalent supported patterns), the system SHALL treat the submission as a **playlist import** candidate and SHALL NOT complete a single-video add solely based on a concurrent `v=` parameter until the playlist path has been resolved per product rules. When the input yields only a **single video** and **no** playlist id, the system SHALL follow the existing single-video behavior.

#### Scenario: Playlist URL uses list parameter

- **WHEN** the user submits a URL that includes a `list=` playlist identifier in the add-song flow
- **THEN** the system detects the playlist id and proceeds toward playlist import (Invidious fetch and subsequent prompts) without a separate “import playlist” control

#### Scenario: Single video URL without playlist

- **WHEN** the user submits a URL that yields only a video id and no playlist id
- **THEN** the system follows the existing single-video add behavior and does not require playlist import prompts

### Requirement: Parse YouTube playlist URL to playlist id

The system SHALL extract a **YouTube playlist id** from user-provided text when it matches supported **playlist** URL patterns (including URLs with a `list=` query parameter and common `youtube.com` / `youtu.be` variants that denote a playlist). The system SHALL NOT treat a bare **video-only** URL without a playlist id as a playlist import.

#### Scenario: Unsupported input

- **WHEN** the user submits text that does not yield a playlist id but is also not a valid single-song URL per `song-catalog`
- **THEN** the system shows a clear validation error and SHALL NOT call the Invidious playlist API

### Requirement: Fetch playlist contents via Invidious

The system SHALL request playlist data from an Invidious-compatible API using **GET** `{base}/api/v1/playlists/{youtube_playlist_id}` where `{base}` is the configured Invidious base URL **without trailing slash** (default **`https://inv.nadeko.net`**) and `{youtube_playlist_id}` is the extracted id. The system SHALL parse the response to obtain **video identifiers** for each listed item. If the API or network fails, the system SHALL show a clear error and SHALL NOT partially persist songs without a defined completion policy.

#### Scenario: Successful fetch

- **WHEN** the Invidious API returns a successful response with one or more videos
- **THEN** the system obtains a list of YouTube video ids (or equivalent fields) to pass to the existing song-creation flow

#### Scenario: Empty playlist

- **WHEN** the playlist contains no videos
- **THEN** the system informs the user and does not create duplicate empty state beyond that message

#### Scenario: Fetch failure

- **WHEN** the request fails (network error, non-success status, or unparseable response)
- **THEN** the system shows a clear error and does not claim success

### Requirement: Import mode choice after playlist detection

When **background detection** identifies a **YouTube playlist**, the system SHALL prompt the user to choose one of: **create a new Musicboxx playlist** containing the imported songs, **or** **add all imported songs** to an **existing** playlist when a **playlist context** is available (see **`playlists`** capability). The system SHALL proceed according to the chosen mode.

#### Scenario: Create new local playlist

- **WHEN** the user chooses to create a new playlist
- **THEN** the system creates a new Musicboxx playlist and adds each imported song to that playlist per the product’s membership rules, **and** persists the YouTube playlist reference on that new playlist when applicable

#### Scenario: Add to context playlist

- **WHEN** the user chooses to add songs to the **current context playlist** and such a context exists
- **THEN** the system adds each imported song to that playlist’s membership without requiring a new playlist row, **and** persists the YouTube playlist reference on that playlist when applicable

#### Scenario: No context for merge

- **WHEN** no **playlist context** is available for “add to existing” (e.g. paste from a surface that is not playlist-scoped)
- **THEN** the system SHALL NOT silently merge into an arbitrary playlist; it SHALL offer **create new playlist** (or equivalent) consistent with the UI

### Requirement: Song creation matches existing catalog rules

For each imported video id, the system SHALL create or resolve **song** records using the **same** rules as single-URL YouTube adds: **deduplication** by video id, **metadata** resolution when available, and **no** duplicate catalog rows for the same video id.

#### Scenario: Duplicate video already in library

- **WHEN** an imported video id already exists in the catalog
- **THEN** the system does not create a second song record and **still** adds membership to the target playlist(s) when that song is not already a member as required by the chosen mode

### Requirement: Persist YouTube playlist source reference

When an import from a YouTube playlist **completes successfully** for a target Musicboxx playlist, the system SHALL persist that playlist’s **YouTube playlist id** on the Musicboxx playlist record **and** SHALL persist a **canonical YouTube playlist URL** (or equivalent stable reference string) suitable for future features (e.g. opening the playlist on YouTube).

#### Scenario: Reference survives reload

- **WHEN** the user reloads the application after a successful import
- **THEN** the stored YouTube playlist id and canonical URL reference remain available on the playlist record

### Requirement: Default and optional Invidious base URL configuration

The system SHALL use **`https://inv.nadeko.net`** as the **default** Invidious base URL for `api/v1` playlist requests. The system SHALL allow the user to **override** the base URL in settings so that users can work around **CORS** or instance availability when the default fails.

#### Scenario: Default instance

- **WHEN** the user has not overridden the Invidious base URL
- **THEN** playlist import requests use `https://inv.nadeko.net` as `{base}` for `{base}/api/v1/playlists/...`

#### Scenario: User overrides base URL

- **WHEN** the user sets a valid Invidious base URL in settings (or equivalent)
- **THEN** playlist import requests use that value as `{base}` instead of the default
