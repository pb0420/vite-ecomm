/*
  # Add Expected Delivery Time to Orders

  1. Changes
    - Add expected_delivery_at column to orders table
    - Update RLS policies
*/

ALTER TABLE orders 
ADD COLUMN expected_delivery_at TIMESTAMPTZ;

-- Add index for performance
CREATE INDEX idx_orders_expected_delivery ON orders(expected_delivery_at);