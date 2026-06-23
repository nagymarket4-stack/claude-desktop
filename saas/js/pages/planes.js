
function renderPlanes() {
  document.getElementById('main-content').innerHTML = `
<div class="page-content">
  <div class="page-header">
    <h1 class="page-title">Planes de precios</h1>
    <span class="page-subtitle">Gestiona los planes y funcionalidades de cada tier</span>
  </div>

  <div class="planes-grid">
    ${PLANES.map(p=>{
      const clientes = CLIENTES.filter(c=>c.plan===p.id&&c.estado==='activo').length;
      const mrrPlan = clientes * p.precio;
      return `
      <div class="plan-card plan-card-${p.color}">
        <div class="plan-card-header">
          <div>
            <div class="plan-card-name">${esc(p.nombre)}</div>
            <div class="plan-card-price">€${p.precio}<span>/mes</span></div>
          </div>
          <div class="plan-card-stats">
            <div class="plan-stat"><span class="plan-stat-val">${clientes}</span><span class="plan-stat-lbl">centros</span></div>
            <div class="plan-stat"><span class="plan-stat-val">${fmtEuro(mrrPlan)}</span><span class="plan-stat-lbl">MRR</span></div>
          </div>
        </div>
        <div class="plan-card-limits">
          <div class="plan-limit"><i class="ti ti-users" aria-hidden="true"></i> Hasta ${p.max_alumnos===999?'ilimitados':p.max_alumnos+' alumnos'}</div>
          <div class="plan-limit"><i class="ti ti-id" aria-hidden="true"></i> Hasta ${p.max_profesores===999?'ilimitados':p.max_profesores+' profesores'}</div>
        </div>
        <ul class="plan-features">
          ${p.features.map(f=>`<li><i class="ti ti-check" aria-hidden="true"></i> ${esc(f)}</li>`).join('')}
        </ul>
        <div class="plan-card-actions">
          <button class="btn-outline" onclick="editarPlan('${p.id}')"><i class="ti ti-edit" aria-hidden="true"></i> Editar precio</button>
          <button class="btn-outline" onclick="navegarSaas('clientes');saasState.clienteEstado='activo'"><i class="ti ti-users" aria-hidden="true"></i> Ver clientes</button>
        </div>
      </div>`;
    }).join('')}
  </div>

  <div class="card" style="margin-top:1.5rem">
    <div class="card-header"><span class="card-title">Comparativa de revenue por plan</span></div>
    <div class="revenue-compare">
      ${PLANES.map(p=>{
        const clientes = CLIENTES.filter(c=>c.plan===p.id&&c.estado==='activo').length;
        const mrr = clientes * p.precio;
        const pct = calcMRR() > 0 ? Math.round(mrr/calcMRR()*100) : 0;
        return `
        <div class="rev-row">
          <div class="rev-plan">${esc(p.nombre)}</div>
          <div class="rev-bar-wrap"><div class="rev-bar bg-${p.color}" style="width:${pct}%"></div></div>
          <div class="rev-pct">${pct}%</div>
          <div class="rev-mrr">${fmtEuro(mrr)}</div>
        </div>`;
      }).join('')}
    </div>
  </div>
</div>

<div id="plan-edit-modal" class="modal-overlay hidden" onclick="if(event.target===this)cerrarEditarPlan()">
  <div id="plan-edit-panel" class="modal-panel modal-sm"></div>
</div>`;
}

function editarPlan(planId) {
  const p = PLANES.find(x=>x.id===planId);
  if(!p) return;
  const modal = document.getElementById('plan-edit-modal');
  const panel = document.getElementById('plan-edit-panel');
  modal.classList.remove('hidden');
  panel.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title">Editar plan ${esc(p.nombre)}</h2>
      <button class="modal-close" onclick="cerrarEditarPlan()"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>
    <div class="form-group">
      <label class="form-label">Precio mensual (€)</label>
      <input type="number" class="form-input" id="edit-precio" value="${p.precio}" min="1">
    </div>
    <div class="form-group">
      <label class="form-label">Máximo de alumnos</label>
      <input type="number" class="form-input" id="edit-alumnos" value="${p.max_alumnos===999?'':p.max_alumnos}" placeholder="Ilimitado">
    </div>
    <div class="form-group">
      <label class="form-label">Máximo de profesores</label>
      <input type="number" class="form-input" id="edit-profesores" value="${p.max_profesores===999?'':p.max_profesores}" placeholder="Ilimitado">
    </div>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="cerrarEditarPlan()">Cancelar</button>
      <button class="btn-primary" onclick="guardarPlan('${planId}')">Guardar cambios</button>
    </div>
  `;
}

function cerrarEditarPlan() {
  document.getElementById('plan-edit-modal').classList.add('hidden');
}

function guardarPlan(planId) {
  const p = PLANES.find(x=>x.id===planId);
  if(!p) return;
  const precio = parseInt(document.getElementById('edit-precio').value);
  const maxA = document.getElementById('edit-alumnos').value;
  const maxP = document.getElementById('edit-profesores').value;
  if(!precio || precio<1) { toastSaas('Precio inválido','error'); return; }
  p.precio = precio;
  p.max_alumnos = maxA ? parseInt(maxA) : 999;
  p.max_profesores = maxP ? parseInt(maxP) : 999;
  CLIENTES.filter(c=>c.plan===planId&&c.estado==='activo').forEach(c=>c.mrr=precio);
  cerrarEditarPlan();
  renderPlanes();
  toastSaas(`Plan ${p.nombre} actualizado a €${precio}/mes`);
}
