## Why

Musicboxx today stores a minimal song row (title, optional channel/author, thumbnails, provider ids) so lists and “open externally” work. Future features such as **search lyrics**, richer library browsing, and smarter matching need a **stable, structured snapshot** of artist, track identity, and related fields **on the device**, without assuming a backend or OAuth. Establishing this data model now avoids rework and keeps metadata fetch logic aligned with what we persist.

## What Changes

- Extend the **persisted song record** (IndexedDB / Dexie) with **optional structured metadata**: at minimum a normalized **primary artist** (or artist list), plus provider-appropriate fields such as **album**, **duration**, **ISRC** (when available from public metadata), and **release year**—filled when public client-side APIs return them.
- **Map** existing display fields: today’s `title` / `author` remain the source for UI where we do not show new columns; new fields complement rather than replace until UI work lands.
- **Index** fields needed for future local search (e.g. artist, title) via Dexie schema where appropriate; no migration path—assume **fresh installs only** (no existing users).
- Update **song-catalog** requirements so persistence and metadata resolution explicitly cover the extended model (see delta spec).

## Capabilities

### New Capabilities

- `song-metadata`: Defines the **local schema** for extended song metadata, which fields are required vs optional, how values are populated from YouTube / Spotify / Apple public metadata, normalization rules (e.g. primary artist string), and indexing for future features (e.g. lyrics search).

### Modified Capabilities

- `song-catalog`: Amends requirements for **resolving** and **persisting** song information so they reference the extended metadata model and optional enriched fields from the same public client-side flows.

## Impact

- **`src/db/`** — `Song` type, Dexie version + indexes, any helpers that read/write songs.
- **`src/lib/`** — Metadata fetch/normalization (YouTube oEmbed, Spotify/Apple helpers) to populate new fields when data exists.
- **UI** — Minimal or no visible change in this change (data layer first); list/detail may keep using title/author until a follow-up surfaces new fields.
- **Specs** — New `song-metadata` spec; delta under `changes/.../specs/song-catalog/spec.md`.
