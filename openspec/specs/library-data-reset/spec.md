# library-data-reset Specification

## Purpose

Define **client-side reset** of the local library (IndexedDB / Dexie): user-initiated **clear** of songs and playlists data with **confirmation**, **safe transactional** semantics, **post-reset invariants**, and **user-visible** outcomes—without sending data to a remote server.

## Requirements

### Requirement: Confirmation before clearing local library data

The system SHALL require **explicit user confirmation** after the user chooses to **clear** or **reset** local library data and **before** any destructive database write for that operation begins. The confirmation step SHALL include a **text input**; the system SHALL **not** proceed with the clear until **trimmed** input equals the literal **`delete`** (all lowercase).

#### Scenario: Confirmation gate

- **WHEN** the user invokes the clear/reset local library action
- **THEN** the system presents a confirmation step that describes that **saved songs and playlists** will be removed (or equivalent clear wording), includes a text field for typing **`delete`**, and **does not** erase data until the user has entered that string and confirms

#### Scenario: Confirm disabled until input matches

- **WHEN** the confirmation step is shown and the trimmed text input is empty or is not exactly **`delete`**
- **THEN** the control that commits the clear remains disabled or otherwise inoperative

#### Scenario: Clear proceeds only after typed confirmation

- **WHEN** the user has entered **`delete`** in the text input and activates the commit control
- **THEN** the system may perform the destructive clear operation

### Requirement: Client-side clear without remote transmission

The system SHALL perform the clear/reset **entirely client-side** such that library data is not **sent to a remote server** as part of the clear feature.

#### Scenario: Local-only operation

- **WHEN** the user completes a confirmed clear/reset
- **THEN** the implementation does not transmit IndexedDB library contents to a remote server for the purpose of clearing

### Requirement: Transactional clear of library tables

The system SHALL remove **songs**, **user and system playlist rows**, **playlist–song membership rows**, and **library-related `settings` rows** stored in the local database using a **single database transaction** (or equivalent atomicity) so that a failed operation does not leave a **partially** cleared library.

#### Scenario: Failure does not corrupt prior state

- **WHEN** an error occurs during the clear transaction before it commits
- **THEN** the prior library data remains intact or the user is left in a clearly defined safe state consistent with Dexie transaction behavior

### Requirement: Invariants after successful clear

After a successful clear/reset, the system SHALL restore **database invariants** required by the application (including the **Favorites** system playlist and valid **default playlist** setting behavior) so the app remains usable and consistent with a **fresh** local library.

#### Scenario: Usable app after clear

- **WHEN** clear/reset completes successfully
- **THEN** the user can navigate the library and playlists without errors caused by missing system playlists or invalid default settings

### Requirement: Offline-capable clear

The clear/reset operation SHALL **not** depend on network access for its core behavior (aside from application shell assets already loaded).

#### Scenario: Offline clear

- **WHEN** the user runs clear/reset while offline
- **THEN** the feature operates without network requests for transferring or deleting library data

### Requirement: User-visible outcomes for clear/reset

The system SHALL surface **success** or **failure** of clear/reset in a way perceivable to the user (e.g. status text, notification pattern, or disabled button state consistent with the rest of the app). The system SHALL **not** fail silently when clear/reset fails.

#### Scenario: Failure message

- **WHEN** clear/reset fails
- **THEN** the user receives a discernible error indication
