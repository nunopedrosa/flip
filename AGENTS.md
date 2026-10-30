# Flip PWA development instructions

## Shared baseline

Before making changes, read `../pwa/AGENTS.md` as the shared trekm PWA baseline when that sibling file exists. This app adopts revision **2026-10-27, decision set 6**. A complete reviewed copy is included at `docs/SHARED_PWA_RULES.md`, sourced from Nuno's shared `AGENTS.md` on 29 October 2026. Use the bundled copy when the sibling project is unavailable. If revisions differ, report the difference and preserve stricter requirements pending reconciliation.

Read this file, `README.md`, `docs/CODE_MAP.md` and `docs/BASELINE_AUDIT.md` before editing. The shared baseline is a development requirement, not a claim that this prototype already meets every rule. Keep the audit accurate; do not silently treat gaps as approved exceptions.

## Project boundary

- Local development folder: `/Users/nfp/github/flip`. Keep this project independent of sibling PWAs.
- This package is standalone static HTML, CSS and JavaScript. Serve the repo root runtime files (`index.html` and siblings); no build, account, backend, dependency installation or ChatGPT hosting is required.
- Keep current work local. Do not publish, configure hosting, change sharing or push to a remote repository unless the user explicitly asks.
- No analytics, telemetry, third-party runtime assets or personal-data uploads. Bundle all runtime assets for offline use.
- Use the shared baseline's complete English and European Portuguese requirement. The default language control, implemented in the header and in Settings, is a native `<select>` pull-down: visible choices are only Unicode 🇬🇧 and 🇵🇹, and the select’s accessible name carries the full language. Do not set option `label` to a language name. The control matches neighbouring button height and shares their top edge. Buttons on one line share that height (at least 44 CSS pixels) and align by their top edges. Portability, controlled updates and the other visual conventions still apply. Missing implementation is recorded in the audit.
- Host deployment is separate from the central toolbox: [`scripts/deploy.sh`](scripts/deploy.sh) copies runtime files only to the public web directory when explicitly run on the host (see README). Do not deploy without an explicit request.

## Flipbook domain

- Laura is seven. The application provides motion references; she draws the actual images by hand. Never replace the core activity with generated finished animation or simple duplicated drawings.
- Six initial movements: bounce, travel, zigzag, grow and shrink, wave, circle. Stable machine IDs must survive translated labels.
- Duration is 1–8 seconds. Preview rates are 6, 12 or 24 pages per second, default 12. Printed frame count equals duration multiplied by rate. Movement cycle count is separate from duration.
- Actual physical playback speed depends on the person flipping. Do not promise exact duration on paper or confuse printed pages with unique poses.
- Guide choices: feet line, centre dot, leaning body line and paired size marks. Keep any preview character out of print output.
- Preserve A4 portrait 210 × 297 mm; two columns by four rows; finished frame size 95 × 65 mm; grid origin 10 × 18.5 mm; left binding strip 15 mm. Do not scale silently.
- Generate preview and PDF from the same frame definitions. Keep numbering within the binding strip, straight shared cut lines, project/sheet identifiers and a 50 mm calibration line. Retain selectable stack order.
- An adult operates the guillotine. Provide sorting, binding and direction-test guidance; do not claim physical accuracy without a printed test.

## Storage and compatibility

- Canonical project format v1: UTF-8 JSON with `format: laura-flipbook`, `version: 1` and `settings`. It contains the current template configuration, not paper drawings. Preserve compatibility when extending it.
- Current auto-save uses the app-scoped `laura-flipbook-v1` localStorage key. Retain recoverable work after failed saves/imports. Validate all imported content before writes; retain the 100 KB file limit unless a justified change is documented.
- Add complete preference backup, import preview and atomic restore according to the shared baseline when those capabilities are implemented. Do not claim project export is a full device backup until coverage is verified.
- Target iPhone 6 / iOS 12.5.x / Safari 12 and modern browsers. Do not introduce unsupported syntax or APIs into startup paths. Use FileReader for legacy import and ordinary download/save-open fallbacks. Actual device testing remains required.
- Keep manifest and service worker scope relative to this app; root and subdirectory hosting must work. Change cache/release markers together for runtime releases. Do not clear user projects during updates.

## Checks and delivery

- Serve the repo root over HTTP (for example `python3 -m http.server 8010 --directory .` at `http://localhost:8010`). No Node.js, npm, or build is required.
- Test actual PDF bytes and A4 geometry, both printing paths, partial final sheets, project import/export, offline reload and safe updates as applicable. Check 320 px layouts and EN/PT labels when localization is added.
- Run only relevant checks. Report separately what was tested in modern desktop browsers, real iOS devices, offline and on paper.
- Keep README, audit, code map, version and format documentation aligned. Do not mark untested behavior as passing.
