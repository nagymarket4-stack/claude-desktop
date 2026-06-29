
function renderClientes() {
  const filtro = saasState.clienteFiltro.toLowerCase();
  const est = saasState.clienteEstado;
  let lista = CLIENTES.filter(c=>{
    const matchEst = est==='todos' || c.estado===est;
    const matchFiltro = !filtro || c.nombre.toLowerCase().includes(filtro) || c.ciudad.toLowerCase().includes(filtro) || c.contacto.toLowerCase().includes(filtro);
    return matchEst && matchFiltro;
  });
  const total = lista.length;
  const mrrTotal = lista.filter(c=>c.estado==='activo').reduce((s,c)=>s+c.mrr,0);

  document.getElementById('main-content').innerHTML = `
<div class="page-content">
  <div class="page-header" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
    <div>
      <h1 class="page-title">Clientes</h1>
      <span class="page-subtitle">${total} centros · ${fmtEuro(mrrTotal)} MRR filtrado</span>
    </div>
    <button class="btn-primary" onclick="abrirNuevoCliente()"><i class="ti ti-plus" aria-hidden="true"></i> Nuevo cliente</button>
  </div>

  <div class="toolbar">
    <div class="search-wrap">
      <i class="ti ti-search search-icon" aria-hidden="true"></i>
      <input type="search" class="search-input" placeholder="Buscar por nombre, ciudad o contacto…" value="${esc(saasState.clienteFiltro)}" oninput="saasState.clienteFiltro=this.value;renderClientes()">
    </div>
    <div class="filter-tabs">
      ${['todos','activo','pausado','cancelado'].map(e=>`
        <button class="filter-tab ${saasState.clienteEstado===e?'active':''}" onclick="saasState.clienteEstado='${e}';renderClientes()">${e.charAt(0).toUpperCase()+e.slice(1)}</button>
      `).join('')}
    </div>
  </div>

  <div class="card table-card">
    <div class="mobile-cards md-hidden">
      ${lista.map(c=>`
        <div class="mobile-client-card" onclick="abrirClienteDetalle('${c.id}')">
          <div class="av av-${planColor(c.plan)} av-lg">${esc(c.nombre[0])}</div>
          <div class="mobile-card-body">
            <div class="mobile-card-name">${esc(c.nombre)}</div>
            <div class="mobile-card-meta">${esc(c.ciudad)} · ${esc(c.contacto)}</div>
            <div class="mobile-card-badges">${planBadge(c.plan)} ${estadoBadge(c.estado)}</div>
          </div>
          <div class="mobile-card-mrr">${c.mrr?fmtEuro(c.mrr)+'/mes':'—'}</div>
        </div>
      `).join('')}
    </div>
    <table class="data-table desktop-only">
      <thead>
        <tr>
          <th>Centro</th><th>Ciudad</th><th>Plan</th><th>Estado</th>
          <th>Alumnos</th><th>MRR</th><th>Alta</th><th></th>
        </tr>
      </thead>
      <tbody>
        ${lista.map(c=>`
          <tr onclick="abrirClienteDetalle('${c.id}')" class="row-clickable">
            <td>
              <div class="cell-name">
                <div class="av av-${planColor(c.plan)}">${esc(c.nombre[0])}</div>
                <div>
                  <div>${esc(c.nombre)}</div>
                  <div class="cell-sub">${esc(c.contacto)}</div>
                </div>
              </div>
            </td>
            <td class="text-muted">${esc(c.ciudad)}</td>
            <td>${planBadge(c.plan)}</td>
            <td>${estadoBadge(c.estado)}</td>
            <td class="text-muted">${c.alumnos||'—'}</td>
            <td class="font-mono">${c.mrr?fmtEuro(c.mrr):'-'}</td>
            <td class="text-muted">${fmtFecha(c.alta)}</td>
            <td><button class="icon-btn" onclick="event.stopPropagation();abrirClienteDetalle('${c.id}')"><i class="ti ti-chevron-right" aria-hidden="true"></i></button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${lista.length===0?'<div class="empty-state"><i class="ti ti-search" aria-hidden="true"></i><p>Sin resultados para esa búsqueda</p></div>':''}
  </div>
</div>

<div id="cliente-modal" class="modal-overlay hidden" onclick="if(event.target===this)cerrarClienteDetalle()">
  <div id="cliente-panel" class="modal-panel"></div>
</div>

<div id="nuevo-modal" class="modal-overlay hidden" onclick="if(event.target===this)cerrarNuevoCliente()">
  <div class="modal-panel">
    <div class="modal-header">
      <div class="modal-title-block">
        <h2 class="modal-title">Nuevo cliente</h2>
        <div class="modal-meta">Se generará su guardería automáticamente</div>
      </div>
      <button class="modal-close" onclick="cerrarNuevoCliente()"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>
    <div class="modal-section">
      <label class="form-label">Nombre del centro *</label>
      <input id="nc-nombre" class="form-input" type="text" placeholder="Ej: Guardería Estrellita" maxlength="60">
      <label class="form-label">Ciudad</label>
      <input id="nc-ciudad" class="form-input" type="text" placeholder="Ej: Madrid" maxlength="40">
      <label class="form-label">Persona de contacto</label>
      <input id="nc-contacto" class="form-input" type="text" placeholder="Nombre y apellidos" maxlength="60">
      <label class="form-label">Email</label>
      <input id="nc-email" class="form-input" type="email" placeholder="contacto@centro.es" maxlength="80">
      <label class="form-label">Plan</label>
      <select id="nc-plan" class="form-input">
        ${PLANES.map(p=>`<option value="${p.id}">${p.nombre} — €${p.precio}/mes</option>`).join('')}
      </select>
      <div id="nc-error" class="form-error hidden"></div>
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="cerrarNuevoCliente()">Cancelar</button>
      <button class="btn-primary" id="nc-guardar" onclick="guardarNuevoCliente()">Crear cliente</button>
    </div>
  </div>
</div>`;

  if (saasState.clienteDetalle) renderClienteDetalle(saasState.clienteDetalle);
}

function abrirClienteDetalle(id) {
  saasState.clienteDetalle = id;
  renderClientes();
}

function copiarUrlCliente(url) {
  navigator.clipboard?.writeText(url).then(
    () => toastSaas('Enlace copiado al portapapeles'),
    () => toastSaas('No se pudo copiar', 'error')
  );
}

// ── Crear nuevo cliente ───────────────────────────────────────────────────────
function abrirNuevoCliente() {
  document.getElementById('nuevo-modal').classList.remove('hidden');
  document.getElementById('nc-nombre').focus();
}
function cerrarNuevoCliente() {
  document.getElementById('nuevo-modal').classList.add('hidden');
}

async function guardarNuevoCliente() {
  const nombre   = document.getElementById('nc-nombre').value.trim();
  const ciudad   = document.getElementById('nc-ciudad').value.trim();
  const contacto = document.getElementById('nc-contacto').value.trim();
  const email    = document.getElementById('nc-email').value.trim();
  const plan     = document.getElementById('nc-plan').value;
  const errEl    = document.getElementById('nc-error');

  if (nombre.length < 2) { errEl.textContent = 'Indica el nombre del centro.'; errEl.classList.remove('hidden'); return; }
  errEl.classList.add('hidden');

  const btn = document.getElementById('nc-guardar');
  btn.disabled = true; btn.textContent = 'Creando…';
  try {
    const nuevo = await crearTenantRemoto({ nombre, ciudad, contacto, email, plan });
    await refrescarClientes();
    cerrarNuevoCliente();
    renderClientes();
    abrirClienteDetalle(nuevo.id);
    toastSaas(`Guardería de ${nombre} creada`);
  } catch (e) {
    errEl.textContent = 'Error: ' + (e.message || 'no se pudo crear'); errEl.classList.remove('hidden');
    btn.disabled = false; btn.textContent = 'Crear cliente';
  }
}
function cerrarClienteDetalle() {
  saasState.clienteDetalle = null;
  document.getElementById('cliente-modal').classList.add('hidden');
}

function renderClienteDetalle(id) {
  const c = CLIENTES.find(x=>String(x.id)===String(id));
  if(!c) return;
  const url = (typeof urlCliente === 'function') ? urlCliente(c.id) : '#';
  const modal = document.getElementById('cliente-modal');
  const panel = document.getElementById('cliente-panel');
  modal.classList.remove('hidden');
  const facturas = FACTURAS.filter(f=>f.cliente_id===id).slice(0,3);
  panel.innerHTML = `
    <div class="modal-header">
      <div class="av av-${planColor(c.plan)} av-lg">${esc(c.nombre[0])}</div>
      <div class="modal-title-block">
        <h2 class="modal-title">${esc(c.nombre)}</h2>
        <div class="modal-meta">${esc(c.ciudad)} · ${planBadge(c.plan)} ${estadoBadge(c.estado)}</div>
      </div>
      <button class="modal-close" onclick="cerrarClienteDetalle()"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>

    <div class="modal-kpis">
      <div class="modal-kpi"><div class="modal-kpi-label">MRR</div><div class="modal-kpi-val">${c.mrr?fmtEuro(c.mrr):'—'}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">ARR</div><div class="modal-kpi-val">${c.mrr?fmtEuro(c.mrr*12):'—'}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">Alumnos</div><div class="modal-kpi-val">${c.alumnos}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">Cliente desde</div><div class="modal-kpi-val">${fmtFecha(c.alta)}</div></div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Contacto</div>
      <div class="detail-row"><i class="ti ti-user" aria-hidden="true"></i> ${esc(c.contacto) || '—'}</div>
      <div class="detail-row"><i class="ti ti-mail" aria-hidden="true"></i> <a href="mailto:${esc(c.email)}">${esc(c.email) || '—'}</a></div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Acceso a su guardería</div>
      <div class="detail-row" style="word-break:break-all;"><i class="ti ti-link" aria-hidden="true"></i> <a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
        <button class="btn-secondary" onclick="copiarUrlCliente('${esc(url)}')"><i class="ti ti-copy" aria-hidden="true"></i> Copiar enlace</button>
        <a class="btn-secondary" href="${esc(url)}" target="_blank" rel="noopener"><i class="ti ti-external-link" aria-hidden="true"></i> Abrir guardería</a>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Cobro</div>
      <div class="detail-row"><i class="ti ti-credit-card" aria-hidden="true"></i> Pago con Stripe — <span class="badge b-warn">próximamente</span></div>
      <button class="btn-secondary" disabled style="margin-top:8px;opacity:.6;cursor:not-allowed;"><i class="ti ti-brand-stripe" aria-hidden="true"></i> Cobrar con Stripe</button>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Plan actual</div>
      <div class="plan-upgrade">
        ${PLANES.map(p=>`
          <div class="plan-option ${c.plan===p.id?'active':''}">
            <div class="plan-option-name">${esc(p.nombre)}</div>
            <div class="plan-option-price">€${p.precio}/mes</div>
            ${c.plan!==p.id?`<button class="plan-change-btn" onclick="cambiarPlan('${c.id}','${p.id}')">Cambiar</button>`:'<span class="plan-current">Actual</span>'}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Últimas facturas</div>
      ${facturas.length ? facturas.map(f=>`
        <div class="factura-row">
          <span class="factura-id">${esc(f.id)}</span>
          <span class="factura-mes">${esc(f.mes)}</span>
          <span class="factura-importe">${fmtEuro(f.importe)}</span>
          <span class="badge ${f.estado==='pagada'?'b-ok':'b-info'}">${f.estado}</span>
        </div>
      `).join('') : '<p class="text-muted">Sin facturas registradas</p>'}
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" onclick="cerrarClienteDetalle()">Cerrar</button>
      ${c.estado==='activo'?`<button class="btn-danger" onclick="cambiarEstadoCliente('${c.id}','pausado')">Pausar cuenta</button>`:''}
      ${c.estado==='pausado'?`<button class="btn-primary" onclick="cambiarEstadoCliente('${c.id}','activo')">Reactivar</button>`:''}
    </div>

    <div class="modal-section" style="border-top:1px solid #fee2e2;margin-top:8px;">
      <div class="modal-section-title" style="color:#dc2626;">Zona peligrosa</div>
      <p class="text-muted" style="font-size:13px;margin-bottom:8px;">Elimina el cliente, su guardería y todos sus datos. No se puede deshacer.</p>
      <button class="btn-danger" onclick="borrarCliente('${c.id}')"><i class="ti ti-trash" aria-hidden="true"></i> Borrar cliente</button>
    </div>
  `;
}

// Clave de administración (PANEL_SECRET): se pide una vez por sesión
function getPanelSecret() {
  let secret = sessionStorage.getItem('__panel_secret');
  if (!secret) {
    secret = prompt('Introduce la clave de administración del panel:');
    if (secret) sessionStorage.setItem('__panel_secret', secret);
  }
  return secret;
}

async function borrarCliente(id) {
  const c = CLIENTES.find(x => String(x.id) === String(id));
  if (!c) return;
  if (!confirm(`¿Borrar DEFINITIVAMENTE "${c.nombre}"?\n\nSe eliminará su guardería y TODOS sus datos (alumnos, mensajes, facturas…). Esta acción no se puede deshacer.`)) return;

  const secret = getPanelSecret();
  if (!secret) return;

  try {
    await borrarTenantRemoto(c.id, secret);
    CLIENTES = CLIENTES.filter(x => String(x.id) !== String(id));
    if (typeof recomputarFacturas === 'function') recomputarFacturas();
    cerrarClienteDetalle();
    renderClientes();
    if (typeof updateSidebarMRR === 'function') updateSidebarMRR();
    toastSaas(`Cliente "${c.nombre}" eliminado`);
  } catch (e) {
    sessionStorage.removeItem('__panel_secret'); // por si la clave era incorrecta
    toastSaas('Error al borrar: ' + (e.message || 'reintenta'), 'error');
  }
}

async function cambiarPlan(id, nuevoPlan) {
  const c = CLIENTES.find(x=>String(x.id)===String(id));
  if(!c) return;
  const p = PLANES.find(x=>x.id===nuevoPlan);
  const secret = getPanelSecret();
  if (!secret) return;
  try {
    await gestionarTenantRemoto(c.id, 'plan', nuevoPlan, secret);
    c.plan = nuevoPlan;
    c.mrr = c.estado==='activo' ? p.precio : 0;
    recomputarFacturas();
    renderClienteDetalle(id);
    if (typeof updateSidebarMRR === 'function') updateSidebarMRR();
    toastSaas(`Plan de ${c.nombre} cambiado a ${p.nombre}`);
  } catch (e) {
    sessionStorage.removeItem('__panel_secret');
    toastSaas('Error al cambiar el plan: ' + (e.message || 'reintenta'), 'error');
  }
}

async function cambiarEstadoCliente(id, nuevoEstado) {
  const c = CLIENTES.find(x=>String(x.id)===String(id));
  if(!c) return;
  const secret = getPanelSecret();
  if (!secret) return;
  try {
    await gestionarTenantRemoto(c.id, 'estado', nuevoEstado, secret);
    c.estado = nuevoEstado;
    if(nuevoEstado!=='activo') c.mrr=0;
    else { const p=PLANES.find(x=>x.id===c.plan); c.mrr=p?p.precio:0; }
    recomputarFacturas();
    cerrarClienteDetalle();
    renderClientes();
    if (typeof updateSidebarMRR === 'function') updateSidebarMRR();
    toastSaas(`Cuenta de ${c.nombre} actualizada a: ${nuevoEstado}`);
  } catch (e) {
    sessionStorage.removeItem('__panel_secret');
    toastSaas('Error al actualizar: ' + (e.message || 'reintenta'), 'error');
  }
}
