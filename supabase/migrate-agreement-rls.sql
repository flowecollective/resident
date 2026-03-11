-- Allow residents to insert their own documents (for agreement uploads)
CREATE POLICY "documents_own_insert" ON documents
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Create agreements storage bucket (public so PDFs are downloadable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreements', 'agreements', true)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload to agreements bucket
CREATE POLICY "agreements_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'agreements' AND auth.role() = 'authenticated');

-- Allow public read on agreements bucket
CREATE POLICY "agreements_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'agreements');
