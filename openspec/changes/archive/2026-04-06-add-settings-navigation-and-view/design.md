## Context

Musicboxx is a client-only PWA: routes live in `App.tsx` under a `Layout` that provides a bottom navigation bar (`Layout.tsx`) with Library, Playlists, and Add. Theme preference is stored in `localStorage` via `src/lib/theme.ts` and toggled from the header. There is no Settings route or consolidated preferences surface today.

## Goals / Non-Goals

**Goals:**

- Add a first-class **Settings** destination in primary navigation and a `/settings` route that renders a dedicated Settings view.
- Structure the Settings screen with clear **sections** so current preferences and future **data management** (backup to an external target, import/export of local IndexedDB data) can land without another navigation redesign.
- Reuse existing visual language (`app-shell`, typography, spacing) and keep behavior testable (routes, nav active state, basic accessibility).

**Non-Goals:**

- Implementing **cloud backup**, **OAuth**, or a specific **external backup provider** in this change.
- Implementing full **database export/import** or migration flows in this change (only placeholders and/or explicit “not yet available” copy per spec).
- Adding a backend or changing Dexie schema solely for settings unless a minimal preference key is required.

## Decisions

1. **Navigation placement**  
   Add a **fourth** `NavLink` in the bottom nav labeled **Settings**, with an appropriate icon (e.g. settings/gear), consistent with existing Library/Playlists/Add patterns. **Rationale:** Matches user expectation of “primary” app areas and keeps parity with mobile-first patterns already in `Layout`. **Alternative considered:** Overflow menu in the header — rejected for this change because it buries Settings and conflicts with “settings navigation menu” as a peer destination.

2. **Routing**  
   Register a child route **`/settings`** under `Layout` (same basename behavior as existing routes). **Rationale:** Simple, shareable, works with GitHub Pages `basename`. No nested settings sub-routes required for the first version unless tasks explicitly add them.

3. **Preferences storage**  
   Continue using **local** persistence for app preferences (`localStorage` for small keys, existing theme helpers for appearance). New settings SHALL use the same storage patterns and error handling (silent catch where storage is blocked) as `theme.ts`. **Alternative considered:** Dexie table for settings — deferred unless a preference must sync with song data or exceed trivial size.

4. **Theme control location**  
   **Keep** the existing header `ThemeToggle` for fast access **and** surface the same theme preference (or the same control) within Settings under an **Appearance** section so “Settings” is the mental place for all preferences. **Rationale:** Avoids removing a widely used control; avoids two sources of truth if the same component/hooks drive both. **Alternative considered:** Move theme only to Settings — rejected as unnecessary friction for a core toggle.

5. **Future backup / import-export**  
   Add a **Data** (or **Library data**) section with short explanatory copy and **non-functional** or placeholder actions (e.g. disabled buttons or “Coming in a future update”) that satisfy the spec without implementing IO. Implementation of export/import will be a follow-on change touching `src/db/` and possibly the File System Access API or download/upload flows.

## Risks / Trade-offs

- **Bottom nav crowding** → Use compact iconography and labels consistent with existing `bottom-nav` styles; verify tap targets on small screens.
- **Duplicated theme UI** → Mitigate by **reusing** one `ThemeToggle` component in both header and Settings (or shared hook) so behavior is identical.
- **Storage blocked** → Settings MUST degrade gracefully (same as theme today) when `localStorage` is unavailable.

## Migration Plan

- **Deploy:** Standard SPA deploy; no data migration. New route is additive.
- **Rollback:** Revert route + nav + page; no persisted schema changes required for a minimal Settings shell.

## Open Questions

- Whether **Genius** or other feature-specific toggles should appear under Settings in a later change (out of scope unless listed in tasks).
- Exact **copy** for placeholder data-management actions (product/legal review).
