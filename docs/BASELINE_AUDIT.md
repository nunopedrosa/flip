# Shared PWA baseline adoption audit

Inspected package: Flip 1.1.1, 30 October 2026 (local working tree). Adopted baseline: 2026-10-27, decision set 6 ([`../pwa/AGENTS.md`](../../pwa/AGENTS.md) when present). No exceptions were approved.

| Group | Status | Evidence and remaining work |
| --- | --- | --- |
| Local operation and privacy | Partial | Static bundled runtime, no upload or login. Release cache protocol in `sw.js`; real iPhone installed/offline tests still outstanding. |
| Settings and help | Implemented | Top-right Settings gear then language control; Settings sections (language, backups, install/offline, updates, help/privacy, version). |
| Languages | Implemented | EN + pt-PT in `i18n.js`. Default control: native `<select>` in the header and Settings; option text is only 🇬🇧 / 🇵🇹; full name on the select accessible name; same height and top edge as neighbouring buttons. |
| Backup and restore | Implemented | v1 project + v2 backup with preferences, import preview, restore-preferences default on, backup freshness metadata, explicit save status. |
| Installation | Partial | Manifest, local icons, in-app install help. Real iOS Home Screen verification still required. |
| Updates | Partial | Running/pending caches, check/apply UI, throttled checks. Production CDN/cache headers not verified. |
| Visual style | Partial | 2px/4px radii, compact spacing, inline SVG icons. Ordinary buttons are 44px tall and top-aligned on a shared line; movement choices share one 72px height. Shared narrow helper font asset not bundled (system condensed styling). |
| Interaction and cards | Implemented | Collapsible cards, dialogs, 44px targets, undo for template edits. |
| Resilient workflows | Implemented | Save states, import preview, cross-window conflict dialog, bounded undo. |
| Helper typography | Partial | Helper styling present; shared narrow font file not yet selected/bundled per collection baseline. |
| Layout and accessibility | Partial | 320px CSS rules, reduced motion, safe areas. Enlarged text and installed safe areas need device pass. |
| Compatibility and limits | Partial | Safari 12–oriented startup paths; FileReader imports; 100 KB limit. iPhone 6 / Safari 12 not physically tested. |
| Domain and output | Partial | Shared geometry/PDF paths; WinAnsi Latin labels. Physical print/cut/flip not verified. |
| Release and docs | Partial | `version.js` + `sw.js` + HTML meta; [`scripts/deploy.sh`](../scripts/deploy.sh) for host copy. No automated regression bundle (manual browser checks). |

## Verification evidence

Manual browser checks recommended when changing `engine.js`, `app.js`, or release markers. Not verified on real Safari 12 / iPhone 6 hardware, interrupted update on device, or physical paper.

## Next priorities

Physical-device Safari 12 pass, shared helper font when selected for the collection, production cache headers when hosting is active. Deploy only as an explicit user action.
