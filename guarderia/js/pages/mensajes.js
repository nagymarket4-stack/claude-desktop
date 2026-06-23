function renderMensajes() {
  const totalNoLeidos = Object.entries(state.mensajes).reduce((acc, [aid, msgs]) => {
    return acc + msgs.filter(m => !m.leido && m.de !== 'centro').length;
  }, 0);

  const chatAbierto = !!state._chatMobileOpen;
  document.getElementById('page-mensajes').innerHTML = `
    <div class="flex h-full">

      <!-- Panel izquierdo: lista de alumnos -->
      <div class="${chatAbierto ? 'hidden md:flex' : 'flex'} w-full md:w-72 border-r border-gray-100 flex-col flex-shrink-0 bg-white">
        <div class="p-5 border-b border-gray-100">
          <h2 class="font-bold text-gray-800 text-lg">Mensajes</h2>
          ${totalNoLeidos > 0
            ? `<p class="text-xs text-orange-500 mt-0.5 font-medium">${totalNoLeidos} mensajes sin leer</p>`
            : `<p class="text-xs text-gray-400 mt-0.5">Todo al día ✓</p>`
          }
        </div>
        <div class="flex-1 overflow-y-auto">
          ${state.alumnos.map(a => {
            const msgs = state.mensajes[a.id] || [];
            const ultimo = msgs[msgs.length - 1];
            const noLeidos = msgs.filter(m => !m.leido && m.de !== 'centro').length;
            const familiaA = (state.familias[a.id] || [])[0];
            return `
              <button onclick="abrirChat(${a.id})" id="chat-item-${a.id}"
                class="chat-item w-full flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors border-b border-gray-50 text-left ${state.chatAlumnoId === a.id ? 'bg-green-50 border-l-4 border-l-green-500' : ''}">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${esc(a.color)}">${esc(a.avatar)}</div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between">
                    <p class="font-semibold text-gray-800 text-sm truncate">${esc(a.nombre)}</p>
                    ${noLeidos > 0 ? `<span class="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 ml-1">${noLeidos}</span>` : ''}
                  </div>
                  <p class="text-xs text-gray-400 truncate mt-0.5">
                    ${ultimo ? esc(ultimo.texto.slice(0,40)) + (ultimo.texto.length > 40 ? '…' : '') : 'Sin mensajes aún'}
                  </p>
                  ${familiaA ? `<p class="text-xs text-green-600 mt-0.5">${esc(familiaA.nombre)}${(state.familias[a.id]||[]).length > 1 ? ' +1' : ''}</p>` : ''}
                </div>
              </button>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Panel derecho: chat -->
      <div class="${chatAbierto ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0">
        ${state.chatAlumnoId ? panelChat(state.chatAlumnoId) : `
          <div class="flex-1 flex items-center justify-center text-gray-300 flex-col gap-3">
            <span class="text-5xl">💬</span>
            <p class="text-sm">Selecciona una conversación</p>
          </div>
        `}
      </div>

    </div>

    <!-- Modal añadir familiar -->
    <div id="modal-familiar" class="hidden fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h3 class="text-lg font-bold text-gray-800 mb-5">Añadir familiar</h3>
        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Nombre completo</label>
            <input id="fam-nombre" type="text" placeholder="Nombre del familiar" maxlength="80"
              class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-700 block mb-1">Relación</label>
            <select id="fam-rol" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400">
              <option>Mamá</option><option>Papá</option><option>Abuelo/a</option><option>Tutor legal</option>
            </select>
          </div>
        </div>
        <div id="fam-error" class="hidden mt-3 text-red-600 text-xs"></div>
        <div class="flex gap-3 mt-6">
          <button onclick="cerrarModal('modal-familiar')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button onclick="guardarFamiliar()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Añadir</button>
        </div>
      </div>
    </div>
  `;
}

function panelChat(alumnoId) {
  const a        = state.alumnos.find(x => x.id === alumnoId);
  const msgs     = state.mensajes[alumnoId] || [];
  const familias = state.familias[alumnoId] || [];

  // Marcar como leídos
  msgs.forEach(m => { if (m.de !== 'centro') m.leido = true; });

  return `
    <!-- Header chat -->
    <div class="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-gray-100 bg-white">
      <div class="flex items-center gap-2 md:gap-3 min-w-0">
        <button onclick="volverListaChat()" class="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 flex-shrink-0" aria-label="Volver">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${esc(a.color)}">${esc(a.avatar)}</div>
        <div>
          <p class="font-semibold text-gray-800">${esc(a.nombre)}</p>
          <div class="flex items-center gap-2">
            ${familias.map(f => `
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">${esc(f.rol)}: ${esc(f.nombre)}</span>
            `).join('')}
            ${familias.length < 2
              ? `<button onclick="abrirModalFamiliar(${alumnoId})" class="text-xs text-green-600 hover:underline">+ Añadir familiar</button>`
              : ''
            }
          </div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${familias.length < 2
          ? `<button onclick="abrirModalFamiliar(${alumnoId})" class="bg-green-50 text-green-700 text-xs px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-medium">+ Familiar</button>`
          : `<button onclick="abrirModalFamiliar(${alumnoId})" class="text-gray-300 text-xs px-3 py-1.5 rounded-lg cursor-not-allowed" title="Máximo 2 familiares" disabled>2/2</button>`
        }
      </div>
    </div>

    <!-- Mensajes -->
    <div class="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50" id="mensajes-scroll">
      ${msgs.length === 0
        ? `<div class="flex items-center justify-center h-full">
             <div class="text-center text-gray-300">
               <p class="text-4xl mb-2">💬</p>
               <p class="text-sm">Sé el primero en escribir</p>
             </div>
           </div>`
        : msgs.map(m => burbujaMsg(m, familias)).join('')
      }
    </div>

    <!-- Input envío -->
    <div class="p-4 bg-white border-t border-gray-100">
      <!-- Selector de quién escribe -->
      <div class="flex items-center gap-2 mb-3">
        <span class="text-xs text-gray-400">Enviar como:</span>
        <button onclick="setRemitente('centro',this)" data-rem="centro"
          class="rem-btn text-xs px-3 py-1.5 rounded-full border transition-colors bg-green-600 text-white border-green-600">
          🏫 Centro
        </button>
        ${familias.map(f => `
          <button onclick="setRemitente('${esc(f.id)}',this)" data-rem="${esc(f.id)}"
            class="rem-btn text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-green-400 transition-colors">
            ${esc(f.rol)}: ${esc(f.nombre.split(' ')[0])}
          </button>
        `).join('')}
      </div>
      <div class="flex gap-3">
        <input id="msg-input" type="text" placeholder="Escribe un mensaje…" maxlength="500"
          onkeydown="if(event.key==='Enter' && !event.shiftKey){ event.preventDefault(); enviarMensaje(${alumnoId}); }"
          class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400" />
        <button onclick="enviarMensaje(${alumnoId})"
          class="bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
          Enviar
        </button>
      </div>
    </div>
  `;
}

function burbujaMsg(m, familias) {
  const esCentro = m.de === 'centro';
  const familiar = familias.find(f => f.id === m.de);
  const nombre   = esCentro ? '🏫 Centro' : (familiar ? `${familiar.rol}: ${familiar.nombre.split(' ')[0]}` : 'Familia');
  const colorBg  = esCentro ? 'bg-green-600 text-white' : 'bg-white text-gray-800 border border-gray-100 shadow-sm';
  const align    = esCentro ? 'items-end' : 'items-start';

  return `
    <div class="flex flex-col ${align}">
      <p class="text-xs text-gray-400 mb-1 px-1">${esc(nombre)} · ${esc(m.hora)}</p>
      <div class="${colorBg} rounded-2xl px-4 py-2.5 max-w-xs lg:max-w-md">
        <p class="text-sm leading-relaxed">${esc(m.texto)}</p>
      </div>
    </div>
  `;
}

let _remitenteActual = 'centro';

function setRemitente(id, btn) {
  _remitenteActual = id;
  document.querySelectorAll('.rem-btn').forEach(b => {
    b.classList.remove('bg-green-600','text-white','border-green-600');
    b.classList.add('border-gray-200','text-gray-600');
  });
  btn.classList.add('bg-green-600','text-white','border-green-600');
  btn.classList.remove('border-gray-200','text-gray-600');
}

function abrirChat(alumnoId) {
  state.chatAlumnoId = alumnoId;
  state._chatMobileOpen = true; // en móvil muestra el chat a pantalla completa
  _remitenteActual = 'centro';
  renderMensajes();
  // Scroll al final
  setTimeout(() => {
    const scroll = document.getElementById('mensajes-scroll');
    if (scroll) scroll.scrollTop = scroll.scrollHeight;
  }, 50);
}

function volverListaChat() {
  state._chatMobileOpen = false;
  renderMensajes();
}

function enviarMensaje(alumnoId) {
  const input = document.getElementById('msg-input');
  const texto = input.value.trim();
  if (!texto) return;

  const hora = horaActual();
  state.mensajes[alumnoId].push({
    id:    (state.mensajes[alumnoId].length + 1),
    de:    _remitenteActual,
    texto,
    hora,
    leido: true,
  });

  input.value = '';
  // Re-render solo el área de mensajes + scroll
  const familias = state.familias[alumnoId] || [];
  const msgs     = state.mensajes[alumnoId];
  const scroll   = document.getElementById('mensajes-scroll');
  if (scroll) {
    scroll.innerHTML = msgs.map(m => burbujaMsg(m, familias)).join('');
    scroll.scrollTop = scroll.scrollHeight;
  }
  // Actualizar lista lateral (último mensaje)
  renderMensajes();
  setTimeout(() => {
    const s = document.getElementById('mensajes-scroll');
    if (s) s.scrollTop = s.scrollHeight;
  }, 30);
}

let _familiarAlumnoId = null;
function abrirModalFamiliar(alumnoId) {
  _familiarAlumnoId = alumnoId;
  const fams = state.familias[alumnoId] || [];
  if (fams.length >= 2) return;
  document.getElementById('fam-nombre').value = '';
  document.getElementById('fam-error').classList.add('hidden');
  document.getElementById('modal-familiar').classList.remove('hidden');
}

function guardarFamiliar() {
  const nombre = document.getElementById('fam-nombre').value.trim();
  const errEl  = document.getElementById('fam-error');
  if (!SOLO_TEXTO.test(nombre)) {
    errEl.textContent = 'Nombre inválido (solo letras, 2-80 caracteres).';
    errEl.classList.remove('hidden'); return;
  }
  errEl.classList.add('hidden');
  const rol     = document.getElementById('fam-rol').value;
  const colores = ['av-green','av-blue','av-pink','av-orange','av-purple'];
  const id      = 'f' + _familiarAlumnoId + (state.familias[_familiarAlumnoId].length + 1);
  state.familias[_familiarAlumnoId].push({
    id, nombre, rol,
    avatar: nombre[0].toUpperCase(),
    color:  colores[Math.floor(Math.random() * colores.length)],
  });
  cerrarModal('modal-familiar');
  abrirChat(_familiarAlumnoId);
  showToast(`${nombre} añadido como ${rol}`);
}
