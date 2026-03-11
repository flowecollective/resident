-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  color text DEFAULT '#8C7A55',
  videos jsonb DEFAULT '[]'::jsonb,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category_id text NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'service',
  target_min int,
  max_min int,
  videos jsonb DEFAULT '[]'::jsonb,
  sop jsonb,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Everyone can read categories and skills
CREATE POLICY "categories_select" ON categories FOR SELECT USING (true);
CREATE POLICY "skills_select" ON skills FOR SELECT USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "categories_insert_admin" ON categories FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "categories_update_admin" ON categories FOR UPDATE USING (is_admin());
CREATE POLICY "categories_delete_admin" ON categories FOR DELETE USING (is_admin());

CREATE POLICY "skills_insert_admin" ON skills FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "skills_update_admin" ON skills FOR UPDATE USING (is_admin());
CREATE POLICY "skills_delete_admin" ON skills FOR DELETE USING (is_admin());
