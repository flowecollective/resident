-- Drop ALL existing policies on categories and skills to eliminate conflicts
DROP POLICY IF EXISTS "categories_select" ON categories;
DROP POLICY IF EXISTS "categories_insert_admin" ON categories;
DROP POLICY IF EXISTS "categories_update_admin" ON categories;
DROP POLICY IF EXISTS "categories_delete_admin" ON categories;

DROP POLICY IF EXISTS "skills_select" ON skills;
DROP POLICY IF EXISTS "skills_insert_admin" ON skills;
DROP POLICY IF EXISTS "skills_update_admin" ON skills;
DROP POLICY IF EXISTS "skills_delete_admin" ON skills;

-- Recreate clean policies: read for all authenticated, write for admins
CREATE POLICY "categories_select" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "categories_update" ON categories FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "categories_delete" ON categories FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "skills_select" ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills_insert" ON skills FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "skills_update" ON skills FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "skills_delete" ON skills FOR DELETE TO authenticated USING (is_admin());
