import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import Stripe from 'npm:stripe@13.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CartItem {
  id: string;
  quantity: number;
}

interface RequestBody {
  productIds: CartItem[];
  deliveryFee: number;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  deliveryNotes?: string;
  deliveryType: string;
  scheduledTime?: string;
}

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

    const { productIds, deliveryFee, customerDetails, deliveryNotes, deliveryType, scheduledTime } = await req.json() as RequestBody;

    // Fetch products from Supabase
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds.map(item => item.id));

    if (productsError) throw productsError;

    // Create Stripe line items from products with quantities
    const lineItems = products.map(product => {
      const cartItem = productIds.find(item => item.id === product.id);
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
          },
          unit_amount: Math.round(product.price * 100), // Convert to cents
        },
        quantity: cartItem?.quantity || 1,
      };
    });

    // Add delivery fee as a separate line item
    if (deliveryFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${deliveryType} Delivery Fee`,
          },
          unit_amount: Math.round(deliveryFee * 100),
        },
        quantity: 1,
      });
    }

    // Calculate total amount
    const amount = lineItems.reduce((total, item) => {
      return total + (item.price_data.unit_amount * item.quantity);
    }, 0);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        customer_email: customerDetails.email,
        customer_address: customerDetails.address,
        delivery_notes: deliveryNotes || '',
        delivery_type: deliveryType,
        scheduled_time: scheduledTime || '',
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});