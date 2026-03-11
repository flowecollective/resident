-- Add countersign tracking to profiles
alter table profiles add column if not exists agreement_countersigned boolean default false;
alter table profiles add column if not exists agreement_countersigned_date date;
