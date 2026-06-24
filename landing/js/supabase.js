// ─── Conexión Supabase de la landing (captación de leads) ─────────────────────
const SB_URL = 'https://ylwxsawiixvtjttsogzu.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlsd3hzYXdpaXh2dGp0dHNvZ3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMjMwMDEsImV4cCI6MjA5Nzc5OTAwMX0.mVckH5Yp_J1uZbUzX1XFihCxz8HHgqAYfJT_2UWvHgw';

let sbLanding = null;
try {
  if (window.supabase) sbLanding = window.supabase.createClient(SB_URL, SB_KEY);
} catch (e) { console.warn('Supabase no disponible:', e); }

// Inserta un lead captado desde la web en la tabla `leads`
async function enviarLead(datos) {
  if (!sbLanding) throw new Error('Sin conexión');
  const { error } = await sbLanding.from('leads').insert({
    nombre:       datos.nombre || '',
    centro:       datos.centro || '',
    email:        datos.email || '',
    telefono:     datos.telefono || '',
    ciudad:       datos.ciudad || '',
    plan_interes: datos.plan_interes || 'pro',
    mensaje:      datos.mensaje || '',
    estado:       'nuevo',
    origen:       'landing',
  });
  if (error) throw error;
  return true;
}
