
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
  <div class="page-header">
    <h1 class="page-title">Clientes</h1>
    <span class="page-subtitle">${total} centros · ${fmtEuro(mrrTotal)} MRR filtrado</span>
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
        <div class="mobile-client-card" onclick="abrirClienteDetalle(${c.id})">
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
          <tr onclick="abrirClienteDetalle(${c.id})" class="row-clickable">
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
            <td><button class="icon-btn" onclick="event.stopPropagation();abrirClienteDetalle(${c.id})"><i class="ti ti-chevron-right" aria-hidden="true"></i></button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${lista.length===0?'<div class="empty-state"><i class="ti ti-search" aria-hidden="true"></i><p>Sin resultados para esa búsqueda</p></div>':''}
  </div>
</div>

<div id="cliente-modal" class="modal-overlay hidden" onclick="if(event.target===this)cerrarClienteDetalle()">
  <div id="cliente-panel" class="modal-panel"></div>
</div>`;

  if (saasState.clienteDetalle) renderClienteDetalle(saasState.clienteDetalle);
}

function abrirClienteDetalle(id) {
  saasState.clienteDetalle = id;
  renderClientes();
}
function cerrarClienteDetalle() {
  saasState.clienteDetalle = null;
  document.getElementById('cliente-modal').classList.add('hidden');
}

function renderClienteDetalle(id) {
  const c = CLIENTES.find(x=>x.id===id);
  if(!c) return;
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
      <div class="detail-row"><i class="ti ti-user" aria-hidden="true"></i> ${esc(c.contacto)}</div>
      <div class="detail-row"><i class="ti ti-mail" aria-hidden="true"></i> <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Plan actual</div>
      <div class="plan-upgrade">
        ${PLANES.map(p=>`
          <div class="plan-option ${c.plan===p.id?'active':''}">
            <div class="plan-option-name">${esc(p.nombre)}</div>
            <div class="plan-option-price">€${p.precio}/mes</div>
            ${c.plan!==p.id?`<button class="plan-change-btn" onclick="cambiarPlan(${c.id},'${p.id}')">Cambiar</button>`:'<span class="plan-current">Actual</span>'}
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
      ${c.estado==='activo'?`<button class="btn-danger" onclick="cambiarEstadoCliente(${c.id},'pausado')">Pausar cuenta</button>`:''}
      ${c.estado==='pausado'?`<button class="btn-primary" onclick="cambiarEstadoCliente(${c.id},'activo')">Reactivar</button>`:''}
    </div>
  `;
}

function cambiarPlan(id, nuevoPlan) {
  const c = CLIENTES.find(x=>x.id===id);
  if(!c) return;
  const p = PLANES.find(x=>x.id===nuevoPlan);
  c.plan = nuevoPlan;
  c.mrr = c.estado==='activo' ? p.precio : 0;
  renderClienteDetalle(id);
  toastSaas(`Plan de ${c.nombre} cambiado a ${p.nombre}`);
}

function cambiarEstadoCliente(id, nuevoEstado) {
  const c = CLIENTES.find(x=>x.id===id);
  if(!c) return;
  c.estado = nuevoEstado;
  if(nuevoEstado!=='activo') c.mrr=0;
  else { const p=PLANES.find(x=>x.id===c.plan); c.mrr=p?p.precio:0; }
  cerrarClienteDetalle();
  renderClientes();
  toastSaas(`Cuenta de ${c.nombre} actualizada a: ${nuevoEstado}`);
}
