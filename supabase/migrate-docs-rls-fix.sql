-- Replace open select with scoped policy: residents see own, admins see all
DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (uploaded_by = auth.uid() OR is_admin());
