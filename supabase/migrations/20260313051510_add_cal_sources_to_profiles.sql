-- Store calendar integrations on user profile so they persist across browsers/devices
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cal_sources jsonb DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gcal_refresh_token text;
