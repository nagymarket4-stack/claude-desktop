function renderActividades() {
  document.getElementById('page-actividades').innerHTML = `
    <div class="p-4 md:p-8">
      <div class="flex items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-gray-800">Actividades del Día</h2>
          <p class="text-gray-500 text-sm mt-1">${esc(state.actividades.length)} actividades registradas</p>
        </div>
        <button onclick="abrirModalActividad()" class="bg-green-600 text-white px-4 md:px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 flex-shrink-0">
          <span>+</span> <span class="hidden sm:inline">Nueva actividad</span>
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5" id="lista-actividades">
        ${actividadesCards()}
      </div>
    </div>

    <!-- Modal nueva actividad -->
    <div id="modal-actividad" class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-screen overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-800 mb-6">Nueva Actividad</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Título</label>
            <input id="act-titulo" type="text" placeholder="Ej: Taller de Pintura" maxlength="100"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Descripción</label>
            <textarea id="act-desc" rows="3" placeholder="Descripción de la actividad..." maxlength="500"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 resize-none"></textarea>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Grupo</label>
              <select id="act-grupo" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400">
                <option>Todos</option><option>Ositos</option><option>Conejitos</option><option>Estrellitas</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 block mb-1">Hora</label>
              <input id="act-hora" type="time" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
            </div>
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Etiquetas (separadas por coma)</label>
            <input id="act-tags" type="text" placeholder="Arte, Creatividad, Motricidad" maxlength="120"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-2">Emojis de fotos</label>
            <div class="flex flex-wrap gap-2" id="emoji-selector">
              ${['🎨','⚽','📖','🎵','🌱','🏃','🤸','🧩','🎪','🌈','🦁','🐭'].map(e =>
                `<button type="button" onclick="toggleEmoji('${e}',this)" class="emoji-opt text-2xl p-2 rounded-xl border border-gray-200 hover:border-green-400 hover:bg-green-50 transition-colors">${e}</button>`
              ).join('')}
            </div>
          </div>
        </div>
        <div id="act-error" class="hidden mt-3 text-red-600 text-xs"></div>
        <div class="flex gap-3 mt-6">
          <button onclick="cerrarModal('modal-actividad')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button onclick="guardarActividad()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Publicar</button>
        </div>
      </div>
    </div>
  `;
}

function actividadesCards() {
  return state.actividades.map(a => `
    <div class="card p-6">
      <div class="flex items-start justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-3xl">${esc(a.fotos[0] || '📋')}</span>
          <div>
            <h4 class="font-semibold text-gray-800">${esc(a.titulo)}</h4>
            <p class="text-xs text-gray-400">${esc(a.grupo)} · ${esc(a.fecha)}</p>
          </div>
        </div>
        <span class="text-xs ${a.publicada ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'} tag">${a.publicada ? '✓ Publicada' : 'Borrador'}</span>
      </div>
      <p class="text-sm text-gray-600 mb-4 leading-relaxed">${esc(a.descripcion)}</p>
      <div class="flex gap-2 mb-4">
        ${a.fotos.map(f => `<span class="text-2xl bg-gray-50 w-10 h-10 flex items-center justify-center rounded-xl">${esc(f)}</span>`).join('')}
      </div>
      <div class="flex flex-wrap gap-1.5">
        ${a.etiquetas.map(t => tagBadge(t)).join('')}
      </div>
    </div>
  `).join('');
}

let emojisSeleccionados = [];
// Lista blanca de emojis permitidos
const EMOJIS_PERMITIDOS = new Set(['🎨','⚽','📖','🎵','🌱','🏃','🤸','🧩','🎪','🌈','🦁','🐭']);

function toggleEmoji(e, btn) {
  if (!EMOJIS_PERMITIDOS.has(e)) return; // rechazar cualquier emoji no autorizado
  const idx = emojisSeleccionados.indexOf(e);
  if (idx === -1) {
    if (emojisSeleccionados.length >= 4) return;
    emojisSeleccionados.push(e);
    btn.classList.add('border-green-500','bg-green-50');
  } else {
    emojisSeleccionados.splice(idx, 1);
    btn.classList.remove('border-green-500','bg-green-50');
  }
}

function abrirModalActividad() {
  emojisSeleccionados = [];
  document.getElementById('modal-actividad').classList.remove('hidden');
  const ahora = new Date();
  document.getElementById('act-hora').value = `${String(ahora.getHours()).padStart(2,'0')}:${String(ahora.getMinutes()).padStart(2,'0')}`;
}

const GRUPOS_VALIDOS = new Set(['Todos','Ositos','Conejitos','Estrellitas']);

function guardarActividad() {
  const titulo = document.getElementById('act-titulo').value.trim();
  const desc   = document.getElementById('act-desc').value.trim();
  const grupo  = document.getElementById('act-grupo').value;
  const hora   = document.getElementById('act-hora').value;
  const errEl  = document.getElementById('act-error');

  if (!titulo || titulo.length < 3) {
    errEl.textContent = 'El título es obligatorio (mínimo 3 caracteres).';
    errEl.classList.remove('hidden'); return;
  }
  if (!GRUPOS_VALIDOS.has(grupo)) {
    errEl.textContent = 'Grupo no válido.';
    errEl.classList.remove('hidden'); return;
  }
  // Etiquetas: solo texto sin HTML
  const etiquetas = document.getElementById('act-tags').value
    .split(',')
    .map(t => t.trim())
    .filter(Boolean)
    .filter(t => t.length <= 30)
    .slice(0, 6);

  errEl.classList.add('hidden');

  const nueva = {
    id: state.actividades.length + 1,
    titulo,
    fecha: `Hoy, ${hora}`,
    descripcion: desc,
    etiquetas,
    fotos: emojisSeleccionados.length ? [...emojisSeleccionados] : ['📋'],
    grupo,
    publicada: true,
  };
  state.actividades.unshift(nueva);
  cerrarModal('modal-actividad');
  renderActividades();
  showToast(`"${nueva.titulo}" publicada`);
}
