# Flip PWA handover for Codex

Date: 29 October 2026  
Project directory on Nuno's Mac: `/Users/nfp/github/flip`  
Latest delivered package: `flip-pwa-v1.0.1.zip`  
Purpose of the next session: complete the agreed common PWA behavior while preserving the printable flipbook workflow and the visual direction Nuno likes.

## Start here

Inspect the actual working tree before editing. The package is the last known state, not proof of what has been installed or changed locally. Preserve local work and inspect Git status. Do not recreate the app or replace the repository with an older archive.

Read these project files:

1. `AGENTS.md`.
2. `../pwa/AGENTS.md`, if present, for the current shared baseline.
3. `docs/SHARED_PWA_RULES.md`, the complete bundled fallback baseline.
4. `README.md`, `docs/CODE_MAP.md` and `docs/BASELINE_AUDIT.md`.

The bundled baseline is revision **2026-10-27, decision set 6**, sourced from Nuno's shared `AGENTS.md`. Compare it with the sibling baseline when available; do not silently overwrite stricter or newer requirements. The baseline is authoritative for shared behavior. This handover summarizes priorities and does not replace it.

The previous delivery documented missing common requirements instead of implementing them. Nuno has explicitly identified this as unfinished work. Continue implementing the requirements; an audit alone does not complete the task. No exception to those requirements has been approved.

## User intent and decisions

Flip helps Laura, aged seven, create paper flipbooks. The app plans movement and prints faint references. **Laura draws the actual images by hand on every page.** Finished AI drawings, digital drawing tools and duplicated finished images are not the core experience.

Nuno likes the current appearance. Preserve the character of the interface while applying the shared PWA conventions. The next work concerns the missing common controls, languages, portability, updates and compatibility, rather than a new product concept.

Use plain HTML, CSS and JavaScript. Nuno explicitly questioned the unnecessary emphasis on npm. npm is acceptable for optional development/build tooling; **Node.js/npm must not be required on the hosting server**. No framework, backend or PHP is required for this app. Prefer the familiar root-level `index.html` and local JavaScript/CSS/assets layout used by his other PWAs. The delivered package still uses `dist/`; the move to a root-level app was discussed but has not been performed.

Keep work local. Do not deploy, change hosting, create another hosted Site, change sharing or push to a remote unless Nuno explicitly asks. The earlier ChatGPT-hosted preview is separate from the local project and is not the target for this session. Do not carry its login gate or hosting identity into Flip.

## Existing flipbook behavior to preserve

| Item | Current behavior |
| --- | --- |
| Movements | Bounce, travel, zigzag, grow/shrink, wave and circle |
| Duration | 1–8 seconds |
| Preview rate | 6, 12 or 24 pages per second; default 12 |
| Movement cycles | 1–4, independent of duration; default 2 |
| Frames | Duration × preview rate; default 48; maximum 192 |
| Guides | Feet line, centre dot, leaning line or two size marks |
| Other options | Guide darkness, ground line, stack order, preview-only character |
| Outputs | Local vector PDF and browser print sheets |
| Save | Current project configuration in localStorage plus JSON project export/import |

The four-second default yields 48 drawing pages on six A4 sheets. Paper playback duration is approximate because the person controls flipping speed. Repeated motion can revisit a pose; avoid promising that every guide coordinate is mathematically unique. The requirement is that the app does not replace Laura's drawing work with duplicate finished drawings.

### Physical geometry

- A4 portrait: **210 × 297 mm**, single-sided.
- Eight frames: **two columns × four rows**.
- Finished page: **95 × 65 mm**, including a **15 mm left binding strip**.
- Grid origin: **10 mm from the left, 18.5 mm from the top**; total grid **190 × 260 mm**.
- Frame numbers stay inside the binding strip; straight shared cut lines support guillotine cutting.
- A **50 mm calibration line** checks actual-size printing.
- Keep the optional preview character out of printed output.
- Retain reversible stack order and explain a numbered direction test before drawing.
- A grown-up operates the guillotine. Laura draws, decorates, sorts, aligns and helps bind.

Preview and PDF use shared frame definitions. Preserve that relationship. Never silently scale physical templates to fix overflow. Physical printing, paper choice and flipping action have not been verified.

## Current code map

Paths below describe the delivered archive; verify against the working tree.

| File | Role |
| --- | --- |
| `dist/index.html` | Main screen, controls, preview, print-sheet thumbnails and assembly help |
| `dist/style.css` | Responsive layout and A4 print rules |
| `dist/engine.js` | Settings normalization, motion poses, frame/sheet geometry, SVG output and vector PDF writer |
| `dist/app.js` | UI state, playback, local saving, import/export, printing, download and PWA registration |
| `dist/sw.js` | Basic app-scoped offline asset cache |
| `dist/manifest.webmanifest`, `dist/icon*` | Relative install metadata and local icons |
| `scripts/serve.mjs` | Optional localhost-only Node development server serving `dist/` |
| `tests.mjs` | Geometry, PDF page count, order and normalization checks |
| `package.json` | Version 1.0.1 and optional start/test commands; no runtime dependencies |

The source is quite compact, with long lines. Reformatting is reasonable when it helps the requested changes; preserve behavior and keep meaningful regression coverage.

## Implementation priorities

### Protect existing work and import integrity

Current saving catches localStorage errors, but callers can still report success after a failed write. The current importer normalizes questionable fields, replaces the in-memory project immediately and lacks a review step. It is not a safe complete restore implementation.

Make persistence success/failure explicit. Preserve recoverable work after failures. Validate imported types, values, format and version before changing state. Preview replacement and allow cancellation. Commit accepted project and preference changes together; cancellation, storage failure or concurrent edits must preserve the previous state. Add practical bounded Undo and cross-window conflict handling where applicable. Do not silently overwrite another window's changes.

### Settings and complete language support

Add the shared **Settings gear, then Language `<select>`** in the top-right, retaining both at narrow widths. Bundled local UK/Portugal flag SVG beside the select as reference; full accessible language names in the options.

Provide complete **English and European Portuguese (`pt-PT`)** catalogues, available offline. Cover static and dynamic text, errors, confirmations, accessibility labels, installation help and generated print/PDF labels. Keep IDs and interchange keys stable and leave Laura's own title unchanged.

Language switches immediately without reloading or losing settings, frame selection or task state. Apply explicit saved preference first, then supported browser language preferences, then English. Guard preference storage failures.

Settings must expose Language, Data and backups, Installation and offline help, Check for updates, Help and privacy, and the **running installed version at the bottom**. Closing Settings preserves the task and returns focus. Theme selection is not universally required.

### Complete portable backup and restore

Current project files are UTF-8 JSON:

```json
{
  "format": "laura-flipbook",
  "version": 1,
  "settings": {}
}
```

The app-scoped localStorage key is `laura-flipbook-v1`. Imports currently have a **100 KB** limit. Preserve legacy v1 files and existing local settings with explicit migrations when necessary.

Use the shared action labels Export backup and Import backup. Include supported device preferences, including language and any newly persisted view options. A restore preview must offer **Restore preferences**, checked by default; unchecked retains current device preferences. Older backups without preferences retain existing preferences. Document scope: template settings and supported preferences, **not paper drawings**. No artwork capture or project-history feature is required.

Track when a full backup was exported and whether covered content changed afterward. A download request is not confirmation that a file was saved to disk. PDF/print is a task export, not a restorable backup.

### Verified offline readiness and controlled updates

The current service worker caches an asset list, serves cache-first, deletes older app caches on activation and claims clients. There is no installed-version UI, manual update check, verified update offer or explicit activation control. Merely awaiting `serviceWorker.ready` does not establish that a complete intended release is ready offline.

Implement the baseline's complete release-cache verification and safe activation protocol. Preserve a usable old release after interrupted downloads or cache-write failures. Avoid mixing assets across releases. Scope cleanup to this app. Offer Check for updates with honest offline/failure/up-to-date feedback. Show Update app only for a verified distinct pending release. Apply and reload only after explicit user action and safe saving of work.

Keep release markers, asset URLs/imports, manifest references and worker caches consistent. Distinguish connectivity from verified offline readiness. Installation/help must work without a proprietary install-prompt API; include manual Safari Add to Home Screen instructions and browser use as a normal option.

### Shared interaction and visual conventions

Use 2 px control radii and 4 px panel/dialog radii, compact shared spacing, flat surfaces and consistent button treatment. Preserve meaningful circles and exact paper geometry. Use a local SVG action family for Settings, update, import/export, close, Back and card toggles.

Meaningful cards need accessible top-right collapse/reopen controls that preserve state. All buttons/icon controls need at least 44 × 44 CSS-pixel targets. Dialogs need accessible names, focus management and reachable close/actions. Preserve errors until resolved and distinguish saving, saved and failed states truthfully.

Follow the shared helper-text typography rule, but inspect the sibling project for an established licensed local font asset first. The supplied baseline said the exact shared narrow font had not yet been selected; do not invent a claim that a particular font is already the collection standard.

### Safari 12 and mobile layout

The required minimum is **iPhone 6, iOS 12.5.x, Safari 12**, in browser and Home Screen contexts. In package 1.0.1, `Object.fromEntries` was removed and file imports changed from `File.text()` to FileReader. These fixes are not a complete compatibility audit.

Review syntax, APIs, CSS, viewport/safe areas, memory and export behavior against that floor. Keep unsupported optional APIs out of startup paths; preserve save/open fallbacks for PDF where a download attribute or Home Screen printing is unreliable. No horizontal page scrolling at 320 CSS px; deliberate sheet-thumbnail component scrolling is allowed if bounded and usable. Test long Portuguese labels, enlarged text, short landscape heights and reduced motion.

### Static layout and documentation

If moving runtime files out of `dist/`, update HTML paths, module imports, manifest/start/scope, worker scope and cache list, tests, optional server and all documentation together. Preserve settings when serving at the same origin. Changing port, domain or path/storage design can affect access to existing data and must be explained.

Do not require Node on the hosting server. A plain local development command is currently:

```bash
cd /Users/nfp/github/flip
python3 -m http.server 8010 --directory dist
```

After a root-level move, document a safe static serve directory and avoid exposing repository metadata or private development files when hosting. A normal website server only needs the runtime assets over HTTPS. Localhost HTTP is suitable for local PWA development; an iPhone's localhost refers to that phone, not the Mac.

Update `AGENTS.md`, README, code map, baseline audit and version documentation to match the final implementation. Do not leave stale instructions saying to serve `dist/` after changing the layout.

## Validation and known limits

Previously verified:

- Modern managed desktop Chrome: changing duration and movement, guide selection, preview playback, settings surviving reload and triggering PDF download.
- Generated sample: valid six-page A4 vector PDF, first page visually inspected.
- Automated geometry checks across all six movements, four guide modes, durations 1/4/8 seconds and rates 6/12/24; finite coordinates, page counts, order and normalization.
- Package 1.0.1 local server/assets, source-file isolation, ZIP integrity and presence of the complete shared baseline.

**Not verified:** actual Safari 12 or iPhone hardware; installed PWA behavior; real offline transition; safe update scenarios; physical printing/cutting/flipping. EN/PT was not implemented, so bilingual behavior has no passing result. Existing tests do not establish safe backup restore or legacy-device compatibility.

The existing optional test command is `node tests.mjs` (also exposed as `npm test`). Add focused tests for the changes: lossless migration/backup, checked and unchecked preference restore, old v1 imports, invalid imports, cancellation, write failure, cross-window conflicts, complete/failed update downloads and offline reload. Check actual exported contents and Portuguese PDF glyph/text bounds—the current PDF writer strips non-ASCII characters, which must be addressed for faithful localized output.

Report what passed and what remains unavailable to test. Do not mark a requirement satisfied solely because a control exists or a modern-browser syntax check passed.

## Suggested opening instruction for Codex

> Continue Flip in `/Users/nfp/github/flip`. Read AGENTS.md, the shared baseline and FLIP_CODEX_HANDOVER.md, then inspect the working tree. Implement the missing common PWA requirements while preserving the hand-drawn movement templates and current visual direction. Keep it a plain static HTML/CSS/JavaScript application with no Node/npm requirement on the server. Preserve existing data and v1 project files, test the relevant flows, update the documentation, and keep the work local without deployment or pushing.
