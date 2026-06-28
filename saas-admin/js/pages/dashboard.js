
// MRR acumulado real por mes (clientes activos dados de alta hasta fin de cada mes)
function mrrPorMes(n = 6) {
  const out = []; const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const fin = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    let label = d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
    label = label.charAt(0).toUpperCase() + label.slice(1);
    const mrr = CLIENTES.filter(c => c.estado === 'activo' && c.alta && new Date(c.alta) <= fin)
      .reduce((s, c) => s + (c.mrr || 0), 0);
    out.push({ mes: label, mrr });
  }
  return out;
}

function renderDashboard() {
  const mrr = calcMRR();
  const arr = calcARR();
  const activos = CLIENTES.filter(c => c.estado === 'activo').length;
  const total   = CLIENTES.length;
  const trials  = PIPELINE.filter(p => p.estado === 'activo' || p.estado === 'negociando').length;
  const arpu    = activos ? Math.round(mrr / activos) : 0;
  const conversion = (activos + trials) ? Math.round(activos / (activos + trials) * 100) : 0;

  const starter = CLIENTES.filter(c => c.plan === 'starter' && c.estado === 'activo').length;
  const pro     = CLIENTES.filter(c => c.plan === 'pro' && c.estado === 'activo').length;
  const ent     = CLIENTES.filter(c => c.plan === 'enterprise' && c.estado === 'activo').length;
  const pct = (x) => activos ? Math.round(x / activos * 100) : 0;

  const ultimos = [...CLIENTES].sort((a, b) => (b.alta || '').localeCompare(a.alta || '')).slice(0, 5);

  // Crecimiento real de MRR
  const hist = mrrPorMes(6);
  const maxMrr = Math.max(1, ...hist.map(m => m.mrr));
  const mrrPrev = hist.length > 1 ? hist[hist.length - 2].mrr : 0;
  const growth = mrrPrev ? Math.round((mrr - mrrPrev) / mrrPrev * 100) : (mrr ? 100 : 0);
  const growthUp = growth >= 0;

  // Trials que caducan pronto (≤ 3 días) — accionable
  const caducan = PIPELINE
    .filter(p => p.estado === 'activo' || p.estado === 'negociando')
    .map(p => ({ ...p, dias: Math.ceil((new Date(p.fin_trial) - new Date()) / 86400000) }))
    .filter(p => p.dias <= 3)
    .sort((a, b) => a.dias - b.dias);

  document.getElementById('main-content').innerHTML = `
<div class="page-content">
  <div class="page-header">
    <h1 class="page-title">Dashboard</h1>
    <span class="page-subtitle">Resumen del negocio · ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
  </div>

  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon kpi-purple"><i class="ti ti-trending-up" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">MRR</div>
        <div class="kpi-value">${fmtEuro(mrr)}</div>
        <div class="kpi-delta ${growthUp ? 'up' : 'down'}">${growthUp ? '↑' : '↓'} ${growthUp ? '+' : ''}${growth}% vs mes anterior</div>
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
        <div class="kpi-delta up">de ${total} en total</div>
      </div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-amber"><i class="ti ti-user-dollar" aria-hidden="true"></i></div>
      <div class="kpi-body">
        <div class="kpi-label">ARPU</div>
        <div class="kpi-value">${fmtEuro(arpu)}</div>
        <div class="kpi-delta up">ingreso medio por cliente</div>
      </div>
    </div>
  </div>

  <!-- Métricas secundarias -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-icon kpi-blue"><i class="ti ti-flask" aria-hidden="true"></i></div>
      <div class="kpi-body"><div class="kpi-label">Trials / oportunidades</div><div class="kpi-value">${trials}</div>
        <div class="kpi-delta up">en el pipeline</div></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-green"><i class="ti ti-target-arrow" aria-hidden="true"></i></div>
      <div class="kpi-body"><div class="kpi-label">Conversión</div><div class="kpi-value">${conversion}%</div>
        <div class="kpi-delta up">activos vs oportunidades</div></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-amber"><i class="ti ti-arrow-down-circle" aria-hidden="true"></i></div>
      <div class="kpi-body"><div class="kpi-label">Churn rate</div><div class="kpi-value">${calcChurn()}%</div>
        <div class="kpi-delta ${parseFloat(calcChurn()) > 5 ? 'down' : 'up'}">cancelaciones</div></div>
    </div>
    <div class="kpi-card">
      <div class="kpi-icon kpi-purple"><i class="ti ti-alarm" aria-hidden="true"></i></div>
      <div class="kpi-body"><div class="kpi-label">Trials caducando</div><div class="kpi-value">${caducan.length}</div>
        <div class="kpi-delta ${caducan.length ? 'down' : 'up'}">en ≤ 3 días</div></div>
    </div>
  </div>

  <div class="dash-grid">
    <div class="card">
      <div class="card-header"><span class="card-title">Crecimiento MRR</span><span class="card-sub">Últimos 6 meses (real)</span></div>
      <div class="chart-area">
        ${hist.map((m, i) => {
          const h = Math.round((m.mrr / maxMrr) * 100);
          const isLast = i === hist.length - 1;
          return `<div class="bar-col">
            <div class="bar-val">${isLast ? fmtEuro(m.mrr) : ''}</div>
            <div class="bar-wrap"><div class="bar-fill ${isLast ? 'bar-last' : ''}" style="height:${Math.max(h, 2)}%"></div></div>
            <div class="bar-label">${esc(m.mes)}</div>
          </div>`;
        }).join('')}
      </div>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Distribución de planes</span><span class="card-sub">${activos} activos</span></div>
      <div class="plan-dist">
        ${[
          { n: 'Pro · €79/mes', c: pro, mrr: pro * 79, cls: 'bg-purple' },
          { n: 'Enterprise · €199/mes', c: ent, mrr: ent * 199, cls: 'bg-amber' },
          { n: 'Starter · €29/mes', c: starter, mrr: starter * 29, cls: 'bg-green' },
        ].map(r => `
        <div class="plan-dist-row">
          <div class="plan-dist-color ${r.cls}"></div>
          <div class="plan-dist-name">${r.n}</div>
          <div class="plan-dist-count">${r.c} centros</div>
          <div class="plan-dist-mrr">${fmtEuro(r.mrr)}</div>
          <div class="plan-dist-bar-wrap"><div class="plan-dist-bar ${r.cls}" style="width:${pct(r.c)}%"></div></div>
        </div>`).join('')}
      </div>
      <div class="plan-dist-trials">
        <i class="ti ti-flask" aria-hidden="true"></i> ${trials} oportunidades activas
        <button class="link-btn" onclick="navegarSaas('pipeline')">Ver pipeline →</button>
      </div>
    </div>
  </div>

  ${caducan.length ? `
  <div class="card" style="border:1px solid #fde68a;background:#fffbeb;">
    <div class="card-header"><span class="card-title">⏰ Trials que caducan en ≤ 3 días</span><span class="card-sub">Contáctalos para convertir</span></div>
    ${caducan.map(p => `
      <div class="pipeline-item" onclick="abrirPipelineDetalle('${esc(p.id)}')">
        <div class="pipeline-av av-amber">${esc(p.nombre[0])}</div>
        <div class="pipeline-body">
          <div class="pipeline-name">${esc(p.nombre)}</div>
          <div class="pipeline-meta">${esc(p.ciudad)} · ${esc(p.email || '')}</div>
        </div>
        <div class="pipeline-right">
          <div class="pipeline-dias urgent">${p.dias <= 0 ? 'Caduca hoy' : p.dias + 'd'}</div>
        </div>
      </div>`).join('')}
  </div>` : ''}

  <div class="dash-grid-2">
    <div class="card">
      <div class="card-header"><span class="card-title">Últimas altas</span><button class="link-btn" onclick="navegarSaas('clientes')">Ver todos →</button></div>
      <table class="data-table">
        <thead><tr><th>Centro</th><th>Ciudad</th><th>Plan</th><th>Alta</th></tr></thead>
        <tbody>
          ${ultimos.map(c => `<tr onclick="abrirClienteDetalle('${c.id}')" class="row-clickable">
            <td><div class="cell-name"><div class="av av-${planColor(c.plan)}">${esc(c.nombre[0])}</div>${esc(c.nombre)}</div></td>
            <td class="text-muted">${esc(c.ciudad)}</td>
            <td>${planBadge(c.plan)}</td>
            <td class="text-muted">${fmtFecha(c.alta)}</td>
          </tr>`).join('') || '<tr><td colspan="4" class="text-muted" style="text-align:center;padding:20px;">Sin clientes todavía</td></tr>'}
        </tbody>
      </table>
    </div>

    <div class="card">
      <div class="card-header"><span class="card-title">Pipeline activo</span><button class="link-btn" onclick="navegarSaas('pipeline')">Ver todo →</button></div>
      ${PIPELINE.filter(p => p.estado === 'activo' || p.estado === 'negociando').slice(0, 6).map(p => {
        const dias = Math.max(0, Math.ceil((new Date(p.fin_trial) - new Date()) / 86400000));
        return `<div class="pipeline-item" onclick="abrirPipelineDetalle('${esc(p.id)}')">
          <div class="pipeline-av av-purple">${esc(p.nombre[0])}</div>
          <div class="pipeline-body">
            <div class="pipeline-name">${esc(p.nombre)}</div>
            <div class="pipeline-meta">${esc(p.ciudad)} · ${planBadge(p.plan_interes)}</div>
          </div>
          <div class="pipeline-right">
            ${estadoBadge(p.estado)}
            <div class="pipeline-dias ${dias <= 3 ? 'urgent' : ''}">${dias}d restantes</div>
          </div>
        </div>`;
      }).join('') || '<p class="text-muted" style="padding:12px;">Sin oportunidades en el pipeline</p>'}
    </div>
  </div>
</div>`;
}
