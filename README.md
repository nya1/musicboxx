# Musicboxx

Local-first **progressive web app** for saving and organizing YouTube links as “songs.” Paste a URL, store it in **IndexedDB**, see **static thumbnails** as cover art, and group items into playlists—starting with a built-in **Favorites** list. Playback stays on **YouTube** (opens in a new tab); there is no in-app player.

## Requirements

- **Node.js** 18+

## Scripts

| Command        | Description                                      |
| -------------- | ------------------------------------------------ |
| `npm run dev`    | Start Vite dev server with hot reload            |
| `npm run build`  | Typecheck (`tsc --noEmit`) and production build  |
| `npm run preview`| Serve the `dist/` output locally                 |
| `npm run lint`   | Run ESLint on the TypeScript/React source        |

## Development

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

Deploy the **`dist/`** folder to any static host (e.g. Vercel, Netlify, GitHub Pages). The PWA registers a service worker from the build output for offline shell caching.

**Share from other apps (YouTube, etc.):** The manifest includes a **Web Share Target** so Musicboxx can appear in the system share sheet on supported setups (typically **Android Chrome** with the app **installed**). iOS and desktop browsers often do not surface installed PWAs as share targets; use **Add song** and paste the link there when sharing is unavailable.

### GitHub Pages (GitHub Actions)

This repo includes [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml), which builds on every push to **`main`** and publishes `dist/` to GitHub Pages.

1. In the GitHub repo: **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
2. Push to `main` (or run the workflow manually under **Actions**). The workflow sets `VITE_BASE` to `/<repository-name>/`, which matches **project** Pages URLs (`https://<owner>.github.io/<repo>/`).
3. For a **user or organization** site (`<user>.github.io` with the site at the domain root) or a **custom domain** at `/`, override the build: set `VITE_BASE=/` in the workflow’s build step (or use a repository variable and wire it into that step) so asset URLs stay at the root.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript  
- [Dexie](https://dexie.org/) for IndexedDB  
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for manifest and Workbox precaching  

## Roadmap

- Support Spotify links
- Support Apple Music links
- Backup local database
- Export local database
- Local search functionality


## License

[MIT](./LICENSE).
