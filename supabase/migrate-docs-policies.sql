-- Allow admins to delete documents
CREATE POLICY "documents_delete_admin" ON documents
  FOR DELETE USING (is_admin());

-- Allow admins to update documents
CREATE POLICY "documents_update_admin" ON documents
  FOR UPDATE USING (is_admin());

-- Make documents bucket public for reads
UPDATE storage.buckets SET public = true WHERE id = 'documents';
