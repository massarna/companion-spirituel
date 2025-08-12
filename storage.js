
import { USE_FIREBASE } from "./config.js";

let adapter;

// ----- Local adapter (par défaut) -----
const LocalAdapter = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  // API homogène: pas d'abonnement local → on renvoie un noop
  subscribe(_key, _cb) {
    return () => {};
  }
};

// ----- Firebase adapter (optionnel) -----
async function makeFirebaseAdapter() {
  const mod = await import("./firebase.js");
  return {
    async get(key) {
      return await mod.firebaseGet(key, null);
    },
    async set(key, value) {
      return await mod.firebaseSet(key, value);
    },
    async remove(key) {
      return await mod.firebaseRemove(key);
    },
    subscribe(key, callback) {
      return mod.firebaseSubscribe(key, callback);
    }
  };
}

// ----- Initialisation -----
(async function initAdapter() {
  if (USE_FIREBASE) {
    try {
      adapter = await makeFirebaseAdapter();
      console.log("[Storage] Adapter Firebase activé");
    } catch (err) {
      console.warn("[Storage] Erreur Firebase, fallback local:", err);
      adapter = LocalAdapter;
    }
  } else {
    adapter = LocalAdapter;
    console.log("[Storage] Adapter local utilisé");
  }
})();

// ----- API publique -----
export async function storageGet(key, defaultValue = null) {
  if (!adapter) {
    // Attendre l'initialisation
    while (!adapter) {
      await new Promise(r => setTimeout(r, 10));
    }
  }
  
  try {
    const result = await adapter.get(key);
    return result !== null ? result : defaultValue;
  } catch (error) {
    console.error('[Storage] Erreur get:', error);
    return defaultValue;
  }
}

export async function storageSet(key, value) {
  if (!adapter) {
    while (!adapter) {
      await new Promise(r => setTimeout(r, 10));
    }
  }
  
  try {
    return await adapter.set(key, value);
  } catch (error) {
    console.error('[Storage] Erreur set:', error);
    return false;
  }
}

export async function storageRemove(key) {
  if (!adapter) {
    while (!adapter) {
      await new Promise(r => setTimeout(r, 10));
    }
  }
  
  try {
    return await adapter.remove(key);
  } catch (error) {
    console.error('[Storage] Erreur remove:', error);
    return false;
  }
}

export function storageSubscribe(key, callback) {
  if (!adapter) {
    console.warn('[Storage] Adapter pas encore prêt pour subscription');
    return () => {};
  }
  
  return adapter.subscribe(key, callback);
}
