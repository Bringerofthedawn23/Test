-- ============================================================
-- Study Helper — usage table
-- Run this in: supabase.com -> your project -> SQL Editor -> New query -> Run
-- ============================================================
-- This table tracks, per user: how many questions they've used and whether
-- they are a paying subscriber. Only the app's backend (service role) can
-- read or write it, so users cannot cheat their free-question count.

create table if not exists public.study_usage (
  user_id          uuid primary key references auth.users on delete cascade,
  questions_used   integer not null default 0,
  is_subscribed    boolean not null default false,
  stripe_customer_id text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- Lock the table down: with RLS on and no policies, only the backend
-- (which uses the secret service-role key) can touch it.
alter table public.study_usage enable row level security;
