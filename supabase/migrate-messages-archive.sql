-- Migration: Add archived column to messages
-- Run this in your Supabase SQL editor

alter table messages add column if not exists archived boolean default false;
