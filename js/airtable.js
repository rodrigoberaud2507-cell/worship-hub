import { db, getLocalSongs, saveLocalSong, deleteLocalSong, getLocalSetlists, saveLocalSetlist, addPendingChange } from './db.js';

const PROXY_URL = '/api/proxy';
const REQUEST_TIMEOUT = 10000; // 10 segundos

async function callProxy(body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    const res = await fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Error del servidor');
    }
    return await res.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('La conexión tardó demasiado. Trabajando offline.');
    }
    throw error;
  }
}

export async function fetchSongs() {
  try {
    const records = await callProxy({ action: 'list', table: 'Songs' });
    const songs = records.map(r => ({ id: r.id, ...r.fields, _syncStatus: 'synced' }));
    await db.songs.clear();
    await db.songs.bulkPut(songs);
    return songs;
  } catch (error) {
    console.warn('Usando canciones locales:', error.message);
    return await getLocalSongs();
  }
}

// ... (el resto de funciones createSong, updateSong, deleteSong se mantienen igual)
// Asegúrate de copiarlas del código anterior.
export async function createSong(fields) {
  const tempId = 'temp_' + Date.now();
  const song = { id: tempId, ...fields, _syncStatus: 'pending' };
  await saveLocalSong(song);
  if (navigator.onLine) {
    try {
      const record = await callProxy({ action: 'create', table: 'Songs', data: fields });
      await deleteLocalSong(tempId);
      const final = { id: record.id, ...fields, _syncStatus: 'synced' };
      await saveLocalSong(final);
      return final;
    } catch {
      await addPendingChange({ tableName: 'Songs', recordId: tempId, operation: 'create', payload: fields });
    }
  } else {
    await addPendingChange({ tableName: 'Songs', recordId: tempId, operation: 'create', payload: fields });
  }
  return song;
}

export async function updateSong(id, fields) {
  await db.songs.update(id, { ...fields, _syncStatus: 'pending' });
  await addPendingChange({ tableName: 'Songs', recordId: id, operation: 'update', payload: fields });
  if (navigator.onLine) {
    try { await callProxy({ action: 'update', table: 'Songs', id, data: fields }); await db.songs.update(id, { _syncStatus: 'synced' }); } catch {}
  }
}

export async function deleteSong(id) {
  await deleteLocalSong(id);
  await addPendingChange({ tableName: 'Songs', recordId: id, operation: 'delete', payload: null });
  if (navigator.onLine) {
    try { await callProxy({ action: 'delete', table: 'Songs', id }); } catch {}
  }
}

export async function fetchSetlists() {
  try {
    const records = await callProxy({ action: 'list', table: 'Setlists' });
    const setlists = records.map(r => ({ id: r.id, ...r.fields, _syncStatus: 'synced' }));
    await db.setlists.clear(); await db.setlists.bulkPut(setlists);
    return setlists;
  } catch {
    return await getLocalSetlists();
  }
}

export async function createSetlist(fields) {
  const tempId = 'temp_setlist_' + Date.now();
  const sl = { id: tempId, ...fields, _syncStatus: 'pending' };
  await saveLocalSetlist(sl);
  if (navigator.onLine) {
    try {
      const record = await callProxy({ action: 'create', table: 'Setlists', data: fields });
      await db.setlists.delete(tempId);
      const final = { id: record.id, ...fields, _syncStatus: 'synced' };
      await saveLocalSetlist(final);
      return final;
    } catch {
      await addPendingChange({ tableName: 'Setlists', recordId: tempId, operation: 'create', payload: fields });
    }
  } else {
    await addPendingChange({ tableName: 'Setlists', recordId: tempId, operation: 'create', payload: fields });
  }
  return sl;
}
