
// Firebase module (optionnel)
export class FirebaseStorage {
  constructor() {
    this.enabled = false;
  }

  async get(key, defaultValue) {
    return defaultValue;
  }

  async set(key, value) {
    return true;
  }

  async remove(key) {
    return true;
  }
}

console.log('[Firebase] Module Firebase initialisé (mode désactivé)');
