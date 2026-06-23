function renderProfesores() {
  const activos = state.profesores.filter(p => p.estado === 'fichado').length;

  document.getElementById('page-profesores').innerHTML = `
    <div class="p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Fichaje de Profesores</h2>
          <p class="text-gray-500 mt-1">${esc(activos)} de ${esc(state.profesores.length)} profesores en turno</p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8" id="cards-profesores">
        ${profesoresCards()}
      </div>

      <div class="card p-6">
        <h3 class="font-semibold text-gray-800 mb-4">Historial del día</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100">
                <th class="text-left py-3 font-semibold text-gray-600">Profesora</th>
                <th class="text-left py-3 font-semibold text-gray-600">Cargo</th>
                <th class="text-left py-3 font-semibold text-gray-600">Entrada</th>
                <th class="text-left py-3 font-semibold text-gray-600">Salida</th>
                <th class="text-left py-3 font-semibold text-gray-600">Horas</th>
                <th class="text-left py-3 font-semibold text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              ${state.profesores.map(p => {
                let horas = '—';
                if (p.hora_entrada && p.hora_salida) {
                  const [eh,em] = p.hora_entrada.split(':').map(Number);
                  const [sh,sm] = p.hora_salida.split(':').map(Number);
                  const diff = (sh*60+sm) - (eh*60+em);
                  horas = `${Math.floor(diff/60)}h ${diff%60}m`;
                } else if (p.hora_entrada) {
                  const [eh,em] = p.hora_entrada.split(':').map(Number);
                  const now = new Date();
                  const diff = (now.getHours()*60+now.getMinutes()) - (eh*60+em);
                  horas = `${Math.floor(diff/60)}h ${diff%60}m`;
                }
                return `
                  <tr class="border-b border-gray-50">
                    <td class="py-3">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${esc(p.color)}">${esc(p.avatar)}</div>
                        <span class="font-medium text-gray-800">${esc(p.nombre)}</span>
                      </div>
                    </td>
                    <td class="py-3 text-gray-500">${esc(p.cargo)}</td>
                    <td class="py-3 font-mono text-xs text-gray-700">${esc(p.hora_entrada) || '—'}</td>
                    <td class="py-3 font-mono text-xs text-gray-700">${esc(p.hora_salida) || '—'}</td>
                    <td class="py-3 text-sm font-medium text-green-700">${esc(horas)}</td>
                    <td class="py-3">${badge(p.estado)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function profesoresCards() {
  return state.profesores.map(p => `
    <div class="card p-6">
      <div class="flex items-start gap-4 mb-4">
        <div class="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${esc(p.color)}">${esc(p.avatar)}</div>
        <div class="flex-1">
          <h4 class="font-semibold text-gray-800">${esc(p.nombre)}</h4>
          <p class="text-sm text-gray-500">${esc(p.cargo)}</p>
        </div>
        ${badge(p.estado)}
      </div>
      <div class="grid grid-cols-2 gap-3 text-center mb-4">
        <div class="bg-gray-50 rounded-xl p-3">
          <p class="text-xs text-gray-400 mb-1">Entrada</p>
          <p class="font-mono text-sm font-semibold text-gray-700">${esc(p.hora_entrada) || '—'}</p>
        </div>
        <div class="bg-gray-50 rounded-xl p-3">
          <p class="text-xs text-gray-400 mb-1">Salida</p>
          <p class="font-mono text-sm font-semibold text-gray-700">${esc(p.hora_salida) || '—'}</p>
        </div>
      </div>
      ${p.estado === 'fichado' ?
        `<button onclick="ficharSalidaProfesor(${p.id})" class="w-full bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
          🔴 Fichar salida
        </button>` :
        `<button onclick="ficharEntradaProfesor(${p.id})" class="w-full bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
          🟢 Fichar entrada
        </button>`
      }
    </div>
  `).join('');
}

function ficharEntradaProfesor(id) {
  const p = state.profesores.find(x => x.id === id);
  p.estado = 'fichado';
  p.hora_entrada = horaActual();
  p.hora_salida = null;
  renderProfesores();
  showToast(`${p.nombre} fichó entrada a las ${p.hora_entrada}`);
}

function ficharSalidaProfesor(id) {
  const p = state.profesores.find(x => x.id === id);
  p.estado = 'salida';
  p.hora_salida = horaActual();
  renderProfesores();
  showToast(`${p.nombre} fichó salida a las ${p.hora_salida}`);
}
