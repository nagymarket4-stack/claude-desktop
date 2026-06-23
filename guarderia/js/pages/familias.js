function renderFamilias() {
  const alumno = state.alumnos.find(a => a.id === state.familiaAlumnoId) || state.alumnos[0];

  document.getElementById('page-familias').innerHTML = `
    <div class="p-4 md:p-8">
      <div class="mb-6 md:mb-8">
        <h2 class="text-xl md:text-2xl font-bold text-gray-800">Portal de Familias</h2>
        <p class="text-gray-500 text-sm mt-1">Consulta el estado y actividades de tu hijo</p>
      </div>

      <div class="card p-4 mb-6 flex items-center gap-4">
        <span class="text-sm font-medium text-gray-600">Ver estado de:</span>
        <select onchange="cambiarAlumnoFamilia(this.value)"
          class="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-green-400 font-medium text-gray-800">
          ${state.alumnos.map(a =>
            `<option value="${esc(a.id)}" ${a.id === alumno.id ? 'selected' : ''}>${esc(a.nombre)}</option>`
          ).join('')}
        </select>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <div class="lg:col-span-1 space-y-4">
          <div class="card p-6 text-center">
            <div class="w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-3xl mx-auto mb-4 ${esc(alumno.color)}">${esc(alumno.avatar)}</div>
            <h3 class="font-bold text-gray-800 text-lg">${esc(alumno.nombre)}</h3>
            <p class="text-gray-500 text-sm">${esc(alumno.edad)} años · ${esc(alumno.grupo)}</p>
            <div class="mt-4">${badge(alumno.estado)}</div>
          </div>

          <div class="card p-6">
            <h4 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Hoy</h4>
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Entrada</span>
                <span class="font-mono font-semibold text-gray-800">${esc(alumno.hora_entrada) || '—'}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Salida</span>
                <span class="font-mono font-semibold text-gray-800">${esc(alumno.hora_salida) || '—'}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Tutora</span>
                <span class="font-medium text-gray-800">${esc(tutoraDel(alumno.grupo))}</span>
              </div>
            </div>
          </div>

          <div class="card p-6">
            <h4 class="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wide">Contacto centro</h4>
            <div class="space-y-2 text-sm">
              <div class="flex items-center gap-2 text-gray-600"><span>📞</span> 91 234 56 78</div>
              <div class="flex items-center gap-2 text-gray-600"><span>✉️</span> info@guarderiasolyluna.es</div>
              <div class="flex items-center gap-2 text-gray-600"><span>📍</span> Calle Alegría, 12 · Madrid</div>
            </div>
          </div>
        </div>

        <div class="lg:col-span-2">
          <h3 class="font-semibold text-gray-800 mb-4">Actividades de hoy</h3>
          <div class="space-y-4">
            ${state.actividades
              .filter(a => a.publicada && (a.grupo === 'Todos' || a.grupo === alumno.grupo))
              .map(a => `
                <div class="card p-6">
                  <div class="flex items-start gap-4">
                    <div class="flex gap-1">
                      ${a.fotos.slice(0,2).map(f => `<span class="text-2xl">${esc(f)}</span>`).join('')}
                    </div>
                    <div class="flex-1">
                      <div class="flex items-start justify-between">
                        <h4 class="font-semibold text-gray-800">${esc(a.titulo)}</h4>
                        <span class="text-xs text-gray-400 ml-2 flex-shrink-0">${esc(a.fecha)}</span>
                      </div>
                      <p class="text-sm text-gray-600 mt-2 leading-relaxed">${esc(a.descripcion)}</p>
                      <div class="flex flex-wrap gap-1.5 mt-3">
                        ${a.etiquetas.map(t => tagBadge(t)).join('')}
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}

            ${state.actividades.filter(a => a.publicada && (a.grupo === 'Todos' || a.grupo === alumno.grupo)).length === 0 ?
              `<div class="card p-10 text-center">
                <p class="text-4xl mb-3">📋</p>
                <p class="text-gray-500 text-sm">No hay actividades publicadas para el grupo ${esc(alumno.grupo)} hoy</p>
              </div>` : ''
            }
          </div>

          <div class="card p-6 mt-4 bg-green-50 border border-green-100">
            <div class="flex items-start gap-3">
              <span class="text-2xl">💬</span>
              <div>
                <h4 class="font-semibold text-green-800 mb-1">Mensaje de la tutora</h4>
                <p class="text-sm text-green-700 leading-relaxed" id="msg-tutora"></p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  // Mensaje de tutora via textContent (nunca innerHTML con datos variables)
  const msg = alumno.estado === 'entrada'
    ? `${alumno.nombre} llegó a las ${alumno.hora_entrada} y está disfrutando de las actividades del día. ¡Todo va genial!`
    : alumno.estado === 'salida'
    ? `${alumno.nombre} fue recogido a las ${alumno.hora_salida}. Fue un día estupendo, ¡hasta mañana!`
    : `${alumno.nombre} no ha asistido hoy. Si necesitas justificar la ausencia, contáctanos.`;
  document.getElementById('msg-tutora').textContent = msg;
}

function cambiarAlumnoFamilia(id) {
  const parsed = parseInt(id, 10);
  if (!isNaN(parsed)) state.familiaAlumnoId = parsed;
  renderFamilias();
}

function tutoraDel(grupo) {
  const map = { Ositos:'Carmen R.', Conejitos:'Marta J.', Estrellitas:'Laura F.' };
  return map[grupo] || 'Ana D.';
}
