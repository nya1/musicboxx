# playlists (delta)

## ADDED Requirements

### Requirement: Playlist accent color

Each playlist SHALL have a persisted **accent color** used as the primary visual differentiator for that playlist in the UI. The stored value SHALL be a **CSS hex color** in the form `#` followed by six hexadecimal digits (example: `#4f46e5`).

#### Scenario: Color is part of playlist data

- **WHEN** a playlist record is read for display or editing
- **THEN** that record includes an accent color suitable for applying to UI chrome associated with that playlist

### Requirement: Auto-assign accent color when creating a playlist

- **WHEN** the user creates a new playlist (top-level or nested) and the system persists the new row
- **THEN** the system SHALL assign an accent color automatically without requiring a separate color step
- **AND** the chosen color SHALL come from the product’s curated palette or an equivalent deterministic scheme that avoids duplicate-looking defaults where practical

#### Scenario: New playlist has a color immediately

- **WHEN** a playlist is successfully created with a valid name
- **THEN** the new playlist’s stored record includes an accent color before the user opens any color editor

### Requirement: Seed Favorites with accent color

When the **Favorites** playlist is created during initial library setup, it SHALL be stored with a **product-defined** accent color consistent with other playlists.

#### Scenario: First launch includes Favorites color

- **WHEN** the application runs for the first time and seeds the default **Favorites** playlist
- **THEN** that playlist record includes a persisted accent color

### Requirement: Change playlist accent color from overflow menu

The system SHALL allow the user to **change** a playlist’s accent color from the **Playlists overview** overflow menu for that playlist. The UI SHALL offer a clear way to pick a color (e.g. preset swatches and/or a color input) and SHALL persist the choice. The updated color SHALL appear everywhere that playlist’s accent is shown (overview and playlist detail).

#### Scenario: User updates color from menu

- **WHEN** the user opens the overflow menu for a playlist row, chooses the action that changes color, selects a new color, and confirms if confirmation is required
- **THEN** the playlist’s stored accent color is updated and the overview reflects the new color

### Requirement: Playlist accent visible in overview and detail

The system SHALL display each playlist’s accent color in the **hierarchical Playlists overview** so that sibling and nested rows are visually distinguishable. The system SHALL also display the same playlist’s accent on **playlist detail** in connection with that playlist’s identity (e.g. header or title region).

#### Scenario: Overview shows accent

- **WHEN** the user views the Playlists overview
- **THEN** each playlist row uses that playlist’s accent color in a consistent, visible way (e.g. leading indicator or row edge)

#### Scenario: Detail shows accent

- **WHEN** the user opens playlist detail for a playlist
- **THEN** the UI reflects that playlist’s accent color in the playlist identity region

## MODIFIED Requirements

### Requirement: Playlists overview row overflow menu

The system SHALL show a **secondary control** (e.g. **⋯** / “more”) on each playlist row in the hierarchical **Playlists** overview beside the existing primary actions. Activating it SHALL open a **menu** (or equivalent) with at least: **Rename**, **Set as default playlist**, **Create nested playlist**, **Move to folder**, **Change color** (or an equally clear label for editing the playlist’s accent color), and **Delete** (labels MAY be shortened if the menu remains clear). **Create nested playlist** SHALL use the **same** nested-create flow (e.g. name modal) as the **`+`** control, with that row’s playlist as the parent. **Delete** SHALL be omitted or disabled for playlists that the system does not allow the user to delete (e.g. **Favorites**).

#### Scenario: Open menu from overview

- **WHEN** the user activates the overflow control on a playlist row in the Playlists overview
- **THEN** a menu opens with the actions above (subject to eligibility for that playlist)

#### Scenario: Nested create from menu matches plus

- **WHEN** the user chooses **Create nested playlist** from the overflow menu for a given playlist
- **THEN** the system opens the same nested-create modal pattern as the **`+`** control for that playlist and, on success, creates the child under that playlist

### Requirement: Persist playlists locally

The system SHALL persist playlists and playlist–song memberships in **browser local storage** together with songs. Playlist records SHALL persist each playlist’s **optional parent playlist reference** so the hierarchy survives reloads. Playlist records SHALL persist each playlist’s **accent color**. The system SHALL persist the **default playlist for new songs** so it survives reloads.

#### Scenario: Reload app

- **WHEN** the user reloads or reopens the PWA
- **THEN** playlists, their names, **accent colors**, parent relationships, memberships, and the **default playlist** setting are restored
