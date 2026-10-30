# Code map

- `index.html`: main screen, header Settings/language controls, task UI, Settings/import/conflict dialogs, print root.
- `style.css`: responsive layout, shared baseline radii/spacing, dialogs, A4 print rules.
- `engine.js`: canonical settings, motion poses, frame and sheet geometry, SVG output, WinAnsi PDF writer.
- `i18n.js`: English and European Portuguese catalogues, language resolution.
- `storage.js`: project/prefs keys, revision/conflict metadata, backup parse/build, undo helpers.
- `version.js`: `APP_VERSION` and `RELEASE_ASSETS` (must stay aligned with `sw.js`).
- `pwa-client.js`: service worker registration, throttled update checks, apply-update flow.
- `app.js`: UI state, playback, persistence, import preview, Settings, cards, printing/PDF.
- `sw.js`: running/pending release caches, offline verification messaging, fetch from running cache.
- `manifest.webmanifest`, `icon*`, `assets/flag-*.svg`, `assets/icons.svg`: install metadata and bundled UI assets.
- `scripts/serve.mjs`: localhost-only static server for the repo root.
- `tests.mjs`: geometry/PDF regressions, backup/import helpers, release consistency checks.

Version 1.1.0. Worker running cache id pattern: `laura-flipbook-running-1.1.0`. Installed version appears in Settings and HTML meta `flipbook-version`.
