import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  movements,
  defaults,
  clean,
  count,
  pose,
  pdf,
  pdfEscapeWinAnsi,
  pageShapes,
} from './engine.js';
import {
  parseBackupText,
  applyImportPreview,
  buildBackupPayload,
  contentFingerprint,
  defaultPrefs,
  cleanPrefs,
} from './storage.js';
import { APP_VERSION, RELEASE_ASSETS } from './version.js';

const root = dirname(fileURLToPath(import.meta.url));
let failed = 0;

function ok(name, cond) {
  if (!cond) {
    console.error('FAIL:', name);
    failed += 1;
  } else {
    console.log('ok', name);
  }
}

function finite(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

for (const m of movements) {
  for (const guide of ['feet', 'dot', 'tilt', 'size']) {
    for (const duration of [1, 4, 8]) {
      for (const fps of [6, 12, 24]) {
        const s = clean({ ...defaults, movement: m.id, guide, duration, fps });
        const n = count(s);
        ok(`count ${m.id} ${guide} d${duration} fps${fps}`, n === duration * fps);
        for (let i = 0; i < n; i++) {
          const p = pose(s, i);
          ok(`pose finite ${m.id} ${i}`, finite(p.x) && finite(p.y));
        }
        const bytes = pdf(s, {
          clip: 'CLIP',
          calibration: '50 mm',
          footer: 'A4',
          pageOf: (p, t) => `Sheet ${p + 1} / ${t}`,
        });
        ok(`pdf header ${m.id}`, bytes.startsWith('%PDF-1.4'));
        ok(`pdf pages ${m.id}`, (bytes.match(/<< \/Type \/Page /g) || []).length === Math.ceil(n / 8));
      }
    }
  }
}

const normalized = clean({ movement: 'nope', duration: 99, fps: 10, title: 'x'.repeat(80) });
ok('clean movement fallback', normalized.movement === defaults.movement);
ok('clean duration clamp', normalized.duration === 8);
ok('clean fps snap', normalized.fps === 12);
ok('clean title length', normalized.title.length === 48);

const v1 = JSON.stringify({ format: 'laura-flipbook', version: 1, settings: defaults });
const parsedV1 = parseBackupText(v1, 100000);
ok('parse v1', parsedV1.ok && parsedV1.version === 1);

const prefs = defaultPrefs();
const v2 = JSON.stringify(buildBackupPayload(defaults, prefs));
const parsedV2 = parseBackupText(v2, 100000);
ok('parse v2', parsedV2.ok && parsedV2.version === 2 && parsedV2.preferences);

const preview = applyImportPreview(defaults, prefs, parsedV2, true);
ok('restore prefs', preview.prefs.language === prefs.language || parsedV2.preferences);

const previewOff = applyImportPreview(defaults, prefs, parsedV2, false);
ok('skip prefs', previewOff.prefs.language === prefs.language);

ok('invalid format', !parseBackupText('{}', 100000).ok);

const ptTitle = 'Filme ção';
const escaped = pdfEscapeWinAnsi(ptTitle);
ok('pdf pt escapes', escaped.indexOf('\\') >= 0 && escaped.indexOf('ç') < 0);
const pdfPt = pdf({ ...defaults, title: ptTitle }, {
  clip: 'CLIP',
  calibration: 'Medir 50 mm',
  footer: 'A4',
  pageOf: () => 'Folha 1 / 1',
});
ok('pdf contains escaped title bytes', pdfPt.indexOf('Filme') >= 0);

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
ok('sw version sync', sw.includes(`var APP_VERSION = '${APP_VERSION}'`));
ok('sw assets sync', RELEASE_ASSETS.every((a) => sw.includes(`'${a}'`)));

const html = readFileSync(join(root, 'index.html'), 'utf8');
ok('html version meta', html.includes(`content="${APP_VERSION}"`));

const fp1 = contentFingerprint(defaults, prefs);
const fp2 = contentFingerprint({ ...defaults, title: 'Other' }, prefs);
ok('fingerprint changes', fp1 !== fp2);

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log('\nAll tests passed');
