// Active Firebase en mettant true quand tu es prêt
export const USE_FIREBASE = true;

// Pour commencer sans te prendre la tête, on utilisera l'auth anonyme.
// Tu pourras passer à Google/Email plus tard.
export const USE_ANONYMOUS_AUTH = true;

// Ta config Firebase (les clés publiques ne sont PAS secrètes côté web)
export const firebaseConfig = {
  apiKey: "VOTRE_VRAIE_CLE_API_FIREBASE_ICI",
  authDomain: "compagnon-spirituel.firebaseapp.com",
  projectId: "compagnon-spirituel",
  storageBucket: "compagnon-spirituel.firebasestorage.app",
  messagingSenderId: "615613488855",
  appId: "1:615613488855:web:c2d406ab77ec25df339a92",
};
