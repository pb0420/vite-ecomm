-- Create postcodes table
CREATE TABLE postcodes (
  id SERIAL PRIMARY KEY,
  postcode VARCHAR(4) NOT NULL,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'SA',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add some initial Adelaide postcodes
INSERT INTO postcodes (postcode, suburb) VALUES
('5000', 'Adelaide'),
('5006', 'North Adelaide'),
('5031', 'Mile End'),
('5034', 'Goodwood'),
('5035', 'Forestville'),
('5037', 'Plympton'),
('5041', 'Colonel Light Gardens'),
('5042', 'Bedford Park'),
('5045', 'Glenelg'),
('5067', 'Norwood');

-- Enable RLS
ALTER TABLE postcodes ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Allow public read access to postcodes" ON postcodes
  FOR SELECT TO public USING (true);

-- Update profiles table to add postcode to addresses
ALTER TABLE profiles
DROP CONSTRAINT valid_addresses_format;

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
        addr ? 'postcode' AND
        jsonb_typeof(addr->>'id') = 'string' AND
        jsonb_typeof(addr->>'label') = 'string' AND
        jsonb_typeof(addr->>'address') = 'string' AND
        jsonb_typeof(addr->>'postcode') = 'string'
      )
    )
  )
);