// ─── Registro de fichajes de profesores (solo superadmin) ─────────────────────

function renderFichajes() {
  const el = document.getElementById('page-fichajes');
  if (sesionActual?.rol !== 'superadmin') {
    el.innerHTML = `<div class="p-8 text-center text-gray-400"><p class="text-5xl mb-4">🔒</p><p>Acceso restringido al superadministrador.</p></div>`;
    return;
  }

  const fichajes = (state.fichajes || []).slice();
  // Agrupar por fecha (más reciente primero)
  const porFecha = {};
  fichajes.forEach(f => { (porFecha[f.fechaISO || f.fecha] = porFecha[f.fechaISO || f.fecha] || []).push(f); });
  const fechasOrden = Object.keys(porFecha).sort().reverse();

  const hoyISO = new Date().toISOString().slice(0,10);
  const resumenHoy = calcularHorasDia(porFecha[hoyISO] || []);

  el.innerHTML = `
    <div class="p-4 md:p-8">
      <div class="flex items-center justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 class="text-xl md:text-2xl font-bold text-gray-800">🕓 Registro de fichajes</h2>
          <p class="text-gray-500 text-sm mt-1">Entradas y salidas del personal · solo superadmin</p>
        </div>
        <button onclick="exportarFichajesCSV()" class="bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors flex-shrink-0">
          ⬇ <span class="hidden sm:inline">Exportar CSV</span>
        </button>
      </div>

      <!-- Resumen de horas de hoy -->
      <div class="mb-8">
        <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Horas trabajadas hoy</h3>
        ${resumenHoy.length === 0
          ? `<div class="card p-6 text-center text-gray-400 text-sm">Todavía no hay fichajes hoy.</div>`
          : `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              ${resumenHoy.map(r => `
                <div class="card p-4 flex items-center gap-3">
                  <div class="w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${esc(r.color||'av-blue')}">${esc(r.nombre[0])}</div>
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-800 text-sm truncate">${esc(r.nombre)}</p>
                    <p class="text-xs text-gray-400">${r.entrada || '—'} → ${r.salida || (r.enTurno ? 'en turno' : '—')}</p>
                  </div>
                  <span class="text-sm font-bold text-green-700">${r.horas}</span>
                </div>`).join('')}
            </div>`
        }
      </div>

      <!-- Histórico completo -->
      <h3 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h3>
      ${fechasOrden.length === 0
        ? `<div class="card p-8 text-center text-gray-400"><p class="text-4xl mb-2">📋</p><p class="text-sm">Sin fichajes registrados todavía.</p></div>`
        : fechasOrden.map(fISO => {
            const lista = porFecha[fISO].slice().reverse();
            const fechaTxt = lista[0]?.fecha || fISO;
            return `
            <div class="card overflow-hidden mb-4">
              <div class="bg-gray-50 px-5 py-3 border-b border-gray-100 font-semibold text-gray-700 text-sm">${esc(fechaTxt)}</div>
              <div class="divide-y divide-gray-50">
                ${lista.map(f => `
                  <div class="flex items-center gap-3 px-5 py-3">
                    <span class="text-lg">${f.tipo === 'entrada' ? '🟢' : '🔴'}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-800 truncate">${esc(f.nombre)}</p>
                      <p class="text-xs text-gray-400 truncate">${esc(f.cargo || '')}</p>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full ${f.tipo === 'entrada' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}">${f.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span>
                    <span class="font-mono text-sm text-gray-700 w-12 text-right">${esc(f.hora)}</span>
                  </div>`).join('')}
              </div>
            </div>`;
          }).join('')
      }
    </div>`;
}

// Empareja entrada/salida por profesor en un día y calcula horas
function calcularHorasDia(lista) {
  const porProf = {};
  lista.forEach(f => { (porProf[f.profesorId] = porProf[f.profesorId] || []).push(f); });
  return Object.values(porProf).map(eventos => {
    const ordenados = eventos.slice().sort((a,b) => (a.hora||'').localeCompare(b.hora||''));
    const entrada = ordenados.find(e => e.tipo === 'entrada')?.hora || null;
    const salidas = ordenados.filter(e => e.tipo === 'salida');
    const salida  = salidas.length ? salidas[salidas.length-1].hora : null;
    const enTurno = !salida || (ordenados[ordenados.length-1]?.tipo === 'entrada');
    const prof = state.profesores.find(p => p.id === eventos[0].profesorId);
    let horas = '—';
    if (entrada) {
      const fin = salida || horaActual();
      const [eh,em] = entrada.split(':').map(Number);
      const [sh,sm] = fin.split(':').map(Number);
      let diff = (sh*60+sm) - (eh*60+em);
      if (diff < 0) diff = 0;
      horas = `${Math.floor(diff/60)}h ${diff%60}m`;
    }
    return { nombre: eventos[0].nombre, color: prof?.color, entrada, salida, enTurno, horas };
  });
}

function exportarFichajesCSV() {
  const fichajes = (state.fichajes || []);
  if (fichajes.length === 0) { showToast('No hay fichajes para exportar'); return; }
  const cabecera = ['Fecha','Profesor','Cargo','Tipo','Hora'];
  const filas = fichajes
    .slice()
    .sort((a,b) => (a.fechaISO+a.hora).localeCompare(b.fechaISO+b.hora))
    .map(f => [f.fecha, f.nombre, f.cargo||'', f.tipo==='entrada'?'Entrada':'Salida', f.hora]);
  const csv = [cabecera, ...filas].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type:'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fichajes_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('CSV de fichajes descargado');
}
