# playlists (delta)

## ADDED Requirements

### Requirement: Hierarchical playlists

The system SHALL model playlists as a **tree**: each playlist MAY reference at most one **parent playlist**, forming a hierarchy with **no cycles**.

#### Scenario: Parent reference

- **WHEN** a playlist record is stored
- **THEN** it MAY include an optional parent playlist identifier, and the system SHALL reject any update that would create a **cycle** in the parent graph

#### Scenario: Favorites stays top-level

- **WHEN** the system validates or persists the **Favorites** playlist
- **THEN** it SHALL NOT assign a parent playlist to **Favorites**

### Requirement: Subtree song list is deduplicated

When displaying songs for a selected playlist **P**, the system SHALL include every song that is a **direct** member of **P** or of **any descendant playlist** of **P** under the parent relationship, and SHALL present **at most one row per song** (deduplicated by song identity).

#### Scenario: Song in multiple branches

- **WHEN** the same song is a direct member of two different descendant playlists under **P**
- **THEN** the subtree view for **P** still shows that song **once**

#### Scenario: Song in parent and child

- **WHEN** a song is a direct member of **P** and also of a child playlist under **P**
- **THEN** the subtree view for **P** shows that song **once**

### Requirement: Navigate empty playlists

The system SHALL allow the user to **open** a playlist that has **no songs** in its subtree (including playlists that only serve as containers for child playlists).

#### Scenario: Empty container

- **WHEN** a playlist has no direct songs and no songs in any descendant playlist
- **THEN** the user can still navigate to that playlist’s view without error

### Requirement: Playlists overview reflects hierarchy

The system SHALL present playlists in the overview (or equivalent entry surface) such that **child playlists** are associated with their **parent** (e.g. nesting, grouping, or indentation), not only as a single flat undifferentiated list.

#### Scenario: Child visible under parent

- **WHEN** a user-created playlist has a parent playlist
- **THEN** the overview makes that relationship visible relative to a playlist with no parent at the same level

### Requirement: Nested playlist creation affordance

The system SHALL provide a **primary control** (e.g. **`+`**) on each playlist in the hierarchical **Playlists** overview so the user can create a **new child playlist** under that playlist. The system SHALL provide the **same pattern** on **playlist detail**: a control to add a child under the **current** playlist and a control beside each **listed sub-playlist** to add under that child. Activating any such control SHALL open a **modal** (or equivalent dialog) where the user enters the new playlist’s **name** and confirms before the playlist is created.

#### Scenario: Add child from overview

- **WHEN** the user activates the nested-create control beside a playlist in the overview
- **THEN** the system prompts for a name in a modal and, after confirmation with a valid non-empty name, creates the playlist with that playlist as **parent**

#### Scenario: Add child from playlist detail

- **WHEN** the user activates the nested-create control for the current playlist or for a sub-playlist row on playlist detail
- **THEN** the system opens the same modal pattern and, on success, creates the child under the corresponding parent playlist

#### Scenario: Modal validation

- **WHEN** the user attempts to confirm creation with an empty or whitespace-only name in the nested-create modal
- **THEN** the system rejects the action with a clear validation message

### Requirement: Ancestor navigation on playlist detail

When the user views **playlist detail** for a playlist that has a **parent playlist** (i.e. it is not top-level), the system SHALL show **navigable links to each ancestor playlist** in order from the **root** of the ancestor chain through the **immediate parent**, so the user may open any upper playlist individually. Playlists with **no** parent SHALL NOT show this ancestor strip.

#### Scenario: Nested playlist shows ancestor links

- **WHEN** the user opens playlist detail for a playlist that has a parent
- **THEN** the system displays a compact navigation control (e.g. breadcrumb) with a link to each ancestor playlist from root to immediate parent

#### Scenario: Top-level playlist omits ancestor strip

- **WHEN** the user opens playlist detail for a playlist with no parent playlist
- **THEN** the ancestor navigation strip is not shown

## MODIFIED Requirements

### Requirement: Seed default Favorites playlist

The system SHALL ensure a playlist named **Favorites** exists on first run (empty until the user adds songs). The **Favorites** playlist SHALL **not** have a parent playlist.

#### Scenario: First launch

- **WHEN** the application runs for the first time with no existing local data
- **THEN** a playlist with the name “Favorites” exists and is treated as the default playlist
- **AND** it has no parent playlist

### Requirement: User-created playlists

The system SHALL allow the user to create additional playlists with a user-provided name. The user SHALL be able to create a playlist **optionally under** an existing parent playlist (subject to cycle and **Favorites** top-level rules). New playlists SHALL appear in the **hierarchical** playlist overview and SHALL be able to receive **direct** song assignments.

#### Scenario: Create playlist

- **WHEN** the user creates a playlist with a non-empty name
- **THEN** a new playlist appears in the playlist overview and can receive **direct** song memberships

#### Scenario: Create child playlist

- **WHEN** the user creates a playlist with a non-empty name **and** an allowed parent playlist (e.g. via the nested-create control and modal, or equivalent)
- **THEN** the new playlist is stored with that parent and appears under that parent in the overview

#### Scenario: Reject empty name

- **WHEN** the user attempts to create a playlist with an empty or whitespace-only name
- **THEN** the system rejects the action with a clear validation message

### Requirement: Persist playlists locally

The system SHALL persist playlists and playlist–song memberships in **browser local storage** together with songs. Playlist records SHALL persist each playlist’s **optional parent playlist reference** so the hierarchy survives reloads.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the PWA
- **THEN** playlists, their names, parent relationships, and memberships are restored
