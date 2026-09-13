-- =============================================================================
-- Vivre: Trophy Room (Celestial Reliquary) Schema
-- Migration: 20260913050000_trophy_room.sql
-- =============================================================================

-- 1. Create public.user_trophies table
create table if not exists public.user_trophies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  trophy_id   text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, trophy_id)
);

-- 2. Performance indexes
create index if not exists idx_user_trophies_user on public.user_trophies(user_id, unlocked_at desc);
create index if not exists idx_user_trophies_lookup on public.user_trophies(user_id, trophy_id);

-- 3. Row Level Security
alter table public.user_trophies enable row level security;

create policy "Users can view own trophies"
  on public.user_trophies for select
  using (auth.uid() = user_id);

-- 4. Authoritative RPC to record newly unlocked trophies
create or replace function public.record_user_trophy_v1(
  p_user_id uuid,
  p_trophy_id text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Only allow authenticated user to unlock for themselves or via server routine
  if auth.uid() is not null and auth.uid() != p_user_id then
    raise exception 'Unauthorized: user mismatch' using errcode = '42501';
  end if;

  insert into public.user_trophies (user_id, trophy_id, unlocked_at)
  values (p_user_id, p_trophy_id, now())
  on conflict (user_id, trophy_id) do nothing;

  return true;
end;
$$;

comment on table public.user_trophies is 'Authoritative player milestones and celestial trophies';
comment on function public.record_user_trophy_v1 is 'Atomically records an unlocked trophy for a player';
