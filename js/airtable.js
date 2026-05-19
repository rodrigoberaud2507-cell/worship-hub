import { db } from './db.js';

const PROXY_URL = '/api/proxy';

async function callProxy(body) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error de red');
  }
  return res.json();
}

export async function fetchSongs() {
  const records = await callProxy({ action: 'list', table: 'Songs' });
  const songs = records.map(r => ({ id: r.id, ...r.fields, _syncStatus: 'synced' }));
  await db.songs.bulkPut(songs);
  return songs;
}

export async function createSong(fields) {
  const tempId = 'temp_' + Date.now();
  await db.songs.put({ id: tempId, ...fields, _syncStatus: 'pending' });
  try {
    const record = await callProxy({ action: 'create', table: 'Songs', data: fields });
    await db.songs.delete(tempId);
    await db.songs.put({ id: record.id, ...record.fields, _syncStatus: 'synced' });
    return record;
  } catch {
    return { id: tempId, ...fields, _syncStatus: 'pending' };
  }
}

export async function updateSong(id, fields) {
  await db.songs.update(id, { ...fields, _syncStatus: 'pending' });
  await db.pendingChanges.add({
    tableName: 'songs', recordId: id, operation: 'update',
    payload: fields, timestamp: Date.now()
  });
  if (navigator.onLine) {
    try {
      await callProxy({ action: 'update', table: 'Songs', id, data: fields });
      await db.songs.update(id, { _syncStatus: 'synced' });
    } catch {}
  }
}

export async function deleteSong(id) {
  await db.songs.delete(id);
  await db.pendingChanges.add({
    tableName: 'songs', recordId: id, operation: 'delete',
    payload: null, timestamp: Date.now()
  });
  if (navigator.onLine) {
    try { await callProxy({ action: 'delete', table: 'Songs', id }); } catch {}
  }
}
