-- Migration: Add archived column to messages
-- Run this in your Supabase SQL editor

alter table messages add column if not exists archived boolean default false;

-- Update RLS policy to allow admins to update any message (for archiving)
drop policy if exists "messages_update_read" on messages;
drop policy if exists "messages_update" on messages;
create policy "messages_update" on messages for update using (
  auth.uid()::text = from_id::text or auth.uid()::text = to_id::text or is_admin()
);
