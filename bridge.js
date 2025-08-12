
// Bridge - API de stockage unifié
window.storageAPI = window.storageAPI || {
  storageGet: async (k, def = null) => {
    try { 
      const v = localStorage.getItem(k); 
      return v == null ? def : JSON.parse(v); 
    }
    catch(e) { 
      console.error('[storageGet]', k, e); 
      return def; 
    }
  },
  storageSet: async (k, v) => {
    try { 
      localStorage.setItem(k, JSON.stringify(v)); 
    } catch(e) { 
      console.error('[storageSet]', k, e); 
    }
  },
  storageRemove: async (k) => { 
    try { 
      localStorage.removeItem(k); 
    } catch(e) {}
  },
  storageSubscribe: () => {} // no-op offline
};
