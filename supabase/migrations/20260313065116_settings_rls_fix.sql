-- Fix settings RLS: replace FOR ALL with explicit INSERT/UPDATE/DELETE policies
DROP POLICY IF EXISTS "Admins can manage settings" ON settings;

CREATE POLICY "Admins can insert settings" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update settings" ON settings
  FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete settings" ON settings
  FOR DELETE TO authenticated
  USING (is_admin());
