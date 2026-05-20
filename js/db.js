/**
 * WorshipHub - Módulo de Base de Datos Local (IndexedDB)
 * Utiliza Dexie.js para gestionar almacenamiento offline
 */

// Importar Dexie desde CDN
import Dexie from 'https://cdn.skypack.dev/dexie@3.2.4';

// Crear instancia de la base de datos
export const db = new Dexie('WorshipHubDB');

// Definir esquema de tablas
db.version(1).stores({
  songs: 'id, title, artist, key, bpm, _syncStatus, createdAt',
  setlists: 'id, name, date, _syncStatus, createdAt',
  events: 'id, name, date, _syncStatus, createdAt',
  pendingChanges: '++id, tableName, recordId, operation, timestamp',
  settings: 'key'
});

// ==================== CANCIONES ====================

/**
 * Obtener todas las canciones del almacenamiento local
 */
export async function getLocalSongs() {
  try {
    const songs = await db.songs.orderBy('title').toArray();
    return songs;
  } catch (error) {
    console.error('Error obteniendo canciones locales:', error);
    return [];
  }
}

/**
 * Guardar una canción localmente
 */
export async function saveLocalSong(song) {
  try {
    await db.songs.put(song);
    return true;
  } catch (error) {
    console.error('Error guardando canción local:', error);
    return false;
  }
}

/**
 * Eliminar una canción localmente
 */
export async function deleteLocalSong(id) {
  try {
    await db.songs.delete(id);
    return true;
  } catch (error) {
    console.error('Error eliminando canción local:', error);
    return false;
  }
}

// ==================== SETLISTS ====================

export async function getLocalSetlists() {
  try {
    return await db.setlists.orderBy('date').reverse().toArray();
  } catch (error) {
    console.error('Error obteniendo setlists locales:', error);
    return [];
  }
}

export async function saveLocalSetlist(setlist) {
  try {
    await db.setlists.put(setlist);
    return true;
  } catch (error) {
    console.error('Error guardando setlist local:', error);
    return false;
  }
}

// ==================== CAMBIOS PENDIENTES ====================

/**
 * Agregar un cambio a la cola de sincronización
 */
export async function addPendingChange(change) {
  try {
    await db.pendingChanges.add({
      ...change,
      timestamp: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Error agregando cambio pendiente:', error);
    return false;
  }
}

/**
 * Obtener todos los cambios pendientes
 */
export async function getPendingChanges() {
  try {
    return await db.pendingChanges.orderBy('timestamp').toArray();
  } catch (error) {
    console.error('Error obteniendo cambios pendientes:', error);
    return [];
  }
}

/**
 * Eliminar un cambio pendiente
 */
export async function removePendingChange(id) {
  try {
    await db.pendingChanges.delete(id);
    return true;
  } catch (error) {
    console.error('Error eliminando cambio pendiente:', error);
    return false;
  }
}

/**
 * Contar cambios pendientes
 */
export async function countPendingChanges() {
  try {
    return await db.pendingChanges.count();
  } catch (error) {
    console.error('Error contando cambios pendientes:', error);
    return 0;
  }
}

// ==================== CONFIGURACIÓN ====================

export async function getSetting(key) {
  try {
    const setting = await db.settings.get(key);
    return setting ? setting.value : null;
  } catch (error) {
    return null;
  }
}

export async function setSetting(key, value) {
  try {
    await db.settings.put({ key, value });
    return true;
  } catch (error) {
    return false;
  }
}
