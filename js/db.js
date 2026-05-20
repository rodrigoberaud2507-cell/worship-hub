import Dexie from 'https://cdn.skypack.dev/dexie@3.2.4';

export const db = new Dexie('WorshipHubDB');
db.version(1).stores({
  songs: 'id, title, artist, key, bpm, _syncStatus',
  setlists: 'id, name, date, _syncStatus',
  pendingChanges: '++id, tableName, recordId, operation, timestamp',
  settings: 'key'
});

export async function getLocalSongs() { return await db.songs.orderBy('title').toArray(); }
export async function saveLocalSong(song) { await db.songs.put(song); }
export async function deleteLocalSong(id) { await db.songs.delete(id); }
export async function getLocalSetlists() { return await db.setlists.orderBy('date').reverse().toArray(); }
export async function saveLocalSetlist(setlist) { await db.setlists.put(setlist); }
export async function addPendingChange(change) { await db.pendingChanges.add({...change, timestamp: Date.now()}); }
export async function getPendingChanges() { return await db.pendingChanges.orderBy('timestamp').toArray(); }
export async function removePendingChange(id) { await db.pendingChanges.delete(id); }
export async function countPendingChanges() { return await db.pendingChanges.count(); }
