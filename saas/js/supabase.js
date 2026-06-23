// ─── Conexión Supabase del panel SaaS (gestión de clientes/tenants) ───────────
const SB_URL = 'https://ylwxsawiixvtjttsogzu.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3hzYXdpaXh2dGp0dHNvZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjMwMDEsImV4cCI6MjA5Nzc5OTAwMX0.mVckH5Yp_J1uZbUzX1XFihCxz8HHgqAYfJT_2UWvHgw';

// URL pública de la app de guardería (el producto que se vende)
const GUARDERIA_URL = 'https://nagymarket4-stack.github.io/claude-desktop/';

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
  const fila = {
    id: slug, nombre, ciudad: ciudad || '', contacto: contacto || '', email: email || '',
    plan, estado: 'activo', alumnos: 0, mrr: precio, alta: new Date().toISOString().slice(0, 10),
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
