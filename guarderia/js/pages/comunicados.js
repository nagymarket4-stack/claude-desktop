// ─── Comunicados y encuestas ─────────────────────────────────────────────────
// Acceso crear/borrar: admin / superadmin. Las familias los leen y votan encuestas.

function fmtFechaCorta(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const ms = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
  return `${d} ${ms[+m - 1]} ${y}`;
}
function gruposDisponibles() {
  return ['Todos', ...new Set(state.alumnos.map(a => a.grupo))];
}

function renderComunicados() {
  const el = document.getElementById('page-comunicados');
  if (!el) return;
  const lista = (state.comunicados || []).slice().sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));

  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-2xl mx-auto">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">📣 Comunicados</h2>
        <p class="text-gray-500 text-sm mt-1">Avisos y encuestas para las familias</p>
      </div>
      <button onclick="abrirNuevoComunicado()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">+ Nuevo</button>
    </div>

    ${lista.length === 0 ? `<div class="text-center py-16 text-gray-400"><p class="text-5xl mb-4">📣</p><p>No hay comunicados todavía.</p></div>` :
      lista.map(c => tarjetaComunicado(c, false)).join('')}
  </div>

  <div id="modal-comunicado" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" id="modal-comunicado-body"></div>
  </div>`;
}

function tarjetaComunicado(c, esFamilia) {
  const totalVotos = c.encuesta ? c.encuesta.opciones.reduce((s, o) => s + o.votos.length, 0) : 0;
  const miVoto = (esFamilia && c.encuesta)
    ? c.encuesta.opciones.findIndex(o => o.votos.includes(sesionActual.id))
    : -1;
  return `
    <div class="card p-5 mb-4">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div>
          <h3 class="font-bold text-gray-800">${esc(c.titulo)}</h3>
          <p class="text-xs text-gray-400 mt-0.5">${fmtFechaCorta(c.fecha)} · ${esc(c.autor || 'Centro')}${c.grupo && c.grupo !== 'Todos' ? ' · ' + esc(c.grupo) : ''}</p>
        </div>
        ${!esFamilia ? `<button onclick="borrarComunicado(${c.id})" class="text-gray-300 hover:text-red-500 text-sm" title="Eliminar">🗑️</button>` : ''}
      </div>
      <p class="text-sm text-gray-600 leading-relaxed whitespace-pre-line">${esc(c.texto)}</p>
      ${c.encuesta ? `
        <div class="mt-4 pt-4 border-t border-gray-100">
          <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Encuesta${totalVotos ? ` · ${totalVotos} voto${totalVotos === 1 ? '' : 's'}` : ''}</p>
          <div class="flex flex-col gap-2">
            ${c.encuesta.opciones.map((o, i) => {
              const pct = totalVotos ? Math.round(o.votos.length / totalVotos * 100) : 0;
              const elegida = i === miVoto;
              return `
              <button ${esFamilia ? `onclick="votarEncuesta(${c.id},${i})"` : 'disabled'}
                class="relative text-left rounded-xl border px-3 py-2 text-sm overflow-hidden ${elegida ? 'border-green-500' : 'border-gray-200'} ${esFamilia ? 'hover:border-green-400 cursor-pointer' : 'cursor-default'}">
                <div class="absolute inset-0 bg-green-50" style="width:${pct}%"></div>
                <div class="relative flex items-center justify-between">
                  <span class="${elegida ? 'font-semibold text-green-700' : 'text-gray-700'}">${elegida ? '✓ ' : ''}${esc(o.texto)}</span>
                  <span class="text-xs text-gray-400">${pct}%</span>
                </div>
              </button>`;
            }).join('')}
          </div>
        </div>` : ''}
    </div>`;
}

let _comOpciones = [];
function abrirNuevoComunicado() {
  _comOpciones = [];
  const body = document.getElementById('modal-comunicado-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-gray-800 text-lg">Nuevo comunicado</h3>
      <button onclick="cerrarModal('modal-comunicado')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Título</label>
    <input id="com-titulo" maxlength="80" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3">
    <label class="text-sm font-semibold text-gray-700 block mb-1">Mensaje</label>
    <textarea id="com-texto" rows="4" maxlength="800" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 resize-none mb-3"></textarea>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Dirigido a</label>
    <select id="com-grupo" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3 bg-white">
      ${gruposDisponibles().map(g => `<option value="${esc(g)}">${g === 'Todos' ? 'Todas las familias' : 'Grupo ' + esc(g)}</option>`).join('')}
    </select>
    <div class="flex items-center justify-between mb-2">
      <label class="text-sm font-semibold text-gray-700">Encuesta (opcional)</label>
      <button type="button" onclick="addOpcionEncuesta()" class="text-xs text-green-600 font-medium">+ Añadir opción</button>
    </div>
    <div id="com-opciones" class="flex flex-col gap-2 mb-3"></div>
    <div id="com-error" class="hidden text-red-500 text-sm mb-2"></div>
    <div class="flex gap-3 mt-2">
      <button onclick="cerrarModal('modal-comunicado')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarComunicado()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Publicar</button>
    </div>`;
  document.getElementById('modal-comunicado').classList.remove('hidden');
}

function addOpcionEncuesta() {
  _comOpciones.push('');
  pintarOpcionesEncuesta();
}
function pintarOpcionesEncuesta() {
  const cont = document.getElementById('com-opciones');
  cont.innerHTML = _comOpciones.map((v, i) => `
    <div class="flex gap-2">
      <input value="${esc(v)}" oninput="_comOpciones[${i}]=this.value" placeholder="Opción ${i + 1}"
        class="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-green-400">
      <button type="button" onclick="_comOpciones.splice(${i},1);pintarOpcionesEncuesta()" class="px-3 text-gray-300 hover:text-red-500">✕</button>
    </div>`).join('');
}

function guardarComunicado() {
  const titulo = document.getElementById('com-titulo').value.trim().slice(0, 80);
  const texto  = document.getElementById('com-texto').value.trim().slice(0, 800);
  const grupo  = document.getElementById('com-grupo').value;
  const errEl  = document.getElementById('com-error');
  if (!titulo || !texto) { errEl.textContent = 'Pon un título y un mensaje.'; errEl.classList.remove('hidden'); return; }

  const opciones = _comOpciones.map(o => o.trim()).filter(Boolean);
  let encuesta = null;
  if (opciones.length >= 2) encuesta = { opciones: opciones.map(t => ({ texto: t.slice(0, 60), votos: [] })) };
  else if (opciones.length === 1) { errEl.textContent = 'Una encuesta necesita al menos 2 opciones.'; errEl.classList.remove('hidden'); return; }

  state.comunicados = state.comunicados || [];
  const id = Math.max(0, ...state.comunicados.map(c => c.id)) + 1;
  state.comunicados.push({
    id, titulo, texto, grupo, autor: sesionActual?.nombre || 'Dirección',
    fecha: new Date().toISOString().slice(0, 10), encuesta,
  });
  guardarDato('comunicados');
  cerrarModal('modal-comunicado');
  renderComunicados();
  showToast('Comunicado publicado');
}

function borrarComunicado(id) {
  state.comunicados = (state.comunicados || []).filter(c => c.id !== id);
  guardarDato('comunicados');
  renderComunicados();
  showToast('Comunicado eliminado');
}

// ── Familias: leen comunicados de su grupo y votan ────────────────────────────
function comunicadosParaFamilia() {
  const grupos = new Set(getHijosPadre().map(h => h.grupo));
  return (state.comunicados || [])
    .filter(c => !c.grupo || c.grupo === 'Todos' || grupos.has(c.grupo))
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
}

function renderPadreComunicados() {
  const el = document.getElementById('page-padre-comunicados');
  if (!el) return;
  const lista = comunicadosParaFamilia();
  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">📣 Comunicados</h2>
      <p class="text-gray-400 text-sm mt-1">Avisos del centro</p>
    </div>
    ${lista.length === 0 ? `<div class="text-center py-16 text-gray-400"><p class="text-5xl mb-4">📣</p><p>No hay comunicados.</p></div>` :
      lista.map(c => tarjetaComunicado(c, true)).join('')}
  </div>`;
}

function votarEncuesta(comId, opcionIdx) {
  const c = (state.comunicados || []).find(x => x.id === comId);
  if (!c || !c.encuesta) return;
  const uid = sesionActual.id;
  c.encuesta.opciones.forEach(o => { o.votos = o.votos.filter(v => v !== uid); });
  c.encuesta.opciones[opcionIdx].votos.push(uid);
  guardarDato('comunicados');
  renderPadreComunicados();
  showToast('¡Voto registrado!');
}
