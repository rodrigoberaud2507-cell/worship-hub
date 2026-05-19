export function renderSongList(songs, searchQuery = '') {
  const container = document.getElementById('main-content');
  if (!container) return;

  const filtered = searchQuery
    ? songs.filter(s => s.title?.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist?.toLowerCase().includes(searchQuery.toLowerCase()))
    : songs;

  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Canciones</h2>
          <p class="text-gray-500 mt-1">${filtered.length} canciones</p>
        </div>
        <div class="flex gap-3">
          <button id="ocr-btn" class="btn-secondary flex items-center gap-2">📷 Escanear</button>
          <button id="add-song-btn" class="btn-primary flex items-center gap-2">+ Nueva canción</button>
        </div>
      </div>
      <div class="relative">
        <input type="text" id="search-input" placeholder="🔍 Buscar..." value="${searchQuery}">
      </div>
      <div class="grid gap-3">
        ${filtered.length === 0 ? `<div class="card text-center py-12"><p class="text-gray-400 text-lg">📭 No hay canciones</p></div>` : filtered.map(s => `
          <div class="song-list-item p-4 bg-white rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3" data-id="${s.id}">
            <div class="flex items-center gap-4 flex-1">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">${s.key || '?'}</div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">${s.title || 'Sin título'}</h3>
                <p class="text-sm text-gray-500 truncate">${s.artist || ''}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              ${s.bpm ? `<span class="tag">${s.bpm} BPM</span>` : ''}
              ${s.timeSignature ? `<span class="tag">${s.timeSignature}</span>` : ''}
              <span class="text-xs px-2 py-1 rounded ${s._syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">${s._syncStatus === 'pending' ? '⏳' : '✅'}</span>
              <button class="edit-btn text-blue-600 hover:text-blue-800 p-2" data-id="${s.id}">✏️</button>
              <button class="delete-btn text-gray-400 hover:text-red-600 p-2" data-id="${s.id}">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderSongForm(song = null) {
  const container = document.getElementById('main-content');
  container.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold text-gray-800">${song ? '✏️ Editar canción' : '🎵 Nueva canción'}</h2>
        <button id="back-btn" class="btn-secondary">← Volver</button>
      </div>
      <div class="card space-y-4">
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Título *</label><input type="text" id="song-title" value="${song?.title || ''}" placeholder="Nombre de la canción"></div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Artista</label><input type="text" id="song-artist" value="${song?.artist || ''}" placeholder="Artista original"></div>
        <div class="grid grid-cols-3 gap-4">
          <div><label class="block text-sm font-semibold text-gray-700 mb-1">Tonalidad</label><input type="text" id="song-key" value="${song?.key || ''}" placeholder="C, Dm"></div>
          <div><label class="block text-sm font-semibold text-gray-700 mb-1">BPM</label><input type="number" id="song-bpm" value="${song?.bpm || ''}" placeholder="120"></div>
          <div><label class="block text-sm font-semibold text-gray-700 mb-1">Compás</label><select id="song-time"><option value="4/4" ${song?.timeSignature === '4/4' ? 'selected' : ''}>4/4</option><option value="3/4" ${song?.timeSignature === '3/4' ? 'selected' : ''}>3/4</option><option value="6/8" ${song?.timeSignature === '6/8' ? 'selected' : ''}>6/8</option></select></div>
        </div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Letra y acordes</label><textarea id="song-chordpro" rows="12" class="font-mono text-sm" placeholder="[G]Grande es tu amor...">${song?.chordpro || ''}</textarea></div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Estructura (JSON)</label><textarea id="song-sections" rows="4" class="font-mono text-sm" placeholder='[{"type":"intro","start":0,"end":4}]'>${song?.sections || ''}</textarea></div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Enlace YouTube/Spotify</label><input type="url" id="song-link" value="${song?.link || ''}" placeholder="https://..."></div>
        <button id="save-song-btn" class="btn-primary w-full py-3 text-lg">${song ? '💾 Guardar cambios' : '🎵 Crear canción'}</button>
      </div>
    </div>
  `;
}

export function renderSongView(song) {
  const container = document.getElementById('main-content');
  const chordProHtml = (song.chordpro || '').split('\n').map(line => line.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>')).join('<br>');
  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <button id="back-btn" class="btn-secondary">← Volver</button>
        <button id="edit-song-btn" class="btn-primary" data-id="${song.id}">✏️ Editar</button>
      </div>
      <div class="card text-center">
        <div class="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-4">${song.key || '?'}</div>
        <h1 class="text-3xl font-bold text-gray-800">${song.title}</h1>
        <p class="text-lg text-gray-500">${song.artist || ''}</p>
        <div class="flex justify-center gap-3 mt-4">
          ${song.bpm ? `<span class="tag text-base">🎵 ${song.bpm} BPM</span>` : ''}
          ${song.timeSignature ? `<span class="tag text-base">${song.timeSignature}</span>` : ''}
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">📝 Letra y acordes</h3>
        <div class="font-mono text-lg leading-relaxed">${chordProHtml}</div>
      </div>
    </div>
  `;
}

export function renderSetlistList(setlists) {
  const container = document.getElementById('main-content');
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div><h2 class="text-3xl font-bold text-gray-800">Setlists</h2><p class="text-gray-500 mt-1">${setlists.length} setlists</p></div>
        <button id="add-setlist-btn" class="btn-primary">+ Nuevo setlist</button>
      </div>
      <div class="grid gap-4">
        ${setlists.length === 0 ? '<div class="card text-center py-12"><p class="text-gray-400 text-lg">📋 No hay setlists</p></div>' : setlists.map(sl => `
          <div class="card flex items-center justify-between">
            <div><h3 class="font-semibold text-gray-800">${sl.name}</h3><p class="text-sm text-gray-500">${sl.date || ''}</p></div>
            <span class="tag">${sl.songIds ? JSON.parse(sl.songIds).length : 0} canciones</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
