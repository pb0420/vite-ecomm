import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@latest";
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"), {
  apiVersion: '2025-03-31.basil'
});
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = Deno.env.toObject();
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { productList, user_id, orderData } = await req.json();
    // Fetch products from Supabase
    const { data: products, error: productsError } = await supabase.from('products').select('*').in('id', productList.map((item)=>item.id));
    if (productsError) throw productsError;
    // Fetch delivery fee based on delivery type
    let deliveryFee = 0;
    if (orderData && orderData.delivery_type) {
      const feeColumn = `${orderData.delivery_type}_fee`;
      const { data: deliverySettings, error: deliveryError } = await supabase.from('delivery_settings').select(feeColumn).single();
      if (deliveryError) {
        console.error("Error fetching delivery fee:", deliveryError);
      // Fallback or throw error if fee cannot be fetched
      // For now, we'll proceed with 0 fee if fetching fails
      } else {
        deliveryFee = deliverySettings ? deliverySettings[feeColumn] : 0;
      }
    }
    // Create Stripe line items and items array for metadata
    const lineItems = [];
    const items = [];
    products.forEach((product)=>{
      const cartItem = productList.find((item)=>item.id === product.id);
      const quantity = cartItem?.quantity || 1;
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: product.name
          },
          unit_amount: Math.round(product.price * 100)
        },
        quantity: quantity
      });
      items.push({
        name: product.name,
        quantity: quantity
      });
    });
    if (deliveryFee === 0) {
      deliveryFee = 9.99; // Default delivery fee if not specified
    }
    // Add delivery fee as a separate line item
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: `${orderData.delivery_type} Delivery Fee`
          },
          unit_amount: Math.round(deliveryFee * 100)
        },
        quantity: 1
      });
    }
    // Calculate total amount
    const amount = lineItems.reduce((total, item)=>{
      return total + item.price_data.unit_amount * item.quantity;
    }, 0);
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'aud',
      metadata: {
        user_id: user_id,
        orderData: JSON.stringify(orderData),
        items: JSON.stringify(items),
        total: amount / 100
      }
    });
    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
