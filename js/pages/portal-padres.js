// ─── Portal Padres ────────────────────────────────────────────────────────────
// Solo muestra datos del hijo asociado al usuario padre

function getHijosPadre() {
  return state.alumnos.filter(a => sesionActual.alumnoIds.includes(a.id));
}

// ── Inicio: estado del hijo hoy ───────────────────────────────────────────────
function renderPadreInicio() {
  const hijos = getHijosPadre();
  const el = document.getElementById('page-padre-inicio');
  if (!el) return;

  el.innerHTML = `
<div class="p-4 md:p-8 max-w-xl mx-auto">
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-800">¡Hola, ${esc(sesionActual.nombre.split(' ')[0])}! 👋</h2>
    <p class="text-gray-400 text-sm mt-1">${TODAY}</p>
  </div>

  ${hijos.map(hijo => {
    const b = state.bienestar[hijo.id] || {};
    const ultimoMsg = (state.mensajes[hijo.id]||[]).slice(-1)[0];
    return `
  <div class="card mb-4">
    <div class="flex items-center gap-4 p-5 border-b border-gray-100">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold ${hijo.color}">${esc(hijo.avatar)}</div>
      <div class="flex-1">
        <h3 class="font-bold text-lg text-gray-800">${esc(hijo.nombre)}</h3>
        <p class="text-sm text-gray-400">${esc(hijo.grupo)} · ${hijo.edad} años</p>
      </div>
      ${badge(hijo.estado)}
    </div>

    <div class="grid grid-cols-3 divide-x divide-gray-100 text-center p-2">
      <div class="px-3 py-3">
        <p class="text-xs text-gray-400 mb-1">Entrada</p>
        <p class="font-semibold text-gray-700">${hijo.hora_entrada || '—'}</p>
      </div>
      <div class="px-3 py-3">
        <p class="text-xs text-gray-400 mb-1">Salida</p>
        <p class="font-semibold text-gray-700">${hijo.hora_salida || '—'}</p>
      </div>
      <div class="px-3 py-3">
        <p class="text-xs text-gray-400 mb-1">Estado ánimo</p>
        <p class="text-2xl">${b.humor || '—'}</p>
      </div>
    </div>

    ${(() => {
      const comidas = b.comidas || {};
      const TIPOS = [
        { key:'desayuno', label:'Desayuno', icon:'🥐' },
        { key:'snack',    label:'Snack',    icon:'🍎' },
        { key:'comida',   label:'Comida',   icon:'🍲' },
        { key:'merienda', label:'Merienda', icon:'🍪' },
      ];
      const CANT = { nada:'Nada', poco:'Poco', normal:'Normal', todo:'Todo' };
      const cantColor = c => c==='todo'?'text-green-600':c==='nada'?'text-red-500':'text-yellow-600';
      const comidasRegistradas = TIPOS.filter(t => comidas[t.key]?.cantidad);
      if (b.sueno == null && comidasRegistradas.length === 0) return '';
      return `
    <div class="px-5 pb-4 pt-2 border-t border-gray-50">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Bienestar de hoy</p>
      <div class="flex flex-col gap-3">
        ${b.sueno != null ? `
        <div class="flex items-center gap-3">
          <span class="text-base">😴</span>
          <div class="flex-1">
            <div class="flex justify-between text-xs text-gray-500 mb-1"><span>Horas de sueño</span><span>${b.sueno}h</span></div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-full bg-blue-400 rounded-full" style="width:${Math.round(b.sueno/14*100)}%"></div>
            </div>
          </div>
        </div>` : ''}
        ${comidasRegistradas.length ? `
        <div>
          <div class="flex items-center gap-2 text-xs text-gray-500 mb-2"><span class="text-base">🍽️</span> Comidas</div>
          <div class="flex flex-col gap-1.5">
            ${comidasRegistradas.map(t => {
              const c = comidas[t.key];
              return `
              <div class="flex items-center justify-between text-sm bg-gray-50 rounded-lg px-3 py-1.5">
                <span class="text-gray-700">${t.icon} ${esc(t.label)}</span>
                <span class="flex items-center gap-2">
                  ${c.hora ? `<span class="text-xs text-gray-400">${esc(c.hora)}</span>` : ''}
                  <span class="text-xs font-medium ${cantColor(c.cantidad)}">${CANT[c.cantidad]||esc(c.cantidad)}</span>
                </span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}
      </div>
    </div>`;
    })()}

    ${ultimoMsg ? `
    <div class="mx-5 mb-5 p-3 bg-green-50 rounded-xl border border-green-100">
      <p class="text-xs text-green-600 font-medium mb-1">Último mensaje del centro</p>
      <p class="text-sm text-gray-700">${esc(ultimoMsg.texto)}</p>
      <p class="text-xs text-gray-400 mt-1">${esc(ultimoMsg.hora)}</p>
    </div>` : ''}

    <div class="px-5 pb-5">
      <button onclick="navigate('padre-mensajes')" class="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
        💬 Enviar mensaje al centro
      </button>
    </div>
  </div>`;
  }).join('')}

  ${hijos.length === 0 ? `
  <div class="text-center py-16 text-gray-400">
    <p class="text-5xl mb-4">👶</p>
    <p class="font-medium">No hay ningún alumno asociado a tu cuenta.</p>
    <p class="text-sm mt-1">Contacta con el centro para verificar tu acceso.</p>
  </div>` : ''}
</div>`;
}

// ── Actividades del hijo ──────────────────────────────────────────────────────
function renderPadreActividades() {
  const hijos   = getHijosPadre();
  const grupos  = [...new Set(hijos.map(h => h.grupo)), 'Todos'];
  const acts    = state.actividades.filter(a => a.publicada && grupos.includes(a.grupo));
  const el      = document.getElementById('page-padre-actividades');
  if (!el) return;

  const nomHijo = hijos.length === 1 ? hijos[0].nombre.split(' ')[0] : 'tus hijos';

  el.innerHTML = `
<div class="p-4 md:p-8 max-w-xl mx-auto">
  <div class="mb-6">
    <h2 class="text-2xl font-bold text-gray-800">Actividades de ${esc(nomHijo)}</h2>
    <p class="text-gray-400 text-sm mt-1">Publicadas hoy por el equipo educativo</p>
  </div>

  ${acts.length === 0 ? `
  <div class="text-center py-16 text-gray-400">
    <p class="text-5xl mb-4">🎨</p>
    <p>Todavía no hay actividades publicadas hoy.</p>
  </div>` : acts.map(a => `
  <div class="card p-5 mb-4">
    <div class="flex items-start justify-between mb-3">
      <div>
        <h3 class="font-bold text-gray-800">${esc(a.titulo)}</h3>
        <p class="text-xs text-gray-400 mt-0.5">${esc(a.fecha)} · Grupo ${esc(a.grupo)}</p>
      </div>
      <div class="flex gap-1">${a.fotos.map(f=>`<span class="text-2xl">${f}</span>`).join('')}</div>
    </div>
    <p class="text-sm text-gray-600 leading-relaxed mb-3">${esc(a.descripcion)}</p>
    <div class="flex flex-wrap gap-1">${a.etiquetas.map(t=>tagBadge(t)).join('')}</div>
  </div>`).join('')}
</div>`;
}

// ── Chat padre-centro ─────────────────────────────────────────────────────────
function renderPadreMensajes() {
  const hijos = getHijosPadre();
  const el    = document.getElementById('page-padre-mensajes');
  if (!el) return;

  if (hijos.length === 0) {
    el.innerHTML = `<div class="p-8 text-center text-gray-400"><p class="text-5xl mb-4">💬</p><p>Sin hijos asociados.</p></div>`;
    return;
  }

  // Si hay más de un hijo, elegir activo
  if (!state.chatAlumnoId || !sesionActual.alumnoIds.includes(state.chatAlumnoId)) {
    state.chatAlumnoId = hijos[0].id;
  }

  const hijo  = state.alumnos.find(a => a.id === state.chatAlumnoId);
  const msgs  = state.mensajes[state.chatAlumnoId] || [];

  // Marcar como leídos los del centro
  msgs.forEach(m => { if (m.de === 'centro') m.leido = true; });

  el.innerHTML = `
<div class="flex flex-col h-full">
  ${hijos.length > 1 ? `
  <div class="flex gap-2 p-3 bg-gray-50 border-b border-gray-100 overflow-x-auto">
    ${hijos.map(h=>`
    <button onclick="state.chatAlumnoId=${h.id};renderPadreMensajes()" class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${state.chatAlumnoId===h.id?'bg-green-600 text-white':'bg-white text-gray-600 border border-gray-200'}">
      <span class="${h.color} w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">${esc(h.avatar)}</span>
      ${esc(h.nombre.split(' ')[0])}
    </button>`).join('')}
  </div>` : ''}

  <div class="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100">
    <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${hijo.color}">${esc(hijo.avatar)}</div>
    <div>
      <p class="font-semibold text-sm text-gray-800">${esc(hijo.nombre)}</p>
      <p class="text-xs text-gray-400">Chat con el centro educativo</p>
    </div>
  </div>

  <div class="flex-1 overflow-y-auto p-4 space-y-3" id="padre-chat-msgs">
    ${msgs.length === 0 ? `<p class="text-center text-gray-400 py-8 text-sm">Sin mensajes todavía. ¡Escribe al centro!</p>` :
      msgs.map(m => {
        const esPadre = m.de !== 'centro';
        return `
        <div class="flex ${esPadre ? 'justify-end' : 'justify-start'}">
          <div class="max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${esPadre ? 'bg-green-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm border border-gray-100'}">
            ${!esPadre ? `<p class="text-xs font-medium text-green-600 mb-1">Centro Sol & Luna</p>` : ''}
            <p>${esc(m.texto)}</p>
            <p class="text-xs mt-1 ${esPadre?'text-green-200':'text-gray-400'}">${esc(m.hora)}</p>
          </div>
        </div>`;
      }).join('')}
  </div>

  <div class="p-4 bg-white border-t border-gray-100 safe-bottom">
    <div class="flex gap-2">
      <input id="padre-msg-input" type="text" placeholder="Escribe un mensaje…"
        class="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
        onkeydown="if(event.key==='Enter')enviarMensajePadre()">
      <button onclick="enviarMensajePadre()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium text-sm hover:bg-green-700 transition-colors">Enviar</button>
    </div>
  </div>
</div>`;

  // Scroll al final
  const chatDiv = document.getElementById('padre-chat-msgs');
  if (chatDiv) chatDiv.scrollTop = chatDiv.scrollHeight;
  actualizarBadgeMensajes();
}

function enviarMensajePadre() {
  const input = document.getElementById('padre-msg-input');
  if (!input) return;
  const texto = input.value.trim();
  if (!texto) return;
  sincronizarDesdeStorage(); // traer mensajes recientes del centro antes de añadir
  const msgs = state.mensajes[state.chatAlumnoId];
  if (!msgs) return;
  msgs.push({
    id: Date.now(),
    de: 'f1a', // identificador genérico de familia
    texto,
    hora: horaActual(),
    leido: false,
  });
  persistir(); // propagar a otras pestañas
  input.value = '';
  renderPadreMensajes();
}
