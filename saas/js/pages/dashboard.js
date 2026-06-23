
function renderDashboard() {
  const mrr = calcMRR();
  const arr = calcARR();
  const activos = CLIENTES.filter(c=>c.estado==='activo').length;
  const trials = PIPELINE.filter(p=>p.estado==='activo').length;
  const starter = CLIENTES.filter(c=>c.plan==='starter'&&c.estado==='activo').length;
  const pro = CLIENTES.filter(c=>c.plan==='pro'&&c.estado==='activo').length;
  const ent = CLIENTES.filter(c=>c.plan==='enterprise'&&c.estado==='activo').length;
  const ultimos = [...CLIENTES].sort((a,b)=>b.alta.localeCompare(a.alta)).slice(0,5);
  const maxMrr = Math.max(...MRR_HISTORICO.map(m=>m.mrr));

  document.getElementById('main-content').innerHTML = `
<div class="page-content">
  <div class="page-header">
    <h1 class="page-title">Dashboard</h1>
    <span class="page-subtitle">Resumen del negocio · ${new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}</span>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon kpi-purple"><i class="ti ti-trending-up" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">MRR</div>
        <div class="kpi-value">${fmtEuro(mrr)}</div>
        <div class="kpi-delta up">↑ +18% vs mes anterior</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-blue"><i class="ti ti-calendar-stats" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">ARR</div>
        <div class="kpi-value">${fmtEuro(arr)}</div>
        <div class="kpi-delta up">Ingresos anuales recurrentes</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-green"><i class="ti ti-building" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">Clientes activos</div>
        <div class="kpi-value">${activos}</div>
        <div class="kpi-delta up">↑ +3 este mes</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-amber"><i class="ti ti-percentage" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">Churn rate</div>
        <div class="kpi-value">${calcChurn()}%</div>
        <div class="kpi-delta down">↓ Bajo control</div>
      </div>
    </div>
  </div>

  <div class="dash-grid">
    <div class="card">
      <div class="card-header"><span class="card-title">Crecimiento MRR</span><span class="card-sub">Últimos 7 meses</span></div>
      <div class="chart-area">
        ${MRR_HISTORICO.map((m,i)=>{
          const h = Math.round((m.mrr/maxMrr)*100);
          const isLast = i===MRR_HISTORICO.length-1;
          return `<div class="bar-col">
            <div class="bar-val">${isLast?fmtEuro(m.mrr):''}</div>
            <div class="bar-wrap"><div class="bar-fill ${isLast?'bar-last':''}" style="height:${h}%"></div></div>
            <div class="bar-label">${esc(m.mes)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Distribución de planes</span></div>
      <div class="plan-dist">
        <div class="plan-dist-row">
          <div class="plan-dist-color bg-purple"></div>
          <div class="plan-dist-name">Pro · €79/mes</div>
          <div class="plan-dist-count">${pro} centros</div>
          <div class="plan-dist-mrr">${fmtEuro(pro*79)}</div>
          <div class="plan-dist-bar-wrap"><div class="plan-dist-bar bg-purple" style="width:${Math.round(pro/activos*100)}%"></div></div>
        </div>
        <div class="plan-dist-row">
          <div class="plan-dist-color bg-amber"></div>
          <div class="plan-dist-name">Enterprise · €199/mes</div>
          <div class="plan-dist-count">${ent} centros</div>
          <div class="plan-dist-mrr">${fmtEuro(ent*199)}</div>
          <div class="plan-dist-bar-wrap"><div class="plan-dist-bar bg-amber" style="width:${Math.round(ent/activos*100)}%"></div></div>
        </div>
        <div class="plan-dist-row">
          <div class="plan-dist-color bg-green"></div>
          <div class="plan-dist-name">Starter · €29/mes</div>
          <div class="plan-dist-count">${starter} centros</div>
          <div class="plan-dist-mrr">${fmtEuro(starter*29)}</div>
          <div class="plan-dist-bar-wrap"><div class="plan-dist-bar bg-green" style="width:${Math.round(starter/activos*100)}%"></div></div>
        </div>
      </div>
      <div class="plan-dist-trials">
        <i class="ti ti-flask" aria-hidden="true"></i> ${trials} trials activos en pipeline
        <button class="link-btn" onclick="navegarSaas('pipeline')">Ver pipeline →</button>
      </div>
    </div>
  </div>

  <div class="dash-grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">Últimas altas</span><button class="link-btn" onclick="navegarSaas('clientes')">Ver todos →</button></div>
      <table class="data-table">
        <thead><tr><th>Centro</th><th>Ciudad</th><th>Plan</th><th>Alta</th></tr></thead>
        <tbody>
          ${ultimos.map(c=>`<tr onclick="abrirClienteDetalle(${c.id})" class="row-clickable">
            <td><div class="cell-name"><div class="av av-${planColor(c.plan)}">${esc(c.nombre[0])}</div>${esc(c.nombre)}</div></td>
            <td class="text-muted">${esc(c.ciudad)}</td>
            <td>${planBadge(c.plan)}</td>
            <td class="text-muted">${fmtFecha(c.alta)}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Pipeline activo</span><button class="link-btn" onclick="navegarSaas('pipeline')">Ver todo →</button></div>
      ${PIPELINE.filter(p=>p.estado==='activo'||p.estado==='negociando').map(p=>{
        const dias = Math.max(0, Math.ceil((new Date(p.fin_trial)-new Date())/(1000*60*60*24)));
        return `<div class="pipeline-item" onclick="abrirPipelineDetalle('${esc(p.id)}')">
          <div class="pipeline-av av-purple">${esc(p.nombre[0])}</div>
          <div class="pipeline-body">
            <div class="pipeline-name">${esc(p.nombre)}</div>
            <div class="pipeline-meta">${esc(p.ciudad)} · ${planBadge(p.plan_interes)}</div>
          </div>
          <div class="pipeline-right">
            ${estadoBadge(p.estado)}
            <div class="pipeline-dias ${dias<=3?'urgent':''}">${dias}d restantes</div>
          </div>
        </div>`;
      }).join('')}
    </div>
  </div>
</div>`;
}
