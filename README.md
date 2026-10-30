# Flip

A standalone PWA for Laura's hand-drawn flipbooks. Choose movement, duration and reference marks; preview the movement; print eight numbered frames per A4 sheet. Laura supplies every drawing.

## Install the project on your Mac

```bash
cd /Users/nfp/github/flip
npm start
```

Open **http://localhost:8010**. Node.js 18 or newer is needed only for the included development server and tests. No `npm install` and no build are required. Alternatively, with Python 3:

```bash
cd /Users/nfp/github/flip
python3 -m http.server 8010 --bind 127.0.0.1 --directory .
```

Do not open `index.html` directly through `file://`: JavaScript modules and service workers need an HTTP origin. Stop the server with Ctrl+C. Use `PORT=8011 npm start` if 8010 is occupied. Keeping the same origin and port preserves access to the same browser storage.

## Install as an app

The app works in an ordinary browser. Where a browser offers installation, use its install control or **Settings → Installation and offline help**. On iPhone/iPad, open the HTTPS-hosted app in Safari and use Share → Add to Home Screen. A Mac's localhost URL is not accessible as localhost from an iPhone. An ordinary LAN HTTP address does not provide the secure origin required for normal PWA installation/offline caching; use HTTPS hosting for phone installation. Safari 12 and physical-device verification remain outstanding.

The service worker caches release assets after a verified load. Use **Settings → Check for updates** and **Update app** when a new release is offered. Installation is not a backup.

## What is included

- Bounce, travel, zigzag, grow/shrink, wave and circle templates.
- 1–8 seconds, 6/12/24 preview pages per second, 1–4 movement cycles.
- Feet line, centre dot, leaning line or paired size marks; optional ground line.
- Shared geometry for preview, direct printing and a vector PDF generated on-device.
- English and European Portuguese (`pt-PT`) UI, print labels and Settings.
- Automatic saving of project settings, portable backup (settings + preferences), and quick project JSON export/import with preview.
- Standalone manifest, local icons and service worker; no hosted-site identity, login gate, remote runtime dependencies or deployment automation.

## Printing

The default 4 seconds × 12 fps produces 48 frames on 6 A4 sheets. Each cut page is 95 × 65 mm, including a 15 mm left binding strip. The animation character appears only in the preview, never in the printed templates. Frame count means drawing pages, not duplicated images. Printed duration depends on flipping speed; recurring poses can occur in repeated movements.

Print single-sided on A4 at **100% / actual size**. For browser printing, disable headers and footers. Check the 50 mm calibration line before cutting. A grown-up operates the guillotine. Test stack order and binding before drawing. Unused cells on a partial last sheet are not animation frames. Paper stock, physical dimensions after printing and flipping action still require a real print test.

## Saving and privacy

Project template settings are saved under `laura-flipbook-v1`; device preferences (language, card layout, backup metadata) under `laura-flipbook-prefs-v1`. There is no server storage, automatic sync, artwork capture or project history. Clearing browser data can remove settings.

- **Export backup / Import backup** (Settings): UTF-8 JSON `format: laura-flipbook`, `version: 2`, with `settings` and `preferences`. Version 1 project files remain supported. Import shows a preview and optional **Restore preferences**. Limit: 100 KB.
- **Save project / Open project** (footer): version 1 settings-only shortcut with the same validation preview.
- PDF is a task export and cannot restore settings. Hand drawings are never stored.

## Development

Read `AGENTS.md`, `docs/SHARED_PWA_RULES.md`, `docs/CODE_MAP.md` and `docs/BASELINE_AUDIT.md` first.

```bash
npm test
```

Tests cover motion geometry, PDF page counts, backup parsing, WinAnsi PDF text, and release marker consistency.

For static hosting, publish the runtime files at the repo root (`index.html`, `app.js`, `engine.js`, assets, manifest, icons, service worker) over HTTPS. Do not expose development-only files such as `tests.mjs` or `scripts/`. No deployment is performed unless explicitly requested.
