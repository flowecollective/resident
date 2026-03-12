-- Migration: Fix storage for photo uploads
-- Run this in your Supabase SQL editor

-- Make the documents bucket public so getPublicUrl works
update storage.buckets set public = true where id = 'documents';

-- Add storage RLS policies (allow authenticated users to upload/read)
create policy "storage_read_all" on storage.objects for select using (bucket_id = 'documents');
create policy "storage_upload_auth" on storage.objects for insert with check (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "storage_update_auth" on storage.objects for update using (bucket_id = 'documents' and auth.role() = 'authenticated');
create policy "storage_delete_admin" on storage.objects for delete using (bucket_id = 'documents' and (select is_admin()));
