// ─── Control de planes (gating de funciones por suscripción) ─────────────────
// "Con maldad": cada plan abre SOLO lo suyo. Quien tenga el plan barato ve las
// funciones premium bajo candado, que al pulsar muestran el muro de mejora.
//
// IMPORTANTE: esto es la capa de UX (disuade al 99% de usuarios reales). El
// blindaje real anti-manipulación se hace en el servidor (ver SQL/Edge Function).

const PLAN_NIVEL = { starter: 1, pro: 2, enterprise: 3 };
const PLAN_NOMBRE = { starter: 'Starter', pro: 'Pro', enterprise: 'Enterprise' };

// Plan mínimo requerido por cada página. Las no listadas = starter (incluidas).
const FEATURE_PLAN = {
  // Pro
  bienestar: 'pro', bano: 'pro', salud: 'pro', fichajes: 'pro',
  facturacion: 'pro', matriculas: 'pro', comunicados: 'pro', eventos: 'pro', menus: 'pro',
  'padre-facturas': 'pro', 'padre-agenda': 'pro', 'padre-comunicados': 'pro',
  // Enterprise
  desarrollo: 'enterprise', 'padre-informes': 'enterprise',
};

// Límites por plan (alumnos y profesores)
const PLAN_LIMITES = {
  starter:    { alumnos: 30,  profesores: 5  },
  pro:        { alumnos: 100, profesores: 20 },
  enterprise: { alumnos: Infinity, profesores: Infinity },
};

// Plan efectivo del centro actual.
// El demo muestra TODO (escaparate). Para un cliente real, si no se conoce el
// plan se asume el más restrictivo (starter) — nunca regalar funciones.
function planActual() {
  if (typeof TENANT !== 'undefined' && TENANT === 'demo') return 'enterprise';
  const p = (typeof SUSCRIPCION !== 'undefined' && SUSCRIPCION && SUSCRIPCION.plan) ? SUSCRIPCION.plan : 'starter';
  return PLAN_NIVEL[p] ? p : 'starter';
}

function planRequerido(page) { return FEATURE_PLAN[page] || 'starter'; }

// ¿El plan del centro permite esta página?
function tieneAccesoPlan(page) {
  return PLAN_NIVEL[planActual()] >= PLAN_NIVEL[planRequerido(page)];
}

function limitesPlan() { return PLAN_LIMITES[planActual()] || PLAN_LIMITES.starter; }

// ¿Puede añadir un alumno/profesor más sin pasarse del límite del plan?
function puedeAnadir(tipo) {
  const lim = limitesPlan()[tipo];
  const actual = (state[tipo] || []).length;
  return actual < lim;
}

// Avisa (con maldad) cuando se alcanza el tope; devuelve true si se debe bloquear.
function bloquearPorLimite(tipo) {
  if (puedeAnadir(tipo)) return false;
  const lim = limitesPlan()[tipo];
  const nombre = tipo === 'alumnos' ? 'alumnos' : 'profesores';
  const sugerido = planActual() === 'starter' ? 'Pro' : 'Enterprise';
  showToast(`Límite del plan ${PLAN_NOMBRE[planActual()]}: ${lim} ${nombre}. Mejora a ${sugerido} para añadir más.`);
  if (typeof esAdmin === 'function' && esAdmin()) setTimeout(() => muroUpgrade(tipo === 'alumnos' ? 'alumnos-limite' : 'profesores-limite'), 600);
  return true;
}

// ─── Muro de mejora (upsell) ──────────────────────────────────────────────────
const FEATURE_INFO = {
  bienestar:'Bienestar, comidas y sueño', bano:'Baño y pañales', salud:'Salud y autorizaciones',
  fichajes:'Fichaje del personal', facturacion:'Facturación y cobros', matriculas:'Matrículas y lista de espera',
  comunicados:'Comunicados y encuestas', eventos:'Calendario y eventos', menus:'Menú del comedor',
  desarrollo:'Desarrollo e informes', 'padre-facturas':'Facturas', 'padre-agenda':'Calendario y menú',
  'padre-comunicados':'Comunicados', 'padre-informes':'Informes de desarrollo',
  'alumnos-limite':'Más alumnos', 'profesores-limite':'Más profesores',
};

// Re-pinta menús y página según el plan ya cargado (corrige el gating cuando
// SUSCRIPCION llega después del primer render del menú).
function refrescarPortalPorPlan() {
  if (!sesionActual) return;
  if (sesionActual.rol === 'padre') {
    if (typeof renderSidebarPadres === 'function') renderSidebarPadres();
    if (typeof renderBottomNavPadres === 'function') renderBottomNavPadres();
  } else {
    if (typeof renderSidebarStaff === 'function') renderSidebarStaff();
    if (typeof renderBottomNavStaff === 'function') renderBottomNavStaff();
  }
  const inicio = sesionActual.rol === 'padre' ? 'padre-inicio' : 'dashboard';
  navigate(state.currentPage || inicio);
  if (typeof aplicarBloqueoSuscripcion === 'function') aplicarBloqueoSuscripcion();
}

function muroUpgrade(page) {
  const req = (page === 'alumnos-limite') ? 'pro' : (page === 'profesores-limite') ? 'pro' : planRequerido(page);
  const nombrePlan = PLAN_NOMBRE[req] || 'Pro';
  const feature = FEATURE_INFO[page] || PAGE_TITLES[page] || 'Esta función';
  const esFamilia = sesionActual?.rol === 'padre';

  // Renderiza el muro en la página activa (no navegamos a la función bloqueada)
  const destino = state.currentPage && document.getElementById('page-' + state.currentPage)
    ? 'page-' + state.currentPage : 'page-' + (esFamilia ? 'padre-inicio' : 'dashboard');
  const el = document.getElementById(destino);
  if (!el) return;

  el.innerHTML = `
  <div class="p-6 md:p-10 max-w-lg mx-auto text-center">
    <div class="w-20 h-20 mx-auto mb-5 rounded-3xl bg-amber-50 flex items-center justify-center text-4xl">🔒</div>
    <span class="inline-block text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 mb-4">Plan ${esc(nombrePlan)}</span>
    <h2 class="text-2xl font-bold text-gray-800 mb-2">${esc(feature)} está en el plan ${esc(nombrePlan)}</h2>
    <p class="text-gray-500 text-sm mb-6">
      ${esFamilia
        ? 'Esta sección no está disponible en el plan contratado por tu centro. Habla con la dirección para activarla.'
        : `Tu centro tiene el plan <b>${esc(PLAN_NOMBRE[planActual()])}</b>. Mejora a <b>${esc(nombrePlan)}</b> para desbloquear ${esc(feature.toLowerCase())} y mucho más.`}
    </p>
    ${!esFamilia && typeof esAdmin === 'function' && esAdmin() ? `
      <button onclick="iniciarPagoSuscripcion('${req}')" class="w-full bg-green-600 text-white py-3 rounded-xl font-medium text-sm hover:bg-green-700 mb-2">
        ⚡ Mejorar a ${esc(nombrePlan)}
      </button>
      <button onclick="navigate('${esFamilia ? 'padre-inicio' : 'dashboard'}')" class="text-gray-400 text-sm hover:text-gray-600">Volver</button>
    ` : `
      <button onclick="navigate('${esFamilia ? 'padre-inicio' : 'dashboard'}')" class="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200">Volver</button>
    `}
  </div>`;
  // Mostrar la página destino
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  el.classList.remove('hidden');
}
