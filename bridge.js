
console.log('[Compagnon] bridge: start');

// Configuration par défaut intégrée
const config = {
  storage: {
    type: 'localStorage'
  }
};

// Implémentation de stockage par défaut
const storage = {
  async get(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.warn('[Storage] Erreur lecture:', error);
      return defaultValue;
    }
  },

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('[Storage] Erreur écriture:', error);
      return false;
    }
  },

  async remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('[Storage] Erreur suppression:', error);
      return false;
    }
  }
};

window.storageAPI = { 
  storageGet: storage.get, 
  storageSet: storage.set, 
  storageRemove: storage.remove, 
  storageSubscribe: () => {} 
};

console.log('[Compagnon] bridge: ready', window.storageAPI);
