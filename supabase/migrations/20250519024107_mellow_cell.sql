/*
  # Add Store Pickup Feature

  1. New Tables
    - `stores`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text)
      - `phone` (text)
      - `opening_time` (time)
      - `closing_time` (time)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pickup_slots`
      - `id` (uuid, primary key)
      - `store_id` (uuid, foreign key)
      - `start_time` (time)
      - `end_time` (time)
      - `max_orders` (int)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `pickup_orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key)
      - `store_id` (uuid, foreign key)
      - `slot_id` (uuid, foreign key)
      - `status` (text)
      - `whatsapp_number` (text)
      - `notes` (text)
      - `estimated_total` (decimal)
      - `actual_total` (decimal)
      - `payment_status` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

-- Create stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  opening_time TIME NOT NULL,
  closing_time TIME NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pickup slots table
CREATE TABLE pickup_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_orders INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create pickup orders table
CREATE TABLE pickup_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES pickup_slots(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled')),
  whatsapp_number TEXT NOT NULL,
  notes TEXT,
  estimated_total DECIMAL(10,2),
  actual_total DECIMAL(10,2),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_orders ENABLE ROW LEVEL SECURITY;

-- Policies for stores
CREATE POLICY "Allow public read access to stores" ON stores
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin full access to stores" ON stores
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Policies for pickup slots
CREATE POLICY "Allow public read access to pickup slots" ON pickup_slots
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow admin full access to pickup slots" ON pickup_slots
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Policies for pickup orders
CREATE POLICY "Allow users to view their own orders" ON pickup_orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to create their own orders" ON pickup_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow admin full access to pickup orders" ON pickup_orders
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));