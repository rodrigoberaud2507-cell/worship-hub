import { db } from './db.js';
import { updateSong, createSong, deleteSong } from './airtable.js';

export async function processPendingChanges() {
  const changes = await db.pendingChanges.toArray();
  for (const change of changes) {
    try {
      if (change.operation === 'update') {
        await updateSong(change.recordId, change.payload);
      } else if (change.operation === 'delete') {
        await deleteSong(change.recordId);
      }
      await db.pendingChanges.delete(change.id);
    } catch (e) {
      console.warn('Error sincronizando, se reintentará', e);
      break;
    }
  }
}

window.addEventListener('online', () => {
  document.getElementById('connection-badge').classList.remove('offline');
  document.getElementById('connection-badge').textContent = 'Online';
  processPendingChanges();
});

window.addEventListener('offline', () => {
  const badge = document.getElementById('connection-badge');
  badge.classList.add('offline');
  badge.textContent = 'Offline';
});
