import { db } from './db.js';

const PROXY_URL = '/api/proxy';

// Función helper para llamar al proxy
async function callProxy(body) {
  const res = await fetch(PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error de conexión con el servidor');
  }
  
  return res.json();
}

// ==================== CANCIONES ====================

export async function fetchSongs(params = {}) {
  try {
    const records = await callProxy({ 
      action: 'list', 
      table: 'Songs',
      params: {
        sort: [{ field: 'title', direction: 'asc' }],
        ...params
      }
    });
    
    const songs = records.map(r => ({ 
      id: r.id, 
      ...r.fields, 
      _syncStatus: 'synced' 
    }));
    
    // Actualizar caché local
    await db.songs.bulkPut(songs);
    
    return songs;
  } catch (error) {
    console.warn('Usando datos offline:', error.message);
    return await db.songs.toArray();
  }
}

export async function createSong(fields) {
  // Guardar localmente primero (offline-first)
  const tempId = 'temp_' + Date.now();
  const songData = { 
    id: tempId, 
    ...fields, 
    _syncStatus: 'pending',
    createdAt: new Date().toISOString()
  };
  
  await db.songs.put(songData);
  
  // Intentar sincronizar con el servidor
  try {
    const record = await callProxy({ 
      action: 'create', 
      table: 'Songs', 
      data: fields 
    });
    
    // Reemplazar el temporal con el real
    await db.songs.delete(tempId);
    const finalSong = { 
      id: record.id, 
      ...record.fields, 
      _syncStatus: 'synced' 
    };
    await db.songs.put(finalSong);
    
    return finalSong;
  } catch (error) {
    // Guardar en cola de pendientes para reintentar
    await db.pendingChanges.add({
      tableName: 'songs',
      recordId: tempId,
      operation: 'create',
      payload: fields,
      timestamp: Date.now()
    });
    
    return songData;
  }
}

export async function updateSong(id, fields) {
  // Actualizar localmente
  await db.songs.update(id, { ...fields, _syncStatus: 'pending' });
  
  // Guardar en cola de sincronización
  await db.pendingChanges.add({
    tableName: 'songs',
    recordId: id,
    operation: 'update',
    payload: fields,
    timestamp: Date.now()
  });
  
  // Intentar sincronizar si hay conexión
  if (navigator.onLine) {
    try {
      await callProxy({ 
        action: 'update', 
        table: 'Songs', 
        id, 
        data: fields 
      });
      await db.songs.update(id, { _syncStatus: 'synced' });
    } catch (error) {
      console.warn('Cambio guardado localmente, se sincronizará después');
    }
  }
}

export async function deleteSong(id) {
  // Eliminar localmente
  await db.songs.delete(id);
  
  // Guardar operación pendiente
  await db.pendingChanges.add({
    tableName: 'songs',
    recordId: id,
    operation: 'delete',
    payload: null,
    timestamp: Date.now()
  });
  
  // Intentar eliminar del servidor
  if (navigator.onLine) {
    try {
      await callProxy({ action: 'delete', table: 'Songs', id });
    } catch (error) {
      console.warn('Eliminación pendiente de sincronización');
    }
  }
}

export async function searchSongs(query) {
  const allSongs = await db.songs.toArray();
  const q = query.toLowerCase();
  return allSongs.filter(s => 
    s.title?.toLowerCase().includes(q) ||
    s.artist?.toLowerCase().includes(q) ||
    s.key?.toLowerCase().includes(q) ||
    s.tags?.some(tag => tag.toLowerCase().includes(q))
  );
}

// ==================== SETLISTS ====================

export async function fetchSetlists() {
  try {
    const records = await callProxy({ 
      action: 'list', 
      table: 'Setlists',
      params: { sort: [{ field: 'date', direction: 'desc' }] }
    });
    
    const setlists = records.map(r => ({ 
      id: r.id, 
      ...r.fields, 
      _syncStatus: 'synced' 
    }));
    
    await db.setlists.bulkPut(setlists);
    return setlists;
  } catch (error) {
    return await db.setlists.toArray();
  }
}

export async function createSetlist(fields) {
  const tempId = 'temp_' + Date.now();
  await db.setlists.put({ id: tempId, ...fields, _syncStatus: 'pending' });
  
  try {
    const record = await callProxy({ 
      action: 'create', 
      table: 'Setlists', 
      data: fields 
    });
    await db.setlists.delete(tempId);
    await db.setlists.put({ id: record.id, ...record.fields, _syncStatus: 'synced' });
    return record;
  } catch {
    await db.pendingChanges.add({
      tableName: 'setlists',
      recordId: tempId,
      operation: 'create',
      payload: fields,
      timestamp: Date.now()
    });
    return { id: tempId, ...fields };
  }
}

// ==================== EVENTOS ====================

export async function fetchEvents() {
  try {
    const records = await callProxy({ 
      action: 'list', 
      table: 'Events',
      params: { sort: [{ field: 'date', direction: 'asc' }] }
    });
    
    const events = records.map(r => ({ 
      id: r.id, 
      ...r.fields, 
      _syncStatus: 'synced' 
    }));
    
    await db.events.bulkPut(events);
    return events;
  } catch (error) {
    return await db.events.toArray();
  }
}
