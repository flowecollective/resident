-- Add onboarding columns directly to profiles table
alter table profiles add column if not exists agreement_signed boolean default false;
alter table profiles add column if not exists agreement_date date;
alter table profiles add column if not exists agreement_url text;
alter table profiles add column if not exists enrollment_completed boolean default false;
alter table profiles add column if not exists enrollment_date date;
alter table profiles add column if not exists enrollment_plan text;
alter table profiles add column if not exists enrollment_stripe_session text;
alter table profiles add column if not exists gusto_completed boolean default false;
alter table profiles add column if not exists gusto_date date;
alter table profiles add column if not exists gusto_fields jsonb default '{}';

-- Move any existing onboarding data to profiles
update profiles p set
  agreement_signed = o.agreement_signed,
  agreement_date = o.agreement_date,
  agreement_url = o.agreement_url,
  enrollment_completed = o.enrollment_completed,
  enrollment_date = o.enrollment_date,
  enrollment_plan = o.enrollment_plan,
  enrollment_stripe_session = o.enrollment_stripe_session,
  gusto_completed = o.gusto_completed,
  gusto_date = o.gusto_date,
  gusto_fields = o.gusto_fields
from onboarding o
where o.user_id = p.id;

-- Drop the separate onboarding table
drop table if exists onboarding cascade;
