# local-database-export-import Specification

## Purpose

Define **client-side export and import** of the full local library (IndexedDB / Dexie) as a **versioned JSON** snapshot, including validation, atomic replace import, and user-visible outcomes—without sending library data to a remote server.

## Requirements

### Requirement: Versioned JSON export document

The system SHALL serialize the local IndexedDB-backed library to a **JSON document** that includes a numeric **`schemaVersion`**, an **`exportedAt`** value in **ISO 8601** form, and payload data for **`songs`**, **`playlists`**, **`playlistSongs`**, and **`settings`** consistent with the Dexie table shapes at export time.

#### Scenario: Schema version present

- **WHEN** a user completes an export
- **THEN** the downloaded document includes a **`schemaVersion`** the implementation recognizes for import

#### Scenario: Snapshot completeness

- **WHEN** a user completes an export
- **THEN** the document includes all rows from **`songs`**, **`playlists`**, **`playlistSongs`**, and **`settings`** at the time of export

### Requirement: Export without remote transmission

The system SHALL implement export **entirely client-side** such that library data is not **sent to a remote server** as part of the export feature.

#### Scenario: Download from Settings

- **WHEN** the user invokes export from the Settings **Library data** section
- **THEN** the browser downloads the JSON document using a normal user-initiated download flow

### Requirement: Import validation before write

The system SHALL **parse** the chosen file, verify **`schemaVersion`** is **supported**, and verify **referential integrity** (including **`playlistSongs`** pointing at existing **`playlistId`** and **`songId`**, and playlist **`parentId`** references when present). If validation fails, the system SHALL **abort** without modifying existing library data.

#### Scenario: Unsupported version

- **WHEN** the document’s **`schemaVersion`** is not supported
- **THEN** the system rejects import and the existing database remains unchanged

#### Scenario: Broken references

- **WHEN** the document fails referential integrity checks
- **THEN** the system rejects import and the existing database remains unchanged

### Requirement: Import replaces library atomically

The system SHALL support **import** that **replaces** the current local library with the validated payload **only after** the user explicitly confirms that existing data will be overwritten. The system SHALL apply the replacement in an **atomic** database operation (single transaction or equivalent) so that a failed import does not leave a **partially** applied library.

#### Scenario: Confirmation gate

- **WHEN** the user selects a file to import
- **THEN** the system requires explicit confirmation before overwriting existing data

#### Scenario: Failure does not corrupt prior state

- **WHEN** an error occurs during the write phase after validation succeeded
- **THEN** the prior library data remains intact or the user is left in a clearly defined safe state consistent with Dexie transaction behavior

### Requirement: Invariants after import

After a successful import, the system SHALL ensure database **invariants** required by the application (including the **Favorites** system playlist and valid **default playlist** setting behavior) hold so the app remains usable.

#### Scenario: App usable after import

- **WHEN** import completes successfully
- **THEN** the user can navigate the library and Settings without errors caused by missing system playlists or invalid default settings

### Requirement: User-visible outcomes

The system SHALL surface **success** or **failure** of export and import in a way perceivable to the user (e.g. status text, notification pattern, or disabled button state consistent with the rest of the app). The system SHALL **not** fail silently when import is rejected.

#### Scenario: Validation failure message

- **WHEN** import is rejected during validation
- **THEN** the user receives a discernible error indication describing failure in general terms (e.g. invalid or unsupported file)

### Requirement: Offline-capable data transfer

Export and import SHALL **not** depend on network access for their core behavior (aside from the application shell assets already loaded).

#### Scenario: Offline export and import

- **WHEN** the user runs export or import while offline
- **THEN** the feature operates without network requests for transferring library data
