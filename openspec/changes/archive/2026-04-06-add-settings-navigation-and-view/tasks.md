## 1. Routing

- [x] 1.1 Register a `/settings` child route under `Layout` in `App.tsx` that renders a new `SettingsPage` component.
- [x] 1.2 Add `src/pages/SettingsPage.tsx` with a page title, main landmark, and section structure (Appearance, Data) matching existing page patterns.

## 2. Primary navigation

- [x] 2.1 Add a `NavLink` to `/settings` in `Layout.tsx` bottom nav with label **Settings**, accessible name, active styling, and an icon consistent with existing nav icons (lucide-react or project convention).
- [x] 2.2 Confirm four-item bottom nav layout still meets tap-target and visual balance (adjust CSS only if needed).

## 3. Settings content

- [x] 3.1 Implement an **Appearance** section that surfaces theme preference using the existing `ThemeToggle` (or shared hook + control) so behavior matches `localStorage` theme keys in `src/lib/theme.ts`.
- [x] 3.2 Implement a **Data** (or **Library data**) section with short copy describing future backup to an external destination and future import/export of local library data; use placeholder/disabled actions or neutral “planned” messaging per spec (no full export/import in this change).

## 4. Tests and quality

- [x] 4.1 Add or extend tests (e.g. route render, nav link presence, or Settings heading) following patterns in `src/pages/*.test.tsx`.
- [x] 4.2 Run `pnpm run test`, `pnpm run build`, and `pnpm run lint` and fix any issues introduced by this change.
