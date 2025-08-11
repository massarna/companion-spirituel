import { firebaseConfig, USE_ANONYMOUS_AUTH } from "./config.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Offline d'abord: garde les données même sans connexion
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    // Plusieurs onglets ouverts, la persistance ne peut être activée que dans un onglet
    console.warn('[Firebase] Persistance désactivée: plusieurs onglets ouverts');
  } else if (err.code == 'unimplemented') {
    // Le navigateur ne supporte pas toutes les fonctionnalités requises
    console.warn('[Firebase] Persistance non supportée par ce navigateur');
  } else {
    console.warn('[Firebase] Erreur de persistance:', err);
  }
});

// Obtenir un UID (anonyme par défaut)
export const uidReady = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      resolve(user.uid);
    } else if (USE_ANONYMOUS_AUTH) {
      const cred = await signInAnonymously(auth);
      resolve(cred.user.uid);
    } else {
      // Pas d'auth → on travaille sans UID (fallback local côté storage)
      resolve(null);
    }
  });
});

// Helpers Firestore KV: users/{uid}/kv/{key}
export async function getKVRef(key) {
  const uid = await uidReady;
  if (!uid) return null;
  return doc(db, "users", uid, "kv", key);
}

export async function kvGet(key) {
  const ref = await getKVRef(key);
  if (!ref) return null;
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().value : null;
}

export async function kvSet(key, value) {
  const ref = await getKVRef(key);
  if (!ref) return null;
  // set avec merge pour créer/mettre à jour
  await setDoc(ref, { value }, { merge: true });
}

export async function kvUpdate(key, value) {
  const ref = await getKVRef(key);
  if (!ref) return null;
  await updateDoc(ref, { value });
}

export async function kvSubscribe(key, callback) {
  const ref = await getKVRef(key);
  if (!ref) return () => {};
  return onSnapshot(ref, (snap) => {
    callback(snap.exists() ? snap.data().value : null);
  });
}