## ADDED Requirements

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
