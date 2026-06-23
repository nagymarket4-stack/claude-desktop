// ─── XSS prevention ──────────────────────────────────────────────────────────
function esc(str) {
  if (str == null) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}

// ─── Navigation ──────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  dashboard:'Dashboard', alumnos:'Alumnos', profesores:'Profesores',
  actividades:'Actividades', bienestar:'Bienestar', mensajes:'Mensajes',
  familias:'Portal Familias', configuracion:'Configuración',
  'padre-inicio':'Inicio', 'padre-actividades':'Actividades', 'padre-mensajes':'Mensajes',
};

function navigate(page) {
  state.currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  let el = document.getElementById('page-' + page);
  if (!el) {
    el = document.createElement('div');
    el.id = 'page-' + page;
    el.className = 'page';
    document.getElementById('main-content').appendChild(el);
  }
  el.classList.remove('hidden');

  const renderers = {
    dashboard:           renderDashboard,
    alumnos:             renderAlumnos,
    profesores:          renderProfesores,
    actividades:         renderActividades,
    bienestar:           renderBienestar,
    mensajes:            renderMensajes,
    familias:            renderFamilias,
    configuracion:       renderConfiguracion,
    'padre-inicio':      renderPadreInicio,
    'padre-actividades': renderPadreActividades,
    'padre-mensajes':    renderPadreMensajes,
  };

  if (renderers[page]) renderers[page]();

  // Sync nav highlights
  document.querySelectorAll('.nav-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.page === page));
  document.querySelectorAll('.bnav-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.bnav === page));

  const titleEl = document.getElementById('top-bar-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;

  actualizarBadgeMensajes();
  closeSidebar();
}

// ─── Sidebar nav por rol ──────────────────────────────────────────────────────
function renderSidebarStaff() {
  const nav = document.getElementById('sidebar-nav');
  const esSuperAdmin = sesionActual?.rol === 'superadmin';
  nav.innerHTML = `
    <button onclick="navigate('dashboard')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="dashboard">
      <span class="text-xl w-7 text-center">🏠</span> Dashboard
    </button>
    <button onclick="navigate('alumnos')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="alumnos">
      <span class="text-xl w-7 text-center">👦</span> Alumnos
    </button>
    <button onclick="navigate('profesores')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="profesores">
      <span class="text-xl w-7 text-center">👩‍🏫</span> Profesores
    </button>
    <button onclick="navigate('actividades')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="actividades">
      <span class="text-xl w-7 text-center">🎨</span> Actividades
    </button>
    <button onclick="navigate('bienestar')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="bienestar">
      <span class="text-xl w-7 text-center">💛</span> Bienestar
    </button>
    <button onclick="navigate('mensajes')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="mensajes">
      <span class="text-xl w-7 text-center">💬</span> Mensajes
      <span id="badge-mensajes" class="ml-auto bg-green-400 text-green-900 text-xs font-bold rounded-full px-1.5 py-0.5 hidden">0</span>
    </button>
    <button onclick="navigate('familias')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="familias">
      <span class="text-xl w-7 text-center">👨‍👩‍👧</span> Portal Familias
    </button>
    ${esSuperAdmin ? `
    <div class="border-t border-green-700 my-2"></div>
    <button onclick="navigate('configuracion')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="configuracion">
      <span class="text-xl w-7 text-center">⚙️</span> Configuración
    </button>` : ''}
  `;
}

function renderSidebarPadres() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = `
    <button onclick="navigate('padre-inicio')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="padre-inicio">
      <span class="text-xl w-7 text-center">🏠</span> Inicio
    </button>
    <button onclick="navigate('padre-actividades')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="padre-actividades">
      <span class="text-xl w-7 text-center">🎨</span> Actividades
    </button>
    <button onclick="navigate('padre-mensajes')" class="nav-btn w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all hover:bg-green-700 active:bg-green-900" data-page="padre-mensajes">
      <span class="text-xl w-7 text-center">💬</span> Mensajes
      <span id="badge-mensajes" class="ml-auto bg-green-400 text-green-900 text-xs font-bold rounded-full px-1.5 py-0.5 hidden">0</span>
    </button>
  `;
}

function renderBottomNavStaff() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  nav.innerHTML = `
    <button data-bnav="dashboard" class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="navigate('dashboard')">
      <span class="text-xl">🏠</span><span>Inicio</span>
    </button>
    <button data-bnav="alumnos" class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="navigate('alumnos')">
      <span class="text-xl">👦</span><span>Alumnos</span>
    </button>
    <button data-bnav="bienestar" class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="navigate('bienestar')">
      <span class="text-xl">💛</span><span>Bienestar</span>
    </button>
    <button data-bnav="mensajes" class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="navigate('mensajes')">
      <span class="text-xl">💬</span><span>Mensajes</span>
      <span id="bnav-badge" class="hidden absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">!</span>
    </button>
    <button class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="toggleSidebar()">
      <span class="text-xl">☰</span><span>Más</span>
    </button>
  `;
}

function renderBottomNavPadres() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;
  nav.innerHTML = `
    <button data-bnav="padre-inicio" class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="navigate('padre-inicio')">
      <span class="text-xl">🏠</span><span>Inicio</span>
    </button>
    <button data-bnav="padre-actividades" class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="navigate('padre-actividades')">
      <span class="text-xl">🎨</span><span>Actividades</span>
    </button>
    <button data-bnav="padre-mensajes" class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="navigate('padre-mensajes')">
      <span class="text-xl">💬</span><span>Mensajes</span>
    </button>
    <button class="bnav-btn flex-1 flex flex-col items-center justify-center gap-0.5 text-xs py-2 text-gray-400 hover:text-green-600 transition-colors" onclick="toggleSidebar()">
      <span class="text-xl">☰</span><span>Más</span>
    </button>
  `;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
  let noLeidos = 0;
  if (sesionActual?.rol === 'padre') {
    sesionActual.alumnoIds.forEach(aid => {
      noLeidos += (state.mensajes[aid]||[]).filter(m => !m.leido && m.de === 'centro').length;
    });
  } else {
    noLeidos = Object.values(state.mensajes).reduce((acc, msgs) =>
      acc + msgs.filter(m => !m.leido && m.de !== 'centro').length, 0);
  }
  ['badge-mensajes','bnav-badge'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (noLeidos > 0) { el.textContent = noLeidos; el.classList.remove('hidden'); }
    else { el.classList.add('hidden'); }
  });
}

// ─── Sidebar toggle (mobile) ──────────────────────────────────────────────────
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const open = !sidebar.classList.contains('-translate-x-full');
  if (open) { closeSidebar(); } else {
    sidebar.classList.remove('-translate-x-full');
    backdrop.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
}
function closeSidebar() {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('sidebar-backdrop').classList.add('hidden');
  document.body.style.overflow = '';
}

// ─── Actualizar textos del centro en UI ───────────────────────────────────────
function aplicarConfiguracion() {
  document.querySelectorAll('.centro-nombre').forEach(el => el.textContent = CONFIGURACION.nombre);
  document.querySelectorAll('.centro-logo').forEach(el => el.textContent = CONFIGURACION.logo);
  document.querySelectorAll('.centro-subtitulo').forEach(el => el.textContent = CONFIGURACION.subtitulo);
}

window.addEventListener('DOMContentLoaded', aplicarConfiguracion);
