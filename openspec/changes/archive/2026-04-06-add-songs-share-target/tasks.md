## 1. Manifest and build config

- [x] 1.1 Add `share_target` to the PWA manifest (action path, `GET`, `params` for `title`, `text`, `url`) via `vite.config.ts` / `vite-plugin-pwa` manifest configuration
- [x] 1.2 Verify the built manifest in devtools (Application → Manifest) and fix any validation issues

## 2. Share route and URL extraction

- [x] 2.1 Add a dedicated route (e.g. `/share`) that reads `title`, `text`, and `url` from the query string
- [x] 2.2 Implement extraction: prefer `url`; otherwise parse the first supported YouTube URL from `text` using the same parser/helpers as the paste flow
- [x] 2.3 When no usable URL exists, surface the same validation UX as invalid paste (no song created)

## 3. Integrate add-song pipeline

- [x] 3.1 Invoke the existing add-song logic (create/resolve song, dedupe messaging, oEmbed/metadata, Favorites) from the share handler
- [x] 3.2 Align post-add navigation/messaging with the existing add-from-paste UX (see design open question)

## 4. Verification and documentation

- [x] 4.1 Manually test on Android Chrome: install PWA, share a YouTube video from the YouTube app, choose Musicboxx, confirm song appears or duplicate is reported
- [x] 4.2 Add a short note in README or in-app help (wherever other PWA limitations are documented) that share-target availability depends on install and platform
