import Dexie from 'https://cdn.skypack.dev/dexie@3.2.4';

export const db = new Dexie('WorshipHubDB');
db.version(1).stores({
  songs: 'id, title, _syncStatus',
  setlists: 'id, name, _syncStatus',
  pendingChanges: '++id, tableName, recordId, timestamp'
});
