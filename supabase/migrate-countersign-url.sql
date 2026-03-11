-- Add countersigned PDF URL to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agreement_countersigned_url text;
