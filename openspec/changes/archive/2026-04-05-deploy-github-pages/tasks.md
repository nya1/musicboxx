## 1. Vite base path and router

- [x] 1.1 Set Vite `base` from env (e.g. `VITE_BASE` defaulting to `/` for local dev) so production builds can use `/<repo>/` for project GitHub Pages.
- [x] 1.2 Pass `basename={import.meta.env.BASE_URL}` to `BrowserRouter` in `src/App.tsx` so client routes match the deployed path.

## 2. GitHub Actions workflow

- [x] 2.1 Add `.github/workflows/deploy-github-pages.yml` with jobs: `build` (checkout, `actions/setup-node` with npm cache, `npm ci`, `npm run build` with `VITE_BASE` or equivalent set from `github.repository` for `owner/repo` → `/<repo>/`), and `deploy` (`needs: build`, `permissions` for `pages: write` and `id-token: write`, `upload-pages-artifact` from `dist`, `deploy-pages`).
- [x] 2.2 Constrain deploy to the default branch (e.g. `main`) and use `environment: github-pages` if required by the chosen action template version.

## 3. Documentation

- [x] 3.1 Update `README.md` with steps to set Pages source to GitHub Actions, note project-site vs user-site `base`, and link to the workflow file.

## 4. Verification

- [x] 4.1 Run `npm run build` locally with `VITE_BASE=/<repo>/` (or the chosen env name) and confirm `dist/index.html` references prefixed asset paths.
- [x] 4.2 After merge, confirm the workflow run succeeds and the live Pages URL loads the app without broken assets (manual check in browser).
