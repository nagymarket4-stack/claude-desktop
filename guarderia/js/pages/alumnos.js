function renderAlumnos() {
  const presentes = state.alumnos.filter(a => a.estado === 'entrada').length;
  const total     = state.alumnos.length;

  document.getElementById('page-alumnos').innerHTML = `
    <div class="p-4 md:p-8">
      <div class="flex items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-gray-800">Registro de Alumnos</h2>
          <p class="text-gray-500 text-sm mt-1">${esc(presentes)} de ${esc(total)} alumnos en el centro</p>
        </div>
        <button onclick="abrirModalAlumno()" class="bg-green-600 text-white px-4 md:px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 flex-shrink-0">
          <span>+</span> <span class="hidden sm:inline">Nuevo alumno</span>
        </button>
      </div>

      <div class="flex gap-2 md:gap-3 mb-6 flex-wrap">
        ${['Todos','Ositos','Conejitos','Estrellitas'].map(g => `
          <button onclick="filtrarGrupo('${esc(g)}')" id="filtro-${esc(g)}"
            class="filtro-btn px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${g==='Todos'?'bg-green-600 text-white border-green-600':'border-gray-200 text-gray-600 hover:border-green-400'}">
            ${esc(g)}
          </button>
        `).join('')}
      </div>

      <!-- Vista tabla (desktop) -->
      <div class="card overflow-hidden hidden md:block">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="text-left px-6 py-4 font-semibold text-gray-600">Alumno</th>
              <th class="text-left px-6 py-4 font-semibold text-gray-600">Grupo</th>
              <th class="text-left px-6 py-4 font-semibold text-gray-600">Estado</th>
              <th class="text-left px-6 py-4 font-semibold text-gray-600">Entrada</th>
              <th class="text-left px-6 py-4 font-semibold text-gray-600">Salida</th>
              <th class="text-center px-6 py-4 font-semibold text-gray-600">Acción</th>
            </tr>
          </thead>
          <tbody id="tabla-alumnos">
            ${alumnosFilas(state.alumnos)}
          </tbody>
        </table>
      </div>

      <!-- Vista tarjetas (móvil) -->
      <div class="md:hidden space-y-3" id="cards-alumnos">
        ${alumnosCards(state.alumnos)}
      </div>
    </div>

    <!-- Modal ficha del alumno -->
    <div id="modal-ficha" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto" id="modal-ficha-body"></div>
    </div>

    <!-- Modal historial de movimientos -->
    <div id="modal-historial" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 id="hist-titulo" class="text-lg font-bold text-gray-800">Movimientos</h3>
          <button onclick="cerrarModal('modal-historial')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div id="hist-body"></div>
      </div>
    </div>

    <!-- Modal nuevo alumno -->
    <div id="modal-alumno" class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <h3 class="text-lg font-bold text-gray-800 mb-6">Nuevo Alumno</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Nombre completo</label>
            <input id="nuevo-nombre" type="text" placeholder="Nombre del alumno" maxlength="80"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Edad</label>
              <select id="nuevo-edad" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400">
                <option>3</option><option>4</option><option>5</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Grupo</label>
              <select id="nuevo-grupo" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400">
                <option>Ositos</option><option>Conejitos</option><option>Estrellitas</option>
              </select>
            </div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Tutor / Familiar</label>
            <input id="nuevo-tutor" type="text" placeholder="Nombre del tutor" maxlength="80"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Teléfono</label>
            <input id="nuevo-tel" type="tel" placeholder="6XX XXX XXX" maxlength="20" pattern="[0-9 +\\-]{6,20}"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
        </div>
        <div id="modal-alumno-error" class="hidden mt-3 text-red-600 text-xs"></div>
        <div class="flex gap-3 mt-6">
          <button onclick="cerrarModal('modal-alumno')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button onclick="guardarAlumno()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Guardar</button>
        </div>
      </div>
    </div>
  `;
}

function alumnosFilas(lista) {
  return lista.map(a => `
    <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
      <td class="px-6 py-4">
        <button onclick="abrirFichaAlumno(${a.id})" class="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
          <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${esc(a.color)}">${esc(a.avatar)}</div>
          <div>
            <p class="font-medium text-gray-800 hover:text-green-700">${esc(a.nombre)}</p>
            <p class="text-xs text-gray-400">${esc(a.edad)} años · ${esc(a.tutor)}</p>
          </div>
        </button>
      </td>
      <td class="px-6 py-4 text-gray-600">${esc(a.grupo)}</td>
      <td class="px-6 py-4">${badge(a.estado)}</td>
      <td class="px-6 py-4 text-gray-600 font-mono text-xs">${esc(a.hora_entrada) || '—'}</td>
      <td class="px-6 py-4 text-gray-600 font-mono text-xs">${esc(a.hora_salida) || '—'}</td>
      <td class="px-6 py-4">
        <div class="flex items-center justify-center gap-2">
          ${botonesEstadoAlumno(a)}
          <button onclick="verHistorialAlumno(${a.id})" title="Ver movimientos del día"
            class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">🕐</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Control segmentado de 3 estados: En el centro / Fuera / Ausente
function botonesEstadoAlumno(a) {
  const est = a.estado === 'salida' ? 'fuera' : a.estado; // normalizar dato antiguo
  const opciones = [
    { key:'entrada', label:'En centro', activo:'bg-green-600 text-white', inactivo:'text-green-700 hover:bg-green-50' },
    { key:'fuera',   label:'Fuera',     activo:'bg-amber-500 text-white', inactivo:'text-amber-600 hover:bg-amber-50' },
    { key:'ausente', label:'Ausente',   activo:'bg-gray-500 text-white',  inactivo:'text-gray-500 hover:bg-gray-100' },
  ];
  return `<div class="inline-flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
    ${opciones.map((o,i) => `
      <button onclick="cambiarEstadoAlumno(${a.id},'${o.key}')"
        class="px-2.5 py-1.5 transition-colors ${est===o.key ? o.activo : o.inactivo} ${i>0?'border-l border-gray-200':''}">
        ${o.label}
      </button>`).join('')}
  </div>`;
}

function alumnosCards(lista) {
  return lista.map(a => `
    <div class="card p-4">
      <div class="flex items-center gap-3 mb-3">
        <button onclick="abrirFichaAlumno(${a.id})" class="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${esc(a.color)}">${esc(a.avatar)}</div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-800 truncate">${esc(a.nombre)}</p>
            <p class="text-xs text-gray-400 truncate">${esc(a.edad)} años · ${esc(a.grupo)} · ${esc(a.tutor)}</p>
          </div>
        </button>
        ${badge(a.estado)}
      </div>
      <div class="flex gap-4 text-xs text-gray-500 mb-3">
        <span>Entrada: <span class="font-mono text-gray-700">${esc(a.hora_entrada) || '—'}</span></span>
        <span>Salida: <span class="font-mono text-gray-700">${esc(a.hora_salida) || '—'}</span></span>
      </div>
      <div class="flex items-center gap-2">
        ${botonesEstadoAlumno(a)}
        <button onclick="verHistorialAlumno(${a.id})" title="Ver movimientos del día"
          class="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 flex-shrink-0">🕐</button>
      </div>
    </div>
  `).join('');
}

function refrescarListasAlumnos(lista) {
  const tabla = document.getElementById('tabla-alumnos');
  const cards = document.getElementById('cards-alumnos');
  if (tabla) tabla.innerHTML = alumnosFilas(lista);
  if (cards) cards.innerHTML = alumnosCards(lista);
}

// Guarda alumnos en la nube (si Supabase está activo) y en cache local
function sincronizarAlumnos() {
  if (typeof guardarDato === 'function') guardarDato('alumnos');
  if (typeof persistir === 'function') persistir();
}

function cambiarEstadoAlumno(id, estado) {
  const a = state.alumnos.find(x => x.id === id);
  if (!a || a.estado === estado) return;
  a.estado = estado;
  const hora = horaActual();
  let msg;
  if (estado === 'entrada') {
    a.hora_entrada = hora;                       // registra la (re)entrada
    msg = `${a.nombre} ha entrado al centro (${hora})`;
  } else if (estado === 'fuera') {
    a.hora_salida = hora;                        // registra la salida (temporal o definitiva)
    msg = `${a.nombre} ha salido del centro (${hora})`;
  } else if (estado === 'ausente') {
    a.hora_entrada = null;
    a.hora_salida = null;
    msg = `${a.nombre} marcado como ausente`;
  }
  // Guardar el movimiento en el historial del día
  a.historial = a.historial || [];
  a.historial.push({ tipo: estado, hora, fecha: hoyFecha() });

  refrescarListasAlumnos(state.alumnos);
  sincronizarAlumnos();
  showToast(msg);
}

function hoyFecha() {
  return new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric' });
}

function verHistorialAlumno(id) {
  const a = state.alumnos.find(x => x.id === id);
  if (!a) return;
  const hist = (a.historial || []).slice().reverse();
  const labels = {
    entrada: { txt:'Entró al centro', icon:'🟢', color:'text-green-600' },
    fuera:   { txt:'Salió del centro', icon:'🟡', color:'text-amber-600' },
    ausente: { txt:'Marcado ausente',  icon:'⚪', color:'text-gray-500' },
    salida:  { txt:'Salió del centro', icon:'🟡', color:'text-amber-600' },
  };
  document.getElementById('hist-titulo').textContent = `Movimientos de ${a.nombre}`;
  document.getElementById('hist-body').innerHTML = hist.length === 0
    ? `<p class="text-center text-gray-400 py-8 text-sm">Sin movimientos registrados hoy.</p>`
    : `<div class="space-y-2">${hist.map(h => {
        const l = labels[h.tipo] || { txt:h.tipo, icon:'•', color:'text-gray-500' };
        return `
        <div class="flex items-center gap-3 p-2.5 bg-gray-50 rounded-xl">
          <span class="text-lg">${l.icon}</span>
          <div class="flex-1">
            <p class="text-sm font-medium ${l.color}">${l.txt}</p>
            <p class="text-xs text-gray-400">${esc(h.fecha || '')}</p>
          </div>
          <span class="font-mono text-sm text-gray-700">${esc(h.hora || '—')}</span>
        </div>`;
      }).join('')}</div>`;
  document.getElementById('modal-historial').classList.remove('hidden');
}

function filtrarGrupo(grupo) {
  document.querySelectorAll('.filtro-btn').forEach(b => {
    b.classList.remove('bg-green-600','text-white','border-green-600');
    b.classList.add('border-gray-200','text-gray-600');
  });
  const btn = document.getElementById('filtro-' + grupo);
  if (btn) {
    btn.classList.add('bg-green-600','text-white','border-green-600');
    btn.classList.remove('border-gray-200','text-gray-600');
  }
  const lista = grupo === 'Todos' ? state.alumnos : state.alumnos.filter(a => a.grupo === grupo);
  refrescarListasAlumnos(lista);
}

function abrirModalAlumno() {
  document.getElementById('modal-alumno').classList.remove('hidden');
}
function cerrarModal(id) {
  document.getElementById(id).classList.add('hidden');
}

const SOLO_TEXTO = /^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'\-\.]{2,80}$/;
const SOLO_TEL   = /^[0-9\s\+\-]{6,20}$/;

function guardarAlumno() {
  const nombre = document.getElementById('nuevo-nombre').value.trim();
  const tutor  = document.getElementById('nuevo-tutor').value.trim();
  const tel    = document.getElementById('nuevo-tel').value.trim();
  const errEl  = document.getElementById('modal-alumno-error');

  if (!SOLO_TEXTO.test(nombre)) {
    errEl.textContent = 'Nombre inválido (solo letras, 2-80 caracteres).';
    errEl.classList.remove('hidden'); return;
  }
  if (tutor && !SOLO_TEXTO.test(tutor)) {
    errEl.textContent = 'Nombre del tutor inválido.';
    errEl.classList.remove('hidden'); return;
  }
  if (tel && !SOLO_TEL.test(tel)) {
    errEl.textContent = 'Teléfono inválido (solo números, espacios, + o -)';
    errEl.classList.remove('hidden'); return;
  }
  errEl.classList.add('hidden');

  const colores = ['av-green','av-blue','av-pink','av-orange','av-purple'];
  const nuevoId = state.alumnos.reduce((max, a) => Math.max(max, a.id), 0) + 1;
  const nuevo = {
    id: nuevoId,
    nombre,
    edad: parseInt(document.getElementById('nuevo-edad').value),
    grupo: document.getElementById('nuevo-grupo').value,
    avatar: nombre[0].toUpperCase(),
    color: colores[Math.floor(Math.random() * colores.length)],
    estado: 'ausente',
    hora_entrada: null, hora_salida: null,
    tutor,
    tel,
  };
  state.alumnos.push(nuevo);
  cerrarModal('modal-alumno');
  renderAlumnos();
  sincronizarAlumnos();
  showToast(`${nombre} añadido correctamente`);
}

// ─── Ficha del alumno (editable por cualquier usuario) ────────────────────────
function abrirFichaAlumno(id) {
  const a = state.alumnos.find(x => x.id === id);
  if (!a) return;
  const tipoBano = a.tipoBano === 'orinal' ? 'orinal' : 'panal';
  document.getElementById('modal-ficha-body').innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${esc(a.color)}">${esc(a.avatar)}</div>
        <div>
          <h3 class="font-bold text-gray-800 text-lg">${esc(a.nombre)}</h3>
          <p class="text-sm text-gray-400">${esc(a.grupo)} · ${esc(a.edad)} años</p>
        </div>
      </div>
      <button onclick="cerrarModal('modal-ficha')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>

    <div class="space-y-3 mb-5">
      <div class="flex justify-between text-sm"><span class="text-gray-400">Tutor / Familiar</span><span class="text-gray-700 font-medium">${esc(a.tutor) || '—'}</span></div>
      <div class="flex justify-between text-sm"><span class="text-gray-400">Teléfono</span><span class="text-gray-700 font-medium">${esc(a.tel) || '—'}</span></div>
      <div class="flex justify-between text-sm"><span class="text-gray-400">Estado actual</span>${badge(a.estado)}</div>
    </div>

    <div class="border-t border-gray-100 pt-5">
      <label class="text-sm font-semibold text-gray-700 block mb-2">🚽 Higiene</label>
      <p class="text-xs text-gray-400 mb-2">¿El niño usa pañal o ya usa el orinal/bater?</p>
      <select id="ficha-tipobano" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 bg-white">
        <option value="panal" ${tipoBano==='panal'?'selected':''}>👶 Usa pañal</option>
        <option value="orinal" ${tipoBano==='orinal'?'selected':''}>🚽 Usa el orinal / bater</option>
      </select>
    </div>

    <div class="flex gap-3 mt-6">
      <button onclick="cerrarModal('modal-ficha')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cerrar</button>
      <button onclick="guardarFichaAlumno(${a.id})" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Guardar</button>
    </div>
  `;
  document.getElementById('modal-ficha').classList.remove('hidden');
}

function guardarFichaAlumno(id) {
  const a = state.alumnos.find(x => x.id === id);
  if (!a) return;
  a.tipoBano = document.getElementById('ficha-tipobano').value;
  cerrarModal('modal-ficha');
  sincronizarAlumnos();
  showToast(`Ficha de ${a.nombre} actualizada`);
}
