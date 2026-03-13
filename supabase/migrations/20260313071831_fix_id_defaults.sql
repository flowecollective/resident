-- Add auto-generated ID defaults to categories and skills
ALTER TABLE categories ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE skills ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
