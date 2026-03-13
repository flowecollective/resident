-- Soft delete for profiles (removing trainees)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
