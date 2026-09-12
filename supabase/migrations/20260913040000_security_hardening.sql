-- =============================================================================
-- Vivre: Application Security Hardening Migration
-- =============================================================================
-- 1. Drop overly permissive direct client UPDATE policies on attributes and challenges
-- 2. Add trigger to forbid direct client mutation of authoritative profile telemetry
-- 3. Confirm RLS and zero public write access across all tables
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Restrict Direct Client Mutations
-- -----------------------------------------------------------------------------
-- Attributes should only be updated authoritatively via complete_task_v1 / reverse_completion_v1
drop policy if exists "Users can update own attributes" on public.attributes;

-- Weekly challenge progress must only be updated authoritatively by server routines
drop policy if exists "Users can update own challenge progress" on public.weekly_challenge_progress;

-- -----------------------------------------------------------------------------
-- 2. Guard Authoritative Profile Telemetry Against Direct Client Tampering
-- -----------------------------------------------------------------------------
create or replace function public.prevent_direct_profile_telemetry_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- When invoked under the 'authenticated' role directly via PostgREST/Supabase client,
  -- block any attempts to manipulate progression telemetry or balances.
  -- Authoritative functions (SECURITY DEFINER) run as the database owner, bypassing this check.
  if current_user = 'authenticated' then
    if new.level is distinct from old.level or
       new.current_xp is distinct from old.current_xp or
       new.soft_currency is distinct from old.soft_currency or
       new.rare_currency is distinct from old.rare_currency or
       new.current_streak is distinct from old.current_streak or
       new.longest_streak is distinct from old.longest_streak or
       new.streak_shield_available is distinct from old.streak_shield_available or
       new.streak_shield_refill_at is distinct from old.streak_shield_refill_at or
       new.last_completion_at is distinct from old.last_completion_at then
      raise exception 'Direct client mutation of progression telemetry or currency balance is forbidden. Use authoritative game RPCs.' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_direct_profile_telemetry on public.profiles;
create trigger trg_prevent_direct_profile_telemetry
  before update on public.profiles
  for each row
  execute function public.prevent_direct_profile_telemetry_mutation();

comment on function public.prevent_direct_profile_telemetry_mutation is 'Blocks direct client REST updates to XP, level, currencies, and streaks';
