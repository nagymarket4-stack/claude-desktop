// ─── Desarrollo e informes pedagógicos ───────────────────────────────────────
// Acceso edición: profesor / admin / superadmin. Las familias ven los de su hijo.

const AREAS_DESARROLLO = ['Lenguaje', 'Motricidad', 'Social', 'Autonomía', 'Cognitivo'];
const AREA_COLOR = {
  Lenguaje:'bg-blue-100 text-blue-700', Motricidad:'bg-orange-100 text-orange-700',
  Social:'bg-pink-100 text-pink-700', 'Autonomía':'bg-green-100 text-green-700',
  Cognitivo:'bg-purple-100 text-purple-700',
};

let _desarrolloAlumnoId = null;

function renderDesarrollo() {
  const el = document.getElementById('page-desarrollo');
  if (!el) return;
  if (!_desarrolloAlumnoId || !state.alumnos.find(a => a.id === _desarrolloAlumnoId)) {
    _desarrolloAlumnoId = state.alumnos[0]?.id || null;
  }
  const registros = ((state.desarrollo || {})[_desarrolloAlumnoId] || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  el.innerHTML = `
  <div class="p-4 md:p-8">
    <div class="mb-6">
      <h2 class="text-xl md:text-2xl font-bold text-gray-800">📈 Desarrollo e informes</h2>
      <p class="text-gray-500 text-sm mt-1">Observaciones y logros de cada alumno</p>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 mb-5">
      ${state.alumnos.map(a => `
        <button onclick="_desarrolloAlumnoId=${a.id};renderDesarrollo()"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${_desarrolloAlumnoId === a.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}">
          <span class="${esc(a.color)} w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">${esc(a.avatar)}</span>
          ${esc(a.nombre.split(' ')[0])}
        </button>`).join('')}
    </div>

    <div class="flex justify-end mb-4">
      <button onclick="abrirNuevaObservacion()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">+ Nueva observación</button>
    </div>

    ${registros.length === 0 ? `<div class="text-center py-16 text-gray-400"><p class="text-5xl mb-4">📈</p><p>Sin observaciones para este alumno.</p></div>` :
      `<div class="space-y-3 max-w-2xl">${registros.map(r => tarjetaObservacion(r, true)).join('')}</div>`}
  </div>

  <div id="modal-obs" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" id="modal-obs-body"></div>
  </div>`;
}

function tarjetaObservacion(r, conBorrar) {
  return `
    <div class="card p-4">
      <div class="flex items-center justify-between gap-2 mb-2">
        <div class="flex items-center gap-2">
          <span class="tag ${AREA_COLOR[r.area] || 'bg-gray-100 text-gray-600'}">${esc(r.area)}</span>
          ${r.hito ? `<span class="tag bg-amber-100 text-amber-700">🏆 Logro</span>` : ''}
        </div>
        <span class="text-xs text-gray-400">${fmtFechaCorta(r.fecha)}</span>
      </div>
      <p class="text-sm text-gray-700 leading-relaxed">${esc(r.texto)}</p>
      <div class="flex items-center justify-between mt-2">
        <p class="text-[11px] text-gray-400">${esc(r.autor || '')}</p>
        ${conBorrar ? `<button onclick="borrarObservacion(${r.id})" class="text-gray-300 hover:text-red-500 text-xs">🗑️</button>` : ''}
      </div>
    </div>`;
}

let _obsHito = false;
function abrirNuevaObservacion() {
  if (!_desarrolloAlumnoId) { showToast('No hay alumno seleccionado'); return; }
  _obsHito = false;
  const a = state.alumnos.find(x => x.id === _desarrolloAlumnoId);
  document.getElementById('modal-obs-body').innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <div>
        <h3 class="font-bold text-gray-800 text-lg">Nueva observación</h3>
        <p class="text-xs text-gray-400">${esc(a.nombre)}</p>
      </div>
      <button onclick="cerrarModal('modal-obs')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Área</label>
    <select id="obs-area" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3 bg-white">
      ${AREAS_DESARROLLO.map(ar => `<option value="${ar}">${ar}</option>`).join('')}
    </select>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Observación</label>
    <textarea id="obs-texto" rows="4" maxlength="500" placeholder="Qué has observado en su evolución…"
      class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none mb-3"></textarea>
    <label class="flex items-center gap-2 text-sm text-gray-700 mb-3 cursor-pointer">
      <input type="checkbox" id="obs-hito" onchange="_obsHito=this.checked" class="w-4 h-4 accent-green-600"> Marcar como logro destacado 🏆
    </label>
    <div id="obs-error" class="hidden text-red-500 text-sm mb-2"></div>
    <div class="flex gap-3">
      <button onclick="cerrarModal('modal-obs')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarObservacion()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Guardar</button>
    </div>`;
  document.getElementById('modal-obs').classList.remove('hidden');
}

function guardarObservacion() {
  const area  = document.getElementById('obs-area').value;
  const texto = document.getElementById('obs-texto').value.trim().slice(0, 500);
  const errEl = document.getElementById('obs-error');
  if (!texto) { errEl.textContent = 'Escribe la observación.'; errEl.classList.remove('hidden'); return; }

  state.desarrollo = state.desarrollo || {};
  const arr = (state.desarrollo[_desarrolloAlumnoId] = state.desarrollo[_desarrolloAlumnoId] || []);
  const id = Math.max(0, ...arr.map(r => r.id)) + 1;
  arr.push({ id, fecha: new Date().toISOString().slice(0, 10), area, texto, autor: sesionActual?.nombre || '', hito: _obsHito });
  guardarDato('desarrollo');
  cerrarModal('modal-obs');
  renderDesarrollo();
  showToast('Observación guardada');
}

function borrarObservacion(id) {
  const arr = (state.desarrollo || {})[_desarrolloAlumnoId] || [];
  state.desarrollo[_desarrolloAlumnoId] = arr.filter(r => r.id !== id);
  guardarDato('desarrollo');
  renderDesarrollo();
  showToast('Observación eliminada');
}

// ── Familias: informes de su(s) hijo(s) ───────────────────────────────────────
function renderPadreInformes() {
  const el = document.getElementById('page-padre-informes');
  if (!el) return;
  const hijos = getHijosPadre();
  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">📈 Informes</h2>
      <p class="text-gray-400 text-sm mt-1">Evolución y logros de ${hijos.length === 1 ? esc(hijos[0].nombre.split(' ')[0]) : 'tus hijos'}</p>
    </div>
    ${hijos.map(h => {
      const registros = ((state.desarrollo || {})[h.id] || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
      return `
      <div class="mb-6">
        ${hijos.length > 1 ? `<div class="flex items-center gap-2 mb-3"><span class="${h.color} w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">${esc(h.avatar)}</span><p class="font-semibold text-gray-700">${esc(h.nombre)}</p></div>` : ''}
        ${registros.length === 0 ? `<p class="text-sm text-gray-400">Todavía no hay observaciones.</p>` :
          `<div class="space-y-3">${registros.map(r => tarjetaObservacion(r, false)).join('')}</div>`}
      </div>`;
    }).join('')}
  </div>`;
}
