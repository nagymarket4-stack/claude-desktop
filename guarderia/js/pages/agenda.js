// ─── Calendario / eventos y Menú semanal ─────────────────────────────────────
// Acceso edición: admin / superadmin. Las familias lo ven en "Calendario y menú".

const DIAS_MENU = [
  { key:'lunes', label:'Lunes' }, { key:'martes', label:'Martes' },
  { key:'miercoles', label:'Miércoles' }, { key:'jueves', label:'Jueves' },
  { key:'viernes', label:'Viernes' },
];

function eventosOrdenados() {
  return (state.eventos || []).slice().sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.hora || '').localeCompare(b.hora || ''));
}

// ── Eventos (staff) ───────────────────────────────────────────────────────────
function renderEventos() {
  const el = document.getElementById('page-eventos');
  if (!el) return;
  const hoy = new Date().toISOString().slice(0, 10);
  const eventos = eventosOrdenados();

  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">📅 Calendario</h2>
        <p class="text-gray-500 text-sm mt-1">Eventos y actividades del centro</p>
      </div>
      <button onclick="abrirNuevoEvento()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">+ Nuevo evento</button>
    </div>

    ${eventos.length === 0 ? `<div class="text-center py-16 text-gray-400"><p class="text-5xl mb-4">📅</p><p>No hay eventos programados.</p></div>` :
      eventos.map(e => `
      <div class="card p-5 mb-3 flex items-start gap-4 ${e.fecha < hoy ? 'opacity-60' : ''}">
        <div class="flex-shrink-0 w-14 text-center bg-green-50 rounded-xl py-2">
          <p class="text-xs text-green-600 uppercase font-semibold">${mesCorto(e.fecha)}</p>
          <p class="text-xl font-bold text-green-700 leading-none">${diaNum(e.fecha)}</p>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold text-gray-800">${esc(e.titulo)}</h3>
          <p class="text-xs text-gray-400 mb-1">${e.hora ? '🕐 ' + esc(e.hora) + ' · ' : ''}${e.grupo && e.grupo !== 'Todos' ? 'Grupo ' + esc(e.grupo) : 'Todo el centro'}</p>
          ${e.descripcion ? `<p class="text-sm text-gray-600">${esc(e.descripcion)}</p>` : ''}
        </div>
        <button onclick="borrarEvento(${e.id})" class="text-gray-300 hover:text-red-500 text-sm" title="Eliminar">🗑️</button>
      </div>`).join('')}
  </div>

  <div id="modal-evento" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" id="modal-evento-body"></div>
  </div>`;
}

function mesCorto(iso) { if (!iso) return ''; const ms = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC']; return ms[+iso.split('-')[1] - 1]; }
function diaNum(iso) { return iso ? iso.split('-')[2] : ''; }

function abrirNuevoEvento() {
  const body = document.getElementById('modal-evento-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-gray-800 text-lg">Nuevo evento</h3>
      <button onclick="cerrarModal('modal-evento')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Título</label>
    <input id="ev-titulo" maxlength="80" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3">
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Fecha</label>
        <input id="ev-fecha" type="date" value="${new Date().toISOString().slice(0,10)}" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"></div>
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Hora</label>
        <input id="ev-hora" type="time" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"></div>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1 mt-3">Dirigido a</label>
    <select id="ev-grupo" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3 bg-white">
      ${gruposDisponibles().map(g => `<option value="${esc(g)}">${g === 'Todos' ? 'Todo el centro' : 'Grupo ' + esc(g)}</option>`).join('')}
    </select>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Descripción <span class="text-gray-400 font-normal">(opcional)</span></label>
    <textarea id="ev-desc" rows="2" maxlength="300" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none"></textarea>
    <div id="ev-error" class="hidden text-red-500 text-sm mt-2"></div>
    <div class="flex gap-3 mt-5">
      <button onclick="cerrarModal('modal-evento')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarEvento()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Crear</button>
    </div>`;
  document.getElementById('modal-evento').classList.remove('hidden');
}

function guardarEvento() {
  const titulo = document.getElementById('ev-titulo').value.trim().slice(0, 80);
  const fecha  = document.getElementById('ev-fecha').value;
  const hora   = document.getElementById('ev-hora').value;
  const grupo  = document.getElementById('ev-grupo').value;
  const desc   = document.getElementById('ev-desc').value.trim().slice(0, 300);
  const errEl  = document.getElementById('ev-error');
  if (!titulo || !fecha) { errEl.textContent = 'Pon un título y una fecha.'; errEl.classList.remove('hidden'); return; }

  state.eventos = state.eventos || [];
  const id = Math.max(0, ...state.eventos.map(e => e.id)) + 1;
  state.eventos.push({ id, titulo, fecha, hora, grupo, descripcion: desc });
  guardarDato('eventos');
  cerrarModal('modal-evento');
  renderEventos();
  showToast('Evento creado');
}

function borrarEvento(id) {
  state.eventos = (state.eventos || []).filter(e => e.id !== id);
  guardarDato('eventos');
  renderEventos();
  showToast('Evento eliminado');
}

// ── Menú del comedor (staff) ──────────────────────────────────────────────────
function renderMenus() {
  const el = document.getElementById('page-menus');
  if (!el) return;
  const menus = state.menus || { dias: {} };
  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <div class="mb-6">
      <h2 class="text-xl md:text-2xl font-bold text-gray-800">🍽️ Menú del comedor</h2>
      <p class="text-gray-500 text-sm mt-1">Planificación semanal · las familias lo ven en su portal</p>
    </div>
    <div class="card divide-y divide-gray-100">
      ${DIAS_MENU.map(d => {
        const m = (menus.dias && menus.dias[d.key]) || {};
        return `
        <div class="p-4">
          <p class="font-semibold text-gray-800 text-sm mb-2">${d.label}</p>
          <div class="grid sm:grid-cols-2 gap-2">
            <input id="menu-${d.key}-comida" value="${esc(m.comida || '')}" placeholder="Plato principal"
              class="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
            <input id="menu-${d.key}-postre" value="${esc(m.postre || '')}" placeholder="Postre"
              class="border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
          </div>
        </div>`;
      }).join('')}
    </div>
    <button onclick="guardarMenus()" class="mt-4 w-full bg-green-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-green-700">Guardar menú</button>
  </div>`;
}

function guardarMenus() {
  const dias = {};
  DIAS_MENU.forEach(d => {
    dias[d.key] = {
      comida: document.getElementById('menu-' + d.key + '-comida').value.trim().slice(0, 120),
      postre: document.getElementById('menu-' + d.key + '-postre').value.trim().slice(0, 80),
    };
  });
  state.menus = { actualizado: new Date().toISOString().slice(0, 10), dias };
  guardarDato('menus');
  showToast('Menú guardado');
}

// ── Familias: calendario + menú ───────────────────────────────────────────────
function renderPadreAgenda() {
  const el = document.getElementById('page-padre-agenda');
  if (!el) return;
  const grupos = new Set(getHijosPadre().map(h => h.grupo));
  const hoy = new Date().toISOString().slice(0, 10);
  const eventos = eventosOrdenados().filter(e => (e.fecha >= hoy) && (!e.grupo || e.grupo === 'Todos' || grupos.has(e.grupo)));
  const menus = state.menus || { dias: {} };

  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">📅 Calendario y menú</h2>
      <p class="text-gray-400 text-sm mt-1">Próximos eventos y comida de la semana</p>
    </div>

    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Próximos eventos</p>
    ${eventos.length === 0 ? `<p class="text-sm text-gray-400 mb-6">No hay eventos próximos.</p>` :
      `<div class="mb-6">${eventos.map(e => `
        <div class="card p-4 mb-3 flex items-start gap-4">
          <div class="flex-shrink-0 w-14 text-center bg-green-50 rounded-xl py-2">
            <p class="text-xs text-green-600 uppercase font-semibold">${mesCorto(e.fecha)}</p>
            <p class="text-xl font-bold text-green-700 leading-none">${diaNum(e.fecha)}</p>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-gray-800">${esc(e.titulo)}</h3>
            <p class="text-xs text-gray-400 mb-1">${e.hora ? '🕐 ' + esc(e.hora) : ''}</p>
            ${e.descripcion ? `<p class="text-sm text-gray-600">${esc(e.descripcion)}</p>` : ''}
          </div>
        </div>`).join('')}</div>`}

    <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Menú del comedor</p>
    <div class="card divide-y divide-gray-100">
      ${DIAS_MENU.map(d => {
        const m = (menus.dias && menus.dias[d.key]) || {};
        if (!m.comida && !m.postre) return '';
        return `
        <div class="p-4">
          <p class="font-semibold text-gray-800 text-sm">${d.label}</p>
          ${m.comida ? `<p class="text-sm text-gray-600 mt-0.5">🍲 ${esc(m.comida)}</p>` : ''}
          ${m.postre ? `<p class="text-sm text-gray-500">🍎 ${esc(m.postre)}</p>` : ''}
        </div>`;
      }).join('') || `<p class="p-4 text-sm text-gray-400">El menú aún no está publicado.</p>`}
    </div>
  </div>`;
}
