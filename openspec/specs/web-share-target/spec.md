# web-share-target Specification

## Purpose
TBD - created by archiving change add-songs-share-target. Update Purpose after archive.
## Requirements
### Requirement: Manifest declares a Web Share Target

The system SHALL include a **`share_target`** entry in the web app manifest so that supported platforms can offer Musicboxx as a destination when the user shares **text** or **links** from another application.

#### Scenario: Manifest includes share target

- **WHEN** a client inspects the deployed manifest
- **THEN** the manifest defines a share target with a documented **action** URL, **method**, and **params** mapping for `title`, `text`, and `url` (or equivalent keys required by the user agent)

### Requirement: Handle GET launch from share target

The system SHALL handle navigation to the share target **action** URL when opened with query parameters supplied by the platform for a share event.

#### Scenario: Incoming share with URL parameter

- **WHEN** the share target URL is opened with a `url` query parameter containing a supported **YouTube** link, **Spotify track** link, or **Apple Music track** link
- **THEN** the application uses that value as input to the same add-song processing as manual URL entry

#### Scenario: Incoming share with text only

- **WHEN** the share target URL is opened such that a YouTube link, Spotify track link, or Apple Music track link appears in `text` but not in `url`
- **THEN** the application extracts a supported URL from `text` and proceeds with add-song processing

#### Scenario: Incoming share with no usable music URL

- **WHEN** neither `url` nor `text` yields a supported YouTube URL, Spotify track URL/URI, or Apple Music track URL after extraction
- **THEN** the application shows a clear validation error and SHALL NOT create a song record

### Requirement: Platform expectations documented for authors

The system documentation or product-facing notes SHALL state that appearing in the **system share sheet** as Musicboxx depends on **OS and browser** support (notably Android Chrome with an **installed** PWA) and MAY NOT be available in all environments.

#### Scenario: Author understands limitation

- **WHEN** an author or user reads the documented share-target guidance
- **THEN** the documentation explains that install and platform affect visibility in the share list
