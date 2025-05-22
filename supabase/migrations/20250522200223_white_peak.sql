/*
  # Add Delivery Settings Table

  1. New Tables
    - `delivery_settings`
      - `id` (int, primary key)
      - `express_fee` (decimal)
      - `scheduled_fee` (decimal)
      - `late_fee` (decimal)
      - `express_delivery_time` (interval)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for admin access only
*/

CREATE TABLE IF NOT EXISTS delivery_settings (
  id INT PRIMARY KEY DEFAULT 1,
  express_fee DECIMAL(10,2) NOT NULL DEFAULT 9.99,
  scheduled_fee DECIMAL(10,2) NOT NULL DEFAULT 5.99,
  late_fee DECIMAL(10,2) NOT NULL DEFAULT 7.99,
  express_delivery_time INTERVAL NOT NULL DEFAULT '2 hours',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE delivery_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access" ON delivery_settings
  USING (auth.uid IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid IN (SELECT id FROM profiles WHERE is_admin = true));