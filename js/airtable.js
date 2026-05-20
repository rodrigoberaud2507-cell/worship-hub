/**
 * WorshipHub - Módulo de API para Airtable
 * Gestiona todas las comunicaciones con Airtable a través del proxy seguro
 */

import { 
  db, 
  getLocalSongs, 
  saveLocalSong, 
  deleteLocalSong,
  getLocalSetlists, 
  saveLocalSetlist,
  addPendingChange 
} from './db.js';

// URL del proxy seguro (nunca expone la API key)
const PROXY_URL = '/api/proxy';

/**
 * Realizar una llamada al proxy de Airtable
 */
async function callProxy(body) {
  try {
    const response = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Error HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en callProxy:', error.message);
    throw error;
  }
}

// ==================== CANCIONES ====================

/**
 * Obtener todas las canciones desde Airtable
 */
export async function fetchSongs() {
  try {
    const records = await callProxy({ 
      action: 'list', 
      table: 'Songs',
      params: {
        sort: [{ field: 'title', direction: 'asc' }]
      }
    });

    // Transformar registros de Airtable a nuestro formato
    const songs = records.map(record => ({
      id: record.id,
      title: record.fields.title || '',
      artist: record.fields.artist || '',
      key: record.fields.key || '',
      bpm: record.fields.bpm || null,
      timeSignature: record.fields.timeSignature || '4/4',
      chordpro: record.fields.chordpro || '',
      link: record.fields.link || '',
      pdfUrl: record.fields.pdfUrl || '',
      sections: record.fields.sections || '',
      tags: record.fields.tags || [],
      _syncStatus: 'synced',
      createdAt: record.fields.createdAt || new Date().toISOString()
    }));

    // Actualizar caché local
    await db.songs.clear();
    if (songs.length > 0) {
      await db.songs.bulkPut(songs);
    }

    return songs;
  } catch (error) {
    console.warn('No se pudo conectar con Airtable, usando datos locales:', error.message);
    // Fallback a datos locales
    return await getLocalSongs();
  }
}

/**
 * Crear una nueva canción
 */
export async function createSong(fields) {
  // Generar ID temporal para uso offline
  const tempId = 'temp_' + Date.now();
  const songData = {
    id: tempId,
    title: fields.title || '',
    artist: fields.artist || '',
    key: fields.key || '',
    bpm: fields.bpm || null,
    timeSignature: fields.timeSignature || '4/4',
    chordpro: fields.chordpro || '',
    link: fields.link || '',
    pdfUrl: fields.pdfUrl || '',
    sections: fields.sections || '',
    tags: fields.tags || [],
    _syncStatus: 'pending',
    createdAt: new Date().toISOString()
  };

  // Guardar localmente primero (offline-first)
  await saveLocalSong(songData);

  // Intentar sincronizar con Airtable
  if (navigator.onLine) {
    try {
      const record = await callProxy({
        action: 'create',
        table: 'Songs',
        data: {
          title: fields.title,
          artist: fields.artist || '',
          key: fields.key || '',
          bpm: fields.bpm ? parseInt(fields.bpm) : undefined,
          timeSignature: fields.timeSignature || '4/4',
          chordpro: fields.chordpro || '',
          link: fields.link || '',
          pdfUrl: fields.pdfUrl || '',
          sections: fields.sections || '',
          tags: fields.tags || []
        }
      });

      // Reemplazar el registro temporal con el real
      await deleteLocalSong(tempId);
      const finalSong = {
        id: record.id,
        ...songData,
        _syncStatus: 'synced'
      };
      delete finalSong.id;
      await saveLocalSong({ id: record.id, ...finalSong, _syncStatus: 'synced' });
      
      return { id: record.id, ...finalSong };
    } catch (error) {
      console.warn('Canción guardada localmente, se sincronizará después');
      // Agregar a cola de pendientes
      await addPendingChange({
        tableName: 'Songs',
        recordId: tempId,
        operation: 'create',
        payload: fields
      });
    }
  } else {
    // Sin conexión, agregar a cola de pendientes
    await addPendingChange({
      tableName: 'Songs',
      recordId: tempId,
      operation: 'create',
      payload: fields
    });
  }

  return songData;
}

/**
 * Actualizar una canción existente
 */
export async function updateSong(id, fields) {
  // Actualizar localmente
  const existing = await db.songs.get(id);
  if (existing) {
    await db.songs.update(id, {
      ...fields,
      _syncStatus: 'pending'
    });
  }

  // Agregar a cola de sincronización
  await addPendingChange({
    tableName: 'Songs',
    recordId: id,
    operation: 'update',
    payload: fields
  });

  // Intentar sincronizar si hay conexión
  if (navigator.onLine) {
    try {
      await callProxy({
        action: 'update',
        table: 'Songs',
        id: id,
        data: {
          title: fields.title,
          artist: fields.artist,
          key: fields.key,
          bpm: fields.bpm ? parseInt(fields.bpm) : undefined,
          timeSignature: fields.timeSignature,
          chordpro: fields.chordpro,
          link: fields.link,
          pdfUrl: fields.pdfUrl,
          sections: fields.sections,
          tags: fields.tags
        }
      });
      
      // Marcar como sincronizado
      if (existing) {
        await db.songs.update(id, { _syncStatus: 'synced' });
      }
    } catch (error) {
      console.warn('Actualización pendiente de sincronización');
    }
  }
}

/**
 * Eliminar una canción
 */
export async function deleteSong(id) {
  // Eliminar localmente
  await deleteLocalSong(id);

  // Agregar a cola de sincronización
  await addPendingChange({
    tableName: 'Songs',
    recordId: id,
    operation: 'delete',
    payload: null
  });

  // Intentar eliminar del servidor
  if (navigator.onLine) {
    try {
      await callProxy({
        action: 'delete',
        table: 'Songs',
        id: id
      });
    } catch (error) {
      console.warn('Eliminación pendiente de sincronización');
    }
  }
}

/**
 * Buscar canciones localmente
 */
export async function searchSongs(query) {
  const allSongs = await getLocalSongs();
  const q = query.toLowerCase().trim();
  
  if (!q) return allSongs;
  
  return allSongs.filter(song => 
    (song.title && song.title.toLowerCase().includes(q)) ||
    (song.artist && song.artist.toLowerCase().includes(q)) ||
    (song.key && song.key.toLowerCase().includes(q)) ||
    (song.tags && song.tags.some(tag => tag.toLowerCase().includes(q)))
  );
}

// ==================== SETLISTS ====================

export async function fetchSetlists() {
  try {
    const records = await callProxy({ 
      action: 'list', 
      table: 'Setlists',
      params: {
        sort: [{ field: 'date', direction: 'desc' }]
      }
    });

    const setlists = records.map(record => ({
      id: record.id,
      name: record.fields.name || '',
      date: record.fields.date || null,
      songIds: record.fields.songIds || '[]',
      notes: record.fields.notes || '',
      _syncStatus: 'synced',
      createdAt: record.fields.createdAt || new Date().toISOString()
    }));

    await db.setlists.clear();
    if (setlists.length > 0) {
      await db.setlists.bulkPut(setlists);
    }

    return setlists;
  } catch (error) {
    console.warn('Usando setlists locales:', error.message);
    return await getLocalSetlists();
  }
}

export async function createSetlist(fields) {
  const tempId = 'temp_setlist_' + Date.now();
  const setlistData = {
    id: tempId,
    name: fields.name || '',
    date: fields.date || new Date().toISOString(),
    songIds: fields.songIds || '[]',
    notes: fields.notes || '',
    _syncStatus: 'pending',
    createdAt: new Date().toISOString()
  };

  await saveLocalSetlist(setlistData);

  if (navigator.onLine) {
    try {
      const record = await callProxy({
        action: 'create',
        table: 'Setlists',
        data: {
          name: fields.name,
          date: fields.date,
          songIds: fields.songIds,
          notes: fields.notes
        }
      });

      await db.setlists.delete(tempId);
      await saveLocalSetlist({ id: record.id, ...setlistData, _syncStatus: 'synced' });
      return { id: record.id, ...setlistData };
    } catch (error) {
      await addPendingChange({
        tableName: 'Setlists',
        recordId: tempId,
        operation: 'create',
        payload: fields
      });
    }
  } else {
    await addPendingChange({
      tableName: 'Setlists',
      recordId: tempId,
      operation: 'create',
      payload: fields
    });
  }

  return setlistData;
}
