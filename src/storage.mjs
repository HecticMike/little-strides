import { freshState, validateBackup } from './engine.mjs';
let database;
let queue = Promise.resolve();
async function db() {
  if (!database) database = await new Promise((resolve, reject) => {
    const request = indexedDB.open('little-strides', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('state');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other Little Strides tabs, then retry.'));
  });
  return database;
}
export async function loadState() {
  const d = await db();
  const stored = await new Promise((resolve, reject) => {
    const req = d.transaction('state').objectStore('state').get('current');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return stored ? validateBackup({ format: 'little-strides', schemaVersion: 1, data: stored }) : freshState();
}
export function saveState(state) {
  const snapshot = structuredClone(state);
  const operation = queue.catch(() => {}).then(async () => {
    const d = await db();
    await new Promise((resolve, reject) => {
      const tx = d.transaction('state', 'readwrite');
      tx.objectStore('state').put(snapshot, 'current');
      tx.oncomplete = resolve;
      tx.onabort = () => reject(tx.error || new Error('Could not save data.'));
      tx.onerror = () => reject(tx.error);
    });
  });
  queue = operation;
  return operation;
}
export const backup = state => JSON.stringify({ format: 'little-strides', schemaVersion: 1, exportedAt: Date.now(), data: state }, null, 2);
