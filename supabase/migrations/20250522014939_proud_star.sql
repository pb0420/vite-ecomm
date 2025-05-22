/*
  # Create Orders Table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key, nullable)
      - `customer_name` (text)
      - `customer_email` (text, nullable)
      - `customer_phone` (text)
      - `customer_address` (text)
      - `delivery_notes` (text)
      - `total` (decimal)
      - `status` (text)
      - `delivery_type` (text)
      - `scheduled_delivery_time` (timestamptz)
      - `delivery_fee` (decimal)
      - `items` (jsonb)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for user access
*/

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT NOT NULL,
  customer_address TEXT NOT NULL,
  delivery_notes TEXT,
  total DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  delivery_type TEXT NOT NULL,
  scheduled_delivery_time TIMESTAMPTZ,
  delivery_fee DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own orders
CREATE POLICY "Users can view own orders"
  ON orders
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
  );

-- Allow users to create orders
CREATE POLICY "Users can create orders"
  ON orders
  FOR INSERT
  WITH CHECK (true);

-- Allow admins to update orders
CREATE POLICY "Admins can update orders"
  ON orders
  FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));