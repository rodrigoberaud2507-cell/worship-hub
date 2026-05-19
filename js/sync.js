import { db } from './db.js';
import { callProxy } from './airtable.js';

const SYNC_INTERVAL = 30000; // 30 segundos

let syncInProgress = false;

export async function processPendingChanges() {
  if (syncInProgress) return;
  syncInProgress = true;
  
  const changes = await db.pendingChanges.orderBy('timestamp').toArray();
  let successCount = 0;
  
  for (const change of changes) {
    try {
      switch (change.operation) {
        case 'create':
          await callProxy({ 
            action: 'create', 
            table: change.tableName, 
            data: change.payload 
          });
          break;
        case 'update':
          await callProxy({ 
            action: 'update', 
            table: change.tableName, 
            id: change.recordId, 
            data: change.payload 
          });
          break;
        case 'delete':
          await callProxy({ 
            action: 'delete', 
            table: change.tableName, 
            id: change.recordId 
          });
          break;
      }
      
      await db.pendingChanges.delete(change.id);
      successCount++;
    } catch (error) {
      console.warn(`Error sincronizando ${change.operation} en ${change.tableName}:`, error.message);
      break; // Detener si hay error de red
    }
  }
  
  if (successCount > 0) {
    console.log(`✅ ${successCount} cambios sincronizados`);
    // Actualizar indicador visual
    updateSyncIndicator();
  }
  
  syncInProgress = false;
}

function updateSyncIndicator() {
  const badge = document.getElementById('connection-badge');
  if (badge && navigator.onLine) {
    badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200';
    badge.textContent = '✅ Sincronizado';
    setTimeout(() => {
      badge.textContent = '🟢 Online';
    }, 2000);
  }
}

// Iniciar sincronización automática
export function startAutoSync() {
  // Sincronizar al iniciar
  processPendingChanges();
  
  // Sincronizar periódicamente
  setInterval(processPendingChanges, SYNC_INTERVAL);
  
  // Sincronizar al reconectar
  window.addEventListener('online', () => {
    console.log('🟢 Conexión restaurada, sincronizando...');
    updateOnlineStatus(true);
    processPendingChanges();
  });
  
  window.addEventListener('offline', () => {
    console.log('🔴 Sin conexión, trabajando offline');
    updateOnlineStatus(false);
  });
  
  // Verificar estado inicial
  updateOnlineStatus(navigator.onLine);
}

function updateOnlineStatus(online) {
  const badge = document.getElementById('connection-badge');
  if (!badge) return;
  
  if (online) {
    badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200';
    badge.textContent = '🟢 Online';
  } else {
    badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200';
    badge.textContent = '🔴 Offline';
  }
}

export async function getSyncStats() {
  const pending = await db.pendingChanges.count();
  const songs = await db.songs.filter(s => s._syncStatus === 'pending').count();
  return { pendingChanges: pending, pendingSongs: songs };
}
