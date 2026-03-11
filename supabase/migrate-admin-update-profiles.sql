-- Allow admins to update any profile (needed for countersign, etc.)
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());
