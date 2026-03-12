-- Migration: Create contacts table for Telnyx SMS integration
-- Run this in Supabase SQL Editor

-- 1. Create contacts table for SMS phone lookup
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  name text,
  phone text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_contacts_phone ON contacts(phone);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);

-- 2. Enable RLS on contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read contacts
CREATE POLICY "Authenticated users can read contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to manage contacts
CREATE POLICY "Admins can manage contacts"
  ON contacts FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Enable realtime on messages (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
