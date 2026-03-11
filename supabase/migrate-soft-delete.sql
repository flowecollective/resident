-- Add soft delete column to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Update select policy to exclude soft-deleted docs
DROP POLICY IF EXISTS "documents_select" ON documents;
CREATE POLICY "documents_select" ON documents
  FOR SELECT USING (deleted_at IS NULL AND (uploaded_by = auth.uid() OR is_admin()));
