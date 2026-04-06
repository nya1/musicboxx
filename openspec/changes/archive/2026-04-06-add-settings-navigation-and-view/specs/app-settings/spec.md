## ADDED Requirements

### Requirement: Settings entry in primary navigation

The system SHALL include a **Settings** entry in the primary navigation chrome (same surface as Library, Playlists, and Add) that navigates to the Settings view.

#### Scenario: Settings link visible

- **WHEN** the user views the main application shell with the primary navigation visible
- **THEN** a control labeled for **Settings** is present and navigates to the Settings route

#### Scenario: Active state

- **WHEN** the Settings route is active
- **THEN** the Settings navigation control reflects the active state using the same visual convention as other primary destinations

### Requirement: Settings route and page

The system SHALL register a **Settings** route reachable from the client-side router (under the same application basename as other routes) and SHALL render a dedicated Settings page as the main content for that route.

#### Scenario: Direct navigation

- **WHEN** the user opens the Settings URL path
- **THEN** the Settings page is shown within the application shell

### Requirement: Settings layout and sections

The Settings page SHALL present content in **distinct sections** with clear headings, including at minimum **Appearance** (or equivalent) for theme-related preferences and **Data** or **Library data** (or equivalent) for future backup and import/export concerns.

#### Scenario: Appearance section

- **WHEN** the user opens the Settings page
- **THEN** a section exists that exposes the **appearance** preference (light / dark / system or equivalent) consistent with existing theme behavior

#### Scenario: Data management section

- **WHEN** the user opens the Settings page
- **THEN** a section exists that explains **data** or **library** backup and import/export as a **future** capability and does not claim completed backup or import/export unless those features are implemented

### Requirement: Accessibility of Settings navigation

The system SHALL expose an **accessible name** for the Settings navigation control and SHALL maintain focus-visible styling consistent with other primary navigation links.

#### Scenario: Assistive technology

- **WHEN** the user navigates primary navigation with the keyboard or assistive technology
- **THEN** the Settings control has a discernible accessible name and participates in a logical focus order

### Requirement: Offline and local-first behavior

The Settings view SHALL load without requiring network access for its static structure and locally stored preferences.

#### Scenario: Offline shell

- **WHEN** the user opens Settings while the application shell is available offline
- **THEN** the Settings page structure and locally persisted preferences (e.g. appearance) remain available without network requests
