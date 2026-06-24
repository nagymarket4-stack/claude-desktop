// Edge Function: webhook de Stripe.
// Cuando un pago se completa, marca la guardería (tenant) como 'activo'.
import Stripe from 'npm:stripe@17';
import { createClient } from 'npm:@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const PRECIO: Record<string, number> = { starter: 29, pro: 79, enterprise: 199 };

Deno.serve(async (req) => {
  const sig = req.headers.get('stripe-signature');
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, whSecret);
  } catch (e) {
    return new Response('Firma no válida: ' + (e as Error).message, { status: 400 });
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const s = event.data.object as Stripe.Checkout.Session;
      const tenant = (s.metadata?.tenant as string) || (s.client_reference_id as string);
      const plan = (s.metadata?.plan as string) || 'pro';
      if (tenant) {
        await supabase.from('tenants').update({
          estado: 'activo',
          plan,
          mrr: PRECIO[plan] ?? 0,
          stripe_customer_id: s.customer as string,
          stripe_subscription_id: s.subscription as string,
        }).eq('id', tenant);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const tenant = sub.metadata?.tenant as string;
      if (tenant) {
        await supabase.from('tenants').update({ estado: 'cancelado', mrr: 0 }).eq('id', tenant);
      }
    }
  } catch (e) {
    console.error('Error procesando evento:', e);
  }

  return new Response('ok', { status: 200 });
});
