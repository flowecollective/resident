-- Add archived_at column for soft-delete/archive on categories and skills
ALTER TABLE categories ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;
