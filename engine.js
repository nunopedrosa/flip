export const movements = [
  { id: 'bounce', name: 'Bounce', icon: '⌒', title: 'A little bounce', tip: 'Marks bunch together at the top and spread out as your creature falls. Draw its feet on the little line.' },
  { id: 'travel', name: 'Travel', icon: '→', title: 'Off on an adventure', tip: 'An even journey across the page. Your character starts again at the left for each new movement.' },
  { id: 'zigzag', name: 'Zigzag', icon: 'ϟ', title: 'This way, that way', tip: 'Follow the turns with a butterfly, a spaceship, or a very busy bee.' },
  { id: 'grow', name: 'Grow', icon: '↗', title: 'From tiny to tremendous', tip: 'Watch your drawing grow and shrink. Choose two size marks to see how tall to draw it.' },
  { id: 'wave', name: 'Wave', icon: '∿', title: 'Ride a gentle wave', tip: 'A smooth rise and fall across the page. Try a fish, a bird, or a floating balloon.' },
  { id: 'orbit', name: 'Circle', icon: '◯', title: 'Round we go', tip: 'A full circle for every movement. Keep your drawing centred on its mark.' },
];

export const defaults = {
  title: 'My bouncing creature',
  movement: 'bounce',
  duration: 4,
  fps: 12,
  cycles: 2,
  guide: 'feet',
  darkness: 'light',
  ground: true,
  order: 'forward',
};

export function clean(v) {
  const input = v || {};
  const a = { ...defaults, ...input };
  for (const row of [['duration', 1, 8], ['fps', 6, 24], ['cycles', 1, 4]]) {
    const k = row[0];
    const lo = row[1];
    const hi = row[2];
    a[k] = Math.min(hi, Math.max(lo, Math.round(Number(a[k]) || defaults[k])));
  }
  if ([6, 12, 24].indexOf(a.fps) < 0) a.fps = 12;
  const optsMap = {
    movement: movements.map((m) => m.id),
    guide: ['feet', 'dot', 'tilt', 'size'],
    darkness: ['light', 'medium', 'dark'],
    order: ['forward', 'reverse'],
  };
  Object.keys(optsMap).forEach((k) => {
    if (optsMap[k].indexOf(a[k]) < 0) a[k] = defaults[k];
  });
  a.title = String(a.title || 'My little movie').slice(0, 48);
  a.ground = typeof a.ground === 'boolean' ? a.ground : true;
  const result = {};
  Object.keys(defaults).forEach((k) => {
    result[k] = a[k];
  });
  return result;
}

export const count = (s) => s.duration * s.fps;

export function pose(s, i) {
  const n = count(s);
  const t = n <= 1 ? 0 : i / (n - 1);
  const phase = t * s.cycles;
  const u = phase - Math.floor(phase);
  let x = 56;
  let y = 51;
  let size = 12;
  let tilt = 0;
  switch (s.movement) {
    case 'bounce':
      y = 51 - 32 * Math.abs(Math.sin(Math.PI * phase));
      break;
    case 'travel':
      x = 29 + 51 * (i === n - 1 ? 1 : u);
      tilt = 0;
      break;
    case 'zigzag':
      x = 29 + 51 * (i === n - 1 ? 1 : u);
      y = 35 + 15 * (2 / Math.PI) * Math.asin(Math.sin(phase * Math.PI * 4));
      tilt = Math.cos(phase * Math.PI * 4) * 0.4;
      break;
    case 'grow':
      size = 7 + 16 * (1 - Math.cos(phase * Math.PI * 2)) / 2;
      break;
    case 'wave':
      x = 29 + 51 * (i === n - 1 ? 1 : u);
      y = 35 - 13 * Math.sin(phase * Math.PI * 2);
      tilt = Math.cos(phase * Math.PI * 2) * 0.35;
      break;
    case 'orbit':
      x = 56 + 22 * Math.sin(phase * Math.PI * 2);
      y = 36 - 15 * Math.cos(phase * Math.PI * 2);
      tilt = 0.3 * Math.sin(phase * Math.PI * 2);
      break;
    default:
      break;
  }
  return { x, y, size, tilt };
}

const line = (x1, y1, x2, y2, color, width) => ({
  kind: 'line',
  x1,
  y1,
  x2,
  y2,
  color,
  width: width === undefined ? 0.2 : width,
});

export function frame(s, i) {
  const p = pose(s, i);
  const ink = { light: '#b8b8b8', medium: '#858585', dark: '#555555' }[s.darkness];
  const shapes = [];
  if (s.ground) shapes.push(line(20, 53, 91, 53, '#d9d9d9', 0.15));
  if (s.guide === 'dot') shapes.push({ kind: 'circle', x: p.x, y: p.y - p.size / 2, r: 0.65, color: ink, fill: ink });
  else if (s.guide === 'size') {
    shapes.push(line(p.x - 2, p.y, p.x + 2, p.y, ink));
    shapes.push(line(p.x - 2, p.y - p.size, p.x + 2, p.y - p.size, ink));
  } else if (s.guide === 'tilt') {
    shapes.push(line(p.x, p.y, p.x + p.tilt * p.size, p.y - p.size, ink, 0.3));
  } else shapes.push(line(p.x - 2.5, p.y, p.x + 2.5, p.y, ink, 0.3));
  return shapes;
}

export function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

export function svgShapes(shapes) {
  return shapes
    .map((o) => (o.kind === 'line'
      ? `<line x1="${o.x1}" y1="${o.y1}" x2="${o.x2}" y2="${o.y2}" stroke="${o.color}" stroke-width="${o.width}"/>`
      : `<circle cx="${o.x}" cy="${o.y}" r="${o.r}" fill="${o.fill || 'none'}" stroke="${o.color}" stroke-width=".2"/>`))
    .join('');
}

export function defaultSheetLabels() {
  return {
    clip: 'CLIP',
    calibration: '50 mm - measure after printing',
    footer: 'A4 / 100% / single-sided / 95 x 65 mm pages',
    pageOf(page, total) {
      return `Sheet ${page + 1} / ${total}`;
    },
  };
}

export function pageShapes(s, page, labels) {
  const L = labels || defaultSheetLabels();
  const shapes = [];
  const texts = [];
  const n = count(s);
  for (let cell = 0; cell < 8; cell++) {
    const index = page * 8 + cell;
    if (index >= n) continue;
    const i = s.order === 'reverse' ? n - 1 - index : index;
    const dx = 10 + (cell % 2) * 95;
    const dy = 18.5 + Math.floor(cell / 2) * 65;
    shapes.push({ kind: 'rect', x: dx, y: dy, w: 15, h: 65, fill: '#f4f4f4' });
    shapes.push(line(dx + 15, dy + 2, dx + 15, dy + 63, '#d0d0d0', 0.15));
    for (const o of frame(s, i)) {
      const v = { ...o };
      if (v.kind === 'line') {
        v.x1 += dx;
        v.x2 += dx;
        v.y1 += dy;
        v.y2 += dy;
      } else {
        v.x += dx;
        v.y += dy;
      }
      shapes.push(v);
    }
    texts.push({ x: dx + 3, y: dy + 8, size: 2.4, text: String(i + 1).padStart(2, '0') });
    texts.push({ x: dx + 3, y: dy + 59, size: 1.8, text: L.clip });
  }
  for (let c = 0; c <= 2; c++) shapes.push(line(10 + c * 95, 16.5, 10 + c * 95, 280.5, '#929292', 0.15));
  for (let r = 0; r <= 4; r++) shapes.push(line(8, 18.5 + r * 65, 202, 18.5 + r * 65, '#929292', 0.15));
  shapes.push(line(10, 287, 60, 287, '#333333', 0.25));
  shapes.push(line(10, 285.5, 10, 288.5, '#333333', 0.25));
  shapes.push(line(60, 285.5, 60, 288.5, '#333333', 0.25));
  texts.push({ x: 10, y: 10, size: 2.8, text: s.title });
  texts.push({ x: 150, y: 10, size: 2.3, text: L.pageOf(page, Math.ceil(n / 8)) });
  texts.push({ x: 12, y: 292, size: 2, text: L.calibration });
  texts.push({ x: 76, y: 287, size: 2, text: L.footer });
  return { shapes, texts };
}

export function sheetSVG(s, p, labels) {
  const parts = pageShapes(s, p, labels);
  const shapes = parts.shapes;
  const texts = parts.texts;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 297"><rect width="210" height="297" fill="white"/>${shapes.map((o) => (o.kind === 'rect'
    ? `<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${o.fill}"/>`
    : svgShapes([o]))).join('')}${texts.map((o) => `<text x="${o.x}" y="${o.y}" font-size="${o.size}" font-family="Arial,sans-serif" fill="#555">${esc(o.text)}</text>`).join('')}</svg>`;
}

export function pdfEscapeWinAnsi(text) {
  let out = '';
  const s = String(text).normalize('NFC');
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 0x5c) out += '\\\\';
    else if (code === 0x28) out += '\\(';
    else if (code === 0x29) out += '\\)';
    else if (code >= 0x20 && code <= 0x7e) out += s.charAt(i);
    else if (code <= 0xff) out += '\\' + code.toString(8);
    else out += '?';
  }
  return out;
}

export function pdf(s, labels) {
  const mm = 72 / 25.4;
  const W = 210 * mm;
  const H = 297 * mm;
  const objects = [null, '<< /Type /Catalog /Pages 2 0 R >>', null, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'];
  const kids = [];
  const num = (v) => (v * mm).toFixed(3);
  const color = (hex) => {
    const h = hex.replace('#', '');
    return [0, 2, 4].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255).toFixed(3)).join(' ');
  };
  for (let p = 0; p < Math.ceil(count(s) / 8); p++) {
    const pageParts = pageShapes(s, p, labels);
    const shapes = pageParts.shapes;
    const texts = pageParts.texts;
    let stream = '';
    for (const o of shapes) {
      if (o.kind === 'rect') stream += `${color(o.fill)} rg ${num(o.x)} ${num(297 - o.y - o.h)} ${num(o.w)} ${num(o.h)} re f\n`;
      if (o.kind === 'line') stream += `${color(o.color)} RG ${num(o.width)} w ${num(o.x1)} ${num(297 - o.y1)} m ${num(o.x2)} ${num(297 - o.y2)} l S\n`;
      if (o.kind === 'circle') {
        const x = o.x;
        const y = 297 - o.y;
        const r = o.r;
        const k = r * 0.55228475;
        stream += `${color(o.fill || o.color)} rg ${num(x + r)} ${num(y)} m ${num(x + r)} ${num(y + k)} ${num(x + k)} ${num(y + r)} ${num(x)} ${num(y + r)} c ${num(x - k)} ${num(y + r)} ${num(x - r)} ${num(y + k)} ${num(x - r)} ${num(y)} c ${num(x - r)} ${num(y - k)} ${num(x - k)} ${num(y - r)} ${num(x)} ${num(y - r)} c ${num(x + k)} ${num(y - r)} ${num(x + r)} ${num(y - k)} ${num(x + r)} ${num(y)} c f\n`;
      }
    }
    for (const t of texts) stream += `0.33 g BT /F1 ${num(t.size)} Tf ${num(t.x)} ${num(297 - t.y)} Td (${pdfEscapeWinAnsi(t.text)}) Tj ET\n`;
    const content = objects.length;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
    const page = objects.length;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W.toFixed(3)} ${H.toFixed(3)}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${content} 0 R >>`);
    kids.push(`${page} 0 R`);
  }
  objects[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 1; i < objects.length; i++) {
    offsets.push(out.length);
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const start = out.length;
  out += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let i = 1; i < objects.length; i++) out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  out += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;
  return out;
}
