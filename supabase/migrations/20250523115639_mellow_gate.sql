/*
  # Add Expected Delivery Time

  1. Changes
    - Add expected_delivery_at column to orders table
    - Add index for performance optimization

  2. Security
    - Inherits existing RLS policies
*/

-- Add expected delivery time column
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS expected_delivery_at TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_orders_expected_delivery ON orders(expected_delivery_at);