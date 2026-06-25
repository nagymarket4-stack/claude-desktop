// Edge Function: alta automática de una guardería en prueba (trial).
// La llama el formulario de la landing al rellenar los datos.
//   1) Crea el tenant (estado=trial, 14 días) con el service role.
//   2) Monta la guardería VACÍA (sin datos demo) + un usuario superadmin
//      (usuario = slug del nombre del centro, contraseña sencilla temporal).
//   3) Envía email al dueño (y de bienvenida al cliente) con los accesos.
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const PRECIO: Record<string, number> = { starter: 29, pro: 79, enterprise: 199 };

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ── Utilidades ────────────────────────────────────────────────────────────────
function slugify(n: string): string {
  return (n || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'centro';
}
async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function genPassword(): string {
  const w = ['sol', 'luna', 'nube', 'flor', 'cielo', 'mar', 'estrella'][Math.floor(Math.random() * 7)];
  return w + Math.floor(1000 + Math.random() * 9000); // ej. "luna4821"
}
function escapeHtml(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function hoyISO(): string { return new Date().toISOString().slice(0, 10); }
function masDias(d: number): string { return new Date(Date.now() + d * 864e5).toISOString().slice(0, 10); }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const body = await req.json();
    const nombre   = String(body.nombre || body.centro || '').trim().slice(0, 80);
    const contacto = String(body.contacto || '').trim().slice(0, 80);
    const email    = String(body.email || '').trim().slice(0, 120);
    const telefono = String(body.telefono || '').trim().slice(0, 30);
    const ciudad   = String(body.ciudad || '').trim().slice(0, 60);
    const plan     = ['starter', 'pro', 'enterprise'].includes(body.plan) ? body.plan : 'pro';

    if (!nombre) throw new Error('Falta el nombre del centro');
    if (!email)  throw new Error('Falta el email de contacto');

    // 1) Slug único
    let slug = slugify(nombre);
    const { data: existe } = await supabase.from('tenants').select('id').eq('id', slug).maybeSingle();
    if (existe) slug = slug + '-' + Math.random().toString(36).slice(2, 6);

    // 2) Credenciales del superadmin del cliente
    const usuario  = slug;                 // login = nombre del centro (slug)
    const password = genPassword();        // contraseña temporal sencilla
    const passHash = await sha256Hex(password);
    const trialFin = masDias(14);

    // 3) Crear el tenant (prueba 14 días)
    const { error: errT } = await supabase.from('tenants').insert({
      id: slug, nombre, ciudad, contacto, email,
      plan, estado: 'trial', alumnos: 0, mrr: 0, alta: hoyISO(), trial_fin: trialFin,
    });
    if (errT) throw new Error('No se pudo crear el centro: ' + errT.message);

    // 4) Montar la guardería VACÍA (sin datos demo) + superadmin + configuración
    const superadmin = {
      id: 1, usuario, passHash, nombre: contacto || 'Dirección',
      rol: 'superadmin', activo: true, alumnoIds: [],
    };
    const vacios: Record<string, unknown> = {
      alumnos: [], profesores: [], actividades: [], bienestar: {}, familias: {},
      fichajes: [], bano: {}, facturas: [], comunicados: [], eventos: [],
      menus: { dias: {} }, desarrollo: {}, matriculas: [], salud: {},
      usuarios: [superadmin],
      configuracion: { nombre, subtitulo: 'Guardería Infantil', logo: '🌱' },
    };
    const filas = Object.entries(vacios).map(([k, value]) => ({
      key: `${slug}__${k}`, value, updated_at: new Date().toISOString(),
    }));
    await supabase.from('app_data').upsert(filas);

    const baseApp = (Deno.env.get('APP_BASE_URL') || 'https://guardialia.com/app/').replace(/\/?$/, '/');
    const url = `${baseApp}?cliente=${encodeURIComponent(slug)}`;

    // 5) Emails (best-effort: si falla el envío, el trial ya está creado)
    const RESEND = Deno.env.get('RESEND_API_KEY');
    const OWNER  = Deno.env.get('OWNER_EMAIL') || 'hola@guardialia.com';
    const FROM   = Deno.env.get('FROM_EMAIL')  || 'Guardalia <onboarding@resend.dev>';
    let emailEnviado = false;

    if (RESEND) {
      const enviar = (to: string[], subject: string, html: string) =>
        fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: FROM, to, subject, html }),
        });

      // Email interno para el dueño (con todos los datos + accesos)
      const htmlOwner = `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="color:#059669">🎉 Nueva guardería en prueba</h2>
          <table style="font-size:14px;line-height:1.7">
            <tr><td><b>Centro:</b></td><td>${escapeHtml(nombre)}</td></tr>
            <tr><td><b>Contacto:</b></td><td>${escapeHtml(contacto)}</td></tr>
            <tr><td><b>Email:</b></td><td>${escapeHtml(email)}</td></tr>
            <tr><td><b>Teléfono:</b></td><td>${escapeHtml(telefono)}</td></tr>
            <tr><td><b>Ciudad:</b></td><td>${escapeHtml(ciudad)}</td></tr>
            <tr><td><b>Plan:</b></td><td>${plan} (${PRECIO[plan]}€/mes) · prueba hasta ${trialFin}</td></tr>
          </table>
          <h3 style="color:#059669;margin-top:18px">Acceso del cliente (superadmin)</h3>
          <p style="font-size:14px;line-height:1.7">
            🔗 <a href="${url}">${url}</a><br>
            👤 Usuario: <b>${escapeHtml(usuario)}</b><br>
            🔑 Contraseña: <b>${escapeHtml(password)}</b>
          </p>
        </div>`;

      // Email de bienvenida para el cliente (solo sus accesos)
      const htmlCliente = `
        <div style="font-family:system-ui,sans-serif;max-width:560px">
          <h2 style="color:#059669">¡Bienvenido a Guardalia, ${escapeHtml(nombre)}! 🌱</h2>
          <p style="font-size:14px;line-height:1.7">Tu guardería ya está activa con <b>14 días de prueba gratis</b>. Estos son tus datos de acceso:</p>
          <div style="background:#ecfdf5;border:1px solid #d1fae5;border-radius:12px;padding:16px;font-size:14px;line-height:1.8">
            🔗 <a href="${url}"><b>Entrar a mi guardería</b></a><br>
            👤 Usuario: <b>${escapeHtml(usuario)}</b><br>
            🔑 Contraseña: <b>${escapeHtml(password)}</b>
          </div>
          <p style="font-size:13px;color:#64748b;margin-top:12px">Por seguridad, cámbiala al entrar desde <b>Configuración → Usuarios</b>.</p>
        </div>`;

      try {
        await enviar([OWNER], `Nueva guardería trial: ${nombre}`, htmlOwner);
        if (email) await enviar([email], `Tu acceso a Guardalia 🌱`, htmlCliente);
        emailEnviado = true;
      } catch (e) {
        console.error('Error enviando email:', e);
      }
    }

    return new Response(JSON.stringify({
      ok: true, slug, url, usuario, password, trial_fin: trialFin, emailEnviado,
    }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message || e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
