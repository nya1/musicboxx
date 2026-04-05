## ADDED Requirements

### Requirement: GitHub Actions builds production assets on default branch

The repository SHALL include a GitHub Actions workflow that runs on pushes to the default branch, installs dependencies with `npm ci`, and runs the same production build command used locally (`npm run build`), producing static output suitable for static hosting.

#### Scenario: Push to main triggers build

- **WHEN** new commits are pushed to the repository default branch
- **THEN** the workflow runs to completion without skipping the install and build steps unless a documented path filter intentionally excludes the change

### Requirement: GitHub Actions publishes the static build to GitHub Pages

The workflow SHALL upload the Vite production output directory (`dist/`) as a Pages artifact and SHALL deploy it using GitHub’s supported Pages deployment action pattern so the site updates after a successful build.

#### Scenario: Successful deploy updates the live Pages site

- **WHEN** the build job succeeds and GitHub Pages is configured to use GitHub Actions as the publishing source
- **THEN** the deployed site reflects the new build’s static assets

### Requirement: Workflow permissions support OIDC Pages deployment

The workflow SHALL declare permissions sufficient for the official Pages deploy flow (including read access to repository contents and the token permissions required by GitHub for `deploy-pages`), so deployment does not depend on a personal access token stored in secrets for the default public-repo case.

#### Scenario: Permissions allow deploy job

- **WHEN** the deploy job runs after a successful build on the default branch
- **THEN** the job is authorized to complete Pages deployment without failing for missing `id-token` or `pages` write scope as documented for `actions/deploy-pages`

### Requirement: Production base path matches GitHub Pages URL layout

When the site is served from a project Pages URL (`https://<owner>.github.io/<repository>/`), the built application SHALL resolve HTML, JS, CSS, and PWA asset URLs correctly (Vite `base` and, if applicable, router basename aligned with that path). When the site is served from the repository root of a user/org Pages site or a custom domain at `/`, the default base path SHALL remain `/` unless explicitly configured otherwise.

#### Scenario: Assets load under project Pages path

- **WHEN** a user opens the deployed app at the project GitHub Pages URL including the repository path segment
- **THEN** the application shell and referenced bundles load without 404s for primary entry assets
