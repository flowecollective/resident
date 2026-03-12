-- ══════════════════════════════════════════
--  FLOWE RESIDENT PORTAL — DATABASE SCHEMA
--  Multi-tenant SaaS ready
-- ══════════════════════════════════════════

-- TENANTS

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_id uuid references auth.users(id),
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- TABLES

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'resident' check (role in ('resident', 'admin')),
  cohort text,
  photo text,
  -- Onboarding fields (live on profile, not separate table)
  agreement_signed boolean default false,
  agreement_date date,
  agreement_url text,
  enrollment_completed boolean default false,
  enrollment_date date,
  enrollment_plan text,
  enrollment_stripe_session text,
  gusto_completed boolean default false,
  gusto_date date,
  gusto_fields jsonb default '{}',
  created_at timestamptz default now()
);

create table tuition (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade unique,
  plan text not null default 'monthly' check (plan in ('monthly', 'full')),
  total numeric not null default 4950,
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric not null,
  date date not null default current_date,
  note text,
  stripe_payment_id text,
  receipt_url text,
  created_at timestamptz default now()
);

create table categories (
  id text primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  sort_order int default 0
);

create table skills (
  id text primary key,
  tenant_id uuid not null references tenants(id) on delete cascade,
  category_id text not null references categories(id) on delete cascade,
  name text not null,
  type text not null default 'service' check (type in ('service', 'knowledge')),
  target_time int,
  video_url text,
  sop text,
  sort_order int default 0
);

create table resident_skills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  technique int default 0,
  timing int default 0,
  done boolean default false,
  unique(user_id, skill_id)
);

create table timing_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  minutes int not null,
  type text not null default 'mannequin' check (type in ('mannequin', 'model')),
  date date not null default current_date,
  note text,
  created_at timestamptz default now()
);

create table log_comments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  log_id uuid not null references timing_logs(id) on delete cascade,
  author_role text not null check (author_role in ('educator', 'trainee')),
  author_name text not null,
  text text not null,
  created_at timestamptz default now()
);

create table schedule (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  date date not null,
  time text,
  type text default 'general',
  skill_id text references skills(id) on delete set null,
  assign_to text,
  notes text,
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  category text not null default 'General',
  size text,
  date date default current_date,
  url text,
  storage_path text,
  uploaded_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  from_id uuid not null references profiles(id),
  to_id uuid not null references profiles(id),
  text text not null,
  channel text default 'portal',
  read boolean default false,
  archived boolean default false,
  time timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  resident_id uuid not null references profiles(id) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  log_id uuid not null references timing_logs(id) on delete cascade,
  read boolean default false,
  reviewed boolean default false,
  created_at timestamptz default now()
);

-- INDEXES

create index idx_profiles_tenant on profiles(tenant_id);
create index idx_tuition_tenant on tuition(tenant_id);
create index idx_payments_tenant on payments(tenant_id);
create index idx_categories_tenant on categories(tenant_id);
create index idx_skills_tenant on skills(tenant_id);
create index idx_resident_skills_tenant on resident_skills(tenant_id);
create index idx_timing_logs_tenant on timing_logs(tenant_id);
create index idx_log_comments_tenant on log_comments(tenant_id);
create index idx_schedule_tenant on schedule(tenant_id);
create index idx_documents_tenant on documents(tenant_id);
create index idx_messages_tenant on messages(tenant_id);
create index idx_notifications_tenant on notifications(tenant_id);

-- ROW LEVEL SECURITY

alter table tenants enable row level security;
alter table profiles enable row level security;
alter table tuition enable row level security;
alter table payments enable row level security;
alter table categories enable row level security;
alter table skills enable row level security;
alter table resident_skills enable row level security;
alter table timing_logs enable row level security;
alter table log_comments enable row level security;
alter table schedule enable row level security;
alter table documents enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

-- HELPER FUNCTIONS

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

-- TENANT POLICIES

create policy "tenants_select" on tenants for select using (
  exists (select 1 from profiles where profiles.tenant_id = tenants.id and profiles.id = auth.uid())
);

-- PROFILE POLICIES

create policy "profiles_select" on profiles for select using (tenant_id = current_tenant_id());
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- TUITION & PAYMENTS

create policy "tuition_select" on tuition for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));
create policy "payments_select" on payments for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));
create policy "payments_insert_admin" on payments for insert with check (tenant_id = current_tenant_id() and is_admin());

-- CATEGORIES & SKILLS

create policy "categories_select" on categories for select using (tenant_id = current_tenant_id());
create policy "categories_insert_admin" on categories for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "categories_update_admin" on categories for update using (tenant_id = current_tenant_id() and is_admin());
create policy "categories_delete_admin" on categories for delete using (tenant_id = current_tenant_id() and is_admin());

create policy "skills_select" on skills for select using (tenant_id = current_tenant_id());
create policy "skills_insert_admin" on skills for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "skills_update_admin" on skills for update using (tenant_id = current_tenant_id() and is_admin());
create policy "skills_delete_admin" on skills for delete using (tenant_id = current_tenant_id() and is_admin());

-- RESIDENT SKILLS

create policy "resident_skills_select" on resident_skills for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));
create policy "resident_skills_upsert" on resident_skills for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "resident_skills_update" on resident_skills for update using (tenant_id = current_tenant_id() and is_admin());

-- TIMING LOGS & COMMENTS

create policy "timing_logs_select" on timing_logs for select using (tenant_id = current_tenant_id() and (auth.uid() = user_id or is_admin()));
create policy "timing_logs_insert" on timing_logs for insert with check (tenant_id = current_tenant_id() and auth.uid() = user_id);

create policy "log_comments_select" on log_comments for select using (tenant_id = current_tenant_id());
create policy "log_comments_insert" on log_comments for insert with check (tenant_id = current_tenant_id());

-- SCHEDULE

create policy "schedule_select" on schedule for select using (tenant_id = current_tenant_id());
create policy "schedule_insert_admin" on schedule for insert with check (tenant_id = current_tenant_id() and is_admin());
create policy "schedule_update_admin" on schedule for update using (tenant_id = current_tenant_id() and is_admin());
create policy "schedule_delete_admin" on schedule for delete using (tenant_id = current_tenant_id() and is_admin());

-- DOCUMENTS

create policy "documents_select" on documents for select using (tenant_id = current_tenant_id());
create policy "documents_admin_insert" on documents for insert with check (tenant_id = current_tenant_id() and is_admin());

-- MESSAGES

create policy "messages_select" on messages for select using (tenant_id = current_tenant_id() and (auth.uid()::text = from_id::text or auth.uid()::text = to_id::text));
create policy "messages_insert" on messages for insert with check (tenant_id = current_tenant_id() and auth.uid()::text = from_id::text);
create policy "messages_update" on messages for update using (tenant_id = current_tenant_id() and (auth.uid()::text = from_id::text or auth.uid()::text = to_id::text or is_admin()));

-- NOTIFICATIONS

create policy "notifications_select" on notifications for select using (tenant_id = current_tenant_id() and is_admin());
create policy "notifications_insert" on notifications for insert with check (tenant_id = current_tenant_id());
create policy "notifications_update_admin" on notifications for update using (tenant_id = current_tenant_id() and is_admin());
create policy "notifications_delete_admin" on notifications for delete using (tenant_id = current_tenant_id() and is_admin());

-- STORAGE

insert into storage.buckets (id, name, public) values ('documents', 'documents', true)
on conflict do nothing;

create policy "storage_read_all" on storage.objects for select using (bucket_id = 'documents');
create policy "storage_upload_auth" on storage.objects for insert with check (bucket_id = 'documents' and auth.uid() is not null);
create policy "storage_update_auth" on storage.objects for update using (bucket_id = 'documents' and auth.uid() is not null);
create policy "storage_delete_admin" on storage.objects for delete using (bucket_id = 'documents' and (select is_admin()));

-- AUTO-CREATE PROFILE ON SIGNUP

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
