-- Allow public read access to media bucket
CREATE POLICY "Public read access on media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'media');

-- Allow anyone to upload to media bucket (via anon key)
CREATE POLICY "Allow uploads to media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'media');

-- Allow anyone to update their uploads in media bucket
CREATE POLICY "Allow updates in media"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'media');

-- Allow anyone to delete from media bucket
CREATE POLICY "Allow deletes in media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'media');
