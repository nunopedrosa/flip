import { clean, defaults } from './engine.js';

export const PROJECT_KEY = 'laura-flipbook-v1';
export const PREFS_KEY = 'laura-flipbook-prefs-v1';
export const REVISION_KEY = 'laura-flipbook-revision-v1';
export const IMPORT_MAX_BYTES = 100000;
export const UNDO_LIMIT = 10;

export const defaultPrefs = () => ({
  language: null,
  explicitLanguage: false,
  cards: {
    controls: false,
    preview: false,
    sheets: false,
    assembly: false,
  },
  showCharacter: true,
  backupMeta: {
    lastExportedAt: null,
    contentFingerprint: null,
  },
});

export function cleanPrefs(raw) {
  const base = defaultPrefs();
  if (!raw || typeof raw !== 'object') return base;
  const cards = { ...base.cards, ...(raw.cards || {}) };
  for (const k of Object.keys(cards)) cards[k] = !!cards[k];
  return {
    language: raw.language === 'pt-PT' || raw.language === 'en' ? raw.language : base.language,
    explicitLanguage: !!raw.explicitLanguage,
    cards,
    showCharacter: typeof raw.showCharacter === 'boolean' ? raw.showCharacter : base.showCharacter,
    backupMeta: {
      lastExportedAt: raw.backupMeta && raw.backupMeta.lastExportedAt ? String(raw.backupMeta.lastExportedAt) : null,
      contentFingerprint: raw.backupMeta && raw.backupMeta.contentFingerprint ? String(raw.backupMeta.contentFingerprint) : null,
    },
  };
}

export function loadRevision() {
  try {
    const raw = JSON.parse(localStorage.getItem(REVISION_KEY) || '{}');
    return {
      revision: Number(raw.revision) || 0,
      updatedAt: raw.updatedAt || null,
    };
  } catch (e) {
    return { revision: 0, updatedAt: null };
  }
}

export function bumpRevision() {
  const prev = loadRevision();
  const next = {
    revision: prev.revision + 1,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(REVISION_KEY, JSON.stringify(next));
    return { ok: true, ...next };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export function saveProject(state) {
  try {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(clean(state)));
    const rev = bumpRevision();
    if (!rev.ok) return { ok: false, error: rev.error };
    return { ok: true, revision: rev.revision };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export function loadProject() {
  try {
    return { ok: true, state: clean(JSON.parse(localStorage.getItem(PROJECT_KEY) || '{}')) };
  } catch (e) {
    return { ok: true, state: { ...defaults } };
  }
}

export function savePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(cleanPrefs(prefs)));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
}

export function loadPrefs() {
  try {
    return { ok: true, prefs: cleanPrefs(JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')) };
  } catch (e) {
    return { ok: true, prefs: defaultPrefs() };
  }
}

export function contentFingerprint(state, prefs) {
  return JSON.stringify({ settings: clean(state), prefs: exportablePrefs(prefs) });
}

export function exportablePrefs(prefs) {
  const p = cleanPrefs(prefs);
  return {
    language: p.language,
    explicitLanguage: p.explicitLanguage,
    cards: p.cards,
    showCharacter: p.showCharacter,
  };
}

export function buildBackupPayload(state, prefs) {
  return {
    format: 'laura-flipbook',
    version: 2,
    settings: clean(state),
    preferences: exportablePrefs(prefs),
  };
}

export function buildProjectFile(state) {
  return {
    format: 'laura-flipbook',
    version: 1,
    settings: clean(state),
  };
}

export function parseBackupText(text, maxBytes) {
  if (typeof text !== 'string') return { ok: false, code: 'invalid' };
  if (text.length > maxBytes) return { ok: false, code: 'size' };
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { ok: false, code: 'json' };
  }
  if (!data || data.format !== 'laura-flipbook') return { ok: false, code: 'format' };
  if (data.version !== 1 && data.version !== 2) return { ok: false, code: 'version' };
  if (!data.settings || typeof data.settings !== 'object') return { ok: false, code: 'settings' };
  const settings = clean(data.settings);
  let preferences = null;
  if (data.version === 2 && data.preferences) {
    preferences = exportablePrefs(cleanPrefs(data.preferences));
  }
  return { ok: true, version: data.version, settings, preferences };
}

export function applyImportPreview(currentState, currentPrefs, parsed, restorePreferences) {
  const nextSettings = parsed.settings;
  const nextPrefs = restorePreferences && parsed.preferences
    ? cleanPrefs({ ...currentPrefs, ...parsed.preferences })
    : currentPrefs;
  return {
    settings: nextSettings,
    prefs: nextPrefs,
    summary: {
      title: nextSettings.title,
      movement: nextSettings.movement,
      frames: nextSettings.duration * nextSettings.fps,
      preferenceChanges: restorePreferences && parsed.preferences ? parsed.preferences : null,
    },
  };
}

export function createUndoStack() {
  const stack = [];
  return {
    push(snapshot) {
      stack.push(JSON.stringify(clean(snapshot)));
      while (stack.length > UNDO_LIMIT) stack.shift();
    },
    pop(current) {
      if (!stack.length) return null;
      const prev = stack.pop();
      try {
        return clean(JSON.parse(prev));
      } catch (e) {
        return current;
      }
    },
    canUndo() {
      return stack.length > 0;
    },
  };
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('no file'));
      return;
    }
    if (file.size > IMPORT_MAX_BYTES) {
      reject(new Error('size'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('read'));
    reader.readAsText(file);
  });
}