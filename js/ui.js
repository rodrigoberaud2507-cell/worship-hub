// ==================== RENDERIZADO DE CANCIONES ====================

export function renderSongList(songs, searchQuery = '') {
  const container = document.getElementById('main-content');
  if (!container) return;

  const filteredSongs = searchQuery 
    ? songs.filter(s => 
        s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.key?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : songs;

  container.innerHTML = `
    <div class="space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Canciones</h2>
          <p class="text-gray-500 mt-1">${filteredSongs.length} canciones en la biblioteca</p>
        </div>
        <div class="flex gap-3">
          <button id="ocr-btn" class="btn-secondary flex items-center gap-2">
            📷 Escanear
          </button>
          <button id="add-song-btn" class="btn-primary flex items-center gap-2">
            <span>+</span> Nueva canción
          </button>
        </div>
      </div>

      <!-- Barra de búsqueda -->
      <div class="relative">
        <input 
          type="text" 
          id="search-input" 
          placeholder="🔍 Buscar por título, artista, tonalidad..." 
          value="${searchQuery}"
          class="pl-10"
        >
      </div>

      <!-- Lista de canciones -->
      <div class="grid gap-3">
        ${filteredSongs.length === 0 ? `
          <div class="card text-center py-12">
            <p class="text-gray-400 text-lg">📭 No se encontraron canciones</p>
            <p class="text-gray-400 text-sm mt-2">Crea tu primera canción o ajusta la búsqueda</p>
          </div>
        ` : filteredSongs.map(song => `
          <div class="song-list-item p-4 bg-white rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3" data-id="${song.id}">
            <div class="flex items-center gap-4 flex-1">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg flex-shrink-0">
                ${song.key || '?'}
              </div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">${song.title || 'Sin título'}</h3>
                <p class="text-sm text-gray-500 truncate">${song.artist || 'Artista desconocido'}</p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              ${song.bpm ? `<span class="tag">${song.bpm} BPM</span>` : ''}
              ${song.timeSignature ? `<span class="tag">${song.timeSignature}</span>` : ''}
              <span class="text-xs px-2 py-1 rounded ${song._syncStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}">
                ${song._syncStatus === 'pending' ? '⏳' : '✅'}
              </span>
              <button class="edit-btn text-blue-600 hover:text-blue-800 p-2" data-id="${song.id}" title="Editar">
                ✏️
              </button>
              <button class="delete-btn text-gray-400 hover:text-red-600 p-2" data-id="${song.id}" title="Eliminar">
                🗑️
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==================== FORMULARIO DE CANCIÓN ====================

export function renderSongForm(song = null) {
  const isEditing = !!song;
  const container = document.getElementById('main-content');
  
  container.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold text-gray-800">
          ${isEditing ? '✏️ Editar canción' : '🎵 Nueva canción'}
        </h2>
        <button id="back-btn" class="btn-secondary">← Volver</button>
      </div>

      <div class="card space-y-4">
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Título *</label>
          <input type="text" id="song-title" value="${song?.title || ''}" placeholder="Nombre de la canción">
        </div>
        
        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Artista</label>
          <input type="text" id="song-artist" value="${song?.artist || ''}" placeholder="Artista original">
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Tonalidad</label>
            <input type="text" id="song-key" value="${song?.key || ''}" placeholder="Ej: C, Dm">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">BPM</label>
            <input type="number" id="song-bpm" value="${song?.bpm || ''}" placeholder="120">
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Compás</label>
            <select id="song-time">
              <option value="4/4" ${song?.timeSignature === '4/4' ? 'selected' : ''}>4/4</option>
              <option value="3/4" ${song?.timeSignature === '3/4' ? 'selected' : ''}>3/4</option>
              <option value="6/8" ${song?.timeSignature === '6/8' ? 'selected' : ''}>6/8</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">
            Letra y acordes (formato ChordPro)
          </label>
          <textarea 
            id="song-chordpro" 
            rows="12" 
            placeholder="[G]Grande es tu amor&#10;[D]Por siempre cantaré..."
            class="font-mono text-sm"
          >${song?.chordpro || ''}</textarea>
          <p class="text-xs text-gray-500 mt-1">
            Usa [Acorde] antes de cada sílaba. Ej: [G]Letra de ejemplo
          </p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Estructura (JSON)</label>
          <textarea 
            id="song-sections" 
            rows="4" 
            placeholder='[{"type":"intro","start":0,"end":4}]'
            class="font-mono text-sm"
          >${song?.sections || ''}</textarea>
        </div>

        <div>
          <label class="block text-sm font-semibold text-gray-700 mb-1">Enlace (YouTube/Spotify)</label>
          <input type="url" id="song-link" value="${song?.link || ''}" placeholder="https://...">
        </div>

        <button id="save-song-btn" class="btn-primary w-full py-3 text-lg">
          ${isEditing ? '💾 Guardar cambios' : '🎵 Crear canción'}
        </button>
      </div>
    </div>
  `;
}

// ==================== VISTA DE CANCIÓN ====================

export function renderSongView(song) {
  const container = document.getElementById('main-content');
  
  // Parsear ChordPro a HTML
  const chordProHtml = parseChordPro(song.chordpro || '');
  
  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <button id="back-btn" class="btn-secondary">← Volver</button>
        <button id="edit-song-btn" class="btn-primary" data-id="${song.id}">✏️ Editar</button>
      </div>

      <div class="card text-center">
        <div class="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-4">
          ${song.key || '?'}
        </div>
        <h1 class="text-3xl font-bold text-gray-800">${song.title}</h1>
        <p class="text-lg text-gray-500">${song.artist || ''}</p>
        <div class="flex justify-center gap-3 mt-4">
          ${song.bpm ? `<span class="tag text-base">🎵 ${song.bpm} BPM</span>` : ''}
          ${song.timeSignature ? `<span class="tag text-base">${song.timeSignature}</span>` : ''}
        </div>
      </div>

      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 mb-4">📝 Letra y acordes</h3>
        <div class="chordpro-viewer font-mono text-lg leading-relaxed">
          ${chordProHtml}
        </div>
      </div>
    </div>
  `;
}

// ==================== SETLISTS ====================

export function renderSetlistList(setlists) {
  const container = document.getElementById('main-content');
  
  container.innerHTML = `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-3xl font-bold text-gray-800">Setlists</h2>
          <p class="text-gray-500 mt-1">${setlists.length} setlists</p>
        </div>
        <button id="add-setlist-btn" class="btn-primary">+ Nuevo setlist</button>
      </div>

      <div class="grid gap-4">
        ${setlists.length === 0 ? `
          <div class="card text-center py-12">
            <p class="text-gray-400 text-lg">📋 No hay setlists aún</p>
          </div>
        ` : setlists.map(sl => `
          <div class="card flex items-center justify-between">
            <div>
              <h3 class="font-semibold text-gray-800">${sl.name}</h3>
              <p class="text-sm text-gray-500">${sl.date ? new Date(sl.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Sin fecha'}</p>
            </div>
            <span class="tag">${sl.songIds ? JSON.parse(sl.songIds).length : 0} canciones</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ==================== UTILIDADES ====================

function parseChordPro(text) {
  if (!text) return '<p class="text-gray-400 italic">Sin letra</p>';
  
  // Convertir [Acorde] a spans con estilo
  return text
    .split('\n')
    .map(line => {
      const formatted = line.replace(/\[([^\]]+)\]/g, '<span class="chord">$1</span>');
      return `<div class="mb-1">${formatted || '&nbsp;'}</div>`;
    })
    .join('');
}

export function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white font-semibold z-50 transition-all ${
    type === 'success' ? 'bg-blue-600' : 'bg-red-500'
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}
