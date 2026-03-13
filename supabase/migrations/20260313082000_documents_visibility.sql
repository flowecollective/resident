-- Add visibility and assignment columns to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS visibility text DEFAULT 'all';  -- 'all', 'specific', 'private'
ALTER TABLE documents ADD COLUMN IF NOT EXISTS assigned_to text[] DEFAULT '{}';  -- array of user IDs
