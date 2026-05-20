eexport function renderSongList(songs, searchQuery = '') {
  const container = document.getElementById('dynamic-content');
  const loading = document.getElementById('loading-screen');
  if (loading) loading.classList.add('hidden');
  container.classList.remove('hidden');
  
  const filtered = searchQuery ? songs.filter(s => 
    s.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.artist?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : songs;

  container.innerHTML = `
    <div class="space-y-6 fade-in">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 class="text-3xl font-bold text-gray-800"><i class="fas fa-music mr-2"></i>Canciones</h2>
          <p class="text-gray-500 mt-1">${filtered.length} canción(es)</p>
        </div>
        <div class="flex gap-3">
          <button id="ocr-btn" class="btn btn-secondary"><i class="fas fa-camera mr-2"></i>Escanear</button>
          <button id="add-song-btn" class="btn btn-primary"><i class="fas fa-plus mr-2"></i>Nueva canción</button>
        </div>
      </div>
      <div><input type="text" id="search-input" placeholder="Buscar..." value="${searchQuery}"></div>
      <div class="grid gap-3">
        ${filtered.length === 0 ? `<div class="card text-center py-12"><p class="text-gray-400 text-lg">No hay canciones</p></div>` : filtered.map(s => `
          <div class="song-list-item p-4 flex flex-col md:flex-row md:items-center justify-between gap-3" data-id="${s.id}">
            <div class="flex items-center gap-4 flex-1">
              <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">${s.key||'?'}</div>
              <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">${s.title||'Sin título'}</h3>
                <p class="text-sm text-gray-500 truncate">${s.artist||''}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${s.bpm?`<span class="tag">${s.bpm} BPM</span>`:''}
              <span class="text-xs px-2 py-1 rounded ${s._syncStatus==='pending'?'bg-yellow-100 text-yellow-700':'bg-green-100 text-green-700'}">${s._syncStatus==='pending'?'Pendiente':'OK'}</span>
              <button class="edit-btn text-blue-600 hover:text-blue-800 p-2" data-id="${s.id}"><i class="fas fa-edit"></i></button>
              <button class="delete-btn text-gray-400 hover:text-red-600 p-2" data-id="${s.id}"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function renderSongForm(song = null) {
  const container = document.getElementById('dynamic-content');
  const loading = document.getElementById('loading-screen');
  if (loading) loading.classList.add('hidden');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="max-w-2xl mx-auto space-y-6 fade-in">
      <div class="flex items-center justify-between">
        <h2 class="text-3xl font-bold text-gray-800">${song?'Editar canción':'Nueva canción'}</h2>
        <button id="back-btn" class="btn btn-secondary"><i class="fas fa-arrow-left mr-2"></i>Volver</button>
      </div>
      <div class="card space-y-4">
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Título *</label><input type="text" id="song-title" value="${song?.title||''}"></div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Artista</label><input type="text" id="song-artist" value="${song?.artist||''}"></div>
        <div class="grid grid-cols-3 gap-4">
          <div><label>Tonalidad</label><input type="text" id="song-key" value="${song?.key||''}"></div>
          <div><label>BPM</label><input type="number" id="song-bpm" value="${song?.bpm||''}"></div>
          <div><label>Compás</label><select id="song-time"><option ${song?.timeSignature==='4/4'?'selected':''}>4/4</option><option ${song?.timeSignature==='3/4'?'selected':''}>3/4</option><option ${song?.timeSignature==='6/8'?'selected':''}>6/8</option></select></div>
        </div>
        <div><label class="block text-sm font-semibold text-gray-700 mb-1">Letra y acordes (ChordPro)</label><textarea id="song-chordpro" rows="12" class="font-mono text-sm">${song?.chordpro||''}</textarea></div>
        <div><label>Estructura (JSON)</label><textarea id="song-sections" rows="4" class="font-mono text-sm">${song?.sections||''}</textarea></div>
        <div><label>Enlace</label><input type="url" id="song-link" value="${song?.link||''}"></div>
        <button id="save-song-btn" class="btn btn-primary w-full py-3"><i class="fas fa-save mr-2"></i>${song?'Guardar cambios':'Crear canción'}</button>
      </div>
    </div>
  `;
}

export function renderSongView(song) {
  const container = document.getElementById('dynamic-content');
  const loading = document.getElementById('loading-screen');
  if (loading) loading.classList.add('hidden');
  container.classList.remove('hidden');
  const chordproHTML = renderChordProToHTML(song.chordpro || '');
  container.innerHTML = `
    <div class="max-w-4xl mx-auto space-y-6 fade-in">
      <div class="flex items-center justify-between">
        <button id="back-btn" class="btn btn-secondary"><i class="fas fa-arrow-left mr-2"></i>Volver</button>
        <button id="edit-song-btn" class="btn btn-primary" data-id="${song.id}"><i class="fas fa-edit mr-2"></i>Editar</button>
      </div>
      <div class="card text-center">
        <div class="w-20 h-20 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-4">${song.key||'?'}</div>
        <h1 class="text-3xl font-bold text-gray-800">${song.title}</h1>
        <p class="text-lg text-gray-500">${song.artist||''}</p>
        <div class="flex justify-center gap-3 mt-4">
          ${song.bpm?`<span class="tag"><i class="fas fa-metronome mr-1"></i>${song.bpm} BPM</span>`:''}
          ${song.timeSignature?`<span class="tag">${song.timeSignature}</span>`:''}
        </div>
      </div>
      <div class="card">
        <h3 class="text-lg font-semibold text-gray-700 mb-4"><i class="fas fa-align-left mr-2"></i>Letra y acordes</h3>
        <div class="chordpro-viewer font-mono text-lg leading-relaxed bg-gray-50 p-6 rounded-lg">
          ${chordproHTML}
        </div>
      </div>
    </div>
  `;
}

export function renderSetlistList(setlists) {
  const container = document.getElementById('dynamic-content');
  const loading = document.getElementById('loading-screen');
  if (loading) loading.classList.add('hidden');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="space-y-6 fade-in">
      <div class="flex items-center justify-between">
        <div><h2 class="text-3xl font-bold text-gray-800"><i class="fas fa-list mr-2"></i>Setlists</h2><p class="text-gray-500">${setlists.length} setlist(s)</p></div>
        <button id="add-setlist-btn" class="btn btn-primary"><i class="fas fa-plus mr-2"></i>Nuevo setlist</button>
      </div>
      <div class="grid gap-4">
        ${setlists.length===0?`<div class="card text-center py-12"><p class="text-gray-400 text-lg">No hay setlists</p></div>`:setlists.map(sl=>`
          <div class="card flex items-center justify-between">
            <div><h3 class="font-semibold text-gray-800">${sl.name}</h3><p class="text-sm text-gray-500">${sl.date?new Date(sl.date).toLocaleDateString('es-ES'):''}</p></div>
            <span class="tag">${sl.songIds?JSON.parse(sl.songIds).length:0} canciones</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =========== RENDERIZADOR CHORDPRO (ACORDES SOBRE LETRA) ===========
function renderChordProToHTML(chordpro) {
  if (!chordpro) return '<p class="text-gray-400 italic">Sin letra</p>';
  const lines = chordpro.split('\n');
  let html = '';
  for (const line of lines) {
    if (line.trim() === '') { html += '<br>'; continue; }
    const chords = [];
    const lyrics = [];
    let chordBuffer = '';
    let lyricBuffer = '';
    let inChord = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '[') {
        inChord = true;
        chordBuffer = '';
      } else if (ch === ']' && inChord) {
        inChord = false;
        chords.push({ pos: lyricBuffer.length, text: chordBuffer });
        chordBuffer = '';
      } else if (inChord) {
        chordBuffer += ch;
      } else {
        lyricBuffer += ch;
      }
    }
    if (chords.length === 0) {
      html += `<div class="chordpro-line"><div class="chordpro-lyrics">${escapeHTML(lyricBuffer)}</div></div>`;
    } else {
      let chordLine = '';
      let lastPos = 0;
      for (const c of chords) {
        const spaces = c.pos - lastPos;
        chordLine += ' '.repeat(Math.max(0, spaces)) + c.text;
        lastPos = c.pos + c.text.length;
      }
      html += `<div class="chordpro-line">
        <div class="chordpro-chords">${escapeHTML(chordLine)}</div>
        <div class="chordpro-lyrics">${escapeHTML(lyricBuffer)}</div>
      </div>`;
    }
  }
  return html;
}

function escapeHTML(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
