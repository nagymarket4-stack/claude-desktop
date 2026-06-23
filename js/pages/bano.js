// ─── Módulo de baño / pañales ─────────────────────────────────────────────────
// tipoBano del alumno: 'panal' (usa pañal) | 'orinal' (usa el bater/orinal)

const BANO_OPTS_PANAL = [
  { key:'seco',   label:'Seco',       icon:'☀️' },
  { key:'humedo', label:'Húmedo',     icon:'💧' },
  { key:'heces',  label:'Con heces',  icon:'💩' },
];
const BANO_OPTS_ORINAL = [
  { key:'pis',     label:'Pis',        icon:'💧' },
  { key:'caca',    label:'Caca',       icon:'💩' },
  { key:'intento', label:'Lo intentó', icon:'🚽' },
];

function banoOpts(tipoBano) {
  return tipoBano === 'orinal' ? BANO_OPTS_ORINAL : BANO_OPTS_PANAL;
}
function banoLabel(tipo) {
  const o = [...BANO_OPTS_PANAL, ...BANO_OPTS_ORINAL].find(x => x.key === tipo);
  return o ? `${o.icon} ${o.label}` : tipo;
}
function getTipoBano(a) { return a.tipoBano === 'orinal' ? 'orinal' : 'panal'; }

function renderBano() {
  const el = document.getElementById('page-bano');
  el.innerHTML = `
    <div class="p-4 md:p-8">
      <div class="mb-6 md:mb-8">
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">🚽 Baño y pañales</h2>
        <p class="text-gray-500 text-sm mt-1">Registra los cambios de pañal y las visitas al baño · sin límite de veces</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${state.alumnos.map(a => tarjetaBano(a)).join('')}
      </div>
    </div>

    <!-- Modal registrar -->
    <div id="modal-bano" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" id="modal-bano-body"></div>
    </div>

    <!-- Modal historial -->
    <div id="modal-bano-hist" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 id="bano-hist-titulo" class="text-lg font-bold text-gray-800">Registro</h3>
          <button onclick="cerrarModal('modal-bano-hist')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div id="bano-hist-body"></div>
      </div>
    </div>
  `;
}

function tarjetaBano(a) {
  const tipo = getTipoBano(a);
  const registros = (state.bano && state.bano[a.id]) || [];
  const ultimo = registros[registros.length - 1];
  const badgeTipo = tipo === 'orinal'
    ? `<span class="tag bg-blue-100 text-blue-700">🚽 Orinal</span>`
    : `<span class="tag bg-purple-100 text-purple-700">👶 Pañal</span>`;

  return `
    <div class="card p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold ${esc(a.color)}">${esc(a.avatar)}</div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-gray-800 text-sm truncate">${esc(a.nombre)}</p>
          <p class="text-xs text-gray-400">${esc(a.grupo)}</p>
        </div>
        ${badgeTipo}
      </div>

      <div class="bg-gray-50 rounded-xl p-3 mb-4 text-center">
        <p class="text-2xl font-bold text-gray-800">${registros.length}</p>
        <p class="text-xs text-gray-400">registros hoy</p>
        ${ultimo ? `<p class="text-xs text-gray-500 mt-1">Último: ${banoLabel(ultimo.tipo)} · ${esc(ultimo.hora)}</p>` : ''}
      </div>

      <div class="flex gap-2">
        <button onclick="abrirRegistroBano(${a.id})"
          class="flex-1 bg-green-600 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-green-700 transition-colors">+ Registrar</button>
        <button onclick="verHistorialBano(${a.id})"
          class="px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">🕐 Historial</button>
      </div>
    </div>
  `;
}

let _banoAlumnoId = null;
let _banoTipoSel = null;

function abrirRegistroBano(alumnoId) {
  _banoAlumnoId = alumnoId;
  _banoTipoSel = null;
  const a = state.alumnos.find(x => x.id === alumnoId);
  const tipo = getTipoBano(a);
  const opts = banoOpts(tipo);

  document.getElementById('modal-bano-body').innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold ${esc(a.color)}">${esc(a.avatar)}</div>
        <div>
          <h3 class="font-bold text-gray-800">${esc(a.nombre)}</h3>
          <p class="text-xs text-gray-400">${tipo === 'orinal' ? 'Usa el orinal/bater' : 'Usa pañal'}</p>
        </div>
      </div>
      <button onclick="cerrarModal('modal-bano')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>

    <label class="text-sm font-semibold text-gray-700 block mb-3">${tipo === 'orinal' ? '¿Qué hizo?' : 'Estado del pañal'}</label>
    <div class="grid grid-cols-3 gap-2 mb-5">
      ${opts.map(o => `
        <button type="button" onclick="selTipoBano('${o.key}',this)" data-bano="${o.key}"
          class="bano-opt flex flex-col items-center gap-1 p-3 rounded-xl border-2 border-gray-100 hover:border-green-300 transition-colors">
          <span class="text-2xl">${o.icon}</span>
          <span class="text-xs text-gray-600 text-center leading-tight">${esc(o.label)}</span>
        </button>`).join('')}
    </div>

    <label class="text-sm font-semibold text-gray-700 block mb-2">Observaciones <span class="text-gray-400 font-normal">(opcional)</span></label>
    <textarea id="bano-obs" rows="2" maxlength="300" placeholder="Ej: irritación leve, deposición normal…"
      class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none mb-2"></textarea>
    <div id="bano-error" class="hidden text-red-500 text-sm mb-2"></div>

    <div class="flex gap-3 mt-4">
      <button onclick="cerrarModal('modal-bano')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarRegistroBano()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Guardar</button>
    </div>
  `;
  document.getElementById('modal-bano').classList.remove('hidden');
}

function selTipoBano(key, btn) {
  _banoTipoSel = key;
  document.querySelectorAll('.bano-opt').forEach(b => {
    b.classList.remove('border-green-500','bg-green-50');
    b.classList.add('border-gray-100');
  });
  btn.classList.add('border-green-500','bg-green-50');
  btn.classList.remove('border-gray-100');
}

function guardarRegistroBano() {
  const errEl = document.getElementById('bano-error');
  if (!_banoTipoSel) { errEl.textContent = 'Selecciona una opción.'; errEl.classList.remove('hidden'); return; }
  const obs = document.getElementById('bano-obs').value.trim().slice(0, 300);
  state.bano = state.bano || {};
  state.bano[_banoAlumnoId] = state.bano[_banoAlumnoId] || [];
  state.bano[_banoAlumnoId].push({
    id: Date.now(),
    tipo: _banoTipoSel,
    obs,
    hora: horaActual(),
    fecha: new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' }),
    por: sesionActual?.nombre || '',
  });
  if (typeof guardarDato === 'function') guardarDato('bano');
  cerrarModal('modal-bano');
  renderBano();
  const a = state.alumnos.find(x => x.id === _banoAlumnoId);
  showToast(`Registro de baño guardado para ${a.nombre}`);
}

function verHistorialBano(alumnoId) {
  const a = state.alumnos.find(x => x.id === alumnoId);
  const registros = ((state.bano && state.bano[alumnoId]) || []).slice().reverse();
  document.getElementById('bano-hist-titulo').textContent = `Baño · ${a.nombre}`;
  document.getElementById('bano-hist-body').innerHTML = registros.length === 0
    ? `<p class="text-center text-gray-400 py-8 text-sm">Sin registros todavía.</p>`
    : `<div class="space-y-2">${registros.map(r => `
        <div class="p-3 bg-gray-50 rounded-xl">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-800">${banoLabel(r.tipo)}</span>
            <span class="font-mono text-xs text-gray-500">${esc(r.hora)}</span>
          </div>
          ${r.obs ? `<p class="text-xs text-gray-600 mt-1">${esc(r.obs)}</p>` : ''}
          <p class="text-[11px] text-gray-400 mt-1">${esc(r.fecha || '')}${r.por ? ' · ' + esc(r.por) : ''}</p>
        </div>`).join('')}</div>`;
  document.getElementById('modal-bano-hist').classList.remove('hidden');
}
