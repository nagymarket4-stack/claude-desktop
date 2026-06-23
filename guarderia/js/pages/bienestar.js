const HUMOR_OPTS = [
  { key:'😄', label:'Muy feliz'  },
  { key:'😊', label:'Contento'   },
  { key:'😐', label:'Normal'     },
  { key:'😴', label:'Cansado'    },
  { key:'😢', label:'Triste'     },
  { key:'🤒', label:'Malito'     },
];

// Cantidad ingerida en cada comida
const COMIDA_OPTS = [
  { key:'nada',   label:'Nada',   icon:'🚫' },
  { key:'poco',   label:'Poco',   icon:'🍽️' },
  { key:'normal', label:'Normal', icon:'✅'  },
  { key:'todo',   label:'Todo',   icon:'⭐'  },
];

// Los 4 momentos de comida del día
const COMIDAS_TIPOS = [
  { key:'desayuno', label:'Desayuno', icon:'🥐', horaDefecto:'09:00' },
  { key:'snack',    label:'Snack',    icon:'🍎', horaDefecto:'11:00' },
  { key:'comida',   label:'Comida',   icon:'🍲', horaDefecto:'13:00' },
  { key:'merienda', label:'Merienda', icon:'🍪', horaDefecto:'16:30' },
];

function renderBienestar() {
  const conRegistro = Object.values(state.bienestar).filter(b => b.humor !== null).length;

  document.getElementById('page-bienestar').innerHTML = `
    <div class="p-4 md:p-8">
      <div class="flex items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-gray-800">Bienestar Diario</h2>
          <p class="text-gray-500 text-sm mt-1">${esc(conRegistro)} de ${esc(state.alumnos.length)} alumnos registrados hoy</p>
        </div>
        <!-- Barra de progreso -->
        <div class="text-right flex-shrink-0">
          <p class="text-xs text-gray-400 mb-1">Completado</p>
          <div class="w-24 md:w-40 bg-gray-100 rounded-full h-2.5">
            <div class="bg-green-500 h-2.5 rounded-full transition-all" style="width:${Math.round(conRegistro/state.alumnos.length*100)}%"></div>
          </div>
          <p class="text-xs text-green-600 font-semibold mt-1">${Math.round(conRegistro/state.alumnos.length*100)}%</p>
        </div>
      </div>

      <!-- Resumen humor -->
      <div class="grid grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        ${HUMOR_OPTS.map(h => {
          const n = Object.values(state.bienestar).filter(b => b.humor === h.key).length;
          return `
            <div class="card p-4 text-center">
              <span class="text-3xl block mb-1">${h.key}</span>
              <span class="text-2xl font-bold text-gray-800">${n}</span>
              <p class="text-xs text-gray-400 mt-0.5">${esc(h.label)}</p>
            </div>`;
        }).join('')}
      </div>

      <!-- Grid alumnos -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        ${state.alumnos.map(a => tarjetaBienestar(a)).join('')}
      </div>
    </div>

    <!-- Modal editar bienestar -->
    <div id="modal-bienestar" class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="flex items-center gap-3 mb-6">
          <div id="bw-avatar" class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg"></div>
          <div>
            <h3 id="bw-nombre" class="font-bold text-gray-800 text-lg"></h3>
            <p id="bw-grupo"   class="text-sm text-gray-500"></p>
          </div>
        </div>

        <!-- Sueño -->
        <div class="mb-6">
          <label class="text-sm font-semibold text-gray-700 block mb-3">😴 Horas de sueño</label>
          <div class="flex items-center gap-4">
            <input id="bw-sueno" type="range" min="0" max="14" step="0.5" value="9"
              oninput="document.getElementById('bw-sueno-val').textContent = this.value + 'h'"
              class="flex-1 accent-green-500" />
            <span id="bw-sueno-val" class="text-green-700 font-bold w-10 text-right">9h</span>
          </div>
          <div class="flex justify-between text-xs text-gray-300 mt-1 px-0.5">
            <span>0h</span><span>7h</span><span>14h</span>
          </div>
        </div>

        <!-- Comidas (4 momentos) -->
        <div class="mb-6">
          <label class="text-sm font-semibold text-gray-700 block mb-3">🍽️ Comidas del día</label>
          <div class="space-y-3">
            ${COMIDAS_TIPOS.map(t => `
              <div class="border border-gray-100 rounded-xl p-3" data-comida-grupo="${t.key}">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <span class="text-base">${t.icon}</span> ${esc(t.label)}
                  </span>
                  <input type="time" id="bw-hora-${t.key}" value="${t.horaDefecto}"
                    class="text-xs border border-gray-200 rounded-lg px-2 py-1 text-gray-600 outline-none focus:border-green-400" />
                </div>
                <div class="grid grid-cols-4 gap-1.5">
                  ${COMIDA_OPTS.map(c => `
                    <button type="button" onclick="selComida('${t.key}','${c.key}',this)"
                      data-comida-tipo="${t.key}" data-comida-val="${c.key}"
                      class="comida-opt flex flex-col items-center gap-0.5 p-2 rounded-lg border-2 border-gray-100 hover:border-green-300 transition-colors">
                      <span class="text-base">${c.icon}</span>
                      <span class="text-[10px] text-gray-600 leading-tight">${esc(c.label)}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Humor -->
        <div class="mb-6">
          <label class="text-sm font-semibold text-gray-700 block mb-3">💛 ¿Cómo se siente?</label>
          <div class="grid grid-cols-6 gap-2">
            ${HUMOR_OPTS.map(h => `
              <button type="button" onclick="selHumor('${h.key}',this)"
                data-humor="${h.key}" title="${esc(h.label)}"
                class="humor-opt text-2xl p-2 rounded-xl border-2 border-gray-100 hover:border-green-300 transition-all hover:scale-110">
                ${h.key}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="flex gap-3">
          <button onclick="cerrarModal('modal-bienestar')"
            class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
            Cancelar
          </button>
          <button onclick="guardarBienestar()"
            class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">
            Guardar
          </button>
        </div>
      </div>
    </div>
  `;
}

function tarjetaBienestar(a) {
  const bw = state.bienestar[a.id] || {};
  const registrado = bw.humor !== null && bw.humor !== undefined;
  const comidas = bw.comidas || {};
  const nComidas = COMIDAS_TIPOS.filter(t => comidas[t.key]?.cantidad).length;

  return `
    <div class="card p-5">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold ${esc(a.color)}">${esc(a.avatar)}</div>
        <div class="flex-1">
          <p class="font-semibold text-gray-800 text-sm">${esc(a.nombre)}</p>
          <p class="text-xs text-gray-400">${esc(a.grupo)}</p>
        </div>
        ${registrado
          ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ Registrado</span>`
          : `<span class="text-xs bg-gray-100 text-gray-400 px-2 py-1 rounded-full">Pendiente</span>`
        }
      </div>

      ${registrado ? `
        <div class="grid grid-cols-3 gap-2 mb-4">
          <div class="bg-blue-50 rounded-xl p-2.5 text-center">
            <p class="text-xs text-blue-500 mb-0.5">Sueño</p>
            <p class="font-bold text-blue-700 text-sm">${esc(bw.sueno)}h</p>
          </div>
          <div class="bg-orange-50 rounded-xl p-2.5 text-center">
            <p class="text-xs text-orange-500 mb-0.5">Comidas</p>
            <p class="font-bold text-orange-700 text-sm">${nComidas}/4</p>
          </div>
          <div class="bg-yellow-50 rounded-xl p-2.5 text-center">
            <p class="text-xs text-yellow-600 mb-0.5">Humor</p>
            <p class="text-xl">${esc(bw.humor)}</p>
          </div>
        </div>
        ${nComidas > 0 ? `
        <div class="flex flex-wrap gap-1.5 mb-4">
          ${COMIDAS_TIPOS.filter(t => comidas[t.key]?.cantidad).map(t => {
            const c = comidas[t.key];
            const opt = COMIDA_OPTS.find(o => o.key === c.cantidad);
            return `<span class="text-[11px] bg-gray-50 border border-gray-100 rounded-lg px-2 py-1 text-gray-600">
              ${t.icon} ${esc(t.label)} ${c.hora ? `<span class="text-gray-400">${esc(c.hora)}</span>` : ''} ${opt ? opt.icon : ''}
            </span>`;
          }).join('')}
        </div>` : ''}
      ` : `
        <div class="bg-gray-50 rounded-xl p-4 text-center mb-4">
          <p class="text-gray-300 text-3xl mb-1">📋</p>
          <p class="text-xs text-gray-400">Sin registro de hoy</p>
        </div>
      `}

      <button onclick="abrirBienestar(${a.id})"
        class="w-full ${registrado ? 'bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-green-600 text-white hover:bg-green-700'} px-4 py-2 rounded-xl text-xs font-medium transition-colors">
        ${registrado ? '✏️ Editar registro' : '+ Añadir registro'}
      </button>
    </div>
  `;
}

let _bwAlumnoId = null;

function abrirBienestar(alumnoId) {
  _bwAlumnoId = alumnoId;
  const a  = state.alumnos.find(x => x.id === alumnoId);
  const bw = state.bienestar[alumnoId] || {};
  const comidas = bw.comidas || {};

  // Rellenar modal
  const avatarEl = document.getElementById('bw-avatar');
  avatarEl.textContent = a.avatar;
  avatarEl.className = `w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${a.color}`;
  document.getElementById('bw-nombre').textContent = a.nombre;
  document.getElementById('bw-grupo').textContent  = a.grupo;

  const sueno = bw.sueno ?? 9;
  document.getElementById('bw-sueno').value = sueno;
  document.getElementById('bw-sueno-val').textContent = sueno + 'h';

  // Reset comidas
  document.querySelectorAll('.comida-opt').forEach(b => {
    b.classList.remove('border-green-500','bg-green-50');
    b.classList.add('border-gray-100');
  });
  // Restaurar cada comida (cantidad seleccionada + hora)
  COMIDAS_TIPOS.forEach(t => {
    const reg = comidas[t.key];
    const horaInput = document.getElementById('bw-hora-' + t.key);
    if (horaInput) horaInput.value = reg?.hora || t.horaDefecto;
    if (reg?.cantidad) {
      const btn = document.querySelector(`.comida-opt[data-comida-tipo="${t.key}"][data-comida-val="${reg.cantidad}"]`);
      if (btn) { btn.classList.add('border-green-500','bg-green-50'); btn.classList.remove('border-gray-100'); }
    }
  });

  // Reset humor
  document.querySelectorAll('.humor-opt').forEach(b => {
    b.classList.remove('border-green-500','bg-green-50','scale-110');
    b.classList.add('border-gray-100');
  });
  if (bw.humor) {
    const btn = document.querySelector(`.humor-opt[data-humor="${CSS.escape(bw.humor)}"]`);
    if (btn) { btn.classList.add('border-green-500','bg-green-50'); btn.classList.remove('border-gray-100'); }
  }

  document.getElementById('modal-bienestar').classList.remove('hidden');
}

function selComida(tipo, val, btn) {
  // Deseleccionar solo dentro del mismo grupo de comida
  document.querySelectorAll(`.comida-opt[data-comida-tipo="${tipo}"]`).forEach(b => {
    b.classList.remove('border-green-500','bg-green-50');
    b.classList.add('border-gray-100');
  });
  // Toggle: si ya estaba esta, permitir deseleccionar
  if (btn.dataset.sel === '1') {
    btn.dataset.sel = '';
  } else {
    document.querySelectorAll(`.comida-opt[data-comida-tipo="${tipo}"]`).forEach(b => b.dataset.sel = '');
    btn.classList.add('border-green-500','bg-green-50');
    btn.classList.remove('border-gray-100');
    btn.dataset.sel = '1';
  }
}

function selHumor(key, btn) {
  document.querySelectorAll('.humor-opt').forEach(b => {
    b.classList.remove('border-green-500','bg-green-50','scale-110');
    b.classList.add('border-gray-100');
  });
  btn.classList.add('border-green-500','bg-green-50','scale-110');
  btn.classList.remove('border-gray-100');
}

function guardarBienestar() {
  const sueno  = parseFloat(document.getElementById('bw-sueno').value);
  const humor  = document.querySelector('.humor-opt.border-green-500')?.dataset.humor || null;

  // Recoger las 4 comidas
  const comidas = {};
  COMIDAS_TIPOS.forEach(t => {
    const sel = document.querySelector(`.comida-opt[data-comida-tipo="${t.key}"].border-green-500`);
    if (sel) {
      comidas[t.key] = {
        cantidad: sel.dataset.comidaVal,
        hora: document.getElementById('bw-hora-' + t.key).value || t.horaDefecto,
      };
    }
  });

  state.bienestar[_bwAlumnoId] = { sueno, comidas, humor };
  cerrarModal('modal-bienestar');
  renderBienestar();
  const a = state.alumnos.find(x => x.id === _bwAlumnoId);
  showToast(`Bienestar de ${a.nombre} guardado`);
}
