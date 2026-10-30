# Flip

A standalone PWA for Laura's hand-drawn flipbooks. Choose movement, duration and reference marks; preview the movement; print eight numbered frames per A4 sheet. Laura supplies every drawing.

## Run locally

Serve this folder over HTTP (modules and the service worker need an origin — do not open `index.html` as `file://`):

```bash
cd /Users/nfp/github/flip
python3 -m http.server 8010 --bind 127.0.0.1 --directory .
```

Open **http://localhost:8010**. No Node.js, npm, or build step is required. Use another port if 8010 is busy. Keeping the same origin and port preserves browser storage.

## Install as an app

The app works in an ordinary browser. Use **Settings** for installation help. On iPhone/iPad, open the HTTPS-hosted app in Safari and use Share → Add to Home Screen. Installation is not a backup.

## Files

Plain static site: `index.html`, `style.css`, `engine.js`, `app.js`, plus focused helpers `i18n.js`, `storage.js`, `pwa-client.js`, `version.js`, and `sw.js`. No build step — the browser loads them as ES modules. Bump `APP_VERSION` in `version.js`, `index.html` meta, and `sw.js` together when you ship a release.

## Saving

Project settings: `laura-flipbook-v1`. Device preferences: `laura-flipbook-prefs-v1` (language, preview character, page flip, card layout). **Export backup** / **Import backup** in Settings (v2 JSON with optional preferences). Footer **Save project** / **Open project** is a v1 settings shortcut. PDF exports cannot restore settings. Hand drawings are never stored.

## Deploy (host)

Publication is a **separate explicit action** on the server. The app repo is [github.com/nunopedrosa/flip](https://github.com/nunopedrosa/flip); default checkout **`~/flip`**, public web root **`~/flip.basecentral.link`**.

```bash
mkdir -p ~/flip.basecentral.link
sh ~/flip/scripts/deploy.sh
```

The script clones or `git pull --ff-only`s the checkout, then copies **runtime files only** (`index.html`, `style.css`, `app.js`, `engine.js`, `i18n.js`, `storage.js`, `pwa-client.js`, `version.js`, `manifest.webmanifest`, icons, `sw.js`). It does not publish `docs/`, `scripts/`, or other development files. Override paths with `FLIP_CHECKOUT` and `FLIP_WEB_ROOT` if needed.

## Development notes

Read `AGENTS.md`, `../pwa/AGENTS.md` (shared baseline), `docs/SHARED_PWA_RULES.md`, `docs/CODE_MAP.md`, and `docs/BASELINE_AUDIT.md`. For HTTPS hosting, publish only the runtime files listed above.
