console.log('[Compagnon] bridge: start');
import "./config.js";
import { storageGet, storageSet, storageRemove, storageSubscribe } from "./storage.js";
window.storageAPI = { storageGet, storageSet, storageRemove, storageSubscribe };
console.log('[Compagnon] bridge: ready', window.storageAPI);