-- Add missing columns to categories (original schema only had id, tenant_id, name, sort_order)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color text DEFAULT '#8C7A55';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Add missing columns to skills (original schema had target_time/video_url instead of target_min/max_min/videos/sop)
ALTER TABLE skills ADD COLUMN IF NOT EXISTS target_min int;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS max_min int;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS sop jsonb;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
