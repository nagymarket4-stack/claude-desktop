
function renderPipeline() {
  const activos   = PIPELINE.filter(p=>p.estado==='activo');
  const negoc     = PIPELINE.filter(p=>p.estado==='negociando');
  const expirados = PIPELINE.filter(p=>p.estado==='expirado');

  document.getElementById('main-content').innerHTML = `
<div class="page-content">
  <div class="page-header">
    <h1 class="page-title">Pipeline de ventas</h1>
    <span class="page-subtitle">${activos.length} trials activos · ${negoc.length} en negociación · ${expirados.length} expirados</span>
  </div>

  <div class="pipeline-columns">
    <div class="pipeline-col">
      <div class="pipeline-col-header">
        <span class="pipeline-col-title">Trials activos</span>
        <span class="badge b-ok">${activos.length}</span>
      </div>
      ${activos.map(p=>pipelineCard(p)).join('')}
    </div>

    <div class="pipeline-col">
      <div class="pipeline-col-header">
        <span class="pipeline-col-title">Negociando</span>
        <span class="badge b-info">${negoc.length}</span>
      </div>
      ${negoc.map(p=>pipelineCard(p)).join('')}
    </div>

    <div class="pipeline-col">
      <div class="pipeline-col-header">
        <span class="pipeline-col-title">Expirados sin convertir</span>
        <span class="badge b-warn">${expirados.length}</span>
      </div>
      ${expirados.map(p=>pipelineCard(p)).join('')}
    </div>
  </div>
</div>

<div id="pipeline-modal" class="modal-overlay hidden" onclick="if(event.target===this)cerrarPipelineDetalle()">
  <div id="pipeline-panel" class="modal-panel"></div>
</div>`;

  if(saasState.pipelineDetalle) renderPipelineDetalle(saasState.pipelineDetalle);
}

function pipelineCard(p) {
  const dias = Math.max(0, Math.ceil((new Date(p.fin_trial)-new Date())/(1000*60*60*24)));
  const urgente = dias <= 3 && p.estado !== 'expirado';
  return `<div class="pipeline-kanban-card ${urgente?'urgent-card':''}" onclick="abrirPipelineDetalle('${esc(p.id)}')">
    <div class="pipeline-kanban-top">
      <div class="pipeline-av av-purple">${esc(p.nombre[0])}</div>
      <div class="pipeline-kanban-body">
        <div class="pipeline-kanban-name">${esc(p.nombre)}</div>
        <div class="pipeline-kanban-meta">${esc(p.ciudad)} · ~${p.alumnos_aprox} alumnos</div>
      </div>
    </div>
    <div class="pipeline-kanban-footer">
      ${planBadge(p.plan_interes)}
      ${p.estado!=='expirado'
        ? `<span class="dias-badge ${urgente?'urgent':''}">${dias}d restantes</span>`
        : `<span class="dias-badge expired">Expirado</span>`}
    </div>
    <div class="pipeline-nota">${esc(p.notas)}</div>
  </div>`;
}

function abrirPipelineDetalle(id) {
  saasState.pipelineDetalle = id;
  renderPipelineDetalle(id);
  document.getElementById('pipeline-modal').classList.remove('hidden');
}
function cerrarPipelineDetalle() {
  saasState.pipelineDetalle = null;
  document.getElementById('pipeline-modal').classList.add('hidden');
}

function renderPipelineDetalle(id) {
  const p = PIPELINE.find(x=>x.id===id);
  if(!p) return;
  const panel = document.getElementById('pipeline-panel');
  if(!panel) return;
  const dias = Math.max(0, Math.ceil((new Date(p.fin_trial)-new Date())/(1000*60*60*24)));
  panel.innerHTML = `
    <div class="modal-header">
      <div class="pipeline-av av-purple av-lg">${esc(p.nombre[0])}</div>
      <div class="modal-title-block">
        <h2 class="modal-title">${esc(p.nombre)}</h2>
        <div class="modal-meta">${esc(p.ciudad)} · ${estadoBadge(p.estado)}</div>
      </div>
      <button class="modal-close" onclick="cerrarPipelineDetalle()"><i class="ti ti-x" aria-hidden="true"></i></button>
    </div>

    <div class="modal-kpis">
      <div class="modal-kpi"><div class="modal-kpi-label">Plan interés</div><div class="modal-kpi-val">${planLabel(p.plan_interes)}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">MRR potencial</div><div class="modal-kpi-val">${fmtEuro(PLANES.find(x=>x.id===p.plan_interes)?.precio||0)}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">Alumnos aprox.</div><div class="modal-kpi-val">${p.alumnos_aprox}</div></div>
      <div class="modal-kpi"><div class="modal-kpi-label">Días restantes</div><div class="modal-kpi-val ${dias<=3?'text-danger':''}">${dias}d</div></div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Contacto</div>
      <div class="detail-row"><i class="ti ti-user" aria-hidden="true"></i> ${esc(p.contacto)}</div>
      <div class="detail-row"><i class="ti ti-mail" aria-hidden="true"></i> <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></div>
      <div class="detail-row"><i class="ti ti-calendar" aria-hidden="true"></i> Trial: ${fmtFecha(p.inicio_trial)} → ${fmtFecha(p.fin_trial)}</div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Notas</div>
      <p class="pipeline-notas-text">${esc(p.notas)}</p>
    </div>

    <div class="modal-actions">
      <button class="btn-secondary" onclick="cerrarPipelineDetalle()">Cerrar</button>
      ${p.estado!=='expirado'?`<button class="btn-primary" onclick="convertirTrialACliente('${p.id}')"><i class="ti ti-check" aria-hidden="true"></i> Convertir a cliente</button>`:''}
      <button class="btn-secondary" onclick="marcarContactado('${p.id}')"><i class="ti ti-mail" aria-hidden="true"></i> Marcar contactado</button>
    </div>
  `;
}

async function convertirTrialACliente(trialId) {
  const t = PIPELINE.find(x=>x.id===trialId);
  if(!t) return;
  const plan = PLANES.find(p=>p.id===t.plan_interes);
  try {
    // Crear el cliente en Supabase (genera su guardería con el nombre de la empresa)
    const nuevo = await crearTenantRemoto({
      nombre: t.nombre, ciudad: t.ciudad, contacto: t.contacto, email: t.email, plan: t.plan_interes,
    });
    if (t.alumnos_aprox) await actualizarTenantRemoto(nuevo.id, { alumnos: t.alumnos_aprox });
    await refrescarClientes();
    const idx = PIPELINE.findIndex(x=>x.id===trialId);
    if(idx!==-1) PIPELINE.splice(idx,1);
    cerrarPipelineDetalle();
    toastSaas(`¡${t.nombre} convertido a cliente! +${fmtEuro(plan?.precio||0)}/mes`);
    navegarSaas('clientes');
  } catch(e) {
    toastSaas('Error al convertir: ' + (e.message || 'reintenta'), 'error');
  }
}

function marcarContactado(trialId) {
  const t = PIPELINE.find(x=>x.id===trialId);
  if(!t) return;
  t.notas = t.notas + ' · Contactado ' + new Date().toLocaleDateString('es-ES');
  cerrarPipelineDetalle();
  toastSaas('Contacto registrado');
}
