# app-settings Specification Delta

## MODIFIED Requirements

### Requirement: Settings layout and sections

The Settings page SHALL present content in **distinct sections** with clear headings, including at minimum **Appearance** (or equivalent) for theme-related preferences and **Data** or **Library data** (or equivalent) for **local** library management, including **export**, **import**, and **clear/reset** of IndexedDB-backed library data: **export** and **import** as specified in **`local-database-export-import`**, and **clear/reset** as specified in **`library-data-reset`**. Cloud backup to an external destination MAY remain a separate, future capability.

#### Scenario: Appearance section

- **WHEN** the user opens the Settings page
- **THEN** a section exists that exposes the **appearance** preference (light / dark / system or equivalent) consistent with existing theme behavior

#### Scenario: Data management section

- **WHEN** the user opens the Settings page
- **THEN** a **Library data** (or equivalent) section exists that exposes **working** **export** and **import** actions for the local database per **`local-database-export-import`**, and a **clear** or **reset local library** action per **`library-data-reset`** (including **typed `delete`** confirmation as specified there), and does not describe local export, import, or clear as unavailable unless the capability is not provided on the platform
