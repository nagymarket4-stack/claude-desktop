// ─── Integración con Supabase (multi-cliente + tiempo real) ───────────────────
const SB_URL = 'https://ylwxsawiixvtjttsogzu.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3hzYXdpaXh2dGp0dHNvZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjMwMDEsImV4cCI6MjA5Nzc5OTAwMX0.mVckH5Yp_J1uZbUzX1XFihCxz8HHgqAYfJT_2UWvHgw';

// Cada cliente (guardería) es un "tenant" identificado en la URL: ?cliente=slug
// Por defecto 'demo' (la guardería de demostración Sol & Luna).
const TENANT = (new URLSearchParams(location.search).get('cliente') || 'demo')
  .toLowerCase().replace(/[^a-z0-9_-]/g, '');
// Prefijo de las claves de app_data para aislar los datos de cada cliente
const claveT = (k) => `${TENANT}__${k}`;

let sb = null;
try {
  if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY);
} catch (e) { console.warn('No se pudo iniciar Supabase:', e); }

// Datos generales que viven en la tabla app_data (clave-valor JSON)
const DATA_KEYS = ['alumnos', 'profesores', 'actividades', 'bienestar', 'familias', 'usuarios', 'fichajes', 'bano',
  'facturas', 'comunicados', 'eventos', 'menus', 'desarrollo', 'matriculas', 'salud'];

function supabaseActivo() { return !!sb; }

// ── Suscripción del cliente (estado trial/activo, días restantes) ─────────────
let SUSCRIPCION = null;

async function cargarSuscripcion() {
  if (!sb || TENANT === 'demo') { SUSCRIPCION = null; return; }
  try {
    const { data } = await sb.from('tenants').select('*').eq('id', TENANT).maybeSingle();
    SUSCRIPCION = data || null;
  } catch (e) { SUSCRIPCION = null; }
}

function diasTrialRestantes() {
  if (!SUSCRIPCION?.trial_fin) return null;
  const fin = new Date(SUSCRIPCION.trial_fin + 'T23:59:59');
  return Math.ceil((fin - new Date()) / 86400000);
}

// Llama a la Edge Function para crear la sesión de pago y redirige a Stripe
async function iniciarPagoSuscripcion(planOverride) {
  if (!sb) return;
  const plan = planOverride || SUSCRIPCION?.plan || 'pro';
  const email = SUSCRIPCION?.email || '';
  try {
    const resp = await fetch(`${SB_URL}/functions/v1/crear-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY, 'apikey': SB_KEY },
      body: JSON.stringify({ tenant: TENANT, plan, email, returnUrl: location.origin + location.pathname }),
    });
    const data = await resp.json();
    if (data.url) { location.href = data.url; }
    else { showToast('No se pudo iniciar el pago: ' + (data.error || 'error')); }
  } catch (e) {
    showToast('Error al conectar con la pasarela de pago');
  }
}

// ── Reconstruye state.mensajes (agrupado por alumno) desde filas de la tabla ──
function reconstruirMensajes(rows) {
  const m = {};
  state.alumnos.forEach(a => { m[a.id] = []; });
  rows.forEach(r => {
    (m[r.alumno_id] = m[r.alumno_id] || []).push({
      id: r.id, de: r.de, texto: r.texto, hora: r.hora, leido: r.leido,
    });
  });
  state.mensajes = m;
}

// ── Carga inicial desde Supabase (auto-rellena las claves que falten) ─────────
async function cargarDeSupabase() {
  if (!sb) throw new Error('cliente no disponible');

  const { data: rows, error } = await sb.from('app_data').select('key,value').like('key', TENANT + '__%');
  if (error) throw error;

  const presentes = {};
  (rows || []).forEach(r => {
    const k = r.key.slice(TENANT.length + 2); // quitar 'tenant__'
    presentes[k] = true;
    if (k === 'configuracion') Object.assign(CONFIGURACION, r.value);
    else if (DATA_KEYS.includes(k)) state[k] = r.value;
  });

  // Sembrar los bloques que falten (cliente nuevo o incompleto)
  const defaults = {
    alumnos: ALUMNOS, profesores: PROFESORES, actividades: ACTIVIDADES,
    bienestar: BIENESTAR_INIT, familias: FAMILIAS_INIT, usuarios: USUARIOS_INIT,
    facturas: FACTURAS_INIT, comunicados: COMUNICADOS_INIT, eventos: EVENTOS_INIT,
    menus: MENUS_INIT, desarrollo: DESARROLLO_INIT, matriculas: MATRICULAS_INIT, salud: SALUD_INIT,
  };
  const faltan = [];
  for (const [k, v] of Object.entries(defaults)) {
    if (!presentes[k]) { state[k] = JSON.parse(JSON.stringify(v)); faltan.push({ key: claveT(k), value: state[k] }); }
  }
  if (!presentes['configuracion']) faltan.push({ key: claveT('configuracion'), value: CONFIGURACION });
  if (faltan.length) await sb.from('app_data').upsert(faltan);

  const { data: msgs } = await sb.from('mensajes').select('*').eq('tenant', TENANT).order('id');
  if (msgs && msgs.length) reconstruirMensajes(msgs);
  else if (TENANT === 'demo') await sembrarMensajes();  // solo el demo arranca con mensajes de muestra
  else state.mensajes = {};                              // cliente real: chat vacío
}

async function sembrarMensajes() {
  const filas = [];
  Object.entries(MENSAJES_INIT).forEach(([aid, arr]) => {
    arr.forEach(m => filas.push({ tenant: TENANT, alumno_id: +aid, de: m.de, texto: m.texto, hora: m.hora, leido: m.leido }));
  });
  if (filas.length) await sb.from('mensajes').insert(filas);
  const { data: msgs } = await sb.from('mensajes').select('*').eq('tenant', TENANT).order('id');
  reconstruirMensajes(msgs || []);
}

// ── Guardar un bloque de datos generales en la nube ───────────────────────────
async function guardarDato(key) {
  if (!sb) return;
  const value = key === 'configuracion' ? CONFIGURACION : state[key];
  try {
    await sb.from('app_data').upsert({ key: claveT(key), value, updated_at: new Date().toISOString() });
  } catch (e) { console.warn('Error guardando', key, e); }
}

// ── Mensajes ──────────────────────────────────────────────────────────────────
async function enviarMensajeRemoto(alumnoId, de, texto) {
  if (!sb) return false;
  const { error } = await sb.from('mensajes').insert({
    tenant: TENANT, alumno_id: alumnoId, de, texto, hora: horaActual(), leido: false,
  });
  return !error;
}

// desde: 'familia' marca como leídos los del centro · 'centro' marca los de las familias
async function marcarLeidosRemoto(alumnoId, desde) {
  if (!sb) return;
  let q = sb.from('mensajes').update({ leido: true }).eq('tenant', TENANT).eq('alumno_id', alumnoId).eq('leido', false);
  q = desde === 'familia' ? q.eq('de', 'centro') : q.neq('de', 'centro');
  try { await q; } catch (e) {}
}

// ── Suscripción en tiempo real (solo de este cliente) ─────────────────────────
function suscribirRealtime() {
  if (!sb) return;

  sb.channel('rt-mensajes-' + TENANT)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes', filter: `tenant=eq.${TENANT}` }, async () => {
      const { data } = await sb.from('mensajes').select('*').eq('tenant', TENANT).order('id');
      reconstruirMensajes(data || []);
      if (sesionActual) refrescarPaginaActual();
    })
    .subscribe();

  sb.channel('rt-appdata-' + TENANT)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, async (payload) => {
      // Solo recargar si el cambio es de este cliente
      const k = payload.new?.key || payload.old?.key || '';
      if (!k.startsWith(TENANT + '__')) return;
      const { data } = await sb.from('app_data').select('key,value').like('key', TENANT + '__%');
      (data || []).forEach(r => {
        const kk = r.key.slice(TENANT.length + 2);
        if (kk === 'configuracion') Object.assign(CONFIGURACION, r.value);
        else if (DATA_KEYS.includes(kk)) state[kk] = r.value;
      });
      aplicarConfiguracion();
      if (sesionActual) refrescarPaginaActual();
    })
    .subscribe();
}

// ── Arranque ──────────────────────────────────────────────────────────────────
async function initSupabase() {
  if (!sb) { console.warn('Supabase no configurado: la app funciona solo en local.'); return; }
  try {
    await cargarDeSupabase();
    await cargarSuscripcion();
    suscribirRealtime();
    aplicarConfiguracion();
    if (sesionActual) refrescarPaginaActual();
    if (typeof revisarEstadoPago === 'function') revisarEstadoPago();
    if (typeof mostrarBannerSuscripcion === 'function') mostrarBannerSuscripcion();
  } catch (e) {
    console.warn('Supabase no disponible, usando datos locales:', e.message);
  }
}
