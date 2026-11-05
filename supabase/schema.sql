-- DealBuddy AI — Supabase schema
-- Run in Supabase → SQL Editor (safe to re-run).
-- Tables: profiles (users), subscriptions, generations, usage.
-- Row Level Security is enabled on every table. Writes to usage and
-- subscriptions happen only from the server with the service role.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Users (profile row per auth user)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  name text,
  history_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Create a profile automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, nullif(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan text not null check (plan in ('free', 'plus', 'pro')),
  status text not null,             -- Razorpay status: created, authenticated, active, pending, halted, cancelled, completed...
  provider text not null default 'razorpay',
  provider_subscription_id text unique,
  current_period_start timestamptz, -- billing period
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists subscriptions_user_idx on public.subscriptions (user_id, updated_at desc);

-- ---------------------------------------------------------------------------
-- Generations
-- input_summary is a short non-sensitive label (never the pasted email/contract).
-- output is NULL unless the user explicitly saves the result.
-- ---------------------------------------------------------------------------
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  tool text not null check (tool in ('reply', 'negotiate', 'risk-check', 'pitch', 'rate-calculator')),
  input_summary text check (char_length(input_summary) <= 200),
  output jsonb,
  saved_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists generations_user_idx on public.generations (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Usage (successful generations per billing period)
-- Free plan uses period_start = 1970-01-01 (lifetime allowance).
-- ---------------------------------------------------------------------------
create table if not exists public.usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  generation_count integer not null default 0 check (generation_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, period_start)
);

-- ---------------------------------------------------------------------------
-- Atomic quota functions (service role only)
-- ---------------------------------------------------------------------------
create or replace function public.reserve_generation(p_user_id uuid, p_period_start date, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  insert into public.usage (user_id, period_start, generation_count)
  values (p_user_id, p_period_start, 0)
  on conflict (user_id, period_start) do nothing;

  update public.usage
     set generation_count = generation_count + 1,
         updated_at = now()
   where user_id = p_user_id
     and period_start = p_period_start
     and generation_count < p_limit
  returning generation_count into v_count;

  return v_count is not null;
end;
$$;

create or replace function public.release_generation(p_user_id uuid, p_period_start date)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.usage
     set generation_count = greatest(generation_count - 1, 0),
         updated_at = now()
   where user_id = p_user_id
     and period_start = p_period_start;
end;
$$;

revoke all on function public.reserve_generation(uuid, date, integer) from public, anon, authenticated;
revoke all on function public.release_generation(uuid, date) from public, anon, authenticated;
grant execute on function public.reserve_generation(uuid, date, integer) to service_role;
grant execute on function public.release_generation(uuid, date) to service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.generations enable row level security;
alter table public.usage enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "subscriptions: read own" on public.subscriptions;
create policy "subscriptions: read own" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "usage: read own" on public.usage;
create policy "usage: read own" on public.usage
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "generations: read own" on public.generations;
create policy "generations: read own" on public.generations
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "generations: insert own" on public.generations;
create policy "generations: insert own" on public.generations
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "generations: update own" on public.generations;
create policy "generations: update own" on public.generations
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "generations: delete own" on public.generations;
create policy "generations: delete own" on public.generations
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Users may not change their own email/id via the API; only name/history.
revoke update on public.profiles from authenticated;
grant update (name, history_enabled) on public.profiles to authenticated;
-- Users can't edit user_id/tool/created_at on generations, only save output.
revoke update on public.generations from authenticated;
grant update (output, saved_at, input_summary) on public.generations to authenticated;
