# playlists (delta)

## ADDED Requirements

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

## MODIFIED Requirements

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

### Requirement: Nested playlist creation affordance

The system SHALL provide a **primary control** (e.g. **`+`**) on each playlist in the hierarchical **Playlists** overview so the user can create a **new child playlist** under that playlist. The system SHALL also expose the **same** nested-create action via the **overflow menu** on each overview row (see **Playlists overview row overflow menu**). The system SHALL provide the **same pattern** on **playlist detail**: a control to add a child under the **current** playlist and a control beside each **listed sub-playlist** to add under that child. Activating any such control SHALL open a **modal** (or equivalent dialog) where the user enters the new playlist’s **name** and confirms before the playlist is created.

#### Scenario: Add child from overview

- **WHEN** the user activates the nested-create control beside a playlist in the overview
- **THEN** the system prompts for a name in a modal and, after confirmation with a valid non-empty name, creates the playlist with that playlist as **parent**

#### Scenario: Add child from playlist detail

- **WHEN** the user activates the nested-create control for the current playlist or for a sub-playlist row on playlist detail
- **THEN** the system opens the same modal pattern and, on success, creates the child under the corresponding parent playlist

#### Scenario: Modal validation

- **WHEN** the user attempts to confirm creation with an empty or whitespace-only name in the nested-create modal
- **THEN** the system rejects the action with a clear validation message

### Requirement: Persist playlists locally

The system SHALL persist playlists and playlist–song memberships in **browser local storage** together with songs. Playlist records SHALL persist each playlist’s **optional parent playlist reference** so the hierarchy survives reloads. The system SHALL persist the **default playlist for new songs** so it survives reloads.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the PWA
- **THEN** playlists, their names, parent relationships, memberships, and the **default playlist** setting are restored
