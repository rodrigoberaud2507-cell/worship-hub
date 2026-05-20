/**
 * Envoltura ligera de IndexedDB sin dependencias externas.
 * Reemplaza a Dexie para evitar errores de CDN.
 */

const DB_NAME = 'WorshipHubDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('songs')) {
        db.createObjectStore('songs', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('setlists')) {
        db.createObjectStore('setlists', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('pendingChanges')) {
        const store = db.createObjectStore('pendingChanges', { autoIncrement: true, keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }
    };
  });
}

function performTransaction(storeName, mode, callback) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      const result = callback(store, tx);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  });
}

export const db = {
  songs: {
    async orderBy(field) {
      // orderBy no es necesario para toArray, lo ignoramos
      return this.toArray();
    },
    async toArray() {
      return performTransaction('songs', 'readonly', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      });
    },
    async get(id) {
      return performTransaction('songs', 'readonly', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.get(id);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    },
    async put(item) {
      return performTransaction('songs', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    },
    async bulkPut(items) {
      return performTransaction('songs', 'readwrite', (store) => {
        return Promise.all(items.map(item => new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = resolve;
          request.onerror = reject;
        })));
      });
    },
    async update(id, changes) {
      const existing = await this.get(id);
      if (!existing) return;
      const updated = { ...existing, ...changes };
      return this.put(updated);
    },
    async delete(id) {
      return performTransaction('songs', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    async clear() {
      return performTransaction('songs', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    async count() {
      return performTransaction('songs', 'readonly', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    }
  },
  setlists: {
    async toArray() {
      return performTransaction('setlists', 'readonly', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      });
    },
    async put(item) {
      return performTransaction('setlists', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    async bulkPut(items) {
      return performTransaction('setlists', 'readwrite', (store) => {
        return Promise.all(items.map(item => new Promise((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = resolve;
          request.onerror = reject;
        })));
      });
    },
    async delete(id) {
      return performTransaction('setlists', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    async clear() {
      return performTransaction('setlists', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    }
  },
  pendingChanges: {
    async toArray() {
      return performTransaction('pendingChanges', 'readonly', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.getAll();
          request.onsuccess = () => resolve(request.result || []);
          request.onerror = () => reject(request.error);
        });
      });
    },
    async add(change) {
      return performTransaction('pendingChanges', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.add({ ...change, timestamp: Date.now() });
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    },
    async delete(id) {
      return performTransaction('pendingChanges', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    async clear() {
      return performTransaction('pendingChanges', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    },
    async count() {
      return performTransaction('pendingChanges', 'readonly', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      });
    }
  },
  settings: {
    async get(key) {
      return performTransaction('settings', 'readonly', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result ? request.result.value : null);
          request.onerror = () => reject(request.error);
        });
      });
    },
    async set(key, value) {
      return performTransaction('settings', 'readwrite', (store) => {
        return new Promise((resolve, reject) => {
          const request = store.put({ key, value });
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      });
    }
  }
};

// Mantenemos las mismas funciones auxiliares que usan los otros módulos
export async function getLocalSongs() {
  return await db.songs.toArray();
}
export async function saveLocalSong(song) {
  await db.songs.put(song);
}
export async function deleteLocalSong(id) {
  await db.songs.delete(id);
}
export async function getLocalSetlists() {
  return await db.setlists.toArray();
}
export async function saveLocalSetlist(setlist) {
  await db.setlists.put(setlist);
}
export async function addPendingChange(change) {
  await db.pendingChanges.add(change);
}
export async function getPendingChanges() {
  const changes = await db.pendingChanges.toArray();
  // Ordenar por timestamp ascendente (más antiguos primero)
  return changes.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
}
export async function removePendingChange(id) {
  await db.pendingChanges.delete(id);
}
export async function countPendingChanges() {
  return await db.pendingChanges.count();
}
