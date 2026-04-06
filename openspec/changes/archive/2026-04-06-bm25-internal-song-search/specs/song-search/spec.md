## ADDED Requirements

### Requirement: BM25 full-text search over local songs

The system SHALL provide **full-text search** over song records stored locally in IndexedDB using **BM25 relevance ranking** via a **published npm dependency** that implements BM25-style retrieval (e.g. Lunr). Search SHALL use text from persisted fields including **title**, **author**, **primaryArtist**, and **albumTitle** when present. The system SHALL NOT send song text to a remote service for ranking.

#### Scenario: Query returns ranked matches

- **WHEN** the user enters a non-empty search query on the Library home
- **THEN** the system ranks songs by relevance to that query and presents matching songs ordered by relevance (ties broken deterministically, e.g. by existing sort key such as `createdAt`)

#### Scenario: Empty query shows full library

- **WHEN** the search query is empty or only whitespace
- **THEN** the system shows the full song list in the default Library order (newest first) as before this capability

### Requirement: Search input on Library home

The system SHALL show a **search input** on the **home** screen (the `/` route, Library). The control SHALL have an accessible name (e.g. label or `aria-label`) identifying it as library or song search. The control SHALL be usable with keyboard and SHALL not prevent navigation to individual songs when results are shown.

#### Scenario: Search visible on home

- **WHEN** the user opens the application home (Library)
- **THEN** a search field is visible without navigating to another tab or screen

#### Scenario: Navigate to song from results

- **WHEN** the user selects a song row from search results
- **THEN** the system navigates to the same song detail behavior as for the non-search library list

### Requirement: Index stays consistent with catalog changes

The system SHALL keep search results consistent with the current song catalog: after songs are added, updated, or removed, subsequent searches SHALL reflect those changes without requiring a full page reload.

#### Scenario: New song appears in search

- **WHEN** a new song is saved to the catalog and the user searches for text present on that song’s indexed fields
- **THEN** that song MAY appear in the search results for a matching query
