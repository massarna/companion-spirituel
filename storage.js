
// Système de stockage avec localStorage comme fallback
export const storageAPI = {
  async storageGet(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.warn('[Storage] Erreur lecture:', error);
      return defaultValue;
    }
  },

  async storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Storage] Erreur écriture:', error);
      return false;
    }
  },

  async storageRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[Storage] Erreur suppression:', error);
      return false;
    }
  },

  storageSubscribe(key, callback) {
    const handler = (event) => {
      if (event.key === key) {
        const newValue = event.newValue ? JSON.parse(event.newValue) : null;
        callback(newValue);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }
};

console.log('[Storage] API de stockage initialisée');
