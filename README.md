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

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + TypeScript  
- [Dexie](https://dexie.org/) for IndexedDB  
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for manifest and Workbox precaching  

## License

[MIT](./LICENSE).
