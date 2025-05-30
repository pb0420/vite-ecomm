import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import Stripe from 'npm:stripe@13.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_ANON_KEY } = Deno.env.toObject();
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const { paymentIntentId } = await req.json();

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment was not successful');
    }

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...paymentIntent.metadata,
        status: 'pending',
        total: paymentIntent.amount / 100, // Convert from cents
        payment_status: 'paid',
      })
      .select()
      .single();

    if (orderError) throw orderError;

    return new Response(
      JSON.stringify({ success: true, orderId: order.id }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});