-- Add series_id to link recurring events together
ALTER TABLE schedule ADD COLUMN IF NOT EXISTS series_id text DEFAULT NULL;
