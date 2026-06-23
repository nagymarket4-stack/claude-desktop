// ─── Integración con Supabase (sincronización en la nube + tiempo real) ───────
const SB_URL = 'https://ylwxsawiixvtjttsogzu.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3hzYXdpaXh2dGp0dHNvZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjMwMDEsImV4cCI6MjA5Nzc5OTAwMX0.mVckH5Yp_J1uZbUzX1XFihCxz8HHgqAYfJT_2UWvHgw';

let sb = null;
try {
  if (window.supabase) sb = window.supabase.createClient(SB_URL, SB_KEY);
} catch (e) { console.warn('No se pudo iniciar Supabase:', e); }

// Datos generales que viven en la tabla app_data (clave-valor JSON)
const DATA_KEYS = ['alumnos', 'profesores', 'actividades', 'bienestar', 'familias', 'usuarios'];

function supabaseActivo() { return !!sb; }

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

// ── Carga inicial desde Supabase (siembra datos si está vacío) ────────────────
async function cargarDeSupabase() {
  if (!sb) throw new Error('cliente no disponible');

  const { data: rows, error } = await sb.from('app_data').select('key,value');
  if (error) throw error;

  if (!rows || rows.length === 0) {
    await sembrarDatos();
  } else {
    rows.forEach(r => {
      if (r.key === 'configuracion') Object.assign(CONFIGURACION, r.value);
      else if (DATA_KEYS.includes(r.key)) state[r.key] = r.value;
    });
  }

  const { data: msgs } = await sb.from('mensajes').select('*').order('id');
  if (!msgs || msgs.length === 0) await sembrarMensajes();
  else reconstruirMensajes(msgs);
}

// ── Siembra inicial (primera vez que se usa el proyecto) ──────────────────────
async function sembrarDatos() {
  const filas = [
    { key: 'alumnos',       value: ALUMNOS },
    { key: 'profesores',    value: PROFESORES },
    { key: 'actividades',   value: ACTIVIDADES },
    { key: 'bienestar',     value: BIENESTAR_INIT },
    { key: 'familias',      value: FAMILIAS_INIT },
    { key: 'usuarios',      value: USUARIOS_INIT },
    { key: 'configuracion', value: CONFIGURACION },
  ];
  await sb.from('app_data').upsert(filas);
}

async function sembrarMensajes() {
  const filas = [];
  Object.entries(MENSAJES_INIT).forEach(([aid, arr]) => {
    arr.forEach(m => filas.push({ alumno_id: +aid, de: m.de, texto: m.texto, hora: m.hora, leido: m.leido }));
  });
  if (filas.length) await sb.from('mensajes').insert(filas);
  const { data: msgs } = await sb.from('mensajes').select('*').order('id');
  reconstruirMensajes(msgs || []);
}

// ── Guardar un bloque de datos generales en la nube ───────────────────────────
async function guardarDato(key) {
  if (!sb) return;
  const value = key === 'configuracion' ? CONFIGURACION : state[key];
  try {
    await sb.from('app_data').upsert({ key, value, updated_at: new Date().toISOString() });
  } catch (e) { console.warn('Error guardando', key, e); }
}

// ── Mensajes ──────────────────────────────────────────────────────────────────
async function enviarMensajeRemoto(alumnoId, de, texto) {
  if (!sb) return false;
  const { error } = await sb.from('mensajes').insert({
    alumno_id: alumnoId, de, texto, hora: horaActual(), leido: false,
  });
  return !error;
}

// desde: 'familia' marca como leídos los del centro · 'centro' marca los de las familias
async function marcarLeidosRemoto(alumnoId, desde) {
  if (!sb) return;
  let q = sb.from('mensajes').update({ leido: true }).eq('alumno_id', alumnoId).eq('leido', false);
  q = desde === 'familia' ? q.eq('de', 'centro') : q.neq('de', 'centro');
  try { await q; } catch (e) {}
}

// ── Suscripción en tiempo real ────────────────────────────────────────────────
function suscribirRealtime() {
  if (!sb) return;

  sb.channel('rt-mensajes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'mensajes' }, async () => {
      const { data } = await sb.from('mensajes').select('*').order('id');
      reconstruirMensajes(data || []);
      if (sesionActual) refrescarPaginaActual();
    })
    .subscribe();

  sb.channel('rt-appdata')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_data' }, async () => {
      const { data } = await sb.from('app_data').select('key,value');
      (data || []).forEach(r => {
        if (r.key === 'configuracion') Object.assign(CONFIGURACION, r.value);
        else if (DATA_KEYS.includes(r.key)) state[r.key] = r.value;
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
    suscribirRealtime();
    aplicarConfiguracion();
    if (sesionActual) refrescarPaginaActual();
  } catch (e) {
    console.warn('Supabase no disponible, usando datos locales:', e.message);
  }
}
