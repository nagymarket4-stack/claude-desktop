// Edge Function: gestión privilegiada de clientes (tenants) desde el panel.
// Acciones: 'borrar' (tenant + app_data + mensajes), 'estado' y 'plan'.
// Estas operaciones tocan columnas bloqueadas para la clave pública, por eso
// van por el service role. Protegida por `x-panel-secret` (PANEL_SECRET): el
// dueño la escribe en el panel (no va en el código).
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);
const SECRET = Deno.env.get('PANEL_SECRET') || '';
const PRECIO: Record<string, number> = { starter: 29, pro: 79, enterprise: 199 };

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
    const { tenant, accion = 'borrar', valor } = await req.json();
    if (!tenant || typeof tenant !== 'string') throw new Error('Falta el identificador del cliente');

    if (accion === 'borrar') {
      await supabase.from('app_data').delete().like('key', `${tenant}__%`);
      await supabase.from('mensajes').delete().eq('tenant', tenant);
      const { error } = await supabase.from('tenants').delete().eq('id', tenant);
      if (error) throw error;
      return new Response(JSON.stringify({ ok: true, tenant, accion }), { headers: { ...cors, 'Content-Type': 'application/json' } });
    }

    // estado / plan necesitan el estado y plan actuales para recalcular el MRR
    const { data: t, error: e0 } = await supabase.from('tenants').select('plan,estado').eq('id', tenant).maybeSingle();
    if (e0) throw e0;
    if (!t) throw new Error('Cliente no encontrado');

    let cambios: Record<string, unknown>;
    if (accion === 'estado') {
      const estado = String(valor);
      cambios = { estado, mrr: estado === 'activo' ? (PRECIO[t.plan] || 0) : 0 };
    } else if (accion === 'plan') {
      const plan = String(valor);
      if (!PRECIO[plan]) throw new Error('Plan no válido');
      cambios = { plan, mrr: t.estado === 'activo' ? PRECIO[plan] : 0 };
    } else {
      throw new Error('Acción no válida');
    }

    const { error } = await supabase.from('tenants').update(cambios).eq('id', tenant);
    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, tenant, accion, cambios }), { headers: { ...cors, 'Content-Type': 'application/json' } });

  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error)?.message || e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
