
// Bridge pour l'API de stockage
console.log('[Compagnon] bridge: start');

// API de stockage unifié
const storageAPI = {
  async storageGet(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      return value === null ? defaultValue : JSON.parse(value);
    } catch (error) {
      console.error('[Storage] Erreur get:', error);
      return defaultValue;
    }
  },

  async storageSet(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Storage] Erreur set:', error);
      return false;
    }
  },

  async storageRemove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[Storage] Erreur remove:', error);
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

// Exposer l'API globalement
window.storageAPI = storageAPI;

console.log('[Compagnon] bridge: ready', storageAPI);
