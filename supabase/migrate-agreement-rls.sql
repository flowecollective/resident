-- Allow residents to insert their own documents (for agreement uploads)
DO $$ BEGIN
  CREATE POLICY "documents_own_insert" ON documents
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create agreements storage bucket (public so PDFs are downloadable)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreements', 'agreements', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist, then recreate
DO $$ BEGIN
  DROP POLICY IF EXISTS "agreements_upload" ON storage.objects;
  DROP POLICY IF EXISTS "agreements_read" ON storage.objects;
END $$;

-- Allow any authenticated user to upload to agreements bucket
CREATE POLICY "agreements_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'agreements'
    AND auth.uid() IS NOT NULL
  );

-- Allow any authenticated user to update (upsert) in agreements bucket
CREATE POLICY "agreements_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'agreements'
    AND auth.uid() IS NOT NULL
  );

-- Allow public read on agreements bucket
CREATE POLICY "agreements_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'agreements');
