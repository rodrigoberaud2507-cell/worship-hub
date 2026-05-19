import Dexie from 'https://cdn.skypack.dev/dexie@3.2.4';

export const db = new Dexie('WorshipHubDB');

db.version(1).stores({
  songs: 'id, title, artist, key, bpm, _syncStatus',
  setlists: 'id, name, date, _syncStatus',
  events: 'id, name, date, _syncStatus',
  pendingChanges: '++id, tableName, recordId, operation, timestamp'
});

// Helpers para estado offline
export async function getOfflineSongs() {
  return await db.songs.toArray();
}

export async function getPendingCount() {
  return await db.pendingChanges.count();
}
