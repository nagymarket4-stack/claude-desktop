// ─── Conexión Supabase del panel SaaS (gestión de clientes/tenants) ───────────
const SB_URL = 'https://ylwxsawiixvtjttsogzu.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3hzYXdpaXh2dGp0dHNvZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjMwMDEsImV4cCI6MjA5Nzc5OTAwMX0.mVckH5Yp_J1uZbUzX1XFihCxz8HHgqAYfJT_2UWvHgw';

// URL pública de la app de guardería (el producto que se vende).
// En Vercel el panel está en /panel y la guardería en /app del mismo dominio.
// Si se sirve fuera de Vercel (ej. GitHub Pages) se usa la URL fija de respaldo.
const GUARDERIA_URL = location.hostname.includes('github.io')
  ? 'https://nagymarket4-stack.github.io/claude-desktop/'
  : location.origin + '/app/';

let sbSaas = null;
try {
  if (window.supabase) sbSaas = window.supabase.createClient(SB_URL, SB_KEY);
} catch (e) { console.warn('No se pudo iniciar Supabase:', e); }

function precioPlan(id) { return ({ starter: 29, pro: 79, enterprise: 199 })[id] || 0; }

// Convierte un nombre de empresa en un slug para la URL (?cliente=slug)
function slugify(nombre) {
  return nombre.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

function urlCliente(slug) { return `${GUARDERIA_URL}?cliente=${encodeURIComponent(slug)}`; }

// ── Cargar todos los clientes desde la tabla tenants ──────────────────────────
async function cargarTenants() {
  if (!sbSaas) return [];
  const { data, error } = await sbSaas.from('tenants').select('*').order('created_at', { ascending: false });
  if (error) { console.warn('Error cargando clientes:', error.message); return []; }
  return (data || []).map(t => ({
    id: t.id,
    nombre: t.nombre,
    ciudad: t.ciudad || '',
    contacto: t.contacto || '',
    email: t.email || '',
    plan: t.plan || 'starter',
    estado: t.estado || 'activo',
    alumnos: t.alumnos || 0,
    mrr: t.mrr || 0,
    alta: (t.alta || t.created_at || '').slice(0, 10),
    stripe_customer_id: t.stripe_customer_id || null,
  }));
}

// ── Crear un cliente nuevo: registra el tenant y genera su guardería ───────────
async function crearTenantRemoto({ nombre, ciudad, contacto, email, plan }) {
  if (!sbSaas) throw new Error('Sin conexión a Supabase');
  let slug = slugify(nombre);
  if (!slug) throw new Error('Nombre no válido');

  // Asegurar slug único
  const { data: existe } = await sbSaas.from('tenants').select('id').eq('id', slug).maybeSingle();
  if (existe) slug = slug + '-' + Math.random().toString(36).slice(2, 6);

  const precio = precioPlan(plan);
  const trialFin = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const fila = {
    id: slug, nombre, ciudad: ciudad || '', contacto: contacto || '', email: email || '',
    plan, estado: 'trial', alumnos: 0, mrr: 0, alta: new Date().toISOString().slice(0, 10),
    trial_fin: trialFin,
  };
  const { error } = await sbSaas.from('tenants').insert(fila);
  if (error) throw error;

  // Generar la guardería del cliente con el nombre de su empresa
  await sbSaas.from('app_data').upsert({
    key: `${slug}__configuracion`,
    value: { nombre, subtitulo: 'Guardería Infantil', logo: '🌱' },
    updated_at: new Date().toISOString(),
  });

  return { ...fila, alta: fila.alta };
}

async function actualizarTenantRemoto(id, cambios) {
  if (!sbSaas) return;
  try { await sbSaas.from('tenants').update(cambios).eq('id', id); }
  catch (e) { console.warn('Error actualizando cliente:', e); }
}

// Borra un cliente por completo (tenant + datos + mensajes) vía Edge Function.
// `secret` = clave de administración (PANEL_SECRET), la escribe el dueño.
async function borrarTenantRemoto(id, secret) {
  const resp = await fetch(`${SB_URL}/functions/v1/borrar-cliente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY, 'apikey': SB_KEY, 'x-panel-secret': secret },
    body: JSON.stringify({ tenant: id }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) throw new Error(data.error || 'No se pudo borrar el cliente');
  return true;
}

// Cambia estado/plan de un cliente vía Edge Function (persiste con service role).
async function gestionarTenantRemoto(id, accion, valor, secret) {
  const resp = await fetch(`${SB_URL}/functions/v1/borrar-cliente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + SB_KEY, 'apikey': SB_KEY, 'x-panel-secret': secret },
    body: JSON.stringify({ tenant: id, accion, valor }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) throw new Error(data.error || 'No se pudo actualizar el cliente');
  return true;
}

// ── Leads captados desde la web (tabla leads) → formato del pipeline ───────────
async function cargarLeads() {
  if (!sbSaas) return [];
  const { data, error } = await sbSaas.from('leads').select('*').order('created_at', { ascending: false });
  if (error) { console.warn('Error cargando leads:', error.message); return []; }
  const estadoMap = { nuevo:'activo', contactado:'activo', negociando:'negociando', expirado:'expirado', descartado:'expirado' };
  return (data || []).filter(l => l.estado !== 'convertido').map(l => {
    const inicio = (l.created_at || '').slice(0, 10);
    const fin = new Date(new Date(l.created_at || Date.now()).getTime() + 14 * 864e5).toISOString().slice(0, 10);
    return {
      id: 'lead-' + l.id, leadId: l.id,
      nombre: l.centro || l.nombre || 'Lead sin nombre',
      ciudad: l.ciudad || '—',
      contacto: l.nombre || '',
      email: l.email || '',
      telefono: l.telefono || '',
      plan_interes: l.plan_interes || 'pro',
      inicio_trial: inicio, fin_trial: fin,
      alumnos_aprox: 0,
      estado: estadoMap[l.estado] || 'activo',
      notas: (l.mensaje || 'Sin notas') + (l.telefono ? ' · Tel: ' + l.telefono : ''),
    };
  });
}

async function actualizarLeadRemoto(leadId, cambios) {
  if (!sbSaas) return;
  try { await sbSaas.from('leads').update(cambios).eq('id', leadId); }
  catch (e) { console.warn('Error actualizando lead:', e); }
}
