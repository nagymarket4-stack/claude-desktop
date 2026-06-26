function renderDashboard() {
  const presentes   = state.alumnos.filter(a => a.estado === 'entrada').length;
  const fuera       = state.alumnos.filter(a => a.estado === 'fuera' || a.estado === 'salida').length;
  const ausentes    = state.alumnos.filter(a => a.estado === 'ausente').length;
  const profActivos = state.profesores.filter(p => p.estado === 'fichado').length;
  const actHoy      = state.actividades.filter(a => a.fecha.startsWith('Hoy')).length;

  // Control de ratios: niños presentes por educador (referencia legal orientativa 1:8)
  const RATIO_MAX = 8;
  const ratio     = profActivos > 0 ? (presentes / profActivos) : presentes;
  const ratioOk   = profActivos > 0 && ratio <= RATIO_MAX;
  const ratioTxt  = profActivos > 0 ? `1 : ${ratio.toFixed(1).replace('.0','')}` : 'Sin personal fichado';

  document.getElementById('page-dashboard').innerHTML = `
    <div class="p-4 md:p-8">
      <div class="mb-6 md:mb-8">
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">Buenos días 👋</h2>
        <p class="text-gray-500 mt-1 capitalize">${esc(TODAY)}</p>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        ${statCard('👦','Alumnos presentes', presentes, 'bg-green-50','text-green-700','text-green-600')}
        ${statCard('🚪','Fuera del centro', fuera, 'bg-amber-50','text-amber-700','text-amber-600')}
        ${statCard('😴','Ausentes', ausentes, 'bg-yellow-50','text-yellow-700','text-yellow-600')}
        ${statCard('👩‍🏫','Profesores activos', profActivos, 'bg-blue-50','text-blue-700','text-blue-600')}
      </div>

      <div class="card p-5 mb-8 ${ratioOk ? 'bg-green-50' : 'bg-amber-50'}">
        <div class="flex items-center gap-4">
          <span class="text-3xl">${ratioOk ? '✅' : '⚠️'}</span>
          <div class="flex-1">
            <p class="font-semibold text-gray-800">Control de ratios · ${esc(ratioTxt)}</p>
            <p class="text-xs ${ratioOk ? 'text-green-700' : 'text-amber-700'} mt-0.5">
              ${profActivos > 0
                ? (ratioOk
                    ? `Dentro de ratio: ${presentes} niños / ${profActivos} educadores (máx. orientativo 1:${RATIO_MAX}).`
                    : `Fuera de ratio: ${presentes} niños / ${profActivos} educadores. Refuerza el personal presente.`)
                : 'No hay personal fichado. Registra la entrada del equipo en Fichajes.'}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Últimos registros</h3>
            <button onclick="navigate('alumnos')" class="text-green-600 text-sm hover:underline">Ver todos →</button>
          </div>
          <div class="space-y-3">
            ${state.alumnos.slice(0,5).map(a => `
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${esc(a.color)}">${esc(a.avatar)}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-800 truncate">${esc(a.nombre)}</p>
                  <p class="text-xs text-gray-400">${esc(a.grupo)}</p>
                </div>
                ${badge(a.estado)}
                <span class="text-xs text-gray-400">${esc(a.hora_entrada) || '—'}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="card p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-800">Actividades de hoy <span class="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full ml-1">${esc(actHoy)}</span></h3>
            <button onclick="navigate('actividades')" class="text-green-600 text-sm hover:underline">Ver todas →</button>
          </div>
          <div class="space-y-3">
            ${state.actividades.filter(a=>a.fecha.startsWith('Hoy')).map(a => `
              <div class="border border-gray-100 rounded-xl p-3">
                <div class="flex items-start gap-2">
                  <span class="text-xl">${esc(a.fotos[0])}</span>
                  <div>
                    <p class="text-sm font-medium text-gray-800">${esc(a.titulo)}</p>
                    <p class="text-xs text-gray-400 mt-0.5">${esc(a.grupo)} · ${esc(a.fecha)}</p>
                    <div class="flex flex-wrap gap-1 mt-2">
                      ${a.etiquetas.map(t => tagBadge(t)).join('')}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    </div>
  `;
}

function statCard(icon, label, value, bg, textColor, numColor) {
  return `
    <div class="card p-5 ${bg}">
      <div class="flex items-center gap-3">
        <span class="text-2xl">${icon}</span>
        <div>
          <p class="text-3xl font-bold ${numColor}">${esc(value)}</p>
          <p class="text-xs ${textColor} mt-0.5">${esc(label)}</p>
        </div>
      </div>
    </div>
  `;
}
