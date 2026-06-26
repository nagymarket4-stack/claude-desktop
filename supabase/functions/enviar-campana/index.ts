// Edge Function: secuencia de prospección (email frío) a escuelas, en 3 pasos.
//   Paso 1 (día 0) → Paso 2 (a los 3 días) → Paso 3 (a los 7 días).
// El cron la llama a diario; cada prospecto avanza un paso cuando "toca".
// Diseñada para NO acabar en spam: gota a gota, personalizado, con
// identificación clara, enlace de baja y cabecera List-Unsubscribe.
//
// Seguridad: protegida por la cabecera `x-campana-secret` (CAMPANA_SECRET).
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const RESEND  = Deno.env.get('RESEND_API_KEY')!;
const FROM    = Deno.env.get('OUTREACH_FROM') || 'Guardalia <hola@guardialia.com>';
const REPLY   = Deno.env.get('OUTREACH_REPLY_TO') || 'hola@guardialia.com';
const LANDING = Deno.env.get('LANDING_URL') || 'https://guardialia.com';
const BASE    = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
const SECRET  = Deno.env.get('CAMPANA_SECRET') || '';
const CAP     = parseInt(Deno.env.get('DAILY_CAP') || '40');
const PAUSA   = parseInt(Deno.env.get('SEND_DELAY_MS') || '900');

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-campana-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function esc(s: string): string {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const dominio = LANDING.replace('https://', '').replace('http://', '');

function envoltorio(cuerpo: string, escuela: string, bajaUrl: string): string {
  return `<div style="font-family:system-ui,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937;max-width:560px">
    ${cuerpo}
    <hr style="border:none;border-top:1px solid #eef2f7;margin:20px 0">
    <p style="font-size:12px;color:#94a3b8">
      Te escribimos porque ${escuela} es un centro de educación infantil y creemos que esto puede interesarte.
      Si no quieres recibir más mensajes, <a href="${bajaUrl}" style="color:#94a3b8">date de baja aquí</a> (un clic).
    </p>
  </div>`;
}

// ── La secuencia: 3 pasos. `espera` = días a esperar desde el email anterior. ──
const SECUENCIA = [
  {
    espera: 0,
    asunto: (n: string) => `Una forma más sencilla de gestionar ${n}`,
    cuerpo: (n: string, c: string) => `
      <p>Hola, equipo de <b>${esc(n)}</b>${c ? ` (${esc(c)})` : ''}:</p>
      <p>Soy del equipo de <b>Guardalia</b>, un software español para gestionar guarderías y escuelas infantiles.
      Ayudamos a centros como el vuestro a ahorrar tiempo en el día a día: asistencia, partes para las familias,
      fotos, comunicación y facturación, todo en un sitio.</p>
      <p>Si os encaja, podéis probarlo gratis 14 días (sin tarjeta):<br>
      👉 <a href="${LANDING}/?utm_source=email&utm_medium=outreach&utm_content=1" style="color:#059669">${dominio}</a></p>
      <p>Y si no es para vosotros, sin problema — gracias por leer.</p>
      <p style="margin-top:18px">Un saludo,<br>Equipo Guardalia</p>`,
  },
  {
    espera: 3,
    asunto: (n: string) => `¿Le pudisteis echar un ojo, ${n}?`,
    cuerpo: (n: string) => `
      <p>Hola de nuevo, ${esc(n)}:</p>
      <p>Os escribí hace unos días sobre <b>Guardalia</b>. Solo quería asegurarme de que no se perdió entre el correo.</p>
      <p>En un par de minutos podéis ver cómo funciona con vuestros propios datos en la prueba gratuita:<br>
      👉 <a href="${LANDING}/?utm_source=email&utm_medium=outreach&utm_content=2" style="color:#059669">${dominio}</a></p>
      <p>Si no es buen momento, lo entiendo perfectamente.</p>
      <p style="margin-top:18px">Un saludo,<br>Equipo Guardalia</p>`,
  },
  {
    espera: 4,
    asunto: () => `Último mensaje sobre Guardalia`,
    cuerpo: (n: string) => `
      <p>Hola, ${esc(n)}:</p>
      <p>No quiero saturaros, así que este es el último correo que os escribo.</p>
      <p>Si en algún momento queréis digitalizar la gestión del centro y ahorrar tiempo, aquí nos tenéis
      (14 días gratis, sin tarjeta):<br>
      👉 <a href="${LANDING}/?utm_source=email&utm_medium=outreach&utm_content=3" style="color:#059669">${dominio}</a></p>
      <p>¡Mucho ánimo con el curso y gracias por vuestro tiempo!</p>
      <p style="margin-top:18px">Un saludo,<br>Equipo Guardalia</p>`,
  },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!SECRET || req.headers.get('x-campana-secret') !== SECRET) {
    return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const limite = Math.max(1, Math.min(parseInt(body.limite) || CAP, CAP));

    // Candidatos: en secuencia ('pendiente'), los más antiguos primero
    const { data: cand, error } = await supabase
      .from('prospectos').select('id,nombre,email,ciudad,token,paso,ultimo_envio')
      .eq('estado', 'pendiente').not('email', 'is', null)
      .order('ultimo_envio', { ascending: true, nullsFirst: true })
      .limit(limite * 8);
    if (error) throw error;

    const ahora = Date.now();
    const toca = (p: any): boolean => {
      const paso = p.paso || 0;
      if (paso >= SECUENCIA.length) return false;
      if (paso === 0) return true; // primer email, ya
      const ult = p.ultimo_envio ? new Date(p.ultimo_envio).getTime() : 0;
      return (ahora - ult) >= SECUENCIA[paso].espera * 864e5;
    };
    const aEnviar = (cand || []).filter(toca).slice(0, limite);

    let enviados = 0; const errores: string[] = [];
    for (const p of aEnviar) {
      const paso = p.paso || 0;
      const plantilla = SECUENCIA[paso];
      const escuela = p.nombre || 'tu escuela infantil';
      const bajaUrl = `${BASE}/baja?t=${encodeURIComponent(p.token)}`;
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM, to: [p.email], reply_to: REPLY,
          subject: plantilla.asunto(escuela),
          html: envoltorio(plantilla.cuerpo(escuela, p.ciudad || ''), esc(escuela), bajaUrl),
          headers: { 'List-Unsubscribe': `<${bajaUrl}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
        }),
      });
      if (resp.ok) {
        const nuevoPaso = paso + 1;
        const completo = nuevoPaso >= SECUENCIA.length;
        await supabase.from('prospectos').update({
          paso: nuevoPaso,
          ultimo_envio: new Date().toISOString(),
          enviado_at: new Date().toISOString(),
          estado: completo ? 'completado' : 'pendiente',
        }).eq('id', p.id);
        enviados++;
      } else {
        const txt = await resp.text();
        errores.push(`${p.email}: ${txt.slice(0, 120)}`);
        await supabase.from('prospectos').update({ estado: 'rebotado', error: txt.slice(0, 200) }).eq('id', p.id);
      }
      await new Promise(r => setTimeout(r, PAUSA));
    }

    const { count } = await supabase.from('prospectos').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente');
    return new Response(JSON.stringify({ ok: true, enviados, en_secuencia: count ?? null, errores }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message || e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
