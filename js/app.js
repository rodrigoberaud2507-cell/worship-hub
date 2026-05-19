import { fetchSongs, createSong, updateSong, deleteSong, fetchSetlists, createSetlist } from './airtable.js';
import { processPendingChanges } from './sync.js';
import { renderSongList, renderSongForm, renderSongView, renderSetlistList } from './ui.js';

let currentView = 'songs';
let currentSongs = [];
let currentSong = null;

document.addEventListener('DOMContentLoaded', async () => {
  processPendingChanges();
  setInterval(processPendingChanges, 30000);
  await loadView();
  setupListeners();
});

async function loadView() {
  switch (currentView) {
    case 'songs':
      currentSongs = await fetchSongs();
      renderSongList(currentSongs);
      break;
    case 'song-form':
      renderSongForm(currentSong);
      break;
    case 'song-view':
      renderSongView(currentSong);
      break;
    case 'setlists':
      const setlists = await fetchSetlists();
      renderSetlistList(setlists);
      break;
    default:
      currentSongs = await fetchSongs();
      renderSongList(currentSongs);
  }
}

function setupListeners() {
  const main = document.getElementById('main-content');
  main.addEventListener('click', async (e) => {
    if (e.target.id === 'back-btn' || e.target.closest('#back-btn')) {
      currentView = 'songs'; currentSong = null; await loadView(); return;
    }
    if (e.target.id === 'add-song-btn' || e.target.closest('#add-song-btn')) {
      currentView = 'song-form'; currentSong = null; await loadView(); return;
    }
    if (e.target.id === 'save-song-btn' || e.target.closest('#save-song-btn')) {
      const title = document.getElementById('song-title')?.value.trim();
      if (!title) return alert('Título obligatorio');
      const fields = {
        title,
        artist: document.getElementById('song-artist')?.value.trim() || '',
        key: document.getElementById('song-key')?.value.trim() || '',
        bpm: parseInt(document.getElementById('song-bpm')?.value) || null,
        timeSignature: document.getElementById('song-time')?.value,
        chordpro: document.getElementById('song-chordpro')?.value.trim() || '',
        sections: document.getElementById('song-sections')?.value.trim() || '',
        link: document.getElementById('song-link')?.value.trim() || ''
      };
      if (currentSong?.id) await updateSong(currentSong.id, fields);
      else await createSong(fields);
      currentView = 'songs'; currentSong = null; await loadView(); return;
    }
    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
      const id = editBtn.dataset.id;
      currentSong = currentSongs.find(s => s.id === id);
      currentView = 'song-form'; await loadView(); return;
    }
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      if (confirm('¿Eliminar?')) {
        await deleteSong(deleteBtn.dataset.id);
        currentSongs = currentSongs.filter(s => s.id !== deleteBtn.dataset.id);
        await loadView();
      }
      return;
    }
    const songItem = e.target.closest('.song-list-item');
    if (songItem && !e.target.closest('button')) {
      currentSong = currentSongs.find(s => s.id === songItem.dataset.id);
      currentView = 'song-view'; await loadView(); return;
    }
    if (e.target.id === 'ocr-btn' || e.target.closest('#ocr-btn')) {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'image/*';
      input.onchange = async (ev) => {
        const file = ev.target.files[0];
        if (!file) return;
        try {
          const { processImageForOCR } = await import('./ocr.js');
          const result = await processImageForOCR(file);
          currentSong = null; currentView = 'song-form'; await loadView();
          setTimeout(() => {
            document.getElementById('song-chordpro').value = result.chordpro || '';
            if (result.key) document.getElementById('song-key').value = result.key;
            if (result.bpm) document.getElementById('song-bpm').value = result.bpm;
          }, 300);
        } catch (err) { alert('Error OCR: ' + err.message); }
      };
      input.click();
    }
  });
  main.addEventListener('input', (e) => {
    if (e.target.id === 'search-input') renderSongList(currentSongs, e.target.value);
  });
}
