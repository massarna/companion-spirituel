
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
    console.warn('[Firebase] Persistance désactivée: plusieurs onglets ouverts');
  } else if (err.code == 'unimplemented') {
    console.warn('[Firebase] Persistance non supportée par ce navigateur');
  } else {
    console.warn('[Firebase] Erreur de persistance:', err);
  }
});

let currentUser = null;

// Gestion de l'authentification
onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (user) {
    console.log('[Firebase] Utilisateur connecté:', user.uid);
  } else if (USE_ANONYMOUS_AUTH) {
    console.log('[Firebase] Connexion anonyme...');
    signInAnonymously(auth).catch((error) => {
      console.error('[Firebase] Erreur connexion anonyme:', error);
    });
  }
});

// API Firebase pour le storage
export async function firebaseGet(key, defaultValue) {
  if (!currentUser) {
    console.warn('[Firebase] Pas d\'utilisateur connecté');
    return defaultValue;
  }

  try {
    const docRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data[key] !== undefined ? data[key] : defaultValue;
    } else {
      return defaultValue;
    }
  } catch (error) {
    console.error('[Firebase] Erreur get:', error);
    return defaultValue;
  }
}

export async function firebaseSet(key, value) {
  if (!currentUser) {
    console.warn('[Firebase] Pas d\'utilisateur connecté');
    return false;
  }

  try {
    const docRef = doc(db, 'users', currentUser.uid);
    await updateDoc(docRef, { [key]: value }).catch(async (error) => {
      if (error.code === 'not-found') {
        await setDoc(docRef, { [key]: value });
      } else {
        throw error;
      }
    });
    return true;
  } catch (error) {
    console.error('[Firebase] Erreur set:', error);
    return false;
  }
}

export async function firebaseRemove(key) {
  if (!currentUser) {
    console.warn('[Firebase] Pas d\'utilisateur connecté');
    return false;
  }

  try {
    const docRef = doc(db, 'users', currentUser.uid);
    await updateDoc(docRef, { [key]: null });
    return true;
  } catch (error) {
    console.error('[Firebase] Erreur remove:', error);
    return false;
  }
}

export function firebaseSubscribe(key, callback) {
  if (!currentUser) {
    console.warn('[Firebase] Pas d\'utilisateur connecté');
    return () => {};
  }

  const docRef = doc(db, 'users', currentUser.uid);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      const data = doc.data();
      callback(data[key]);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('[Firebase] Erreur subscribe:', error);
  });
}
