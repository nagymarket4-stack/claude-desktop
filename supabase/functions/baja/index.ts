// Edge Function: baja de la lista de email (unsubscribe).
// Enlace público que aparece en cada email de prospección. Marca el prospecto
// como 'baja' para no volver a contactarlo nunca. Atiende también la baja en
// un clic de Gmail/Outlook (List-Unsubscribe-Post).
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const pagina = (titulo: string, msg: string) => `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${titulo}</title><style>body{font-family:system-ui,sans-serif;background:#f8fafc;color:#1f2937;
display:grid;place-items:center;height:100vh;margin:0}.c{background:#fff;border:1px solid #eef2f7;border-radius:16px;
padding:32px;max-width:380px;text-align:center;box-shadow:0 20px 40px -24px rgba(2,6,23,.25)}
h1{font-size:18px;margin:0 0 8px}p{color:#64748b;font-size:14px;line-height:1.6;margin:0}</style></head>
<body><div class="c"><div style="font-size:40px">🌱</div><h1>${titulo}</h1><p>${msg}</p></div></body></html>`;

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    // Token por query (?t=) o por el cuerpo (one-click de Gmail)
    let token = url.searchParams.get('t') || '';
    if (!token && req.method === 'POST') {
      try { const b = await req.text(); token = new URLSearchParams(b).get('t') || ''; } catch (_) {}
    }
    if (token) {
      await supabase.from('prospectos').update({ estado: 'baja', baja_at: new Date().toISOString() }).eq('token', token);
    }
    return new Response(
      pagina('Te has dado de baja', 'No volverás a recibir comunicaciones de Guardalia. Gracias por tu tiempo.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  } catch (_e) {
    return new Response(
      pagina('Listo', 'Tu solicitud se ha registrado.'),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }
});
