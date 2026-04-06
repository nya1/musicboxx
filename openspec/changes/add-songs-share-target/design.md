## Context

Musicboxx is a client-only PWA that adds songs by **pasting YouTube URLs** and persisting them locally. The **Web Share Target API** (declared in the web app manifest) allows an **installed** PWA to appear in the Android system share sheet when another app shares **text** or **links**. YouTube’s share flow typically provides a URL (and sometimes title text); we must accept that payload and reuse the existing **URL parse → video ID → add/dedupe → metadata** pipeline.

## Goals / Non-Goals

**Goals:**

- Declare a valid **`share_target`** in the manifest so **Musicboxx** can appear as a share destination where the platform supports it (primarily **Android Chrome**, installed PWA).
- Handle the incoming launch URL (query parameters per the share-target spec) and extract a **candidate YouTube URL** from `url` and/or `text`.
- Route into the **same add-song behavior** as paste, including validation errors and duplicate handling.

**Non-Goals:**

- **Receiving shares in the browser tab** without install when the OS does not expose the PWA in the sheet (cannot be fixed in-app).
- **iOS parity** for share-target in Safari (limited/uncertain); document only, no guarantee.
- **Share *out*** from Musicboxx (Web Share API) — separate change.
- **Multiple share actions** (e.g. “Save to playlist X”) — v1 uses a single target that adds like the default flow (including Favorites per existing product rules).

## Decisions

1. **Manifest `share_target` action URL**  
   - **Choice**: Use a dedicated path (e.g. `/share`) with `method: GET` and `params` mapping `title`, `text`, `url` to query keys the platform sends.  
   - **Rationale**: Matches [Web Share Target](https://w3c.github.io/web-app-manifest/#share_target) conventions; keeps share handling out of the root route; easy to test by opening the URL manually.  
   - **Alternatives**: POST + enctype (heavier); same route as home with query flags (clutters main entry).

2. **URL extraction priority**  
   - **Choice**: Prefer `url` when present; otherwise scan `text` for the first substring that matches existing **YouTube URL patterns** (same as catalog parser).  
   - **Rationale**: YouTube may put the link in `text` only depending on the source app.  
   - **Alternatives**: Title-only (insufficient); prefer `text` over `url` (breaks when both differ—prefer explicit `url`).

3. **UX after successful parse**  
   - **Choice**: Run the **same** add flow as paste (including toast/message for duplicate vs new). Optionally navigate to library or stay on a minimal confirmation screen—follow existing add UX for consistency.  
   - **Rationale**: One code path, one spec story for catalog behavior.

4. **Invalid share (no YouTube URL)**  
   - **Choice**: Show the same class of **validation error** as invalid paste; do not create a song record.  
   - **Rationale**: Predictable behavior; satisfies catalog requirements.

5. **Service worker / PWA plugin**  
   - **Choice**: Ensure the share entry path is **reachable offline** at least for shell (same as rest of app); no special caching of share payload.  
   - **Rationale**: Share launches should not show a blank uncached route; align with existing precache strategy.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Share target only appears for **installed** PWA on many setups | Document in UI/help: install the app for “Share to Musicboxx”; set expectations for iOS/desktop. |
| Payload varies by app (only title, or URL in `text`) | Implement robust scanning of `text` + `url` per decision above. |
| Duplicate manifest or SW issues break install | Validate manifest with Chrome DevTools Application tab after implementation. |

## Migration Plan

- **Deploy**: Ship manifest + route + handler in one release. No data migration (IndexedDB unchanged).  
- **Rollback**: Revert deploy; users lose share target until redeploy—no user data impact.

## Open Questions

- Exact **post-add navigation** (stay on `/share` with message vs redirect to home): resolve during implementation to match existing “add song” UX patterns in the codebase.
