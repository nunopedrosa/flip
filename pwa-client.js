import { APP_VERSION } from './version.js';

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function createPwaClient(handlers) {
  let registration = null;
  let pendingUpdate = false;
  let offlineReady = false;
  let lastCheck = 0;
  let checking = false;

  function notify() {
    if (handlers && handlers.onChange) {
      handlers.onChange({
        offlineReady,
        pendingUpdate,
        checking,
        version: APP_VERSION,
      });
    }
  }

  function listenWorker() {
    if (!navigator.serviceWorker) return;
    navigator.serviceWorker.addEventListener('message', (event) => {
      const data = event.data || {};
      if (data.type === 'OFFLINE_READY') {
        offlineReady = true;
        notify();
      }
      if (data.type === 'UPDATE_READY') {
        pendingUpdate = true;
        notify();
      }
    });
  }

  function register() {
    if (!('serviceWorker' in navigator)) {
      return Promise.resolve({ ok: false });
    }
    listenWorker();
    return navigator.serviceWorker.register('./sw.js').then((reg) => {
      registration = reg;
      if (reg.waiting) pendingUpdate = true;
      reg.addEventListener('updatefound', () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) {
            pendingUpdate = true;
            notify();
          }
        });
      });
      return navigator.serviceWorker.ready.then(() => {
        verifyOfflineReady();
        notify();
        return { ok: true };
      });
    }).catch(() => ({ ok: false }));
  }

  function verifyOfflineReady() {
    if (!registration || !registration.active) return;
    registration.active.postMessage({ type: 'VERIFY_OFFLINE' });
  }

  function checkForUpdates(force) {
    const now = Date.now();
    if (!force && now - lastCheck < CHECK_INTERVAL_MS) {
      return Promise.resolve({ status: 'throttled', pendingUpdate });
    }
    if (!navigator.onLine) {
      return Promise.resolve({ status: 'offline', pendingUpdate });
    }
    if (!registration) {
      return Promise.resolve({ status: 'unavailable', pendingUpdate });
    }
    checking = true;
    notify();
    lastCheck = now;
    return registration.update().then(() => {
      checking = false;
      verifyOfflineReady();
      notify();
      if (registration.waiting) pendingUpdate = true;
      return { status: pendingUpdate ? 'available' : 'current', pendingUpdate };
    }).catch(() => {
      checking = false;
      notify();
      return { status: 'failed', pendingUpdate };
    });
  }

  function applyUpdate() {
    if (!registration || !registration.waiting) {
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      const worker = registration.waiting;
      const onChange = () => {
        if (worker.state === 'activated') {
          worker.removeEventListener('statechange', onChange);
          resolve(true);
        }
      };
      worker.addEventListener('statechange', onChange);
      worker.postMessage({ type: 'SKIP_WAITING' });
    }).then((activated) => {
      if (activated) window.location.reload();
      return activated;
    });
  }

  return {
    register,
    checkForUpdates,
    applyUpdate,
    getState() {
      return { offlineReady, pendingUpdate, checking, version: APP_VERSION };
    },
  };
}