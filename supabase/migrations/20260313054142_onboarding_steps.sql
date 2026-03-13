-- Per-trainee onboarding step config (null = all steps enabled)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_steps jsonb DEFAULT '["agreement","enrollment","gusto"]'::jsonb;
