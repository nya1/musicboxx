# AGENTS.md

Context for AI coding agents working on **Musicboxx**. Format follows [AGENTS.md](https://agents.md/).

## Project overview

- **Musicboxx** is a local-first **PWA**: save and organize **YouTube** URLs as “songs,” store data in **IndexedDB** (via **Dexie**), show static thumbnails as cover art, playlists (including built-in **Favorites**).
- **Playback is on YouTube** (new tab). There is **no in-app media player**.
- **Stack:** Vite, React 18, TypeScript (strict), React Router, `vite-plugin-pwa` (manifest + Workbox).

## Prerequisites

- **Node.js** 18+ (CI uses Node 20).
- **npm** — this repo uses `package-lock.json`; prefer `npm ci` in CI and clean installs.

## Commands

| Command | Purpose |
|--------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server (usually `http://localhost:5173`) |
| `npm run build` | `tsc --noEmit` then production build → `dist/` |
| `npm run preview` | Serve `dist/` locally |
| `npm run lint` | ESLint on `ts`/`tsx` (max warnings: 0) |

There is **no** `test` script yet; before finishing a change, run **`npm run build`** and **`npm run lint`**.

## Repository layout

- **`src/`** — application code (`pages/`, `components/`, `lib/`, `db/`).
- **`vite.config.ts`** — `base` URL, PWA manifest, **Web Share Target** wiring.
- **`.github/workflows/deploy-github-pages.yml`** — build and deploy to GitHub Pages on push to `main`.

## Critical build and PWA constraints

- **`VITE_BASE`** — Vite `base` for asset URLs. Local dev defaults to `/`. **GitHub project Pages** needs `/<repository-name>/` (set in the workflow). For a **user/org root site** or **custom domain at `/`**, use `VITE_BASE=/` when building.
- **Web Share Target** — `share_target.action` must stay inside the manifest **`scope`** (see `viteBase()` and `shareTargetAction` in `vite.config.ts`). Share handler lives under **`src/pages/ShareTargetPage.tsx`** and related routes.
- **Service worker / caching** — changing precache patterns or PWA behavior can affect offline behavior; verify after edits.
- For PWA documentation visit https://web.dev/learn/pwa/os-integration

## Specs and larger changes

- **`openspec/`** holds specs and archived change proposals (`proposal.md`, `design.md`, `tasks.md`, `specs/`).
- Cursor skills under **`.cursor/skills/openspec-*`** describe how to propose, implement, or archive OpenSpec changes—use them when the user asks for spec-driven work.

## Code conventions

- **TypeScript:** `strict` mode; unused locals/parameters are errors; match existing `tsconfig` patterns.
- **Style:** Follow existing files (e.g. semicolons, import style as in `src/`).
- **ESLint:** `.eslintrc.cjs` — TypeScript + React Hooks + `react-refresh/only-export-components` (warn).
- **React:** Prefer hooks and clear data flow; keep routes and Dexie access in predictable places (`src/db/`).

## Security and privacy

- App data stays **client-side** (IndexedDB). Do not add secrets or API keys in the frontend for features that belong on a server unless the project explicitly moves to a backend.

## README

Human-facing setup, deployment (including GitHub Pages steps), and roadmap: **`README.md`**.
