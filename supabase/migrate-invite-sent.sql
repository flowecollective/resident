-- Track when invite email was sent to trainee
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz DEFAULT NULL;
