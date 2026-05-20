import { db, getLocalSongs, saveLocalSong, deleteLocalSong, getLocalSetlists, saveLocalSetlist, addPendingChange } from './db.js';

const PROXY_URL = '/api/proxy';

async function callProxy(body) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error((await res.json().catch(()=>({}))).error || 'Error');
  return res.json();
}

export async function fetchSongs() {
  try {
    const records = await callProxy({ action:'list', table:'Songs' });
    const songs = records.map(r => ({ id: r.id, ...r.fields, _syncStatus:'synced' }));
    await db.songs.clear();
    await db.songs.bulkPut(songs);
    return songs;
  } catch { return await getLocalSongs(); }
}

export async function createSong(fields) {
  const tempId = 'temp_'+Date.now();
  const song = { id:tempId, ...fields, _syncStatus:'pending' };
  await saveLocalSong(song);
  if (navigator.onLine) {
    try {
      const record = await callProxy({ action:'create', table:'Songs', data:fields });
      await deleteLocalSong(tempId);
      const final = { id:record.id, ...fields, _syncStatus:'synced' };
      await saveLocalSong(final);
      return final;
    } catch { await addPendingChange({ tableName:'Songs', recordId:tempId, operation:'create', payload:fields }); }
  } else { await addPendingChange({ tableName:'Songs', recordId:tempId, operation:'create', payload:fields }); }
  return song;
}

export async function updateSong(id, fields) {
  await db.songs.update(id, { ...fields, _syncStatus:'pending' });
  await addPendingChange({ tableName:'Songs', recordId:id, operation:'update', payload:fields });
  if (navigator.onLine) {
    try { await callProxy({ action:'update', table:'Songs', id, data:fields }); await db.songs.update(id, {_syncStatus:'synced'}); } catch {}
  }
}

export async function deleteSong(id) {
  await deleteLocalSong(id);
  await addPendingChange({ tableName:'Songs', recordId:id, operation:'delete', payload:null });
  if (navigator.onLine) { try { await callProxy({ action:'delete', table:'Songs', id }); } catch {} }
}

export async function fetchSetlists() {
  try {
    const records = await callProxy({ action:'list', table:'Setlists' });
    const setlists = records.map(r => ({ id:r.id, ...r.fields, _syncStatus:'synced' }));
    await db.setlists.clear(); await db.setlists.bulkPut(setlists);
    return setlists;
  } catch { return await getLocalSetlists(); }
}

export async function createSetlist(fields) {
  const tempId = 'temp_setlist_'+Date.now();
  const sl = { id:tempId, ...fields, _syncStatus:'pending' };
  await saveLocalSetlist(sl);
  if (navigator.onLine) {
    try {
      const record = await callProxy({ action:'create', table:'Setlists', data:fields });
      await db.setlists.delete(tempId);
      const final = { id:record.id, ...fields, _syncStatus:'synced' };
      await saveLocalSetlist(final);
      return final;
    } catch { await addPendingChange({ tableName:'Setlists', recordId:tempId, operation:'create', payload:fields }); }
  } else { await addPendingChange({ tableName:'Setlists', recordId:tempId, operation:'create', payload:fields }); }
  return sl;
}

  return setlistData;
}
