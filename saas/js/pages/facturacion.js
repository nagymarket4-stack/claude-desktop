
function renderFacturacion() {
  const pendientes = FACTURAS.filter(f=>f.estado==='pendiente');
  const pagadas    = FACTURAS.filter(f=>f.estado==='pagada');
  const totalPend  = pendientes.reduce((s,f)=>s+f.importe,0);
  const totalPag   = pagadas.reduce((s,f)=>s+f.importe,0);

  const filtroMes  = saasState.factMes  || '';
  const filtroPlan = saasState.factPlan || '';
  let lista = FACTURAS.filter(f=>{
    const c = CLIENTES.find(x=>x.id===f.cliente_id);
    return (!filtroMes || f.mes===filtroMes) && (!filtroPlan || (c&&c.plan===filtroPlan));
  });

  const meses = [...new Set(FACTURAS.map(f=>f.mes))];

  document.getElementById('main-content').innerHTML = `
<div class="page-content">
  <div class="page-header">
    <h1 class="page-title">Facturación</h1>
    <span class="page-subtitle">Gestión de cobros y facturas</span>
  </div>

  <div class="kpi-grid" style="grid-template-columns:repeat(3,1fr)">
    <div class="kpi-card">
      <div class="kpi-icon kpi-green"><i class="ti ti-receipt" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">Cobrado este mes</div>
        <div class="kpi-value">${fmtEuro(totalPag)}</div>
        <div class="kpi-delta up">${pagadas.length} facturas pagadas</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-amber"><i class="ti ti-clock" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">Pendiente de cobro</div>
        <div class="kpi-value">${fmtEuro(totalPend)}</div>
        <div class="kpi-delta down">${pendientes.length} facturas pendientes</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-blue"><i class="ti ti-chart-line" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">MRR actual</div>
        <div class="kpi-value">${fmtEuro(calcMRR())}</div>
        <div class="kpi-delta up">ARR: ${fmtEuro(calcARR())}</div>
      </div>
    </div>
  </div>

  <div class="toolbar" style="margin-top:1rem">
    <select class="form-select" onchange="saasState.factMes=this.value;renderFacturacion()">
      <option value="">Todos los meses</option>
      ${meses.map(m=>`<option value="${esc(m)}" ${filtroMes===m?'selected':''}>${esc(m)}</option>`).join('')}
    </select>
    <select class="form-select" onchange="saasState.factPlan=this.value;renderFacturacion()">
      <option value="">Todos los planes</option>
      ${PLANES.map(p=>`<option value="${p.id}" ${filtroPlan===p.id?'selected':''}>${esc(p.nombre)}</option>`).join('')}
    </select>
    <button class="btn-outline" onclick="exportarCSV()"><i class="ti ti-download" aria-hidden="true"></i> Exportar CSV</button>
  </div>

  <div class="card table-card" style="margin-top:1rem">
    <table class="data-table">
      <thead>
        <tr><th>Nº factura</th><th>Centro</th><th>Mes</th><th>Plan</th><th>Importe</th><th>Estado</th><th></th></tr>
      </thead>
      <tbody>
        ${lista.map(f=>{
          const c = CLIENTES.find(x=>x.id===f.cliente_id);
          return `<tr>
            <td class="font-mono text-muted">${esc(f.id)}</td>
            <td><div class="cell-name"><div class="av av-${c?planColor(c.plan):'gray'}">${esc(f.cliente[0])}</div>${esc(f.cliente)}</div></td>
            <td class="text-muted">${esc(f.mes)}</td>
            <td>${c?planBadge(c.plan):'—'}</td>
            <td class="font-mono">${fmtEuro(f.importe)}</td>
            <td>${f.estado==='pagada'?'<span class="badge b-ok">Pagada</span>':'<span class="badge b-warn">Pendiente</span>'}</td>
            <td>${f.estado==='pendiente'?`<button class="btn-xs" onclick="marcarPagada('${esc(f.id)}')">Marcar pagada</button>`:'<i class="ti ti-check text-muted" aria-hidden="true"></i>'}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    ${lista.length===0?'<div class="empty-state"><i class="ti ti-receipt" aria-hidden="true"></i><p>Sin facturas para ese filtro</p></div>':''}
  </div>
</div>`;
}

function marcarPagada(factId) {
  const f = FACTURAS.find(x=>x.id===factId);
  if(!f) return;
  f.estado = 'pagada';
  renderFacturacion();
  toastSaas(`Factura ${factId} marcada como pagada`);
}

function exportarCSV() {
  const rows = [['Nº Factura','Centro','Mes','Importe','Estado']];
  FACTURAS.forEach(f=>rows.push([f.id, f.cliente, f.mes, f.importe, f.estado]));
  const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url  = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download='facturas-guarderia-saas.csv'; a.click();
  URL.revokeObjectURL(url);
  toastSaas('CSV exportado correctamente');
}
