import { fetchSongs, createSong, deleteSong } from './airtable.js';
import { processPendingChanges } from './sync.js';
import { renderSongList } from './ui.js';

let songs = [];

async function loadSongs() {
  try {
    songs = await fetchSongs();
    renderSongList(songs);
  } catch (e) {
    const { db } = await import('./db.js');
    songs = await db.songs.toArray();
    renderSongList(songs);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSongs();
  processPendingChanges();

  document.getElementById('main-content').addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('¿Eliminar canción?')) {
        await deleteSong(id);
        songs = songs.filter(s => s.id !== id);
        renderSongList(songs);
      }
    }
    const addBtn = e.target.closest('#add-song-btn');
    if (addBtn) {
      const title = prompt('Título:');
      if (title) {
        const artist = prompt('Artista:') || '';
        const key = prompt('Tonalidad:') || '';
        await createSong({ title, artist, key });
        await loadSongs();
      }
    }
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js');
  });
}
