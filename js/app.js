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
  const
