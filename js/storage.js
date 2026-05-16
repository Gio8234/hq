/* ================================================================
   RetroHQ — storage.js
   Wrapper LocalStorage per la persistenza dei dati
================================================================ */

const Storage = (() => {
  const KEY = 'retrohq_v1';

  function defaultState() {
    return {
      vibe:       '',
      projects:   [],
      tasks:      [],
      notes:      [],
      milestones: [],
      habits:     [],
      stats:      {},
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch {
      return defaultState();
    }
  }

  function save(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('RetroHQ: impossibile salvare', e);
    }
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  return { load, save, clear };
})();
