// ─── Página de Configuración (solo superadmin) ────────────────────────────────
const EMOJIS_LOGO = ['🌱','🌸','🦋','⭐','🌈','🏡','🎓','🌻','🐣','🌿','🎠','🌞'];

const ROL_LABELS = { superadmin:'Superadmin', admin:'Administración', profesor:'Profesor/a', padre:'Familia' };
const ROL_COLORS = { superadmin:'bg-purple-100 text-purple-700', admin:'bg-blue-100 text-blue-700', profesor:'bg-green-100 text-green-700', padre:'bg-orange-100 text-orange-700' };

function renderConfiguracion() {
  if (sesionActual?.rol !== 'superadmin') {
    document.getElementById('page-configuracion').innerHTML = `<div class="p-8 text-center text-gray-400"><p class="text-5xl mb-4">🔒</p><p>Acceso restringido.</p></div>`;
    return;
  }

  const el = document.getElementById('page-configuracion');
  el.innerHTML = `
<div class="p-4 md:p-8 max-w-3xl">
  <div class="mb-8">
    <h2 class="text-2xl font-bold text-gray-800">⚙️ Configuración del centro</h2>
    <p class="text-gray-400 text-sm mt-1">Solo visible para el superadministrador</p>
  </div>

  <!-- Datos del centro -->
  <div class="card p-6 mb-6">
    <h3 class="font-bold text-gray-800 text-lg mb-5">🏫 Datos del centro</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Nombre del centro</label>
        <input id="cfg-nombre" type="text" value="${esc(CONFIGURACION.nombre)}" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Subtítulo</label>
        <input id="cfg-subtitulo" type="text" value="${esc(CONFIGURACION.subtitulo)}" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
      </div>
    </div>
    <div class="mb-5">
      <label class="block text-xs font-medium text-gray-500 mb-2">Logo (emoji)</label>
      <div class="flex flex-wrap gap-2">
        ${EMOJIS_LOGO.map(e => `
        <button onclick="seleccionarLogo('${e}')" class="w-10 h-10 rounded-xl text-xl flex items-center justify-center border-2 transition-all logo-opt ${CONFIGURACION.logo===e?'border-green-500 bg-green-50':'border-gray-200 hover:border-gray-300'}">${e}</button>
        `).join('')}
      </div>
    </div>
    <div class="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-5">
      <div class="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl" id="cfg-preview-logo">${esc(CONFIGURACION.logo)}</div>
      <div>
        <p class="font-bold text-gray-800" id="cfg-preview-nombre">${esc(CONFIGURACION.nombre)}</p>
        <p class="text-xs text-gray-400" id="cfg-preview-sub">${esc(CONFIGURACION.subtitulo)}</p>
      </div>
    </div>
    <button onclick="guardarConfigCentro()" class="bg-green-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
      Guardar cambios del centro
    </button>
  </div>

  <!-- Gestión de usuarios -->
  <div class="card p-6">
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-gray-800 text-lg">👥 Usuarios del sistema</h3>
      <button onclick="abrirModalNuevoUsuario()" class="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
        + Nuevo usuario
      </button>
    </div>
    <div id="tabla-usuarios">${renderTablaUsuarios()}</div>
  </div>
</div>

<!-- Modal nuevo/editar usuario -->
<div id="modal-usuario" class="hidden fixed inset-0 bg-black/50 z-[300] flex items-end md:items-center justify-center p-4">
  <div class="bg-white rounded-2xl w-full max-w-md p-6" id="modal-usuario-body"></div>
</div>`;

  // live preview mientras escribe
  document.getElementById('cfg-nombre').addEventListener('input', e => {
    document.getElementById('cfg-preview-nombre').textContent = e.target.value || CONFIGURACION.nombre;
  });
  document.getElementById('cfg-subtitulo').addEventListener('input', e => {
    document.getElementById('cfg-preview-sub').textContent = e.target.value;
  });
}

function seleccionarLogo(emoji) {
  CONFIGURACION.logo = emoji;
  document.querySelectorAll('.logo-opt').forEach(b => {
    b.classList.toggle('border-green-500', b.textContent === emoji);
    b.classList.toggle('bg-green-50', b.textContent === emoji);
    b.classList.toggle('border-gray-200', b.textContent !== emoji);
  });
  document.getElementById('cfg-preview-logo').textContent = emoji;
}

function guardarConfigCentro() {
  CONFIGURACION.nombre    = document.getElementById('cfg-nombre').value.trim() || CONFIGURACION.nombre;
  CONFIGURACION.subtitulo = document.getElementById('cfg-subtitulo').value.trim();
  aplicarConfiguracion();
  if (typeof guardarDato === 'function') guardarDato('configuracion');
  // Actualizar login screen si está visible
  const loginLogo = document.querySelector('#login-screen .text-3xl');
  if (loginLogo) loginLogo.textContent = CONFIGURACION.logo;
  showToast('Configuración del centro guardada');
  renderConfiguracion();
}

function renderTablaUsuarios() {
  const usuarios = state.usuarios;
  return `
<div class="overflow-x-auto">
  <table class="w-full text-sm">
    <thead>
      <tr class="border-b border-gray-100">
        <th class="text-left py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Usuario</th>
        <th class="text-left py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Nombre</th>
        <th class="text-left py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Rol</th>
        <th class="text-left py-2 text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Hijos</th>
        <th class="text-left py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">Estado</th>
        <th class="py-2"></th>
      </tr>
    </thead>
    <tbody>
      ${usuarios.map(u => `
      <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
        <td class="py-3 font-mono text-gray-600">${esc(u.usuario)}</td>
        <td class="py-3 font-medium text-gray-800">${esc(u.nombre)}</td>
        <td class="py-3"><span class="tag ${ROL_COLORS[u.rol]||'bg-gray-100 text-gray-600'}">${ROL_LABELS[u.rol]||u.rol}</span></td>
        <td class="py-3 text-gray-400 hidden md:table-cell">${u.alumnoIds?.length ? u.alumnoIds.map(id => { const a = state.alumnos.find(x=>x.id===id); return a ? esc(a.nombre.split(' ')[0]) : id; }).join(', ') : '—'}</td>
        <td class="py-3">
          <span class="tag ${u.activo?'bg-green-100 text-green-700':'bg-red-100 text-red-600'}">${u.activo?'Activo':'Inactivo'}</span>
        </td>
        <td class="py-3 flex items-center gap-2 justify-end">
          <button onclick="editarUsuario(${u.id})" class="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">Editar</button>
          ${u.id !== sesionActual.id ? `
          <button onclick="toggleActivoUsuario(${u.id})" class="text-xs px-3 py-1 border rounded-lg ${u.activo?'border-red-200 text-red-500 hover:bg-red-50':'border-green-200 text-green-600 hover:bg-green-50'}">
            ${u.activo ? 'Dar de baja' : 'Reactivar'}
          </button>` : '<span class="text-xs text-gray-300 px-3 py-1">Tú</span>'}
        </td>
      </tr>`).join('')}
    </tbody>
  </table>
</div>`;
}

function toggleActivoUsuario(id) {
  const u = state.usuarios.find(x=>x.id===id);
  if (!u) return;
  u.activo = !u.activo;
  document.getElementById('tabla-usuarios').innerHTML = renderTablaUsuarios();
  if (typeof guardarDato === 'function') guardarDato('usuarios');
  showToast(`Usuario ${u.nombre} ${u.activo?'reactivado':'dado de baja'}`);
}

function abrirModalNuevoUsuario() {
  mostrarModalUsuario(null);
}

function editarUsuario(id) {
  const u = state.usuarios.find(x=>x.id===id);
  mostrarModalUsuario(u);
}

function mostrarModalUsuario(u) {
  const modal = document.getElementById('modal-usuario');
  const body  = document.getElementById('modal-usuario-body');
  const esNuevo = !u;
  modal.classList.remove('hidden');

  body.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-lg text-gray-800">${esNuevo?'Nuevo usuario':'Editar usuario'}</h3>
      <button onclick="cerrarModalUsuario()" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <div class="space-y-4">
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Nombre completo</label>
        <input id="mu-nombre" type="text" value="${u?esc(u.nombre):''}" placeholder="Ej: María García" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Usuario (login)</label>
        <input id="mu-usuario" type="text" value="${u?esc(u.usuario):''}" placeholder="sin espacios, minúsculas" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Contraseña ${u?'(dejar en blanco para no cambiar)':''}</label>
        <input id="mu-pass" type="password" placeholder="Nueva contraseña" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Rol</label>
        <select id="mu-rol" onchange="actualizarSelectorHijos()" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 bg-white">
          ${Object.entries(ROL_LABELS).map(([v,l])=>`<option value="${v}" ${u?.rol===v?'selected':''}>${l}</option>`).join('')}
        </select>
      </div>
      <div id="selector-hijos" class="${u?.rol==='padre'?'':'hidden'}">
        <label class="block text-xs font-medium text-gray-500 mb-1.5">Alumnos vinculados</label>
        <div class="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-xl">
          ${state.alumnos.map(a=>`
          <label class="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-1.5 rounded-lg">
            <input type="checkbox" class="hijo-check accent-green-600 w-4 h-4" value="${a.id}" ${u?.alumnoIds?.includes(a.id)?'checked':''}>
            <span class="text-sm text-gray-700">${esc(a.nombre)} <span class="text-gray-400">(${esc(a.grupo)})</span></span>
          </label>`).join('')}
        </div>
      </div>
      <div id="mu-error" class="hidden text-red-500 text-sm"></div>
    </div>
    <div class="flex gap-3 mt-6">
      <button onclick="cerrarModalUsuario()" class="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarUsuario(${u?u.id:'null'})" class="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">
        ${esNuevo?'Crear usuario':'Guardar cambios'}
      </button>
    </div>
  `;
}

function actualizarSelectorHijos() {
  const rol = document.getElementById('mu-rol')?.value;
  const div = document.getElementById('selector-hijos');
  if (div) div.classList.toggle('hidden', rol !== 'padre');
}

function cerrarModalUsuario() {
  document.getElementById('modal-usuario').classList.add('hidden');
}

async function guardarUsuario(id) {
  const nombre  = document.getElementById('mu-nombre').value.trim();
  const usuario = document.getElementById('mu-usuario').value.trim().toLowerCase().replace(/\s+/g,'_');
  const pass    = document.getElementById('mu-pass').value;
  const rol     = document.getElementById('mu-rol').value;
  const errEl   = document.getElementById('mu-error');

  if (!nombre || !usuario) { errEl.textContent='Nombre y usuario son obligatorios.'; errEl.classList.remove('hidden'); return; }

  const alumnoIds = rol === 'padre'
    ? [...document.querySelectorAll('.hijo-check:checked')].map(c=>parseInt(c.value))
    : [];

  // Verificar usuario único
  const duplicado = state.usuarios.find(u => u.usuario === usuario && u.id !== id);
  if (duplicado) { errEl.textContent='Ese nombre de usuario ya existe.'; errEl.classList.remove('hidden'); return; }

  if (id) {
    // Editar existente
    const u = state.usuarios.find(x=>x.id===id);
    u.nombre = nombre;
    u.usuario = usuario;
    u.rol = rol;
    u.alumnoIds = alumnoIds;
    if (pass) u.passHash = await sha256(pass);
    showToast(`Usuario ${nombre} actualizado`);
  } else {
    // Crear nuevo
    if (!pass) { errEl.textContent='La contraseña es obligatoria para nuevos usuarios.'; errEl.classList.remove('hidden'); return; }
    const nuevoId = Math.max(...state.usuarios.map(u=>u.id)) + 1;
    state.usuarios.push({ id:nuevoId, usuario, passHash: await sha256(pass), nombre, rol, activo:true, alumnoIds });
    showToast(`Usuario ${nombre} creado`);
  }

  if (typeof guardarDato === 'function') guardarDato('usuarios');
  cerrarModalUsuario();
  document.getElementById('tabla-usuarios').innerHTML = renderTablaUsuarios();
}
