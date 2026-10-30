# Code map

- `index.html`: screen layout, Settings/import/conflict dialogs, inline SVG icons, Language `<select>` (Unicode flag options).
- `style.css`: layout, print rules, dialogs, shared baseline spacing.
- `engine.js`: settings normalization, motion geometry, SVG sheets, WinAnsi PDF output.
- `i18n.js`: English and European Portuguese catalogues; language resolution.
- `storage.js`: localStorage project/prefs, backups, import validation, undo stack.
- `version.js`: `APP_VERSION` and offline asset list (keep aligned with `sw.js` and HTML meta).
- `pwa-client.js`: service worker registration, update checks, apply update.
- `app.js`: UI wiring, playback (optional page hinge), print/PDF, Settings.
- `sw.js`: offline cache for the current release (classic worker; mirrors `version.js`).
- `manifest.webmanifest`, `icon.svg`, `icon-192.png`, `icon-512.png`: install metadata.

Version 1.1.2. Plain static files — no build, no `dist/`, no Node/npm required to run the app.
