# AGENTS.md

Context for AI coding agents working on **Musicboxx**. Format follows [AGENTS.md](https://agents.md/). Always keep this document updated.

## Project overview

- **Musicboxx** is a local-first **PWA**: save and organize music links as “songs” from **YouTube**, **Spotify**, and **Apple Music** (paste or Web Share Target). Data lives in **IndexedDB** (via **Dexie**); cover art uses static thumbnails (YouTube-derived images, Spotify/Apple metadata artwork, or placeholders). Playlists include built-in **Favorites**.
- **Playback is external** (new tab): **YouTube**, **Spotify**, or **Apple Music** depending on each song’s provider. There is **no in-app media player**.
- **Metadata** uses **public** client-side requests only (e.g. oEmbed, iTunes lookup)—no OAuth or streaming API keys in the app for catalog features.
- **Stack:** Vite, React 19, TypeScript (strict), React Router, `vite-plugin-pwa` (manifest + Workbox).

## Prerequisites

- **Node.js** 25+ (see `engines` in `package.json`; `.nvmrc` pins `25` for **nvm**). Use `nvm use 25` to set the correct node version before any node/pnpm related commands.
- **pnpm** — this repo uses `pnpm-lock.yaml`; use **`pnpm install`** locally and **`pnpm install --frozen-lockfile`** in CI.

## Commands

| Command | Purpose |
|--------|---------|
| `pnpm install` | Install dependencies |
| `pnpm run dev` | Vite dev server (usually `http://localhost:5173`) |
| `pnpm run build` | `tsc --noEmit` then production build → `dist/` |
| `pnpm run preview` | Serve `dist/` locally |
| `pnpm run lint` | ESLint on `ts`/`tsx` (max warnings: 0) |
| `pnpm run test` | Vitest (unit + flow tests, `happy-dom`) |
| `pnpm run test:watch` | Vitest watch mode |
| `pnpm run dev:e2e` | Vite dev server on `http://127.0.0.1:51730` (used by Playwright) |
| `pnpm run test:e2e` | Playwright E2E (`e2e/*.spec.ts`; install browsers once with `pnpm exec playwright install chromium`) |

Before finishing a change, run **`pnpm run test`**, **`pnpm run build`**, and **`pnpm run lint`**. After changing routes, navigation, or **`e2e/`**, also run **`pnpm run test:e2e`**.

## Repository layout

- **`src/`** — application code (`pages/`, `components/`, `lib/`, `db/`).
- **`e2e/`** — Playwright end-to-end specs (`playwright.config.ts` at repo root).
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
- **ESLint:** `eslint.config.js` (flat config) — TypeScript + React Hooks + `react-refresh/only-export-components` (warn).
- **React:** Prefer hooks and clear data flow; keep routes and Dexie access in predictable places (`src/db/`).

## UI and UX

- **Look and feel:** Keep the interface **consistent** across screens—spacing, typography, and controls should feel like one product. Aim for a **minimal, Vercel-like** aesthetic: plenty of whitespace, restrained color, clear hierarchy, no visual noise.
- **Interaction:** Prefer **fewer steps** to complete a task (fewer taps/clicks and shallower navigation). Put common actions on primary surfaces; avoid burying essentials behind extra menus or confirmation steps unless necessary.

## Security and privacy

- App data stays **client-side** (IndexedDB). Do not add secrets or API keys in the frontend for features that belong on a server unless the project explicitly moves to a backend.

## README

Human-facing setup, deployment (including GitHub Pages steps), and roadmap: **`README.md`**.
