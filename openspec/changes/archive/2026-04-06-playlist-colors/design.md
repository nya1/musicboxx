## Context

Musicboxx stores playlists in **IndexedDB** via Dexie (`Playlist`: `id`, `name`, `isSystem`, `createdAt`, optional `parentId`). The **Playlists** overview uses a **row overflow menu** (Rename, default, nested create, move, delete). There is **no** per-playlist visual identity beyond text today.

## Goals / Non-Goals

**Goals:**

- Persist one **accent color per playlist**, shown in the playlist tree and on playlist detail so lists are easy to tell apart.
- **Auto-pick** a color when a playlist is created (any create path), without an extra required step.
- **Seed** **Favorites** with a product default accent when the DB is first initialized (same release as this feature—no legacy upgrade).
- Let users **change** the color from the **playlist overflow menu** on the Playlists overview (primary surface named in the product brief).

**Non-Goals:**

- **Migrating** playlists that lack `color` from older installed app versions (assume greenfield / fresh DB for this work).
- Theming the entire app per playlist or syncing colors across devices.
- Per-song or album colors; image extraction from thumbnails.
- Unlimited custom color UX beyond a practical picker (preset swatches are acceptable).

## Decisions

1. **Storage format**  
   **Decision:** Store **`color`** as a **CSS 7-character hex** string (e.g. `#a3b4c5`) on `Playlist`.  
   **Rationale:** Simple, serializable, works inline in styles; no extra parsing for common UI needs.  
   **Alternatives:** HSL object (more fields); palette enum only (less expressive).

2. **Auto-generation algorithm**  
   **Decision:** Use a **fixed palette** of **accessible, distinct hues** (e.g. 12–24 swatches) and assign the next color by **hash of `playlist.id`** (or round-robin index at creation time if ids are random UUIDs). If collision with siblings matters visually, prefer **index-based rotation** among the palette at insert time.  
   **Rationale:** Avoids neon clashes and keeps contrast predictable; hashing by id keeps a stable color if the row is reloaded without storing “creation order.”  
   **Alternatives:** Pure random (can cluster); derive from name (changes if renamed—rejected).

3. **Favorites at first run**  
   **Decision:** When **Favorites** is created during initial bootstrap, assign a **fixed brand-adjacent** color from the same palette (e.g. warm accent).  
   **Rationale:** System playlist matches the same color model as user lists; no separate “migration” from a prior schema.

4. **Editing UX**  
   **Decision:** Overflow menu item **Change color** opens a small **popover or modal** with **preset swatches** plus optional **native color input** (`<input type="color">`) for advanced users. Persist on selection.  
   **Rationale:** Fast taps on mobile; still allows exact picks.

5. **Where the color appears**  
   **Decision:** **Left border** or **leading dot/swatch** on each playlist row in the overview; **same accent** on playlist detail **title row** or header strip.  
   **Rationale:** Consistent with minimal UI; avoid filling large areas with saturated color.

6. **Playlist detail menu parity**  
   **Decision:** If playlist detail already exposes an overflow or “more” control for playlist-level actions, **mirror Change color** there; otherwise **overview-only** for v1 is acceptable per proposal.  
   **Rationale:** User asked for “menu of the playlist”—overview overflow satisfies; detail is optional parity.

## Risks / Trade-offs

- **[Risk]** Hex colors on dark/light backgrounds may reduce contrast for thin borders → **Mitigation:** Choose palette with **WCAG-friendly** pairs against app background; use border + optional subtle tint.
- **[Risk]** Schema definition drift if `color` is optional in types but required in UI → **Mitigation:** Treat `color` as required on `Playlist` at rest after bootstrap; always set on insert.
- **[Trade-off]** Preset-only pickers limit expression → **Mitigation:** Optional `<input type="color">` in the same dialog.

## Open Questions

- Exact **palette** list and **Favorites** hex—finalize during implementation to match existing CSS variables / theme.
- Whether **child create** modal should show a **preview** of the auto color before confirm (nice-to-have).
