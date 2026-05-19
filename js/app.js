import { fetchSongs, createSong, updateSong, deleteSong, fetchSetlists, createSetlist } from './airtable.js';
import { processPendingChanges, startAutoSync, getSyncStats } from './sync.js';
import { renderSongList, renderSongForm, renderSongView, renderSetlistList, showNotification } from './ui.js';

// Estado global
let currentView = 'songs';
let currentSongs = [];
let currentSetlists = [];
let currentSong = null;

// ==================== INICIALIZACIÓN ====================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🎵 WorshipHub iniciado');
  
  // Iniciar sincronización automática
  startAutoSync();
  
  // Cargar datos iniciales
  await loadCurrentView();
  
  // Configurar eventos globales
  setupEventListeners();
  
  // Registrar Service Worker
  registerServiceWorker();
});

// ==================== NAVEGACIÓN ====================

async function loadCurrentView() {
  switch (currentView) {
    case 'songs':
      currentSongs = await fetchSongs();
      renderSongList(currentSongs);
      break;
    case 'setlists':
      currentSetlists = await fetchSetlists();
      renderSetlistList(currentSetlists);
      break;
    case 'song-form':
      renderSongForm(currentSong);
      break;
    case 'song-view':
      renderSongView(currentSong);
      break;
    default:
      currentSongs = await fetchSongs();
      renderSongList(currentSongs);
  }
}

// ==================== EVENTOS ====================

function setupEventListeners() {
  const mainContent = document.getElementById('main-content');
  
  // Delegación de eventos
  mainContent.addEventListener('click', handleMainClick);
  mainContent.addEventListener('submit', handleFormSubmit);
  mainContent.addEventListener('input', handleInput);
}

function handleMainClick(e) {
  const target = e.target;
  
  // Botón volver
  if (target.id === 'back-btn' || target.closest('#back-btn')) {
    currentView = 'songs';
    currentSong = null;
    loadCurrentView();
    return;
  }
  
  // Botón nueva canción
  if (target.id === 'add-song-btn' || target.closest('#add-song-btn')) {
    currentView = 'song-form';
    currentSong = null;
    loadCurrentView();
    return;
  }
  
  // Botón guardar canción
  if (target.id === 'save-song-btn' || target.closest('#save-song-btn')) {
    handleSaveSong();
    return;
  }
  
  // Botón editar canción
  const editBtn = target.closest('.edit-btn');
  if (editBtn) {
    const id = editBtn.dataset.id;
    const song = currentSongs.find(s => s.id === id);
    if (song) {
      currentSong = song;
      currentView = 'song-form';
      loadCurrentView();
    }
    return;
  }
  
  // Click en canción (ver detalles)
  const songItem = target.closest('.song-list-item');
  if (songItem && !target.closest('button')) {
    const id = songItem.dataset.id;
    const song = currentSongs.find(s => s.id === id);
    if (song) {
      currentSong = song;
      currentView = 'song-view';
      loadCurrentView();
    }
    return;
  }
  
  // Botón eliminar
  const deleteBtn = target.closest('.delete-btn');
  if (deleteBtn) {
    const id = deleteBtn.dataset.id;
    if (confirm('¿Estás seguro de eliminar esta canción?')) {
      deleteSong(id);
      currentSongs = currentSongs.filter(s => s.id !== id);
      loadCurrentView();
      showNotification('Canción eliminada', 'success');
    }
    return;
  }
  
  // Botón nuevo setlist
  if (target.id === 'add-setlist-btn' || target.closest('#add-setlist-btn')) {
    createNewSetlist();
    return;
  }
  
  // Botón OCR
  if (target.id === 'ocr-btn' || target.closest('#ocr-btn')) {
    handleOCR();
    return;
  }
}

function handleInput(e) {
  // Búsqueda en tiempo real
  if (e.target.id === 'search-input') {
    const query = e.target.value;
    renderSongList(currentSongs, query);
  }
}

async function handleSaveSong() {
  const title = document.getElementById('song-title')?.value?.trim();
  const artist = document.getElementById('song-artist')?.value?.trim();
  const key = document.getElementById('song-key')?.value?.trim();
  const bpm = parseInt(document.getElementById('song-bpm')?.value) || null;
  const timeSignature = document.getElementById('song-time')?.value;
  const chordpro = document.getElementById('song-chordpro')?.value?.trim();
  const sections = document.getElementById('song-sections')?.value?.trim();
  const link = document.getElementById('song-link')?.value?.trim();

  if (!title) {
    alert('El título es obligatorio');
    return;
  }

  const songData = { title, artist, key, bpm, timeSignature, chordpro, sections, link };

  try {
    if (currentSong?.id) {
      await updateSong(currentSong.id, songData);
      showNotification('✅ Canción actualizada');
    } else {
      await createSong(songData);
      showNotification('🎵 Canción creada');
    }
    
    currentView = 'songs';
    currentSong = null;
    await loadCurrentView();
  } catch (error) {
    console.error('Error guardando:', error);
    alert('Error al guardar: ' + error.message);
  }
}

async function createNewSetlist() {
  const name = prompt('📋 Nombre del setlist:');
  if (!name) return;
  
  try {
    await createSetlist({ name, date: new Date().toISOString() });
    showNotification('Setlist creado');
    await loadCurrentView();
  } catch (error) {
    alert('Error: ' + error.message);
  }
}

async function handleOCR() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showNotification('🔍 Analizando imagen...', 'success');
    try {
      const { processImageForOCR } = await import('./ocr.js');
      const result = await processImageForOCR(file);
      
      if (result.chordpro) {
        currentSong = null;
        currentView = 'song-form';
        loadCurrentView();
        
        setTimeout(() => {
          document.getElementById('song-chordpro').value = result.chordpro;
          if (result.key) document.getElementById('song-key').value = result.key;
          if (result.bpm) document.getElementById('song-bpm').value = result.bpm;
          showNotification('✅ Letra detectada correctamente');
        }, 500);
      }
    } catch (error) {
      showNotification('❌ Error en OCR: ' + error.message, 'error');
    }
  };
  input.click();
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('✅ Service Worker registrado'))
        .catch(err => console.warn('Service Worker falló:', err));
    });
  }
}

// ==================== EXPORTACIONES ====================

export { currentView, currentSongs, loadCurrentView };
