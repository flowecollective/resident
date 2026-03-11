-- Add Gusto invite URL field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gusto_invite_url text;
