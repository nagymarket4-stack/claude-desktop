// ─── Escape HTML — previene XSS en todo dato insertado via innerHTML ─────────
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ─── Core navigation & helpers ───────────────────────────────────────────────

function navigate(page) {
  state.currentPage = page;

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));

  // Show target
  const el = document.getElementById('page-' + page);
  el.classList.remove('hidden');

  // Render content
  const renderers = {
    dashboard:   renderDashboard,
    alumnos:     renderAlumnos,
    profesores:  renderProfesores,
    actividades: renderActividades,
    bienestar:   renderBienestar,
    mensajes:    renderMensajes,
    familias:    renderFamilias,
  };
  actualizarBadgeMensajes();
  if (renderers[page]) renderers[page]();

  // Update nav buttons
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === page);
  });
}

function showToast(msg) {
  const t = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = '✓ ' + msg;
  t.classList.remove('hidden');
  setTimeout(() => t.classList.add('hidden'), 2800);
}

function horaActual() {
  return new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
}

function badge(estado) {
  const map = {
    entrada: ['badge-entrada','En centro'],
    salida:  ['badge-salida','Recogido'],
    ausente: ['badge-ausente','Ausente'],
    fichado: ['badge-fichado','En turno'],
  };
  const [cls, label] = map[estado] || ['bg-gray-100 text-gray-600','–'];
  return `<span class="tag ${cls}">${label}</span>`;
}

function tagBadge(tag) {
  const colors = ['bg-green-100 text-green-700','bg-blue-100 text-blue-700','bg-purple-100 text-purple-700','bg-orange-100 text-orange-700','bg-pink-100 text-pink-700'];
  const i = tag.charCodeAt(0) % colors.length;
  return `<span class="tag ${colors[i]}">${tag}</span>`;
}

function actualizarBadgeMensajes() {
  if (!state.mensajes) return;
  const noLeidos = Object.values(state.mensajes).reduce((acc, msgs) =>
    acc + msgs.filter(m => !m.leido && m.de !== 'centro').length, 0);
  const badge = document.getElementById('badge-mensajes');
  if (!badge) return;
  if (noLeidos > 0) {
    badge.textContent = noLeidos;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

// Start on dashboard
window.addEventListener('DOMContentLoaded', () => navigate('dashboard'));
