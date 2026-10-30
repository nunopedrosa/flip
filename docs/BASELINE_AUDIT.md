# Shared PWA baseline adoption audit

Inspected package: Flip 1.1.0, 29 October 2026 (local working tree). Adopted baseline: 2026-10-27, decision set 6. No exceptions were approved.

| Group | Status | Evidence and remaining work |
| --- | --- | --- |
| Local operation and privacy | Partial | Static bundled runtime, no upload or login. Verified release cache protocol implemented; real iPhone installed/offline tests still outstanding. |
| Settings and help | Implemented | Top-right Settings and flag language selector; Settings sections for language, backups, install/offline, updates, help/privacy, installed version. |
| Languages | Implemented | Full EN and pt-PT catalogues, bundled flags, immediate switching. Long-label layout checked in CSS at 320px; device verification pending. |
| Backup and restore | Implemented | v1 project + v2 full backup with preferences, import preview, restore-preferences checkbox, backup freshness metadata. Atomic failure handling via explicit save status. |
| Installation | Partial | Relative manifest, local icons, in-app install help. Real iOS Home Screen verification still required. |
| Updates | Partial | Running/pending caches, check/apply UI, throttled checks. Production CDN/host cache behaviour not verified. |
| Visual style | Partial | 2px/4px radii, compact spacing, SVG settings/close/chevron icons, helper typography styling. Shared narrow font file not yet bundled (condensed system styling used). |
| Interaction and cards | Implemented | Collapsible cards with top-right toggles, dialogs with focus entry, 44px touch targets on primary controls, undo for template edits. |
| Resilient workflows | Implemented | Save success/failure status, import preview, cross-window revision conflict dialog, bounded undo. |
| Layout and accessibility | Partial | 320px rules, reduced motion, safe-area padding. Enlarged text and installed safe areas need device pass. |
| Compatibility and limits | Partial | Startup paths avoid optional chaining/nullish coalescing; FileReader imports; 100 KB limit. Safari 12 / iPhone 6 not physically tested. |
| Domain and output | Partial | Geometry/PDF automated tests pass; WinAnsi PDF for Latin labels. Physical printing/cutting/flipping not verified. |
| Release and docs | Partial | Root serve documented; version markers in HTML, Settings, `version.js`, `sw.js`. Tests cover release asset list sync. |

## Verification evidence

Automated regression scripts are not bundled; verify geometry, PDF, backup, and update flows manually in a browser when changing `engine.js` or `app.js`.

Not verified on real Safari 12 / iPhone 6 hardware, installed PWA offline transition after interrupted update, or physical paper print/cut/flip. Report device results separately when available.

## Next priorities

Physical-device Safari 12 pass, optional bundled shared helper font asset, production update cache headers when hosting is chosen. Do not deploy without explicit user request.
