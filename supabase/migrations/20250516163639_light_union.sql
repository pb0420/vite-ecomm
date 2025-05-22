/*
  # Create AI Settings Table

  1. New Tables
    - `ai_settings`
      - `id` (int, primary key)
      - `api_key` (text)
      - `model` (text)
      - `temperature` (float)
      - `max_tokens` (int)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policy for admin access only
*/

CREATE TABLE IF NOT EXISTS ai_settings (
  id INT PRIMARY KEY DEFAULT 1,
  api_key TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gpt-3.5-turbo',
  temperature FLOAT NOT NULL DEFAULT 0.7,
  max_tokens INT NOT NULL DEFAULT 150,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow admin full access" ON ai_settings
  USING (auth.uid IN (SELECT id FROM profiles WHERE is_admin = true))
  WITH CHECK (auth.uid IN (SELECT id FROM profiles WHERE is_admin = true));