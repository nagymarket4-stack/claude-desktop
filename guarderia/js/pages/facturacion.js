// ─── Facturación (recibos por alumno) ────────────────────────────────────────
// Acceso: admin / superadmin. Las familias ven solo las facturas de su hijo.

function fmtImporte(n) { return '€' + Number(n || 0).toLocaleString('es-ES'); }
function alumnoNombre(id) { const a = state.alumnos.find(x => x.id === id); return a ? a.nombre : 'Alumno'; }
function alumnoAvatar(id) { const a = state.alumnos.find(x => x.id === id); return a ? `<span class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${esc(a.color)}">${esc(a.avatar)}</span>` : ''; }

function renderFacturacion() {
  const el = document.getElementById('page-facturacion');
  if (!el) return;
  const facturas = state.facturas || [];
  const cobrado   = facturas.filter(f => f.estado === 'pagada').reduce((s, f) => s + (+f.importe || 0), 0);
  const pendiente = facturas.filter(f => f.estado !== 'pagada').reduce((s, f) => s + (+f.importe || 0), 0);

  el.innerHTML = `
  <div class="p-4 md:p-8">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">💳 Facturación</h2>
        <p class="text-gray-500 text-sm mt-1">Recibos y cobros de las familias</p>
      </div>
      <button onclick="abrirNuevaFactura()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">+ Nueva factura</button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
      <div class="card p-4"><p class="text-xs text-gray-400">Cobrado</p><p class="text-2xl font-bold text-green-600">${fmtImporte(cobrado)}</p></div>
      <div class="card p-4"><p class="text-xs text-gray-400">Pendiente</p><p class="text-2xl font-bold text-amber-500">${fmtImporte(pendiente)}</p></div>
      <div class="card p-4 col-span-2 md:col-span-1"><p class="text-xs text-gray-400">Facturas</p><p class="text-2xl font-bold text-gray-800">${facturas.length}</p></div>
    </div>

    <div class="card divide-y divide-gray-100">
      ${facturas.length === 0 ? `<p class="text-center text-gray-400 py-12 text-sm">Aún no hay facturas. Crea la primera.</p>` :
        facturas.slice().sort((a,b)=>(b.fecha||'').localeCompare(a.fecha||'')).map(f => `
        <div class="flex items-center gap-3 p-4">
          ${alumnoAvatar(f.alumnoId)}
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 text-sm truncate">${esc(alumnoNombre(f.alumnoId))}</p>
            <p class="text-xs text-gray-400 truncate">${esc(f.concepto)} · ${esc(f.periodo)} · ${esc(f.id)}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-gray-800 text-sm">${fmtImporte(f.importe)}</p>
            ${f.estado === 'pagada'
              ? `<span class="tag bg-green-100 text-green-700">Pagada</span>`
              : `<span class="tag bg-amber-100 text-amber-700">Pendiente</span>`}
          </div>
          <button onclick="toggleFacturaPagada('${esc(f.id)}')" title="Cambiar estado"
            class="ml-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
            ${f.estado === 'pagada' ? '↺' : '✓'}
          </button>
        </div>`).join('')}
    </div>
  </div>

  <div id="modal-factura" class="hidden fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto" id="modal-factura-body"></div>
  </div>`;
}

function abrirNuevaFactura() {
  const body = document.getElementById('modal-factura-body');
  body.innerHTML = `
    <div class="flex items-center justify-between mb-5">
      <h3 class="font-bold text-gray-800 text-lg">Nueva factura</h3>
      <button onclick="cerrarModal('modal-factura')" class="text-gray-400 hover:text-gray-600 text-xl">✕</button>
    </div>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Alumno</label>
    <select id="fac-alumno" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3 bg-white">
      ${state.alumnos.map(a => `<option value="${a.id}">${esc(a.nombre)}</option>`).join('')}
    </select>
    <label class="text-sm font-semibold text-gray-700 block mb-1">Concepto</label>
    <input id="fac-concepto" value="Cuota mensual" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400 mb-3">
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="text-sm font-semibold text-gray-700 block mb-1">Periodo</label>
        <input id="fac-periodo" placeholder="Julio 2026" value="${esc(mesActualTexto())}" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
      </div>
      <div>
        <label class="text-sm font-semibold text-gray-700 block mb-1">Importe (€)</label>
        <input id="fac-importe" type="number" min="0" step="1" value="295" class="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-green-400">
      </div>
    </div>
    <div id="fac-error" class="hidden text-red-500 text-sm mt-2"></div>
    <div class="flex gap-3 mt-5">
      <button onclick="cerrarModal('modal-factura')" class="flex-1 border border-gray-200 text-gray-600 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">Cancelar</button>
      <button onclick="guardarFactura()" class="flex-1 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700">Crear factura</button>
    </div>`;
  document.getElementById('modal-factura').classList.remove('hidden');
}

function mesActualTexto() {
  return new Date().toLocaleDateString('es-ES', { month:'long', year:'numeric' }).replace(/^\w/, c => c.toUpperCase());
}

function guardarFactura() {
  const alumnoId = +document.getElementById('fac-alumno').value;
  const concepto = document.getElementById('fac-concepto').value.trim().slice(0, 80) || 'Cuota';
  const periodo  = document.getElementById('fac-periodo').value.trim().slice(0, 40) || mesActualTexto();
  const importe  = Math.round(+document.getElementById('fac-importe').value);
  const errEl = document.getElementById('fac-error');
  if (!importe || importe <= 0) { errEl.textContent = 'Introduce un importe válido.'; errEl.classList.remove('hidden'); return; }

  const num = 1000 + (state.facturas?.length || 0) + 1;
  state.facturas = state.facturas || [];
  state.facturas.push({
    id: 'F-' + num, alumnoId, concepto, periodo, importe,
    estado: 'pendiente', fecha: new Date().toISOString().slice(0, 10), fechaPago: null,
  });
  guardarDato('facturas');
  cerrarModal('modal-factura');
  renderFacturacion();
  showToast(`Factura creada para ${alumnoNombre(alumnoId)}`);
}

function toggleFacturaPagada(id) {
  const f = (state.facturas || []).find(x => x.id === id);
  if (!f) return;
  if (f.estado === 'pagada') { f.estado = 'pendiente'; f.fechaPago = null; }
  else { f.estado = 'pagada'; f.fechaPago = new Date().toISOString().slice(0, 10); }
  guardarDato('facturas');
  renderFacturacion();
  showToast(f.estado === 'pagada' ? 'Factura marcada como pagada' : 'Factura marcada como pendiente');
}

// ── Vista de familias: facturas de su(s) hijo(s) ──────────────────────────────
function renderPadreFacturas() {
  const el = document.getElementById('page-padre-facturas');
  if (!el) return;
  const ids = sesionActual.alumnoIds || [];
  const facturas = (state.facturas || []).filter(f => ids.includes(f.alumnoId))
    .sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  const pendiente = facturas.filter(f => f.estado !== 'pagada').reduce((s, f) => s + (+f.importe || 0), 0);

  el.innerHTML = `
  <div class="p-4 md:p-8 max-w-xl mx-auto">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">💳 Facturas</h2>
      <p class="text-gray-400 text-sm mt-1">Recibos del centro</p>
    </div>
    ${pendiente > 0 ? `<div class="card p-4 mb-4 bg-amber-50 border border-amber-100"><p class="text-sm text-amber-700">Tienes <b>${fmtImporte(pendiente)}</b> pendiente de pago. El cobro se gestiona con el centro.</p></div>` : ''}
    ${facturas.length === 0 ? `<div class="text-center py-16 text-gray-400"><p class="text-5xl mb-4">💳</p><p>No hay facturas todavía.</p></div>` :
      `<div class="card divide-y divide-gray-100">${facturas.map(f => `
        <div class="flex items-center justify-between gap-3 p-4">
          <div class="min-w-0">
            <p class="font-semibold text-gray-800 text-sm">${esc(f.concepto)}</p>
            <p class="text-xs text-gray-400">${esc(f.periodo)} · ${esc(f.id)}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-gray-800 text-sm">${fmtImporte(f.importe)}</p>
            ${f.estado === 'pagada' ? `<span class="tag bg-green-100 text-green-700">Pagada</span>` : `<span class="tag bg-amber-100 text-amber-700">Pendiente</span>`}
          </div>
        </div>`).join('')}</div>`}
  </div>`;
}
