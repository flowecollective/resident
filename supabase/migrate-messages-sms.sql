-- Migration: Wire messages table for Telnyx SMS integration
-- Run this in Supabase SQL Editor

-- 1. Alter messages table to match code expectations
ALTER TABLE messages RENAME COLUMN from_user TO from_id;
ALTER TABLE messages RENAME COLUMN to_user TO to_id;

-- Change from uuid references to text (to support both UUIDs and lookups)
ALTER TABLE messages ALTER COLUMN from_id TYPE text USING from_id::text;
ALTER TABLE messages ALTER COLUMN to_id TYPE text USING to_id::text;

-- Add missing columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS channel text DEFAULT 'portal';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS time timestamptz DEFAULT now();

-- Backfill time from created_at for any existing rows
UPDATE messages SET time = created_at WHERE time IS NULL;

-- 2. Create contacts table for SMS phone lookup
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

-- 3. Enable RLS on contacts
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

-- 4. Enable realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
