import { fetchSongs, createSong, updateSong, deleteSong, fetchSetlists, createSetlist } from './airtable.js';
import { processPendingChanges } from './sync.js';
import { processImageForOCR } from './ocr.js';
import { renderSongList, renderSongForm, renderSongView, renderSetlistList } from './ui.js';

let currentView = 'songs';
let currentSongs = [];
let currentSong = null;

document.addEventListener('DOMContentLoaded', async () => {
  await processPendingChanges();
  setInterval(processPendingChanges, 30000);
  setupNavigation();
  await loadView();
  setupChatbot();
});

async function loadView() {
  const loading = document.getElementById('loading-screen');
  const dynamic = document.getElementById('dynamic-content');

  try {
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
  } catch (e) {
    dynamic.innerHTML = `<div class="text-center py-20"><i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i><p class="text-red-600 text-lg">Error al cargar los datos</p><p class="text-gray-500">${e.message}</p></div>`;
  } finally {
    if (loading) loading.classList.add('hidden');
    dynamic.classList.remove('hidden');
  }
}

function setupNavigation() {
  document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const view = e.currentTarget.dataset.view;
      if (view === 'songs') { currentView = 'songs'; currentSong = null; }
      else if (view === 'setlists') { currentView = 'setlists'; currentSong = null; }
      else if (view === 'events') { currentView = 'songs'; }
      document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(b => {
        b.classList.remove('active', 'bg-blue-50', 'text-blue-700');
      });
      e.currentTarget.classList.add('active', 'bg-blue-50', 'text-blue-700');
      loadView();
    });
  });

  document.getElementById('main-content').addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'back-btn' || btn.closest('#back-btn')) { currentView = 'songs'; currentSong = null; loadView(); }
    else if (btn.id === 'add-song-btn') { currentView = 'song-form'; currentSong = null; loadView(); }
    else if (btn.id === 'save-song-btn') await saveSong();
    else if (btn.classList.contains('edit-btn') || btn.id === 'edit-song-btn') {
      const id = btn.dataset.id;
      currentSong = currentSongs.find(s => s.id === id);
      currentView = 'song-form'; loadView();
    }
    else if (btn.classList.contains('delete-btn')) {
      if (confirm('¿Eliminar canción?')) {
        await deleteSong(btn.dataset.id);
        currentSongs = currentSongs.filter(s => s.id !== btn.dataset.id);
        loadView();
      }
    }
    else if (btn.id === 'ocr-btn') triggerOCR();
    else if (btn.id === 'add-setlist-btn') {
      const name = prompt('Nombre del setlist:');
      if (name) { await createSetlist({ name, date: new Date().toISOString() }); loadView(); }
    }
  });

  document.getElementById('main-content').addEventListener('input', (e) => {
    if (e.target.id === 'search-input') renderSongList(currentSongs, e.target.value);
  });
}

async function saveSong() {
  const title = document.getElementById('song-title').value.trim();
  if (!title) return alert('Título obligatorio');
  const fields = {
    title,
    artist: document.getElementById('song-artist').value,
    key: document.getElementById('song-key').value,
    bpm: document.getElementById('song-bpm').value || null,
    timeSignature: document.getElementById('song-time').value,
    chordpro: document.getElementById('song-chordpro').value,
    sections: document.getElementById('song-sections').value,
    link: document.getElementById('song-link').value
  };
  if (currentSong?.id && !currentSong.id.startsWith('temp')) await updateSong(currentSong.id, fields);
  else await createSong(fields);
  currentView = 'songs'; currentSong = null; loadView();
}

async function triggerOCR() {
  const input = document.createElement('input');
  input.type = 'file'; input.accept = 'image/*';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const result = await processImageForOCR(file);
      currentSong = null;
      currentView = 'song-form';
      await loadView();
      setTimeout(() => {
        document.getElementById('song-chordpro').value = result.chordpro || '';
        if (result.key) document.getElementById('song-key').value = result.key;
        if (result.bpm) document.getElementById('song-bpm').value = result.bpm;
      }, 300);
    } catch (err) { alert('Error OCR: ' + err.message); }
  };
  input.click();
}

// ==================== CHATBOT ====================
function setupChatbot() {
  const toggle = document.getElementById('chat-toggle');
  const container = document.getElementById('chatbot-container');
  const close = document.getElementById('close-chat');
  const send = document.getElementById('chat-send');
  const input = document.getElementById('chat-input');
  const messages = document.getElementById('chat-messages');

  toggle.addEventListener('click', () => container.classList.toggle('hidden'));
  close.addEventListener('click', () => container.classList.add('hidden'));

  send.addEventListener('click', sendMessage);
  input.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

  async function sendMessage() {
    const question = input.value.trim();
    if (!question) return;
    addMessage('user', question);
    input.value = '';
    if (!currentSong) {
      addMessage('assistant', 'Primero selecciona una canción para hacer preguntas sobre ella.');
      return;
    }
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          song: { title: currentSong.title, artist: currentSong.artist, chordpro: currentSong.chordpro }
        })
      });
      if (!res.ok) throw new Error('Error');
      const data = await res.json();
      addMessage('assistant', data.answer || 'No tengo respuesta.');
    } catch (e) {
      addMessage('assistant', 'Error al comunicarse con el asistente.');
    }
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }
}
