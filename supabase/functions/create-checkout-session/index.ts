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
    const { order_type, orderData, productList, user_id  } = await req.json();
    let totalAmount = 0;
    const items = [];
    let orderDataComplete = {};
    if (order_type === 'pickup'){
      const orderId = req.json().order_id;
      totalAmount = orderData.estimated_total * 100; // Convert to cents
      orderDataComplete = {
        orderId,
        user_id,
        ...orderData
      }
    }else{
      // Fetch products from Supabase
      const { data: products, error: productsError } = await supabase.from('products').select('*').in('id', productList.map((item)=>item.id));
      if (productsError) throw productsError;
      // Fetch delivery fee based on delivery type
      let deliveryFee = 0;
      if (orderData && orderData.delivery_type) {
        const feeColumn = `${orderData.delivery_type}_fee`;
        const { data: deliverySettings, error: deliveryError } = await supabase.from('delivery_settings').select(feeColumn).single();
        if (!deliveryError && deliverySettings) {
          deliveryFee = deliverySettings[feeColumn] || 0;
        } else {
          console.error("Error fetching delivery fee:", deliveryError);
        }
      }
      // Create Stripe line items and items array for metadata
      const lineItems = [];
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
          quantity
        });
        items.push({
          name: product.name,
          quantity,
          price: product.price
        });
      });
      if (deliveryFee === 0) deliveryFee = 9.99;
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
      totalAmount = lineItems.reduce((total, item)=>{
        return total + item.price_data.unit_amount * item.quantity;
      }, 0);

      let discountAmount = 0;
      if (orderData.promo_code) {
        // Validate promo code directly in Edge Function
        const { data: promo, error: promoError } = await supabase.from('promo_codes').select('*').eq('code', orderData.promo_code).eq('is_active', true).maybeSingle();
        if (promoError) throw promoError;
        if (!promo) throw new Error('Invalid or inactive promo code');
        const now = new Date();
        const validFrom = new Date(promo.valid_from);
        const validUntil = promo.valid_until ? new Date(promo.valid_until) : null;
        if (now < validFrom || validUntil && now > validUntil) {
          throw new Error('Promo code not currently valid');
        }
        if (totalAmount / 100 < promo.minimum_order_amount) {
          throw new Error('Order does not meet the minimum amount for promo');
        }
        if (promo.discount_type === 'percentage') {
          discountAmount = Math.round(totalAmount * (promo.discount_value / 100));
        } else if (promo.discount_type === 'fixed') {
          discountAmount = Math.min(Math.round(promo.discount_value * 100), totalAmount);
        }
        totalAmount -= discountAmount;
      }

        
      // Attach order data
      orderDataComplete = {
        ...orderData,
        user_id,
        items,
        total: totalAmount / 100,
        discount_amount: discountAmount / 100,
        promo_code: orderData.promo_code || null
      };

    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'aud',
      metadata: {
        orderData: JSON.stringify(orderDataComplete)
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
