
// Bridge pour l'API de stockage
import { storageAPI } from './storage.js';

// Exposer l'API globalement
window.storageAPI = storageAPI;

console.log('[Bridge] API de stockage initialisée');
