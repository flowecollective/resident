-- ══════════════════════════════════════════
--  FLOWE RESIDENT PORTAL — DATABASE SCHEMA
-- ══════════════════════════════════════════

-- TABLES

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
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
  user_id uuid not null references profiles(id) on delete cascade unique,
  plan text not null default 'monthly' check (plan in ('monthly', 'full')),
  total numeric not null default 4950,
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  amount numeric not null,
  date date not null default current_date,
  note text,
  stripe_payment_id text,
  created_at timestamptz default now()
);

create table categories (
  id text primary key,
  name text not null,
  sort_order int default 0
);

create table skills (
  id text primary key,
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
  user_id uuid not null references profiles(id) on delete cascade,
  skill_id text not null references skills(id) on delete cascade,
  technique int default 0,
  timing int default 0,
  done boolean default false,
  unique(user_id, skill_id)
);

create table timing_logs (
  id uuid primary key default gen_random_uuid(),
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
  log_id uuid not null references timing_logs(id) on delete cascade,
  author_role text not null check (author_role in ('educator', 'trainee')),
  author_name text not null,
  text text not null,
  created_at timestamptz default now()
);

create table schedule (
  id uuid primary key default gen_random_uuid(),
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
  from_user uuid not null references profiles(id),
  to_user uuid not null references profiles(id),
  text text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- ROW LEVEL SECURITY

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

create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer stable;

create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

create policy "tuition_select" on tuition for select using (auth.uid() = user_id or is_admin());
create policy "payments_select" on payments for select using (auth.uid() = user_id or is_admin());
create policy "payments_insert_admin" on payments for insert with check (is_admin());

create policy "categories_select" on categories for select using (true);
create policy "categories_insert_admin" on categories for insert with check (is_admin());
create policy "categories_update_admin" on categories for update using (is_admin());
create policy "categories_delete_admin" on categories for delete using (is_admin());

create policy "skills_select" on skills for select using (true);
create policy "skills_insert_admin" on skills for insert with check (is_admin());
create policy "skills_update_admin" on skills for update using (is_admin());
create policy "skills_delete_admin" on skills for delete using (is_admin());

create policy "resident_skills_select" on resident_skills for select using (auth.uid() = user_id or is_admin());
create policy "resident_skills_upsert" on resident_skills for insert with check (is_admin());
create policy "resident_skills_update" on resident_skills for update using (is_admin());

create policy "timing_logs_select" on timing_logs for select using (auth.uid() = user_id or is_admin());
create policy "timing_logs_insert" on timing_logs for insert with check (auth.uid() = user_id);

create policy "log_comments_select" on log_comments for select using (
  exists (select 1 from timing_logs where timing_logs.id = log_id and (timing_logs.user_id = auth.uid() or is_admin()))
);
create policy "log_comments_insert" on log_comments for insert with check (true);

create policy "schedule_select" on schedule for select using (true);
create policy "schedule_insert_admin" on schedule for insert with check (is_admin());
create policy "schedule_update_admin" on schedule for update using (is_admin());
create policy "schedule_delete_admin" on schedule for delete using (is_admin());

create policy "documents_select" on documents for select using (true);
create policy "documents_admin_insert" on documents for insert with check (is_admin());

create policy "messages_select" on messages for select using (auth.uid() = from_user or auth.uid() = to_user);
create policy "messages_insert" on messages for insert with check (auth.uid() = from_user);
create policy "messages_update_read" on messages for update using (auth.uid() = to_user);

-- STORAGE

insert into storage.buckets (id, name, public) values ('documents', 'documents', false)
on conflict do nothing;

-- AUTO-CREATE PROFILE ON SIGNUP

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'resident')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
