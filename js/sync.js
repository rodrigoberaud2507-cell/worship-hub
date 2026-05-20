import { getPendingChanges, removePendingChange } from './db.js';

export async function processPendingChanges() {
  const changes = await getPendingChanges();
  for (const change of changes) {
    try {
      await fetch('/api/proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: change.operation === 'delete' ? 'delete' : change.operation === 'update' ? 'update' : 'create',
          table: change.tableName,
          id: change.recordId,
          data: change.payload
        })
      });
      await removePendingChange(change.id);
    } catch { break; }
  }
}

window.addEventListener('online', () => {
  const badge = document.getElementById('connection-badge');
  if (badge) {
    badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200';
    badge.innerHTML = '<i class="fas fa-circle text-xs text-green-500 mr-1"></i> Online';
  }
  processPendingChanges();
});

window.addEventListener('offline', () => {
  const badge = document.getElementById('connection-badge');
  if (badge) {
    badge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200';
    badge.innerHTML = '<i class="fas fa-circle text-xs text-red-500 mr-1"></i> Offline';
  }
});
