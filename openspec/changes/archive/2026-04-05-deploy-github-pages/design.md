## Context

Musicboxx is a Vite + React SPA with PWA plugins. Production output is static files in `dist/`. The README already mentions GitHub Pages as a deployment target, but there is no CI. GitHub Pages supports deployment from GitHub Actions using the official Pages actions and OIDC (`id-token: write`), which avoids long-lived deploy tokens for public repos.

## Goals / Non-Goals

**Goals:**

- On each push to the default branch (`main`), automatically run `npm ci` and `npm run build`, then publish `dist/` to GitHub Pages.
- Use a maintained, documented pattern (Node setup, artifact upload, `deploy-pages`).
- Make asset URLs correct for the chosen GitHub Pages style (user/org root site vs project site under `/<repo>/`).

**Non-Goals:**

- Preview deployments for every PR (optional future work).
- Migrating away from Vite or changing PWA behavior.
- Non-GitHub static hosts (Vercel, Netlify) beyond brief README pointers.

## Decisions

1. **Workflow shape**: Use a single workflow with `workflow_dispatch` optional plus `push` to `main` (and paths filter if desired later). Use `actions/setup-node` with `cache: 'npm'`, `npm ci`, `npm run build`, then `actions/upload-pages-artifact` with `path: dist` and `actions/deploy-pages` in a `deploy` job that `needs: build` and runs only on `main`.

2. **Permissions**: Set top-level `permissions` to `contents: read`, `pages: write`, `id-token: write` as required by [deploy-pages](https://github.com/actions/deploy-pages). Configure environment `github-pages` only if the template recommends it; the standard pattern uses `pages: write` on the job.

3. **Vite `base`**: GitHub **project** pages are served at `https://<user>.github.io/<repo>/`, so `base` MUST be `/<repo>/` (with trailing slash per Vite convention) unless the site is a user/org root repo (`<user>.github.io`). **Decision**: Document both cases in README; implement `base` using an env var in CI (e.g. `VITE_BASE` or pass `--base` via workflow) defaulting to `/` for custom domains/root sites, and set `base: '/musicboxx/'` or `process.env.VITE_BASE` in config when building for project Pages. Simplest robust approach: use `import.meta.env.BASE_URL` in the app only where needed (router may need `basename`); Vite's `base` affects built asset paths. For this repo name `musicboxx`, use `base: process.env.GITHUB_REPOSITORY && ...` — cleaner: **workflow sets `VITE_BASE_PATH` / `BASE_URL` and vite.config reads `base: process.env.VITE_BASE ?? '/'`**. Implementation task will wire this.

4. **Alternatives considered**: `peaceiris/actions-gh-pages` pushing to `gh-pages` branch — works but is branch-based; official artifact + deploy-pages is the current GitHub recommendation and keeps history out of a second branch.

## Risks / Trade-offs

- **Wrong `base` breaks assets** → Mitigation: README documents project vs user site; workflow sets base from repo name via `github.repository` split or explicit env in workflow.
- **Workflow fails on lint/type errors** → Mitigation: `npm run build` already runs `tsc --noEmit`; keep it so broken builds do not deploy.
- **Forks** → Mitigation: Pages deploy typically only configured on upstream; forks do not deploy unless maintainers enable Pages (acceptable).

## Migration Plan

1. Merge workflow and any `vite.config` / router `basename` changes.
2. In GitHub: Settings → Pages → Build and deployment → Source: **GitHub Actions**.
3. First run: push to `main` or run workflow manually; verify site URL and PWA loads.

**Rollback**: Remove or disable the workflow; revert `base` if it breaks local dev (keep local default `/`).

## Open Questions

- Whether the canonical deployment is **always** `/<repo>/` project pages or a **custom domain** (affects default `base` in workflow). Proposal assumes project pages unless README states otherwise; implementer can use repository variables for `BASE_PATH`.
