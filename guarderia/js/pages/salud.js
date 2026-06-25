// ─── Salud: alergias, medicación y autorizaciones de recogida ────────────────
// Acceso edición: profesor / admin / superadmin. Las familias lo ven en su Inicio.

function getSalud(alumnoId) {
  state.salud = state.salud || {};
  if (!state.salud[alumnoId]) state.salud[alumnoId] = { alergias: '', medicacion: [], autorizados: [] };
  return state.salud[alumnoId];
}

let _saludAlumnoId = null;

function renderSalud() {
  const el = document.getElementById('page-salud');
  if (!el) return;
  if (!_saludAlumnoId || !state.alumnos.find(a => a.id === _saludAlumnoId)) {
    _saludAlumnoId = state.alumnos[0]?.id || null;
  }
  const a = state.alumnos.find(x => x.id === _saludAlumnoId);
  const s = a ? getSalud(a.id) : { alergias: '', medicacion: [], autorizados: [] };

  el.innerHTML = `
  <div class="p-4 md:p-8">
    <div class="mb-6">
      <h2 class="text-xl md:text-2xl font-bold text-gray-800">🩺 Salud y autorizaciones</h2>
      <p class="text-gray-500 text-sm mt-1">Alergias, medicación y personas autorizadas a recoger</p>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-2 mb-5">
      ${state.alumnos.map(al => `
        <button onclick="_saludAlumnoId=${al.id};renderSalud()"
          class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${_saludAlumnoId === al.id ? 'bg-green-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}">
          <span class="${esc(al.color)} w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">${esc(al.avatar)}</span>
          ${esc(al.nombre.split(' ')[0])}
        </button>`).join('')}
    </div>

    ${!a ? `<p class="text-gray-400 text-sm">No hay alumnos.</p>` : `
    <div class="grid gap-4 max-w-2xl">
      <!-- Alergias -->
      <div class="card p-5">
        <h3 class="font-bold text-gray-800 mb-2">🥜 Alergias e intolerancias</h3>
        <textarea id="salud-alergias" rows="2" maxlength="300" placeholder="Sin alergias conocidas"
          class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none">${esc(s.alergias || '')}</textarea>
        <button onclick="guardarAlergias()" class="mt-2 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-green-700">Guardar alergias</button>
      </div>

      <!-- Medicación -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-800">💊 Medicación</h3>
          <button onclick="abrirNuevaMedicacion()" class="text-xs text-green-600 font-medium">+ Añadir</button>
        </div>
        ${s.medicacion.length === 0 ? `<p class="text-sm text-gray-400">Sin medicación registrada.</p>` :
          `<div class="space-y-2">${s.medicacion.map(m => `
            <div class="flex items-start justify-between gap-2 bg-gray-50 rounded-xl p-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-800">${esc(m.nombre)} ${m.dosis ? `· ${esc(m.dosis)}` : ''}</p>
                <p class="text-xs text-gray-400">${m.hora ? '🕐 ' + esc(m.hora) : ''}${m.obs ? ' · ' + esc(m.obs) : ''}</p>
              </div>
              <button onclick="borrarMedicacion('${esc(m.id)}')" class="text-gray-300 hover:text-red-500 text-sm">🗑️</button>
            </div>`).join('')}</div>`}
      </div>

      <!-- Autorizados -->
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-gray-800">✋ Autorizados a recoger</h3>
          <button onclick="abrirNuevoAutorizado()" class="text-xs text-green-600 font-medium">+ Añadir</button>
        </div>
        ${s.autorizados.length === 0 ? `<p class="text-sm text-gray-400">Solo los tutores legales.</p>` :
          `<div class="space-y-2">${s.autorizados.map(p => `
            <div class="flex items-start justify-between gap-2 bg-gray-50 rounded-xl p-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-800">${esc(p.nombre)} <span class="text-gray-400 font-normal">· ${esc(p.relacion)}</span></p>
                <p class="text-xs text-gray-400">${p.dni ? 'DNI ' + esc(p.dni) : ''}${p.tel ? ' · ' + esc(p.tel) : ''}</p>
              </div>
              <button onclick="borrarAutorizado('${esc(p.id)}')" class="text-gray-300 hover:text-red-500 text-sm">🗑️</button>
            </div>`).join('')}</div>`}
      </div>
    </div>`}
  </div>

  <div id="modal-salud" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" id="modal-salud-body"></div>
  </div>`;
}

function guardarAlergias() {
  const s = getSalud(_saludAlumnoId);
  s.alergias = document.getElementById('salud-alergias').value.trim().slice(0, 300);
  guardarDato('salud');
  showToast('Alergias guardadas');
}

function abrirNuevaMedicacion() {
  document.getElementById('modal-salud-body').innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-gray-800 text-lg">Añadir medicación</h3>
      <button onclick="cerrarModal('modal-salud')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Medicamento</label>
    <input id="med-nombre" maxlength="60" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3">
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Dosis</label>
        <input id="med-dosis" placeholder="5 ml" maxlength="30" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"></div>
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Hora</label>
        <input id="med-hora" type="time" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"></div>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1 mt-3">Indicaciones</label>
    <input id="med-obs" maxlength="120" placeholder="Solo si tiene fiebre…" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
    <div id="med-error" class="hidden text-red-500 text-sm mt-2"></div>
    <div class="flex gap-3 mt-5">
      <button onclick="cerrarModal('modal-salud')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarMedicacion()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Añadir</button>
    </div>`;
  document.getElementById('modal-salud').classList.remove('hidden');
}

function guardarMedicacion() {
  const nombre = document.getElementById('med-nombre').value.trim().slice(0, 60);
  const errEl = document.getElementById('med-error');
  if (!nombre) { errEl.textContent = 'Pon el nombre del medicamento.'; errEl.classList.remove('hidden'); return; }
  const s = getSalud(_saludAlumnoId);
  s.medicacion.push({
    id: 'm' + Date.now(), nombre,
    dosis: document.getElementById('med-dosis').value.trim().slice(0, 30),
    hora:  document.getElementById('med-hora').value,
    obs:   document.getElementById('med-obs').value.trim().slice(0, 120),
  });
  guardarDato('salud');
  cerrarModal('modal-salud');
  renderSalud();
  showToast('Medicación añadida');
}

function borrarMedicacion(id) {
  const s = getSalud(_saludAlumnoId);
  s.medicacion = s.medicacion.filter(m => m.id !== id);
  guardarDato('salud');
  renderSalud();
}

function abrirNuevoAutorizado() {
  document.getElementById('modal-salud-body').innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-gray-800 text-lg">Persona autorizada</h3>
      <button onclick="cerrarModal('modal-salud')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Nombre completo</label>
    <input id="aut-nombre" maxlength="60" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3">
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Relación</label>
        <input id="aut-relacion" placeholder="Abuela, tío…" maxlength="30" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"></div>
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">DNI</label>
        <input id="aut-dni" maxlength="15" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"></div>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1 mt-3">Teléfono</label>
    <input id="aut-tel" maxlength="20" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
    <div id="aut-error" class="hidden text-red-500 text-sm mt-2"></div>
    <div class="flex gap-3 mt-5">
      <button onclick="cerrarModal('modal-salud')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarAutorizado()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Añadir</button>
    </div>`;
  document.getElementById('modal-salud').classList.remove('hidden');
}

function guardarAutorizado() {
  const nombre = document.getElementById('aut-nombre').value.trim().slice(0, 60);
  const errEl = document.getElementById('aut-error');
  if (!nombre) { errEl.textContent = 'Pon el nombre.'; errEl.classList.remove('hidden'); return; }
  const s = getSalud(_saludAlumnoId);
  s.autorizados.push({
    id: 'a' + Date.now(), nombre,
    relacion: document.getElementById('aut-relacion').value.trim().slice(0, 30) || 'Autorizado/a',
    dni: document.getElementById('aut-dni').value.trim().slice(0, 15),
    tel: document.getElementById('aut-tel').value.trim().slice(0, 20),
  });
  guardarDato('salud');
  cerrarModal('modal-salud');
  renderSalud();
  showToast('Persona autorizada añadida');
}

function borrarAutorizado(id) {
  const s = getSalud(_saludAlumnoId);
  s.autorizados = s.autorizados.filter(p => p.id !== id);
  guardarDato('salud');
  renderSalud();
}
