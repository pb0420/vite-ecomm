/*
  # Update Pickup Orders Schema

  1. Changes to pickup_orders table
    - Remove slot_id (we'll handle time slots differently)
    - Add pickup_date and time_slot columns
    - Add phone_number for SMS/Call option
    - Add delivery_address and postcode columns
    - Add photos JSONB column for uploaded images
    - Add admin_messages JSONB column for admin communication

  2. Changes to stores table
    - Add store_delivery_fee column
    - Add minimum_order_amount column

  3. New table: pickup_order_stores
    - For handling multiple stores per order
    - Links pickup orders to multiple stores with individual totals

  4. Security
    - Update RLS policies
*/

-- Update stores table
ALTER TABLE stores 
ADD COLUMN IF NOT EXISTS store_delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2) NOT NULL DEFAULT 50.00;

-- Update pickup_orders table
ALTER TABLE pickup_orders 
DROP COLUMN IF EXISTS slot_id,
ADD COLUMN IF NOT EXISTS pickup_date DATE,
ADD COLUMN IF NOT EXISTS time_slot TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS postcode TEXT,
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS admin_messages JSONB DEFAULT '[]'::jsonb;

-- Create pickup_order_stores junction table
CREATE TABLE IF NOT EXISTS pickup_order_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_order_id UUID NOT NULL REFERENCES pickup_orders(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  estimated_total DECIMAL(10,2),
  actual_total DECIMAL(10,2),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pickup_order_id, store_id)
);

-- Enable RLS on new table
ALTER TABLE pickup_order_stores ENABLE ROW LEVEL SECURITY;

-- Policies for pickup_order_stores
CREATE POLICY "Allow users to view their own order stores" ON pickup_order_stores
  FOR SELECT USING (
    pickup_order_id IN (
      SELECT id FROM pickup_orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow users to create their own order stores" ON pickup_order_stores
  FOR INSERT WITH CHECK (
    pickup_order_id IN (
      SELECT id FROM pickup_orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admin full access to pickup order stores" ON pickup_order_stores
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Update existing pickup_orders policies to handle new columns
DROP POLICY IF EXISTS "Allow users to create their own orders" ON pickup_orders;
CREATE POLICY "Allow users to create their own orders" ON pickup_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow users to view their own orders" ON pickup_orders;
CREATE POLICY "Allow users to view their own orders" ON pickup_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own orders" ON pickup_orders
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);