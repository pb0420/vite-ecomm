/*
  # Create Time Slots Management System

  1. New Tables
    - `time_slots`
      - `id` (uuid, primary key)
      - `date` (date) - The specific date for this slot
      - `start_time` (time) - Start time of the slot
      - `end_time` (time) - End time of the slot
      - `max_orders` (int) - Maximum orders allowed for this slot
      - `current_orders` (int) - Current number of orders booked
      - `slot_type` (text) - 'delivery' or 'pickup'
      - `is_active` (boolean) - Whether the slot is available for booking
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Changes to existing tables
    - Add `timeslot_id` to `orders` table
    - Add `timeslot_id` to `pickup_orders` table

  3. Security
    - Enable RLS
    - Add policies for admin and user access
*/

-- Create time_slots table
CREATE TABLE IF NOT EXISTS time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_orders INT NOT NULL DEFAULT 10,
  current_orders INT NOT NULL DEFAULT 0,
  slot_type TEXT NOT NULL CHECK (slot_type IN ('delivery', 'pickup')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(date, start_time, end_time, slot_type)
);

-- Add timeslot_id to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS timeslot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL;

-- Add timeslot_id to pickup_orders table
ALTER TABLE pickup_orders 
ADD COLUMN IF NOT EXISTS timeslot_id UUID REFERENCES time_slots(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_slots_date_type ON time_slots(date, slot_type);
CREATE INDEX IF NOT EXISTS idx_time_slots_active ON time_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_timeslot ON orders(timeslot_id);
CREATE INDEX IF NOT EXISTS idx_pickup_orders_timeslot ON pickup_orders(timeslot_id);

-- Enable RLS
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Policies for time_slots
CREATE POLICY "Allow public read access to active time slots" ON time_slots
  FOR SELECT TO public USING (is_active = true AND date >= CURRENT_DATE);

CREATE POLICY "Allow admin full access to time slots" ON time_slots
  USING (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true));

-- Function to increment current_orders when booking a slot
CREATE OR REPLACE FUNCTION increment_slot_orders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.timeslot_id IS NOT NULL THEN
    UPDATE time_slots 
    SET current_orders = current_orders + 1,
        updated_at = NOW()
    WHERE id = NEW.timeslot_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to decrement current_orders when canceling/updating a slot
CREATE OR REPLACE FUNCTION decrement_slot_orders()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.timeslot_id IS NOT NULL THEN
      UPDATE time_slots 
      SET current_orders = GREATEST(current_orders - 1, 0),
          updated_at = NOW()
      WHERE id = OLD.timeslot_id;
    END IF;
    RETURN OLD;
  END IF;
  
  -- Handle UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If timeslot changed
    IF OLD.timeslot_id IS DISTINCT FROM NEW.timeslot_id THEN
      -- Decrement old slot
      IF OLD.timeslot_id IS NOT NULL THEN
        UPDATE time_slots 
        SET current_orders = GREATEST(current_orders - 1, 0),
            updated_at = NOW()
        WHERE id = OLD.timeslot_id;
      END IF;
      -- Increment new slot
      IF NEW.timeslot_id IS NOT NULL THEN
        UPDATE time_slots 
        SET current_orders = current_orders + 1,
            updated_at = NOW()
        WHERE id = NEW.timeslot_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for orders table
CREATE TRIGGER trigger_increment_orders_slot
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION increment_slot_orders();

CREATE TRIGGER trigger_decrement_orders_slot
  AFTER UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION decrement_slot_orders();

-- Create triggers for pickup_orders table
CREATE TRIGGER trigger_increment_pickup_orders_slot
  AFTER INSERT ON pickup_orders
  FOR EACH ROW
  EXECUTE FUNCTION increment_slot_orders();

CREATE TRIGGER trigger_decrement_pickup_orders_slot
  AFTER UPDATE OR DELETE ON pickup_orders
  FOR EACH ROW
  EXECUTE FUNCTION decrement_slot_orders();