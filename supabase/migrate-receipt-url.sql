-- Migration: Add receipt_url column to payments
-- Run this in your Supabase SQL editor

alter table payments add column if not exists receipt_url text;
