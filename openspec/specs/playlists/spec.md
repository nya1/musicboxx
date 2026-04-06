# playlists Specification

## Purpose

Playlists organize songs in Musicboxx: a default **Favorites** list, user-created playlists, optional **nesting** (parent/child), subtree views with deduplication, **ancestor links** on nested playlist detail, a **Playlists** overview **overflow menu** (rename, default playlist, nested create, move, delete), **user-configurable default playlist** for new songs, and local persistence in the browser.

## Requirements

### Requirement: Seed default Favorites playlist

The system SHALL ensure a playlist named **Favorites** exists on first run (empty until the user adds songs). The **Favorites** playlist SHALL **not** have a parent playlist.

#### Scenario: First launch

- **WHEN** the application runs for the first time with no existing local data
- **THEN** a playlist with the name “Favorites” exists and is the **initial** default playlist for new songs until the user configures otherwise
- **AND** it has no parent playlist

### Requirement: New songs belong to Favorites by default

The system SHALL add every newly created song to the **configured default playlist** (see **User-configurable default playlist for new songs**). Until the user changes the default, that playlist SHALL be **Favorites**.

#### Scenario: Add song after first launch

- **WHEN** a new song record is successfully created from a pasted URL
- **THEN** that song is a member of the **default playlist** (initially **Favorites**)

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

The system SHALL provide a way to create a **new child playlist** under each playlist in the hierarchical **Playlists** overview: the **overflow menu** on each overview row (see **Playlists overview row overflow menu**) with **Create nested playlist**, and optionally other controls (e.g. **`+`**) if present. The system SHALL provide the **same pattern** on **playlist detail**: a control to add a child under the **current** playlist and a control beside each **listed sub-playlist** to add under that child. Activating any such control SHALL open a **modal** (or equivalent dialog) where the user enters the new playlist’s **name** and confirms before the playlist is created.

#### Scenario: Add child from overview

- **WHEN** the user activates **Create nested playlist** from the overflow menu (or an equivalent nested-create control) for a playlist in the overview
- **THEN** the system prompts for a name in a modal and, after confirmation with a valid non-empty name, creates the playlist with that playlist as **parent**

#### Scenario: Add child from playlist detail

- **WHEN** the user activates the nested-create control for the current playlist or for a sub-playlist row on playlist detail
- **THEN** the system opens the same modal pattern and, on success, creates the child under the corresponding parent playlist

#### Scenario: Modal validation

- **WHEN** the user attempts to confirm creation with an empty or whitespace-only name in the nested-create modal
- **THEN** the system rejects the action with a clear validation message

### Requirement: Playlists overview row overflow menu

The system SHALL show a **secondary control** (e.g. **⋯** / “more”) on each playlist row in the hierarchical **Playlists** overview beside the existing primary actions. Activating it SHALL open a **menu** (or equivalent) with at least: **Rename**, **Set as default playlist**, **Create nested playlist**, **Move to folder**, and **Delete** (labels MAY be shortened if the menu remains clear). **Create nested playlist** SHALL use the **same** nested-create flow (e.g. name modal) as the **`+`** control, with that row’s playlist as the parent. **Delete** SHALL be omitted or disabled for playlists that the system does not allow the user to delete (e.g. **Favorites**).

#### Scenario: Open menu from overview

- **WHEN** the user activates the overflow control on a playlist row in the Playlists overview
- **THEN** a menu opens with the actions above (subject to eligibility for that playlist)

#### Scenario: Nested create from menu matches plus

- **WHEN** the user chooses **Create nested playlist** from the overflow menu for a given playlist
- **THEN** the system opens the same nested-create modal pattern as the **`+`** control for that playlist and, on success, creates the child under that playlist

### Requirement: Rename playlist from overview

The system SHALL allow the user to **rename** a playlist from the Playlists overview overflow menu. The UI SHALL collect a **non-empty** name (after trimming); the system SHALL reject empty or whitespace-only names with a clear validation message. The updated name SHALL persist and appear everywhere that playlist is shown (overview, detail, breadcrumbs).

#### Scenario: Successful rename

- **WHEN** the user chooses **Rename**, enters a valid non-empty name, and confirms
- **THEN** the playlist’s stored name is updated and the playlist row shows the new name

#### Scenario: Reject empty name

- **WHEN** the user attempts to confirm rename with an empty or whitespace-only name
- **THEN** the system rejects the action with a clear validation message

### Requirement: User-configurable default playlist for new songs

The system SHALL persist exactly one **default playlist** identifier used when **new songs** are added to the library (same role as **Favorites** in the initial product). On first install or before any user choice, the default SHALL be the **Favorites** playlist. The user SHALL be able to **set another playlist as default** from the Playlists overview (e.g. via the overflow menu). The overview SHALL indicate which playlist is currently the default (e.g. a **Default** badge on that row). **Favorites** SHALL remain a normal playlist row that MAY or MAY NOT be the current default.

#### Scenario: Initial default is Favorites

- **WHEN** no user override has been stored
- **THEN** new songs are added to the **Favorites** playlist membership and the UI treats **Favorites** as the default playlist for labeling

#### Scenario: User sets a different default

- **WHEN** the user sets a user-created playlist as the default from the overview
- **THEN** subsequent new songs are added to that playlist’s membership (and the UI shows that playlist as default)

#### Scenario: Default survives reload

- **WHEN** the user has set a non-Favorites default and reloads the app
- **THEN** the same playlist remains the default and new songs follow it

### Requirement: Move playlist to another folder

The system SHALL allow the user to **change the parent** of a user playlist (reparent / “move to folder”) from the Playlists overview, subject to existing hierarchy rules (**no cycles**, **Favorites** remains top-level only). The UI SHALL let the user pick a **new parent** among allowed targets (e.g. another playlist as folder, or **top level**). The system SHALL reject invalid targets with a clear message.

#### Scenario: Move under another playlist

- **WHEN** the user chooses **Move to folder** and selects an allowed parent playlist that is not the moved playlist or its descendant
- **THEN** the playlist is stored with that `parentId` and appears under that parent in the overview

#### Scenario: Move to top level

- **WHEN** the user chooses **top level** (no parent) for an allowed playlist
- **THEN** the playlist has no parent and appears at the top level of the tree (except where rules forbid, e.g. **Favorites**)

#### Scenario: Reject cycle

- **WHEN** the user attempts to move a playlist under itself or under one of its descendants
- **THEN** the system rejects the action and does not persist an invalid parent

### Requirement: Delete user playlist from overview

The system SHALL allow the user to **delete** a user playlist from the overflow menu when permitted. **Favorites** (and other system playlists the product defines as non-deletable) SHALL NOT be deletable. Deleting a playlist SHALL remove its **playlist–song** memberships for that playlist and SHALL NOT remove songs from the global song catalog. If the playlist **has child playlists**, the system SHALL **block** deletion until those children are moved or deleted, with a clear message. The system SHALL ask for **confirmation** before completing delete when the playlist has direct song members or when the action is otherwise destructive.

#### Scenario: Delete leaf user playlist

- **WHEN** the user deletes a user playlist that has **no child playlists** and confirms any confirmation step
- **THEN** the playlist is removed and its direct memberships are removed; songs remain in the catalog and other playlists

#### Scenario: Block delete when children exist

- **WHEN** the user attempts to delete a playlist that has one or more child playlists
- **THEN** the system rejects the action and explains that child playlists must be moved or deleted first

#### Scenario: Cannot delete Favorites

- **WHEN** the user attempts to delete **Favorites**
- **THEN** the action is not available or is rejected with a clear explanation

### Requirement: Ancestor navigation on playlist detail

When the user views **playlist detail** for a playlist that has a **parent playlist** (i.e. it is not top-level), the system SHALL show **navigable links to each ancestor playlist** in order from the **root** of the ancestor chain through the **immediate parent**, so the user may open any upper playlist individually. Playlists with **no** parent SHALL NOT show this ancestor strip.

#### Scenario: Nested playlist shows ancestor links

- **WHEN** the user opens playlist detail for a playlist that has a parent
- **THEN** the system displays a compact navigation control (e.g. breadcrumb) with a link to each ancestor playlist from root to immediate parent

#### Scenario: Top-level playlist omits ancestor strip

- **WHEN** the user opens playlist detail for a playlist with no parent playlist
- **THEN** the ancestor navigation strip is not shown

### Requirement: Organize songs across playlists

The system SHALL allow a song to be associated with **one or more** playlists (many-to-many), including **Favorites** and user playlists.

#### Scenario: Add song to another playlist

- **WHEN** the user adds an existing song to a user-created playlist
- **THEN** the song remains in **Favorites** unless the user explicitly removes it from **Favorites**

#### Scenario: Remove song from a playlist

- **WHEN** the user removes a song from a specific playlist
- **THEN** the song is removed only from that playlist’s membership and remains stored in the catalog unless the user deletes the song globally (if such an action exists)

### Requirement: Persist playlists locally

The system SHALL persist playlists and playlist–song memberships in **browser local storage** together with songs. Playlist records SHALL persist each playlist’s **optional parent playlist reference** so the hierarchy survives reloads. The system SHALL persist the **default playlist for new songs** so it survives reloads.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the PWA
- **THEN** playlists, their names, parent relationships, memberships, and the **default playlist** setting are restored
