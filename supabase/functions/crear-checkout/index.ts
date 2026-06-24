// Edge Function: crea una sesión de Stripe Checkout (suscripción mensual)
// Se llama desde la guardería del cliente cuando pulsa "Activar suscripción".
import Stripe from 'npm:stripe@17';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

// Planes y precios en céntimos (EUR)
const PLANES: Record<string, { nombre: string; precio: number }> = {
  starter:    { nombre: 'Guardalia Starter',    precio: 2900 },
  pro:        { nombre: 'Guardalia Pro',         precio: 7900 },
  enterprise: { nombre: 'Guardalia Enterprise',  precio: 19900 },
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { tenant, plan, email, returnUrl } = await req.json();
    if (!tenant) throw new Error('Falta el identificador del cliente');
    const p = PLANES[plan] || PLANES.pro;
    const base = returnUrl || 'https://nagymarket4-stack.github.io/claude-desktop/';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: p.nombre },
          unit_amount: p.precio,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      client_reference_id: tenant,
      customer_email: email || undefined,
      metadata: { tenant, plan: plan || 'pro' },
      subscription_data: { metadata: { tenant, plan: plan || 'pro' } },
      allow_promotion_codes: true,
      success_url: `${base}?cliente=${encodeURIComponent(tenant)}&pago=ok`,
      cancel_url: `${base}?cliente=${encodeURIComponent(tenant)}&pago=cancel`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message || e) }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
