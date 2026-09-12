-- =============================================================================
-- Vivre: Server-Authoritative Compensating Reversal Engine
-- Migration: 20260913010000_completion_reversal.sql
-- =============================================================================
-- Table: completion_reversals (immutable compensating ledger)
-- Function: reverse_completion_v1(p_completion_id uuid)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. completion_reversals (immutable append-only reversal ledger)
-- ---------------------------------------------------------------------------
create table if not exists public.completion_reversals (
  id               uuid primary key default gen_random_uuid(),
  completion_id    uuid        not null unique references public.task_completions(id) on delete cascade,
  user_id          uuid        not null references public.profiles(id) on delete cascade,
  xp_reversed      integer     not null default 0,
  reversed_at      timestamptz not null default now()
);

comment on table public.completion_reversals is 'Immutable compensating ledger recording reversed completions within the UI window.';

-- Immutability triggers for completion_reversals
create or replace function public.prevent_reversal_update_or_delete()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'completion_reversals is an immutable ledger: UPDATE and DELETE are forbidden';
end;
$$;

create or replace trigger prevent_reversal_update
  before update on public.completion_reversals
  for each row
  execute function public.prevent_reversal_update_or_delete();

create or replace trigger prevent_reversal_delete
  before delete on public.completion_reversals
  for each row
  execute function public.prevent_reversal_update_or_delete();

-- RLS
alter table public.completion_reversals enable row level security;

create policy "Users can view own reversals"
  on public.completion_reversals for select
  to authenticated
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 2. reverse_completion_v1: Authoritative Compensating Reversal Function
-- ---------------------------------------------------------------------------
create or replace function public.reverse_completion_v1(
  p_completion_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id             uuid;
  v_profile             public.profiles%rowtype;
  v_completion          public.task_completions%rowtype;
  v_existing_reversal   public.completion_reversals%rowtype;
  v_xp_reversed         integer;
  v_current_xp          integer;
  v_level               integer;
  v_xp_to_next          integer;
  v_prev_xp_to_next     integer;
  v_new_attr_value      integer;
  v_reversal_id         uuid;
  v_reversed_at         timestamptz;
begin
  -- 1. Input validation
  if p_completion_id is null then
    raise exception 'Completion ID is required' using errcode = '22023';
  end if;

  -- 2. Authenticate caller
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'UNAUTHENTICATED: Authentication required' using errcode = '42501';
  end if;

  -- 3. Lock profile row for progression serialization
  select * into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if v_profile.id is null then
    raise exception 'Profile not found' using errcode = 'P0002';
  end if;

  -- 4. Fetch target completion record
  select * into v_completion
  from public.task_completions
  where id = p_completion_id;

  if v_completion.id is null then
    raise exception 'Completion record not found' using errcode = 'P0002';
  end if;

  -- 5. Verify ownership
  if v_completion.user_id <> v_user_id then
    raise exception 'UNAUTHORIZED: Completion does not belong to user' using errcode = '42501';
  end if;

  -- 6. Verify reversal has not already occurred
  select * into v_existing_reversal
  from public.completion_reversals
  where completion_id = p_completion_id;

  if v_existing_reversal.id is not null then
    raise exception 'Completion has already been reversed' using errcode = '22000';
  end if;

  -- 7. Verify within reversal window (5s UI window + 10s network transit tolerance = 15s)
  if now() > v_completion.completed_at + interval '15 seconds' then
    raise exception 'Reversal window has expired' using errcode = '22000';
  end if;

  v_xp_reversed := v_completion.xp_awarded;

  -- 8. Deduct XP and rollback level if needed
  v_current_xp := v_profile.current_xp;
  v_level := v_profile.level;

  if v_xp_reversed > 0 then
    if v_current_xp >= v_xp_reversed then
      v_current_xp := v_current_xp - v_xp_reversed;
    else
      -- Reversal crosses below current level threshold: rollback level
      while v_xp_reversed > v_current_xp and v_level > 1 loop
        v_level := v_level - 1;
        -- Calculate previous level xp requirement
        if v_level <= 10 then
          v_prev_xp_to_next := 50 + (v_level * 25);
        elsif v_level <= 50 then
          v_prev_xp_to_next := round(50.0 * (v_level::numeric ^ 1.5))::integer;
        else
          v_prev_xp_to_next := round(50.0 * (v_level::numeric ^ 1.5) * 0.6)::integer;
        end if;
        v_current_xp := v_current_xp + v_prev_xp_to_next;
      end loop;

      v_current_xp := greatest(0, v_current_xp - v_xp_reversed);
    end if;

    -- 9. Decrement matching attribute value
    update public.attributes
    set value = greatest(0, value - v_xp_reversed)
    where user_id = v_user_id and lower(name) = lower(v_completion.category)
    returning value into v_new_attr_value;
  else
    select coalesce(value, 0) into v_new_attr_value
    from public.attributes
    where user_id = v_user_id and lower(name) = lower(v_completion.category);
  end if;

  -- 10. Insert immutable compensating reversal ledger row
  insert into public.completion_reversals (
    completion_id,
    user_id,
    xp_reversed,
    reversed_at
  ) values (
    p_completion_id,
    v_user_id,
    v_xp_reversed,
    now()
  ) returning id, reversed_at into v_reversal_id, v_reversed_at;

  -- 11. Calculate updated xp_to_next
  if v_level <= 10 then
    v_xp_to_next := 50 + (v_level * 25);
  elsif v_level <= 50 then
    v_xp_to_next := round(50.0 * (v_level::numeric ^ 1.5))::integer;
  else
    v_xp_to_next := round(50.0 * (v_level::numeric ^ 1.5) * 0.6)::integer;
  end if;

  -- 12. Update profile state
  update public.profiles
  set level = v_level,
      current_xp = v_current_xp
  where id = v_user_id;

  -- 13. Return authoritative payload
  return jsonb_build_object(
    'success', true,
    'reversal_id', v_reversal_id,
    'completion_id', p_completion_id,
    'task_id', v_completion.task_id,
    'category', v_completion.category,
    'xp_reversed', v_xp_reversed,
    'level', v_level,
    'current_xp', v_current_xp,
    'xp_to_next', v_xp_to_next,
    'current_streak', v_profile.current_streak,
    'longest_streak', v_profile.longest_streak,
    'streak_shield_available', v_profile.streak_shield_available,
    'attribute', jsonb_build_object(
      'name', v_completion.category,
      'value', coalesce(v_new_attr_value, 0)
    ),
    'reversed_at', v_reversed_at
  );
end;
$$;

comment on function public.reverse_completion_v1 is 'Server-authoritative compensating reversal for task completion within the 5s UI window.';

-- Restrict execution to authenticated users
revoke execute on function public.reverse_completion_v1(uuid) from public, anon;
grant execute on function public.reverse_completion_v1(uuid) to authenticated;
