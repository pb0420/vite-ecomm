-- SQL migration: Create outside_contact table for storing contact, work, and business delivery form submissions
CREATE TABLE outside_contact (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL, -- 'contact', 'work', 'business'
  name TEXT, -- For contact and work
  email TEXT NOT NULL,
  phone TEXT, -- For work and business
  subject TEXT, -- For contact
  message TEXT, -- For contact
  position TEXT, -- For work
  experience TEXT, -- For work
  availability TEXT, -- For work
  business_name TEXT, -- For business
  contact_name TEXT, -- For business
  address TEXT, -- For business
  requirements TEXT, -- For business
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
