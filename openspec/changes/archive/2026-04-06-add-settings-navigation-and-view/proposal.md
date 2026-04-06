## Why

Musicboxx has no dedicated place to manage app-level preferences or to surface future data-management actions (backup, restore). Users expect a predictable **Settings** entry from the main chrome, and the product needs a stable route and screen where preferences and import/export can grow without redesigning navigation later.

## What Changes

- Add a **Settings** item to the app’s primary navigation (alongside existing main destinations) that routes to a dedicated **Settings** view.
- Implement a **Settings** page with a clear structure for **app preferences** (stored client-side, consistent with the rest of the app).
- Include **placeholder or clearly scoped sections** for future capabilities: backing up to an external destination and **import/export of the local IndexedDB-backed data**, without committing to a specific backup provider or full import/export UX in this change unless explicitly scoped in tasks.
- Keep visual and interaction patterns aligned with the existing minimalist shell (spacing, typography, accessibility).

## Capabilities

### New Capabilities

- `app-settings`: Primary navigation to a Settings route; Settings layout and sections for current preferences; documented extension points for future backup and database import/export (requirements may scope placeholders only).

### Modified Capabilities

- (none) — no existing published spec defines primary app navigation entries or a Settings screen; this change introduces a new capability rather than altering an existing spec’s requirements.

## Impact

- **Routing**: New route(s) and possibly layout updates where navigation is defined (`src/` pages, router config).
- **State / persistence**: Preferences storage (e.g. localStorage or existing patterns alongside Dexie) as chosen in design; no server or OAuth.
- **PWA**: Settings must remain within app scope and work offline for purely local UI and stored preferences.
- **Future work**: Backup targets and full DB import/export remain follow-on changes; this change establishes navigation and UI shell so those features plug in later.
