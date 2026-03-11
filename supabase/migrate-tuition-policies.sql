-- Allow admins to insert and update tuition records
CREATE POLICY "tuition_insert_admin" ON tuition FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "tuition_update_admin" ON tuition FOR UPDATE USING (is_admin());
