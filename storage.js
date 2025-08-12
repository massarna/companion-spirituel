
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
  // Validation des paramètres
  if (!key || typeof key !== 'string') {
    console.error('[Storage] Clé invalide pour storageGet:', key);
    return defaultValue;
  }

  try {
    if (USE_FIREBASE && db && currentUser) {
      const docRef = doc(db, 'users', currentUser.uid, 'data', key);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        return validateStorageData(data.value, defaultValue);
      }
    }
  } catch (error) {
    console.warn(`[Storage] Erreur Firebase get ${key}:`, error);
    // Tentative de récupération depuis localStorage en cas d'échec Firebase
  }

  // Fallback localStorage avec validation renforcée
  try {
    const item = localStorage.getItem(key);
    if (item !== null) {
      const parsed = JSON.parse(item);
      return validateStorageData(parsed, defaultValue);
    }
    return defaultValue;
  } catch (error) {
    console.warn(`[Storage] Erreur localStorage get ${key}:`, error);
    // Tentative de récupération des données corrompues
    try {
      localStorage.removeItem(key);
      console.info(`[Storage] Clé corrompue supprimée: ${key}`);
    } catch (cleanupError) {
      console.error(`[Storage] Impossible de nettoyer la clé ${key}:`, cleanupError);
    }
    return defaultValue;
  }
}

// Fonction de validation des données
function validateStorageData(data, defaultValue) {
  if (data === null || data === undefined) {
    return defaultValue;
  }
  
  // Validation spécifique selon le type de données attendu
  if (typeof defaultValue === 'boolean' && typeof data !== 'boolean') {
    console.warn('[Storage] Type invalide, conversion en booléen');
    return Boolean(data);
  }
  
  if (typeof defaultValue === 'number' && typeof data !== 'number') {
    const num = Number(data);
    if (isNaN(num)) {
      console.warn('[Storage] Conversion numérique échouée, utilisation valeur par défaut');
      return defaultValue;
    }
    return num;
  }
  
  return data;
}

export async function storageSet(key, value) {
  // Validation des paramètres
  if (!key || typeof key !== 'string') {
    console.error('[Storage] Clé invalide pour storageSet:', key);
    return false;
  }

  // Validation de la valeur
  if (!isValidStorageValue(value)) {
    console.error('[Storage] Valeur invalide pour storageSet:', value);
    return false;
  }

  let firebaseSuccess = false;
  let localStorageSuccess = false;

  // Tentative Firebase avec retry
  if (USE_FIREBASE && db && currentUser) {
    try {
      const docRef = doc(db, 'users', currentUser.uid, 'data', key);
      await setDoc(docRef, { 
        value, 
        timestamp: Date.now(),
        version: '1.0'
      });
      firebaseSuccess = true;
      console.debug(`[Storage] Firebase set réussi: ${key}`);
    } catch (error) {
      console.warn(`[Storage] Erreur Firebase set ${key}:`, error);
      // Réessayer une fois après un délai
      setTimeout(async () => {
        try {
          const docRef = doc(db, 'users', currentUser.uid, 'data', key);
          await setDoc(docRef, { value, timestamp: Date.now(), version: '1.0' });
          console.info(`[Storage] Firebase retry réussi: ${key}`);
        } catch (retryError) {
          console.error(`[Storage] Firebase retry échoué: ${key}`, retryError);
        }
      }, 1000);
    }
  }

  // Sauvegarde localStorage avec gestion d'espace
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    localStorageSuccess = true;
    console.debug(`[Storage] localStorage set réussi: ${key}`);
  } catch (error) {
    console.error(`[Storage] Erreur localStorage set ${key}:`, error);
    
    // Gestion du quota dépassé
    if (error.name === 'QuotaExceededError') {
      console.warn('[Storage] Quota localStorage dépassé, tentative de nettoyage');
      try {
        cleanupOldStorageData();
        localStorage.setItem(key, JSON.stringify(value));
        localStorageSuccess = true;
        console.info(`[Storage] localStorage set réussi après nettoyage: ${key}`);
      } catch (cleanupError) {
        console.error('[Storage] Nettoyage et sauvegarde échoués:', cleanupError);
      }
    }
  }

  return firebaseSuccess || localStorageSuccess;
}

// Validation des valeurs à stocker
function isValidStorageValue(value) {
  try {
    JSON.stringify(value);
    return true;
  } catch (error) {
    return false;
  }
}

// Nettoyage des anciennes données
function cleanupOldStorageData() {
  const keysToRemove = [];
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('temp_') || key.startsWith('cache_')) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    try {
      localStorage.removeItem(key);
      console.debug(`[Storage] Clé temporaire supprimée: ${key}`);
    } catch (error) {
      console.warn(`[Storage] Impossible de supprimer ${key}:`, error);
    }
  });
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
