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
      return await mod.kvGet(key);
    },
    async set(key, value) {
      await mod.kvSet(key, value);
    },
    async remove(key) {
      // pas de remove dans cet exemple simple: on set à null
      await mod.kvSet(key, null);
    },
    async subscribe(key, cb) {
      return await mod.kvSubscribe(key, cb);
    }
  };
}

// Sélection de l’adapter
export async function getStorage() {
  if (!USE_FIREBASE) return LocalAdapter;
  if (!adapter) adapter = await makeFirebaseAdapter();
  return adapter;
}

// Petit helper pratique global
export async function storageGet(key, def = null) {
  const s = await getStorage();
  const v = await s.get(key);
  return (v === undefined || v === null) ? def : v;
}

export async function storageSet(key, value) {
  const s = await getStorage();
  return s.set(key, value);
}

export async function storageRemove(key) {
  const s = await getStorage();
  return s.remove(key);
}

export async function storageSubscribe(key, cb) {
  const s = await getStorage();
  return s.subscribe(key, cb);
}

// Expose (optionnel) sur window pour tester vite en console
window.storageAPI = { getStorage, storageGet, storageSet, storageRemove, storageSubscribe };
