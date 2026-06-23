function renderAlumnos() {
  const presentes = state.alumnos.filter(a => a.estado === 'entrada').length;
  const total     = state.alumnos.length;

  document.getElementById('page-alumnos').innerHTML = `
    <div class="p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Registro de Alumnos</h2>
          <p class="text-gray-500 mt-1">${esc(presentes)} de ${esc(total)} alumnos en el centro</p>
        </div>
        <button onclick="abrirModalAlumno()" class="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2">
          <span>+</span> Nuevo alumno
        </button>
      </div>

      <div class="flex gap-3 mb-6 flex-wrap">
        ${['Todos','Ositos','Conejitos','Estrellitas'].map(g => `
          <button onclick="filtrarGrupo('${esc(g)}')" id="filtro-${esc(g)}"
            class="filtro-btn px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${g==='Todos'?'bg-green-600 text-white border-green-600':'border-gray-200 text-gray-600 hover:border-green-400'}">
            ${esc(g)}
          </button>
        `).join('')}
      </div>

      <div class="card overflow-hidden">
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
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${esc(a.color)}">${esc(a.avatar)}</div>
          <div>
            <p class="font-medium text-gray-800">${esc(a.nombre)}</p>
            <p class="text-xs text-gray-400">${esc(a.edad)} años · ${esc(a.tutor)}</p>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 text-gray-600">${esc(a.grupo)}</td>
      <td class="px-6 py-4">${badge(a.estado)}</td>
      <td class="px-6 py-4 text-gray-600 font-mono text-xs">${esc(a.hora_entrada) || '—'}</td>
      <td class="px-6 py-4 text-gray-600 font-mono text-xs">${esc(a.hora_salida) || '—'}</td>
      <td class="px-6 py-4 text-center">
        ${a.estado === 'ausente' ?
          `<button onclick="registrarEntradaAlumno(${a.id})" class="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors">Registrar entrada</button>` :
          a.estado === 'entrada' ?
          `<button onclick="registrarSalidaAlumno(${a.id})" class="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors">Registrar salida</button>` :
          `<span class="text-gray-400 text-xs">Recogido</span>`
        }
      </td>
    </tr>
  `).join('');
}

function registrarEntradaAlumno(id) {
  const a = state.alumnos.find(x => x.id === id);
  a.estado = 'entrada';
  a.hora_entrada = horaActual();
  a.hora_salida = null;
  document.getElementById('tabla-alumnos').innerHTML = alumnosFilas(state.alumnos);
  showToast(`Entrada de ${a.nombre} registrada a las ${a.hora_entrada}`);
}

function registrarSalidaAlumno(id) {
  const a = state.alumnos.find(x => x.id === id);
  a.estado = 'salida';
  a.hora_salida = horaActual();
  document.getElementById('tabla-alumnos').innerHTML = alumnosFilas(state.alumnos);
  showToast(`Salida de ${a.nombre} registrada a las ${a.hora_salida}`);
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
  document.getElementById('tabla-alumnos').innerHTML = alumnosFilas(lista);
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
  const nuevo = {
    id: state.alumnos.length + 1,
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
  showToast(`${nombre} añadido correctamente`);
}
