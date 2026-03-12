-- ══════════════════════════════════════════
--  MIGRATION: Multi-tenant support
--  Run this in your Supabase SQL editor
-- ══════════════════════════════════════════

-- 1. Create tenants table
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id),
  settings jsonb default '{}',
  created_at timestamptz default now()
);

alter table tenants enable row level security;

-- 2. Seed Flowe Collective as the first tenant
insert into tenants (name, slug)
values ('Flowe Collective', 'flowe')
on conflict (slug) do nothing;

-- Grab the tenant id for backfill
do $$
declare
  _tid uuid;
begin
  select id into _tid from tenants where slug = 'flowe';

  -- 3. Add tenant_id columns (nullable first)
  alter table profiles      add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table tuition        add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table payments       add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table categories     add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table skills         add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table resident_skills add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table timing_logs    add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table log_comments   add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table schedule       add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table documents      add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table messages       add column if not exists tenant_id uuid references tenants(id) on delete cascade;
  alter table notifications  add column if not exists tenant_id uuid references tenants(id) on delete cascade;

  -- 4. Backfill all existing rows with the Flowe tenant
  update profiles       set tenant_id = _tid where tenant_id is null;
  update tuition        set tenant_id = _tid where tenant_id is null;
  update payments       set tenant_id = _tid where tenant_id is null;
  update categories     set tenant_id = _tid where tenant_id is null;
  update skills         set tenant_id = _tid where tenant_id is null;
  update resident_skills set tenant_id = _tid where tenant_id is null;
  update timing_logs    set tenant_id = _tid where tenant_id is null;
  update log_comments   set tenant_id = _tid where tenant_id is null;
  update schedule       set tenant_id = _tid where tenant_id is null;
  update documents      set tenant_id = _tid where tenant_id is null;
  update messages       set tenant_id = _tid where tenant_id is null;
  update notifications  set tenant_id = _tid where tenant_id is null;

  -- 5. Make tenant_id NOT NULL
  alter table profiles       alter column tenant_id set not null;
  alter table tuition        alter column tenant_id set not null;
  alter table payments       alter column tenant_id set not null;
  alter table categories     alter column tenant_id set not null;
  alter table skills         alter column tenant_id set not null;
  alter table resident_skills alter column tenant_id set not null;
  alter table timing_logs    alter column tenant_id set not null;
  alter table log_comments   alter column tenant_id set not null;
  alter table schedule       alter column tenant_id set not null;
  alter table documents      alter column tenant_id set not null;
  alter table messages       alter column tenant_id set not null;
  alter table notifications  alter column tenant_id set not null;
end $$;

-- 6. Helper functions

create or replace function public.current_tenant_id()
returns uuid as $$
  select tenant_id from profiles where id = auth.uid();
$$ language sql security definer stable;

create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

create or replace function public.default_tenant_id()
returns uuid as $$
  select tenant_id from profiles where id = auth.uid();
$$ language sql security definer stable;

-- 7. Set column defaults so frontend inserts auto-populate tenant_id
alter table tuition         alter column tenant_id set default public.default_tenant_id();
alter table payments        alter column tenant_id set default public.default_tenant_id();
alter table categories      alter column tenant_id set default public.default_tenant_id();
alter table skills          alter column tenant_id set default public.default_tenant_id();
alter table resident_skills alter column tenant_id set default public.default_tenant_id();
alter table timing_logs     alter column tenant_id set default public.default_tenant_id();
alter table log_comments    alter column tenant_id set default public.default_tenant_id();
alter table schedule        alter column tenant_id set default public.default_tenant_id();
alter table documents       alter column tenant_id set default public.default_tenant_id();
alter table messages        alter column tenant_id set default public.default_tenant_id();
alter table notifications   alter column tenant_id set default public.default_tenant_id();

-- 8. Indexes
create index if not exists idx_profiles_tenant on profiles(tenant_id);
create index if not exists idx_tuition_tenant on tuition(tenant_id);
create index if not exists idx_payments_tenant on payments(tenant_id);
create index if not exists idx_categories_tenant on categories(tenant_id);
create index if not exists idx_skills_tenant on skills(tenant_id);
create index if not exists idx_resident_skills_tenant on resident_skills(tenant_id);
create index if not exists idx_timing_logs_tenant on timing_logs(tenant_id);
create index if not exists idx_log_comments_tenant on log_comments(tenant_id);
create index if not exists idx_schedule_tenant on schedule(tenant_id);
create index if not exists idx_documents_tenant on documents(tenant_id);
create index if not exists idx_messages_tenant on messages(tenant_id);
create index if not exists idx_notifications_tenant on notifications(tenant_id);

-- 9. Drop old RLS policies and create tenant-scoped ones

-- TENANTS
drop policy if exists "tenants_select" on tenants;
create policy "tenants_select" on tenants for select using (
  exists (select 1 from profiles where profiles.tenant_id = tenants.id and profiles.id = auth.uid())
);

-- PROFILES
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_select" on profiles for select using (tenant_id = current_tenant_id());
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- TUITION
drop policy if exists "tuition_select" on tuition;
create policy "tuition_select" on tuition for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));

-- PAYMENTS
drop policy if exists "payments_select" on payments;
drop policy if exists "payments_insert_admin" on payments;
create policy "payments_select" on payments for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));
create policy "payments_insert_admin" on payments for insert with check (tenant_id = current_tenant_id() and is_admin());

-- CATEGORIES
drop policy if exists "categories_select" on categories;
drop policy if exists "categories_insert_admin" on categories;
drop policy if exists "categories_update_admin" on categories;
drop policy if exists "categories_delete_admin" on categories;
create policy "categories_select" on categories for select using (tenant_id = current_tenant_id());
create policy "categories_insert_admin" on categories for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "categories_update_admin" on categories for update using (tenant_id = current_tenant_id() and is_admin());
create policy "categories_delete_admin" on categories for delete using (tenant_id = current_tenant_id() and is_admin());

-- SKILLS
drop policy if exists "skills_select" on skills;
drop policy if exists "skills_insert_admin" on skills;
drop policy if exists "skills_update_admin" on skills;
drop policy if exists "skills_delete_admin" on skills;
create policy "skills_select" on skills for select using (tenant_id = current_tenant_id());
create policy "skills_insert_admin" on skills for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "skills_update_admin" on skills for update using (tenant_id = current_tenant_id() and is_admin());
create policy "skills_delete_admin" on skills for delete using (tenant_id = current_tenant_id() and is_admin());

-- RESIDENT SKILLS
drop policy if exists "resident_skills_select" on resident_skills;
drop policy if exists "resident_skills_upsert" on resident_skills;
drop policy if exists "resident_skills_update" on resident_skills;
create policy "resident_skills_select" on resident_skills for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));
create policy "resident_skills_upsert" on resident_skills for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "resident_skills_update" on resident_skills for update using (tenant_id = current_tenant_id() and is_admin());

-- TIMING LOGS
drop policy if exists "timing_logs_select" on timing_logs;
drop policy if exists "timing_logs_insert" on timing_logs;
create policy "timing_logs_select" on timing_logs for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));
create policy "timing_logs_insert" on timing_logs for insert with check (tenant_id = current_tenant_id() and auth.uid() = user_id);

-- LOG COMMENTS
drop policy if exists "log_comments_select" on log_comments;
drop policy if exists "log_comments_insert" on log_comments;
create policy "log_comments_select" on log_comments for select using (tenant_id = current_tenant_id());
create policy "log_comments_insert" on log_comments for insert with check (tenant_id = current_tenant_id());

-- SCHEDULE
drop policy if exists "schedule_select" on schedule;
drop policy if exists "schedule_insert_admin" on schedule;
drop policy if exists "schedule_update_admin" on schedule;
drop policy if exists "schedule_delete_admin" on schedule;
create policy "schedule_select" on schedule for select using (tenant_id = current_tenant_id());
create policy "schedule_insert_admin" on schedule for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "schedule_update_admin" on schedule for update using (tenant_id = current_tenant_id() and is_admin());
create policy "schedule_delete_admin" on schedule for delete using (tenant_id = current_tenant_id() and is_admin());

-- DOCUMENTS
drop policy if exists "documents_select" on documents;
drop policy if exists "documents_admin_insert" on documents;
create policy "documents_select" on documents for select using (tenant_id = current_tenant_id());
create policy "documents_admin_insert" on documents for insert with check (tenant_id = current_tenant_id() and is_admin());

-- MESSAGES
drop policy if exists "messages_select" on messages;
drop policy if exists "messages_insert" on messages;
drop policy if exists "messages_update" on messages;
create policy "messages_select" on messages for select using (tenant_id = current_tenant_id() and (auth.uid()::text = from_id::text or auth.uid()::text = to_id::text));
create policy "messages_insert" on messages for insert with check (tenant_id = current_tenant_id() and auth.uid()::text = from_id::text);
create policy "messages_update" on messages for update using (tenant_id = current_tenant_id() and (auth.uid()::text = from_id::text or auth.uid()::text = to_id::text or is_admin()));

-- NOTIFICATIONS
drop policy if exists "notifications_select" on notifications;
drop policy if exists "notifications_insert" on notifications;
drop policy if exists "notifications_update_admin" on notifications;
drop policy if exists "notifications_delete_admin" on notifications;
create policy "notifications_select" on notifications for select using (tenant_id = current_tenant_id() and is_admin());
create policy "notifications_insert" on notifications for insert with check (tenant_id = current_tenant_id());
create policy "notifications_update_admin" on notifications for update using (tenant_id = current_tenant_id() and is_admin());
create policy "notifications_delete_admin" on notifications for delete using (tenant_id = current_tenant_id() and is_admin());

-- 10. Update handle_new_user trigger to accept tenant_id from metadata

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, tenant_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'resident'),
    (new.raw_user_meta_data->>'tenant_id')::uuid
  );
  return new;
end;
$$ language plpgsql security definer;

-- Done! Your database is now multi-tenant ready.
-- All existing data has been assigned to the "Flowe Collective" tenant.
-- The default_tenant_id() function auto-populates tenant_id on inserts,
-- so no frontend code changes are needed for existing insert calls.
