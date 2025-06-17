/*
  # Add Timezone and Delivery Time Settings

  1. Changes to delivery_settings table
    - Add timezone column with default ACST
    - Add estimated_delivery_minutes column for homepage display

  2. Security
    - Inherits existing RLS policies
*/

-- Add timezone and delivery time columns to delivery_settings
ALTER TABLE delivery_settings 
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Australia/Adelaide',
ADD COLUMN IF NOT EXISTS estimated_delivery_minutes INT NOT NULL DEFAULT 45;

-- Update the constraint to include new columns
ALTER TABLE delivery_settings 
DROP CONSTRAINT IF EXISTS single_row;

ALTER TABLE delivery_settings 
ADD CONSTRAINT single_row CHECK (id = 1);

-- Insert default settings if none exist
INSERT INTO delivery_settings (id, timezone, estimated_delivery_minutes) 
VALUES (1, 'Australia/Adelaide', 45)
ON CONFLICT (id) DO UPDATE SET
  timezone = COALESCE(delivery_settings.timezone, 'Australia/Adelaide'),
  estimated_delivery_minutes = COALESCE(delivery_settings.estimated_delivery_minutes, 45);