import { movements, defaults, clean, count, pose, frame, svgShapes, sheetSVG, pdf } from './engine.js';
import { createI18n, resolveLanguage } from './i18n.js';
import {
  loadProject, saveProject, loadPrefs, savePrefs, loadRevision,
  buildBackupPayload, buildProjectFile, parseBackupText, applyImportPreview,
  createUndoStack, readFileAsText, contentFingerprint, IMPORT_MAX_BYTES,
} from './storage.js';
import { createPwaClient } from './pwa-client.js';
import { APP_VERSION } from './version.js';

const $ = (id) => document.getElementById(id);
let state = { ...defaults };
let prefs = loadPrefs().prefs;
let index = 0;
let playing = false;
let timer;
let last = 0;
let localRevision = loadRevision().revision;
const undo = createUndoStack();
let pendingImport = null;
let settingsTrigger = null;
let installPrompt = null;

const i18n = createI18n(resolveLanguage(prefs));
i18n.setLang(prefs.language || resolveLanguage(prefs));

const loaded = loadProject();
if (loaded.ok) state = loaded.state;

const pwa = createPwaClient({
  onChange() {
    refreshStatus();
    refreshSettingsPanels();
  },
});

function sheetLabels() {
  const L = i18n.sheetLabels();
  return {
    clip: L.clip,
    calibration: L.calibration,
    footer: L.footer,
    pageOf(page, total) {
      return L.pageOf(page, total);
    },
  };
}

function t(key, vars) {
  return i18n.t(key, vars);
}

function message(text) {
  $('message').textContent = text || '';
}

function setSaveStatus(mode) {
  const el = $('save-status');
  if (mode === 'saved') el.textContent = t('save.saved');
  else if (mode === 'failed') el.textContent = t('save.failed');
  else if (mode === 'saving') el.textContent = t('save.saving');
  else el.textContent = '';
}

function persistState(pushUndo) {
  if (pushUndo) undo.push(state);
  setSaveStatus('saving');
  const result = saveProject(state);
  if (result.ok) {
    localRevision = result.revision || localRevision;
    setSaveStatus('saved');
    $('undo').disabled = !undo.canUndo();
    markBackupStaleIfNeeded();
    return true;
  }
  setSaveStatus('failed');
  message(t('save.failed'));
  return false;
}

function markBackupStaleIfNeeded() {
  refreshSettingsPanels();
}

function applyLanguage(lang, explicit) {
  i18n.setLang(lang);
  prefs.language = lang;
  prefs.explicitLanguage = !!explicit;
  const prefSave = savePrefs(prefs);
  if (!prefSave.ok && explicit) message(t('save.failed'));
  document.title = t('app.title');
  applyI18nStatic();
  render();
  refreshSettingsPanels();
  updateLangButtons();
}

function updateLangButtons() {
  const en = i18n.lang === 'en';
  $('lang-en').setAttribute('aria-pressed', en ? 'true' : 'false');
  $('lang-pt').setAttribute('aria-pressed', en ? 'false' : 'true');
}

function applyI18nStatic() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key);
  });
  $('settings-open-label').textContent = t('header.settings');
  $('help').textContent = t('header.help');
  $('install').textContent = t('header.install');
  fillSelect('cycles', ['1', '2', '3', '4'], (v) => t(`cycles.${v}`));
  fillSelect('guide', ['feet', 'dot', 'tilt', 'size'], (v) => t(`guide.${v}`));
  fillSelect('darkness', ['light', 'medium', 'dark'], (v) => t(`ink.${v}`));
  fillSelect('fps', ['6', '12', '24'], (v) => t(`fps.${v}`));
  fillSelect('order', ['forward', 'reverse'], (v) => t(`order.${v}`));
  document.querySelectorAll('[data-card-toggle]').forEach((btn) => {
    const card = btn.getAttribute('data-card-toggle');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const name = t(`card.${card}`);
    btn.querySelector('.sr-only').textContent = expanded ? t('card.collapse', { card: name }) : t('card.expand', { card: name });
  });
}

function fillSelect(id, values, labelFn) {
  const sel = $(id);
  const current = sel.value;
  sel.innerHTML = values.map((v) => `<option value="${v}">${labelFn(v)}</option>`).join('');
  if (values.indexOf(current) >= 0) sel.value = current;
}

function controls() {
  for (const k of ['title', 'duration', 'fps', 'cycles', 'guide', 'darkness', 'order']) {
    $(k).value = state[k];
  }
  $('ground').checked = state.ground;
  $('character').checked = prefs.showCharacter;
}

function renderScene() {
  const p = pose(state, index);
  let character = '';
  if ($('character').checked) {
    const cx = p.x + p.tilt * p.size / 2;
    const cy = p.y - p.size / 2;
    character = `<g transform="rotate(${p.tilt * 25} ${cx} ${cy})"><ellipse cx="${cx}" cy="${cy}" rx="${p.size * 0.47}" ry="${p.size * 0.5}" fill="#f4bc8f" stroke="#9a6851" stroke-width=".4"/><circle cx="${cx - p.size * 0.14}" cy="${cy - 1}" r=".55" fill="#374e43"/><circle cx="${cx + p.size * 0.14}" cy="${cy - 1}" r=".55" fill="#374e43"/><path d="M ${cx - 1.2} ${cy + 1} Q ${cx} ${cy + 2.6} ${cx + 1.2} ${cy + 1}" fill="none" stroke="#895c49" stroke-width=".4"/></g>`;
  }
  const binding = t('sheet.binding');
  const frameLabel = t('preview.frame', { n: index + 1, total: count(state) });
  $('scene').innerHTML = `<svg viewBox="0 0 95 65" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${frameLabel}"><rect width="95" height="65" fill="#fffefa"/><rect width="15" height="65" fill="#eeeee6"/><path d="M15 2V63" stroke="#c7cec2" stroke-width=".2" stroke-dasharray="1 1"/><text x="4" y="8" font-family="sans-serif" font-size="2.5" fill="#738271">${String(index + 1).padStart(2, '0')}</text><text transform="translate(7 40) rotate(-90)" font-family="sans-serif" font-size="1.8" letter-spacing=".7" fill="#879481">${binding}</text>${svgShapes(frame(state, index))}${character}</svg>`;
  $('scrub').value = index;
  $('counter').textContent = `${String(index + 1).padStart(2, '0')} / ${count(state)}`;
}

function render() {
  const meta = i18n.movement(state.movement);
  const n = count(state);
  index = Math.min(index, n - 1);
  $('movements').innerHTML = movements.map((m) => {
    const label = i18n.movement(m.id);
    const active = m.id === state.movement;
    return `<button type="button" class="movement ${active ? 'active' : ''}" data-movement="${m.id}" aria-pressed="${active}"><span class="symbol" aria-hidden="true">${m.icon}</span>${label.name}</button>`;
  }).join('');
  const durLabel = state.duration === 1 ? `1 ${t('controls.durationOne')}` : `${state.duration} ${t('controls.durationUnit')}`;
  $('duration-label').textContent = durLabel;
  $('motion-title').textContent = meta.title;
  $('motion-tip').textContent = meta.tip;
  $('frame-count').textContent = n;
  $('sheet-count').textContent = Math.ceil(n / 8);
  $('scrub').max = n - 1;
  const labels = sheetLabels();
  $('sheets').innerHTML = Array.from({ length: Math.ceil(n / 8) }, (_, p) => `<div class="sheet-thumb">${sheetSVG(state, p, labels)}<span>${t('sheets.sheet', { n: p + 1 })}</span></div>`).join('');
  applyCardCollapse();
  renderScene();
}

function applyCardCollapse() {
  Object.keys(prefs.cards).forEach((key) => {
    const body = $(`card-body-${key}`);
    const toggle = document.querySelector(`[data-card-toggle="${key}"]`);
    if (!body || !toggle) return;
    const collapsed = !!prefs.cards[key];
    body.hidden = collapsed;
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.classList.toggle('collapsed', collapsed);
  });
}

function stopPlayback() {
  playing = false;
  cancelAnimationFrame(timer);
  $('play').textContent = '▶';
  $('play').setAttribute('aria-label', t('preview.play'));
}

function tick(ts) {
  if (!playing) return;
  if (ts - last >= 1000 / state.fps) {
    index = (index + 1) % count(state);
    renderScene();
    last = ts;
  }
  timer = requestAnimationFrame(tick);
}

function download(data, type, name) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

function slug() {
  return state.title.replace(/[^a-z0-9_-]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'my-flipbook';
}

function backupFilename() {
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return `flipbook-backup-${stamp}.json`;
}

function exportBackup() {
  const payload = buildBackupPayload(state, prefs);
  download(JSON.stringify(payload, null, 2), 'application/json', backupFilename());
  prefs.backupMeta.lastExportedAt = new Date().toISOString();
  prefs.backupMeta.contentFingerprint = contentFingerprint(state, prefs);
  savePrefs(prefs);
  message(t('msg.backupExported'));
  refreshSettingsPanels();
}

function openImportPreview(parsed) {
  pendingImport = parsed;
  const preview = applyImportPreview(state, prefs, parsed, true);
  $('import-summary').textContent = t('import.summary', {
    title: preview.summary.title,
    movement: preview.summary.movement,
    frames: preview.summary.frames,
  });
  $('restore-prefs').checked = true;
  $('restore-prefs-wrap').hidden = !parsed.preferences;
  $('import-prefs-note').hidden = !parsed.preferences;
  showDialog('import-dialog');
}

function commitImport() {
  if (!pendingImport) return;
  const restorePreferences = $('restore-prefs').checked;
  const preview = applyImportPreview(state, prefs, pendingImport, restorePreferences);
  undo.push(state);
  state = preview.settings;
  prefs = preview.prefs;
  stopPlayback();
  index = 0;
  controls();
  persistState(false);
  savePrefs(prefs);
  pendingImport = null;
  hideDialog('import-dialog');
  render();
  message(t('msg.projectOpened'));
}

function handleParsedFile(parsed) {
  if (!parsed.ok) {
    message(t('msg.importInvalid'));
    return;
  }
  openImportPreview(parsed);
}

function readImportFile(file) {
  readFileAsText(file).then((text) => {
    handleParsedFile(parseBackupText(text, IMPORT_MAX_BYTES));
  }).catch(() => {
    message(t('msg.importInvalid'));
  });
}

function showDialog(id) {
  const el = $(id.replace('#', ''));
  if (!el) return;
  el.hidden = false;
  const focusable = el.querySelector('button, input, select, textarea, [href]');
  if (focusable) focusable.focus();
}

function hideDialog(id) {
  const el = $(id);
  if (el) el.hidden = true;
  if (settingsTrigger) settingsTrigger.focus();
}

function refreshStatus() {
  const pwaState = pwa.getState();
  let text = navigator.onLine ? t('header.status.online') : t('header.status.offline');
  if (pwaState.offlineReady) text = t('header.status.ready');
  else if ('serviceWorker' in navigator) text = t('header.status.pending');
  $('status-line').textContent = `● ${text}`;
}

function refreshSettingsPanels() {
  $('app-version').textContent = APP_VERSION;
  const fp = contentFingerprint(state, prefs);
  const meta = prefs.backupMeta || {};
  if (!meta.lastExportedAt) $('backup-status').textContent = t('settings.backupNever');
  else {
    $('backup-status').textContent = `${t('settings.backupExported', { when: meta.lastExportedAt })} ${meta.contentFingerprint !== fp ? t('settings.backupStale') : t('settings.backupCurrent')}`;
  }
  const pwaState = pwa.getState();
  $('offline-status').textContent = pwaState.offlineReady ? t('settings.offlineReady') : t('settings.offlinePending');
  $('apply-update').hidden = !pwaState.pendingUpdate;
}

function checkConflict() {
  const remote = loadRevision();
  if (remote.revision > localRevision) showDialog('conflict-dialog');
}

function bindEvents() {
  $('movements').addEventListener('click', (e) => {
    const b = e.target.closest('[data-movement]');
    if (!b) return;
    undo.push(state);
    state.movement = b.dataset.movement;
    index = 0;
    persistState(false);
    render();
  });

  for (const key of ['title', 'duration', 'fps', 'cycles', 'guide', 'darkness', 'ground', 'order']) {
    const el = $(key);
    el.addEventListener(key === 'duration' || key === 'title' ? 'input' : 'change', () => {
      undo.push(state);
      state[key] = key === 'ground' ? el.checked : el.value;
      state = clean(state);
      persistState(false);
      render();
    });
  }

  $('character').addEventListener('change', () => {
    prefs.showCharacter = $('character').checked;
    savePrefs(prefs);
    renderScene();
  });

  $('play').onclick = () => {
    if (playing) stopPlayback();
    else {
      playing = true;
      last = 0;
      $('play').textContent = 'Ⅱ';
      $('play').setAttribute('aria-label', t('preview.pause'));
      timer = requestAnimationFrame(tick);
    }
  };
  $('scrub').oninput = () => {
    stopPlayback();
    index = Number($('scrub').value);
    renderScene();
  };

  $('pdf').onclick = () => {
    try {
      download(pdf(state, sheetLabels()), 'application/pdf', `${slug()}.pdf`);
      message(t('msg.pdfReady', { sheets: Math.ceil(count(state) / 8) }));
    } catch (e) {
      message(t('msg.pdfFail'));
    }
  };

  function preparePrint() {
    const labels = sheetLabels();
    $('print-root').innerHTML = Array.from({ length: Math.ceil(count(state) / 8) }, (_, p) => `<div class="print-sheet">${sheetSVG(state, p, labels)}</div>`).join('');
  }
  $('print').onclick = () => {
    preparePrint();
    window.print();
  };
  window.addEventListener('beforeprint', preparePrint);

  $('backup').onclick = () => download(JSON.stringify(buildProjectFile(state), null, 2), 'application/json', `${slug()}.json`);
  $('restore').onclick = () => $('file-project').click();
  $('file-project').onchange = () => {
    const f = $('file-project').files[0];
    $('file-project').value = '';
    if (f) readImportFile(f);
  };

  $('export-backup').onclick = exportBackup;
  $('import-backup').onclick = () => $('file-backup').click();
  $('file-backup').onchange = () => {
    const f = $('file-backup').files[0];
    $('file-backup').value = '';
    if (f) readImportFile(f);
  };

  $('reset').onclick = () => {
    if (window.confirm(t('confirm.reset'))) {
      undo.push(state);
      stopPlayback();
      state = { ...defaults };
      index = 0;
      controls();
      persistState(false);
      render();
    }
  };

  $('undo').onclick = () => {
    const prev = undo.pop(state);
    if (!prev) return;
    state = prev;
    index = 0;
    controls();
    persistState(false);
    render();
  };

  $('help').onclick = () => $('instructions').scrollIntoView({ behavior: 'smooth' });

  $('lang-en').onclick = () => applyLanguage('en', true);
  $('lang-pt').onclick = () => applyLanguage('pt-PT', true);
  $('settings-lang-en').onclick = () => applyLanguage('en', true);
  $('settings-lang-pt').onclick = () => applyLanguage('pt-PT', true);

  $('settings-open').onclick = () => {
    settingsTrigger = $('settings-open');
    refreshSettingsPanels();
    showDialog('settings-dialog');
  };
  $('settings-close').onclick = () => hideDialog('settings-dialog');

  $('import-close').onclick = () => {
    pendingImport = null;
    hideDialog('import-dialog');
  };
  $('import-cancel').onclick = () => {
    pendingImport = null;
    hideDialog('import-dialog');
  };
  $('import-apply').onclick = commitImport;

  $('conflict-keep').onclick = () => {
    localRevision = loadRevision().revision;
    hideDialog('conflict-dialog');
  };
  $('conflict-reload').onclick = () => {
    const loadedAgain = loadProject();
    state = loadedAgain.state;
    prefs = loadPrefs().prefs;
    localRevision = loadRevision().revision;
    index = 0;
    controls();
    hideDialog('conflict-dialog');
    applyLanguage(prefs.language || resolveLanguage(prefs), prefs.explicitLanguage);
  };
  $('conflict-export').onclick = () => {
    exportBackup();
    hideDialog('conflict-dialog');
  };

  $('check-updates').onclick = () => {
    $('update-status').textContent = t('settings.update.checking');
    pwa.checkForUpdates(true).then((result) => {
      if (result.status === 'offline') $('update-status').textContent = t('settings.update.offline');
      else if (result.status === 'failed') $('update-status').textContent = t('settings.update.failed');
      else if (result.status === 'available') $('update-status').textContent = t('settings.update.available');
      else $('update-status').textContent = t('settings.update.current');
      refreshSettingsPanels();
    });
  };
  $('apply-update').onclick = () => {
    persistState(false);
    pwa.applyUpdate();
  };

  $('copy-diagnostics').onclick = () => {
    const text = `Flip ${APP_VERSION}\nlang=${i18n.lang}\nrevision=${localRevision}\nonline=${navigator.onLine}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => message(t('settings.diagnosticsCopied')));
    } else {
      message(text);
    }
  };

  document.querySelectorAll('[data-card-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-card-toggle');
      prefs.cards[key] = !prefs.cards[key];
      savePrefs(prefs);
      applyCardCollapse();
      applyI18nStatic();
    });
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    installPrompt = e;
    $('install').hidden = false;
  });
  $('install').onclick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt = null;
    $('install').hidden = true;
  };

  window.addEventListener('online', refreshStatus);
  window.addEventListener('offline', refreshStatus);
  window.addEventListener('storage', (e) => {
    if (e.key && e.key.indexOf('laura-flipbook') === 0) checkConflict();
  });
  window.addEventListener('focus', checkConflict);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopPlayback();
    else {
      pwa.checkForUpdates(false);
      checkConflict();
    }
  });
}

function init() {
  $('app-version').textContent = APP_VERSION;
  applyLanguage(prefs.language || resolveLanguage(prefs), prefs.explicitLanguage);
  controls();
  render();
  bindEvents();
  refreshStatus();
  pwa.register().then((result) => {
    if (result.ok) pwa.checkForUpdates(true);
    else message(t('msg.swFail'));
    if (!sessionStorage.getItem('offline-note')) {
      message(t('msg.offlineTip'));
      sessionStorage.setItem('offline-note', '1');
    }
  });
  setSaveStatus('saved');
}

init();
