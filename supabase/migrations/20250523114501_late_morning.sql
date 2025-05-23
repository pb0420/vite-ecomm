/*
  # Add Addresses to Profiles

  1. Changes
    - Add addresses JSONB column to profiles table
    - Default empty array for addresses
    - Add validation check for address format

  2. Format for addresses:
    [
      {
        "id": "uuid",
        "label": "Home",
        "address": "123 Main St, Adelaide SA 5000"
      }
    ]
*/

ALTER TABLE profiles
ADD COLUMN addresses JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Add check constraint to ensure addresses is an array
ALTER TABLE profiles
ADD CONSTRAINT valid_addresses_format CHECK (
  jsonb_typeof(addresses) = 'array' AND
  (
    jsonb_array_length(addresses) = 0 OR
    NOT EXISTS (
      SELECT 1
      FROM jsonb_array_elements(addresses) AS addr
      WHERE NOT (
        addr ? 'id' AND
        addr ? 'label' AND
        addr ? 'address' AND
        jsonb_typeof(addr->>'id') = 'string' AND
        jsonb_typeof(addr->>'label') = 'string' AND
        jsonb_typeof(addr->>'address') = 'string'
      )
    )
  )
);