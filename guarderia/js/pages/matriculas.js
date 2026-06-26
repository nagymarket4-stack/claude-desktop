// ─── Matrículas online y lista de espera ─────────────────────────────────────
// Acceso: admin / superadmin.

const MAT_ESTADOS = {
  nueva:        { label:'Nueva',         cls:'bg-blue-100 text-blue-700' },
  lista_espera: { label:'Lista de espera', cls:'bg-amber-100 text-amber-700' },
  aceptada:     { label:'Aceptada',      cls:'bg-green-100 text-green-700' },
  rechazada:    { label:'Rechazada',     cls:'bg-gray-100 text-gray-500' },
};

function renderMatriculas() {
  const el = document.getElementById('page-matriculas');
  if (!el) return;
  const lista = (state.matriculas || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const cuenta = e => lista.filter(m => m.estado === e).length;

  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">📋 Matrículas</h2>
        <p class="text-gray-500 text-sm mt-1">Solicitudes de plaza y lista de espera</p>
      </div>
      <button onclick="abrirNuevaMatricula()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">+ Nueva solicitud</button>
    </div>

    <div class="grid grid-cols-4 gap-2 mb-6 text-center">
      <div class="card p-3"><p class="text-lg font-bold text-blue-600">${cuenta('nueva')}</p><p class="text-[11px] text-gray-400">Nuevas</p></div>
      <div class="card p-3"><p class="text-lg font-bold text-amber-500">${cuenta('lista_espera')}</p><p class="text-[11px] text-gray-400">En espera</p></div>
      <div class="card p-3"><p class="text-lg font-bold text-green-600">${cuenta('aceptada')}</p><p class="text-[11px] text-gray-400">Aceptadas</p></div>
      <div class="card p-3"><p class="text-lg font-bold text-gray-400">${cuenta('rechazada')}</p><p class="text-[11px] text-gray-400">Rechazadas</p></div>
    </div>

    ${lista.length === 0 ? `<div class="text-center py-16 text-gray-400"><p class="text-5xl mb-4">📋</p><p>No hay solicitudes de matrícula.</p></div>` :
      lista.map(m => {
        const est = MAT_ESTADOS[m.estado] || MAT_ESTADOS.nueva;
        return `
        <div class="card p-5 mb-3">
          <div class="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 class="font-bold text-gray-800">${esc(m.nino)} <span class="text-sm font-normal text-gray-400">· ${m.edad} año${m.edad === 1 ? '' : 's'}</span></h3>
              <p class="text-xs text-gray-400 mt-0.5">Solicita: Grupo ${esc(m.grupo)} · ${fmtFechaCorta(m.fecha)}</p>
            </div>
            <span class="tag ${est.cls}">${est.label}</span>
          </div>
          <p class="text-sm text-gray-600">👤 ${esc(m.tutor)} · 📧 ${esc(m.email)} · 📞 ${esc(m.telefono)}</p>
          ${m.notas ? `<p class="text-xs text-gray-500 mt-1 italic">${esc(m.notas)}</p>` : ''}
          <div class="flex flex-wrap gap-2 mt-3">
            <button onclick="cambiarEstadoMatricula(${m.id},'aceptada')" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100">Aceptar</button>
            <button onclick="cambiarEstadoMatricula(${m.id},'lista_espera')" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100">Lista de espera</button>
            <button onclick="cambiarEstadoMatricula(${m.id},'rechazada')" class="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 text-gray-500 hover:bg-gray-100">Rechazar</button>
            <button onclick="borrarMatricula(${m.id})" class="ml-auto text-gray-300 hover:text-red-500 text-sm">🗑️</button>
          </div>
        </div>`;
      }).join('')}
  </div>

  <div id="modal-matricula" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" id="modal-matricula-body"></div>
  </div>`;
}

function abrirNuevaMatricula() {
  document.getElementById('modal-matricula-body').innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-gray-800 text-lg">Nueva solicitud</h3>
      <button onclick="cerrarModal('modal-matricula')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="col-span-2"><label class="text-sm font-semibold text-gray-700 block mb-1">Nombre del niño/a</label>
        <input id="mat-nino" maxlength="60" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"></div>
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Edad</label>
        <input id="mat-edad" type="number" min="0" max="6" value="2" class="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-green-400"></div>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1 mt-3">Tutor/a</label>
    <input id="mat-tutor" maxlength="60" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3">
    <div class="grid grid-cols-2 gap-3">
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Email</label>
        <input id="mat-email" type="email" maxlength="80" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"></div>
      <div><label class="text-sm font-semibold text-gray-700 block mb-1">Teléfono</label>
        <input id="mat-tel" maxlength="20" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400"></div>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1 mt-3">Grupo de interés</label>
    <select id="mat-grupo" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3 bg-white">
      ${[...new Set(state.alumnos.map(a => a.grupo))].map(g => `<option value="${esc(g)}">${esc(g)}</option>`).join('')}
    </select>
    <div id="mat-error" class="hidden text-red-500 text-sm mb-2"></div>
    <div class="flex gap-3">
      <button onclick="cerrarModal('modal-matricula')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarMatricula()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Guardar</button>
    </div>`;
  document.getElementById('modal-matricula').classList.remove('hidden');
}

function guardarMatricula() {
  const nino = document.getElementById('mat-nino').value.trim().slice(0, 60);
  const tutor = document.getElementById('mat-tutor').value.trim().slice(0, 60);
  const errEl = document.getElementById('mat-error');
  if (!nino || !tutor) { errEl.textContent = 'Pon el nombre del niño/a y del tutor/a.'; errEl.classList.remove('hidden'); return; }
  state.matriculas = state.matriculas || [];
  const id = Math.max(0, ...state.matriculas.map(m => m.id)) + 1;
  state.matriculas.push({
    id, nino, edad: +document.getElementById('mat-edad').value || 0, tutor,
    email: document.getElementById('mat-email').value.trim().slice(0, 80),
    telefono: document.getElementById('mat-tel').value.trim().slice(0, 20),
    grupo: document.getElementById('mat-grupo').value,
    estado: 'nueva', fecha: new Date().toISOString().slice(0, 10), notas: '',
  });
  guardarDato('matriculas');
  cerrarModal('modal-matricula');
  renderMatriculas();
  showToast('Solicitud registrada');
}

function cambiarEstadoMatricula(id, estado) {
  const m = (state.matriculas || []).find(x => x.id === id);
  if (!m) return;
  m.estado = estado;
  guardarDato('matriculas');
  renderMatriculas();
  showToast('Estado actualizado: ' + (MAT_ESTADOS[estado]?.label || estado));
}

function borrarMatricula(id) {
  state.matriculas = (state.matriculas || []).filter(m => m.id !== id);
  guardarDato('matriculas');
  renderMatriculas();
  showToast('Solicitud eliminada');
}
