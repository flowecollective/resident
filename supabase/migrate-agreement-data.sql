-- Store agreement form data so countersign can reload the full form
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agreement_data jsonb DEFAULT '{}';
