-- Nuclear fix: drop ALL policies on categories and skills using pg_policies catalog
-- This catches any policies from the original schema.sql that had different names
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public' AND tablename IN ('categories', 'skills')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- Recreate clean policies
CREATE POLICY "categories_select" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert" ON categories FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "categories_update" ON categories FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "categories_delete" ON categories FOR DELETE TO authenticated USING (is_admin());

CREATE POLICY "skills_select" ON skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "skills_insert" ON skills FOR INSERT TO authenticated WITH CHECK (is_admin());
CREATE POLICY "skills_update" ON skills FOR UPDATE TO authenticated USING (is_admin());
CREATE POLICY "skills_delete" ON skills FOR DELETE TO authenticated USING (is_admin());
