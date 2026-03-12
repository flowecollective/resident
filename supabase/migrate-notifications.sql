-- Migration: Add notifications table
-- Run this against your existing Supabase database

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  resident_id uuid not null references profiles(id) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  log_id uuid not null references timing_logs(id) on delete cascade,
  read boolean default false,
  reviewed boolean default false,
  created_at timestamptz default now()
);

alter table notifications enable row level security;

create policy "notifications_select" on notifications for select using (is_admin());
create policy "notifications_insert" on notifications for insert with check (true);
create policy "notifications_update_admin" on notifications for update using (is_admin());
create policy "notifications_delete_admin" on notifications for delete using (is_admin());
