import { db } from './db.js';
import { updateSong, createSong, deleteSong } from './airtable.js';

async function callProxy(body) {
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Error');
  return res.json();
}

export async function processPendingChanges() {
  const changes = await db.pendingChanges.orderBy('timestamp').toArray();
  for (const change of changes) {
    try {
      switch (change.operation) {
        case 'create':
          await callProxy({ action: 'create', table: change.tableName, data: change.payload });
          break;
        case 'update':
          await callProxy({ action: 'update', table: change.tableName, id: change.recordId, data: change.payload });
          break;
        case 'delete':
          await callProxy({ action: 'delete', table: change.tableName, id: change.recordId });
          break;
      }
      await db.pendingChanges.delete(change.id);
    } catch {
      break;
    }
  }
}

window.addEventListener('online', () => {
  const badge = document.getElementById('connection-badge');
  if (badge) {
    badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200';
    badge.textContent = '🟢 Online';
  }
  processPendingChanges();
});

window.addEventListener('offline', () => {
  const badge = document.getElementById('connection-badge');
  if (badge) {
    badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200';
    badge.textContent = '🔴 Offline';
  }
});
