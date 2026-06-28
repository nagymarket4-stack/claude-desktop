// Edge Function: borrar un cliente (tenant) por completo desde el panel.
// Borra tenant + sus datos (app_data) + sus mensajes, con el service role.
// Protegida por la cabecera `x-panel-secret` (PANEL_SECRET): el dueño la escribe
// en el panel (no va en el código), así que nadie externo puede borrar clientes.
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const SECRET = Deno.env.get('PANEL_SECRET') || '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-panel-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (!SECRET || req.headers.get('x-panel-secret') !== SECRET) {
    return new Response(JSON.stringify({ ok: false, error: 'Clave de administración incorrecta' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
  try {
    const { tenant } = await req.json();
    if (!tenant || typeof tenant !== 'string') throw new Error('Falta el identificador del cliente');

    // Borrar los datos de la guardería (todas las claves tenant__*)
    await supabase.from('app_data').delete().like('key', `${tenant}__%`);
    // Borrar sus mensajes
    await supabase.from('mensajes').delete().eq('tenant', tenant);
    // Borrar la ficha del cliente
    const { error } = await supabase.from('tenants').delete().eq('id', tenant);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, tenant }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message || e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
