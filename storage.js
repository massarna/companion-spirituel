
// storage.js - Gestion du stockage avec Firebase/localStorage
import { USE_FIREBASE, USE_ANONYMOUS_AUTH } from './config.js';

let firebaseApp = null;
let auth = null;
let db = null;
let currentUser = null;

// Initialisation Firebase si activé
export async function initFirebase() {
  if (!USE_FIREBASE) {
    console.log('[Storage] Mode localStorage uniquement');
    return false;
  }

  try {
    const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
    const { getAuth, signInAnonymously, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    const { getFirestore, doc, setDoc, getDoc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    
    const { firebaseConfig } = await import('./config.js');
    
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    db = getFirestore(firebaseApp);

    if (USE_ANONYMOUS_AUTH) {
      await signInAnonymously(auth);
      console.log('[Storage] Connexion anonyme Firebase réussie');
    }

    onAuthStateChanged(auth, (user) => {
      currentUser = user;
      if (user) {
        console.log('[Storage] Utilisateur connecté:', user.uid);
      }
    });

    return true;
  } catch (error) {
    console.warn('[Storage] Erreur Firebase, fallback localStorage:', error);
    return false;
  }
}

// Fonctions de stockage
export async function storageGet(key, defaultValue) {
  try {
    if (USE_FIREBASE && db && currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'data', key);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data().value : defaultValue;
    }
  } catch (error) {
    console.warn(`[Storage] Erreur Firebase get ${key}:`, error);
  }

  // Fallback localStorage
  try {
    const item = localStorage.getItem(key);
    return item !== null ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`[Storage] Erreur localStorage get ${key}:`, error);
    return defaultValue;
  }
}

export async function storageSet(key, value) {
  try {
    if (USE_FIREBASE && db && currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'data', key);
      await setDoc(docRef, { value });
    }
  } catch (error) {
    console.warn(`[Storage] Erreur Firebase set ${key}:`, error);
  }

  // Toujours sauvegarder en localStorage aussi
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`[Storage] Erreur localStorage set ${key}:`, error);
    return false;
  }
}

export async function storageRemove(key) {
  try {
    if (USE_FIREBASE && db && currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'data', key);
      await deleteDoc(docRef);
    }
  } catch (error) {
    console.warn(`[Storage] Erreur Firebase remove ${key}:`, error);
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`[Storage] Erreur localStorage remove ${key}:`, error);
    return false;
  }
}

export function storageSubscribe(key, callback) {
  const handler = (e) => {
    if (e.key === key) {
      callback(e.newValue ? JSON.parse(e.newValue) : null);
    }
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

// Initialisation automatique
if (USE_FIREBASE) {
  initFirebase().catch(console.error);
}
