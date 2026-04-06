## Why

Users discover music in other apps (especially YouTube) and should be able to send a video into Musicboxx without copying the link and switching apps manually. Registering as a **Web Share Target** lets the installed PWA appear in the system share sheet on Android (and in supporting browsers), matching how people already share to other apps.

## What Changes

- Register a **share target** in the PWA manifest so **Musicboxx** can appear when the user shares **text/URLs** from apps like YouTube (after install; behavior depends on OS and browser).
- Add an **entry route or handler** that receives the shared payload (typically `title` and/or `text` containing a URL), extracts a candidate YouTube URL, and runs the **same add-song flow** as manual paste (validation, dedupe, metadata, Favorites).
- Show clear **feedback** when the shared content is not a usable YouTube URL (reuse existing validation messaging patterns).

## Capabilities

### New Capabilities

- `web-share-target`: Manifest `share_target` configuration, handling of incoming share navigation (GET params per spec), integration with the existing add-song pipeline, and platform notes (e.g. Android Chrome installed PWA vs. browser-only limitations).

### Modified Capabilities

- `song-catalog`: Add requirements that **system share** is a supported way to supply a YouTube URL, with scenarios aligned to the existing URL parsing and validation rules (no duplicate behavior definitions—share is another input channel).

## Impact

- **Manifest generation** (e.g. Vite PWA / Workbox config): extend with `share_target` pointing at a dedicated path or query contract.
- **Client routing**: handle launch via share (deep link / query string) and optionally pre-fill or auto-submit the add flow.
- **No backend**; no new dependencies required beyond existing app stack.
- **Platform**: Share target for PWAs is **most relevant on Android Chrome** when the app is installed; iOS Safari support for share target is limited—document expectations in design/spec.
