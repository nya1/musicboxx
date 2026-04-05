## Why

Musicboxx is a static Vite PWA that already documents deploying `dist/` to hosts including GitHub Pages, but there is no automated pipeline. A GitHub Actions workflow gives every push to the default branch a reproducible build and publish path, so contributors and maintainers do not rely on manual uploads and the live site stays aligned with the repo.

## What Changes

- Add a GitHub Actions workflow that builds the app (`npm ci`, `npm run build`) and deploys the `dist/` output to **GitHub Pages** using the official `actions/upload-pages-artifact` and `actions/deploy-pages` pattern (or equivalent supported approach).
- Ensure the Vite build is compatible with GitHub Pages URL shapes (project pages under `/<repo>/` may require `base` in `vite.config`; document or implement as needed in implementation).
- Document in the README how to enable Pages in the repo (Settings → Pages → GitHub Actions) and any one-time setup (e.g. workflow permissions).

## Capabilities

### New Capabilities

- `github-pages-cicd`: Continuous deployment of the production static build to GitHub Pages via GitHub Actions, including when the workflow runs, required permissions, and correct asset paths for the chosen Pages URL mode.

### Modified Capabilities

- *(none — product behavior of PWA, playlists, and catalog is unchanged; only delivery and repo automation are added.)*

## Impact

- **Repository**: New file under `.github/workflows/`.
- **Build config**: Possible `vite.config` `base` adjustment for project-site hosting; `package.json` scripts unchanged unless we add a deploy helper (prefer keeping deploy in CI only).
- **Dependencies**: No new runtime or dev dependencies required for the app; CI uses Node as provided by `actions/setup-node`.
- **Secrets / settings**: Repo must enable GitHub Pages from Actions and grant the workflow `pages: write` / `id-token: write` as required by `deploy-pages`.
