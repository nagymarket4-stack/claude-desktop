// Edge Function: envía la campaña de prospección (email frío) a escuelas.
// Diseñada para NO acabar en spam: envío gota a gota, personalizado, con
// identificación clara, enlace de baja y cabecera List-Unsubscribe.
//
// Seguridad: protegida por la cabecera `x-campana-secret` (CAMPANA_SECRET).
// La disparas tú (curl/cron), no es pública.
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const RESEND  = Deno.env.get('RESEND_API_KEY')!;
// MUY recomendable usar un subdominio/dominio aparte para no arriesgar la
// reputación del correo transaccional (altas/facturas). Ej: news.guardialia.com
const FROM    = Deno.env.get('OUTREACH_FROM') || 'Guardalia <hola@guardialia.com>';
const REPLY   = Deno.env.get('OUTREACH_REPLY_TO') || 'hola@guardialia.com';
const LANDING = Deno.env.get('LANDING_URL') || 'https://guardialia.com';
const BASE    = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
const SECRET  = Deno.env.get('CAMPANA_SECRET') || '';
const CAP     = parseInt(Deno.env.get('DAILY_CAP') || '40');     // tope de seguridad por tanda
const PAUSA   = parseInt(Deno.env.get('SEND_DELAY_MS') || '900'); // gota a gota

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-campana-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Plantilla sobria (poco HTML/imagen = mejor entregabilidad), honesta y con baja visible.
function plantilla(nombre: string, ciudad: string, bajaUrl: string): string {
  const escuela = nombre ? esc(nombre) : 'tu escuela infantil';
  return `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px">
    <p>Hola, equipo de <b>${escuela}</b>${ciudad ? ` (${esc(ciudad)})` : ''}:</p>
    <p>Soy del equipo de <b>Guardalia</b>, un software español para gestionar guarderías y escuelas infantiles.
    Ayudamos a centros como el vuestro a ahorrar tiempo en el día a día: asistencia, partes para las familias,
    fotos, comunicación y facturación, todo en un sitio.</p>
    <p>Si os encaja, podéis probarlo gratis 14 días (sin tarjeta) aquí:<br>
    👉 <a href="${LANDING}/?utm_source=email&utm_medium=outreach" style="color:#059669">${LANDING.replace('https://', '')}</a></p>
    <p>Y si no es para vosotros, sin problema — gracias por leer.</p>
    <p style="margin-top:20px">Un saludo,<br>Equipo Guardalia · ${LANDING.replace('https://', '')}</p>
    <hr style="border:none;border-top:1px solid #eef2f7;margin:20px 0">
    <p style="font-size:12px;color:#94a3b8">
      Te escribimos porque ${escuela} es un centro de educación infantil y creemos que esto puede interesarte.
      Si no quieres recibir más mensajes, <a href="${bajaUrl}" style="color:#94a3b8">date de baja aquí</a> (un clic).
    </p>
  </div>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  // Autenticación por secreto (no es un endpoint público)
  if (!SECRET || req.headers.get('x-campana-secret') !== SECRET) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const limite = Math.max(1, Math.min(parseInt(body.limite) || CAP, CAP));

    // Solo prospectos pendientes (los de baja/enviados/rebotados quedan fuera)
    const { data: pendientes, error } = await supabase
      .from('prospectos').select('id,nombre,email,ciudad,token')
      .eq('estado', 'pendiente').not('email', 'is', null)
      .order('created_at', { ascending: true }).limit(limite);
    if (error) throw error;

    let enviados = 0; const errores: string[] = [];
    for (const p of (pendientes || [])) {
      const bajaUrl = `${BASE}/baja?t=${encodeURIComponent(p.token)}`;
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [p.email], reply_to: REPLY,
          subject: `Una forma más sencilla de gestionar ${p.nombre || 'tu escuela infantil'}`,
          html: plantilla(p.nombre, p.ciudad, bajaUrl),
          headers: {
            'List-Unsubscribe': `<${bajaUrl}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      });
      if (resp.ok) {
        await supabase.from('prospectos').update({ estado: 'enviado', enviado_at: new Date().toISOString() }).eq('id', p.id);
        enviados++;
      } else {
        const txt = await resp.text();
        errores.push(`${p.email}: ${txt.slice(0, 120)}`);
        await supabase.from('prospectos').update({ estado: 'rebotado', error: txt.slice(0, 200) }).eq('id', p.id);
      }
      await new Promise(r => setTimeout(r, PAUSA)); // gota a gota
    }

    const { count } = await supabase.from('prospectos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente');
    return new Response(JSON.stringify({ ok: true, enviados, restantes: count ?? null, errores }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message || e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
